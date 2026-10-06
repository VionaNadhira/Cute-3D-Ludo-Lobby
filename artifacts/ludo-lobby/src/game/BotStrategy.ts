import { HOME_PROGRESS, SAFE_CELLS, START_OFFSETS, type BotDifficulty, type GameState, type PlayerState, type ValidMove } from './types';

function isInDanger(state: GameState, player: PlayerState, move: ValidMove): boolean {
  if (move.toProgress < 0 || move.toProgress >= 52 || move.isSafe) return false;
  const target = (START_OFFSETS[player.color] + move.toProgress) % 52;
  return state.players.some((opponent) => {
    if (opponent.id === player.id) return false;
    return opponent.tokens.some((token) => {
      if (token.progress < 0 || token.progress >= 52) return false;
      const distance = (target - (START_OFFSETS[opponent.color] + token.progress) + 52) % 52;
      return distance > 0 && distance <= 6 && !SAFE_CELLS.has(target);
    });
  });
}

function scoreMove(state: GameState, move: ValidMove, difficulty: BotDifficulty): number {
  const player = state.players[state.currentPlayerIndex];
  let score = move.toProgress;
  if (move.reachesHome) score += 10_000;
  else if (move.toProgress === HOME_PROGRESS) score += 8_000;
  if (move.captures.length) score += 1_000 + move.captures.length * 200;
  if (move.exitsYard) score += 550;
  if (move.entersHome) score += 300;
  if (move.isSafe) score += 80;

  if (difficulty === 'easy') return score * 0.2 + Math.random() * 110;
  if (difficulty === 'hard' && isInDanger(state, player, move)) score -= 450;
  if (difficulty === 'hard') score += Math.max(0, move.toProgress) * 4;
  return score + Math.random() * 12;
}

export function chooseBestMove(
  state: GameState,
  validMoves: ValidMove[],
  difficulty: BotDifficulty,
): ValidMove | null {
  if (validMoves.length === 0) return null;
  if (difficulty === 'easy') return validMoves[Math.floor(Math.random() * validMoves.length)];
  return [...validMoves].sort(
    (a, b) => scoreMove(state, b, difficulty) - scoreMove(state, a, difficulty)
  )[0];
}

