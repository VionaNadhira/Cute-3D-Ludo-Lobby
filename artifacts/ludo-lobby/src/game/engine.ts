import {
  HOME_PROGRESS,
  PLAYER_COLORS,
  SAFE_CELLS,
  START_OFFSETS,
  type GameAction,
  type GameConfig,
  type GameEvent,
  type GameState,
  type GameTransition,
  type PlayerState,
  type ValidMove,
} from './types';

export function createGame(config: GameConfig): GameState {
  const playerCount = config.mode === 'bot' ? 2 : config.localPlayers;
  const players: PlayerState[] = Array.from({ length: playerCount }, (_, index) => {
    const isBot = config.mode === 'bot' && index === 1;
    const name = isBot ? 'Pip Bot' : config.mode === 'local' ? `Player ${index + 1}` : 'You';
    const id = `player-${index + 1}`;
    return {
      id,
      type: isBot ? 'bot' : 'human',
      name,
      color: PLAYER_COLORS[index],
      tokens: Array.from({ length: 4 }, (_, tokenIndex) => ({
        id: `${id}-token-${tokenIndex + 1}`,
        progress: -1,
      })),
    };
  });

  return {
    id: `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    config,
    players,
    currentPlayerIndex: 0,
    phase: 'ready',
    diceValue: null,
    lastRoll: null,
    validMoves: [],
    winnerId: null,
    turnsTaken: 0,
  };
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

export function getValidMoves(state: GameState, roll: number): ValidMove[] {
  const currentPlayer = getCurrentPlayer(state);
  return currentPlayer.tokens.flatMap((token) => {
    if (token.progress === HOME_PROGRESS) return [];

    let destination: number;
    let exitsYard = false;
    if (token.progress < 0) {
      if (roll !== 6) return [];
      destination = 0;
      exitsYard = true;
    } else {
      destination = token.progress + roll;
      if (destination > HOME_PROGRESS) return [];
    }

    const globalCell = destination < 52
      ? (START_OFFSETS[currentPlayer.color] + destination) % 52
      : null;
    const isSafe = globalCell !== null && SAFE_CELLS.has(globalCell);
    const captures = globalCell === null || isSafe
      ? []
      : state.players
          .filter((player) => player.id !== currentPlayer.id)
          .flatMap((player) =>
            player.tokens
              .filter((opponentToken) =>
                opponentToken.progress >= 0 &&
                opponentToken.progress < 52 &&
                (START_OFFSETS[player.color] + opponentToken.progress) % 52 === globalCell
              )
              .map((opponentToken) => opponentToken.id)
          );

    return [{
      tokenId: token.id,
      fromProgress: token.progress,
      toProgress: destination,
      exitsYard,
      entersHome: token.progress < 52 && destination >= 52,
      reachesHome: destination === HOME_PROGRESS,
      captures,
      isSafe,
    }];
  });
}

function passTurn(state: GameState, keepTurn: boolean): GameState {
  if (keepTurn) {
    return {
      ...state,
      phase: 'ready',
      validMoves: [],
      diceValue: null,
      turnsTaken: state.turnsTaken + 1,
    };
  }
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    phase: 'ready',
    validMoves: [],
    diceValue: null,
    turnsTaken: state.turnsTaken + 1,
  };
}

export function reduceGame(state: GameState, action: GameAction): GameTransition {
  if (state.phase === 'over') return { state, events: [] };

  if (action.type === 'ROLL_DICE') {
    if (state.phase !== 'ready' || action.value < 1 || action.value > 6) {
      return { state, events: [] };
    }

    const player = getCurrentPlayer(state);
    const moves = getValidMoves(state, action.value);
    const rolledState: GameState = {
      ...state,
      diceValue: action.value,
      lastRoll: action.value,
      validMoves: moves,
      phase: moves.length > 0 ? 'select-token' : 'ready',
    };
    const events: GameEvent[] = [
      { type: 'DICE_ROLLED', value: action.value, playerId: player.id },
    ];

    if (moves.length === 0) {
      const extraTurn = action.value === 6;
      const nextState = passTurn(rolledState, extraTurn);
      const activePlayer = getCurrentPlayer(nextState);
      events.push(extraTurn
        ? { type: 'EXTRA_TURN', playerId: activePlayer.id }
        : { type: 'TURN_CHANGED', playerId: activePlayer.id });
      return { state: nextState, events };
    }

    return { state: rolledState, events };
  }

  if (action.type === 'SELECT_TOKEN') {
    if (state.phase !== 'select-token') return { state, events: [] };
    const move = state.validMoves.find((candidate) => candidate.tokenId === action.tokenId);
    if (!move) return { state, events: [] };

    const player = getCurrentPlayer(state);
    let players = state.players.map((entry) => ({
      ...entry,
      tokens: entry.tokens.map((token) =>
        token.id === move.tokenId ? { ...token, progress: move.toProgress } : token
      ),
    }));

    for (const capturedId of move.captures) {
      players = players.map((entry) => ({
        ...entry,
        tokens: entry.tokens.map((token) =>
          token.id === capturedId ? { ...token, progress: -1 } : token
        ),
      }));
    }

    const events: GameEvent[] = [
      { type: 'TOKEN_SELECTED', tokenId: move.tokenId, playerId: player.id },
      {
        type: 'TOKEN_MOVED',
        tokenId: move.tokenId,
        playerId: player.id,
        from: move.fromProgress,
        to: move.toProgress,
        steps: move.exitsYard ? 1 : move.toProgress - move.fromProgress,
      },
    ];
    move.captures.forEach((tokenId) => {
      events.push({ type: 'TOKEN_CAPTURED', tokenId, playerId: player.id, byPlayerId: player.id });
    });
    if (move.reachesHome) {
      events.push({ type: 'TOKEN_ENTERED_HOME', tokenId: move.tokenId, playerId: player.id });
    } else if (move.isSafe) {
      events.push({ type: 'SAFE_CELL', tokenId: move.tokenId, playerId: player.id });
    }

    const hasWon = players[state.currentPlayerIndex].tokens.every(
      (token) => token.progress === HOME_PROGRESS
    );
    if (hasWon) {
      events.push({ type: 'GAME_WON', playerId: player.id });
      return {
        state: {
          ...state,
          players,
          phase: 'over',
          validMoves: [],
          winnerId: player.id,
        },
        events,
        move,
      };
    }

    const extraTurn = state.lastRoll === 6 || move.captures.length > 0;
    const movedState: GameState = { ...state, players, validMoves: [] };
    const nextState = passTurn(movedState, extraTurn);
    events.push(extraTurn
      ? { type: 'EXTRA_TURN', playerId: getCurrentPlayer(nextState).id }
      : { type: 'TURN_CHANGED', playerId: getCurrentPlayer(nextState).id });
    return { state: nextState, events, move };
  }

  return { state, events: [] };
}

