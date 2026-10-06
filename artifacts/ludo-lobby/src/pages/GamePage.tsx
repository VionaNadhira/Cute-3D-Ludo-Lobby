import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, DoorOpen, Hand, Shield, Sparkles, Trophy } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { LudoBoard } from '@/components/game/LudoBoard';
import { audioManager } from '@/audio/AudioManager';
import { chooseBestMove } from '@/game/BotStrategy';
import { getCurrentPlayer } from '@/game/engine';
import { useGameSession } from '@/game/GameContext';
import { subscribeGameEvents } from '@/game/events/GameEvents';
import type { GameState } from '@/game/types';

function DiceFace({ value }: { value: number | null }) {
  return <span className={`dice-face${value === 6 ? ' is-six' : ''}`} aria-label={value ? `Dice showing ${value}` : 'Dice ready'}>
    {value ?? <DiceDots/>}
  </span>;
}

function DiceDots() {
  return <span className="dice-dots" aria-hidden="true"><i/><i/><i/><i/><i/><i/></span>;
}

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { state, rollDice, selectToken, resetGame } = useGameSession();
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [displayedDice, setDisplayedDice] = useState<number | null>(null);
  const [visualProgress, setVisualProgress] = useState<Record<string, number>>({});
  const [highlightedTokenId, setHighlightedTokenId] = useState<string | null>(null);
  const [turnFeedback, setTurnFeedback] = useState('');
  const [captureFeedback, setCaptureFeedback] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState('YOU DID IT!');
  const [confirmExit, setConfirmExit] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<GameState | null>(state);
  const previousState = useRef<GameState | null>(state);
  const routedToResult = useRef(false);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    if (rollInterval.current) clearInterval(rollInterval.current);
    if (resultTimer.current) clearTimeout(resultTimer.current);
  }, []);

  useEffect(() => subscribeGameEvents((event) => {
    if (event.type === 'DICE_ROLLED') audioManager.playSfx('dice_roll');
    if (event.type === 'TOKEN_SELECTED') audioManager.playSfx('token_select');
    if (event.type === 'TOKEN_CAPTURED') {
      audioManager.playSfx('capture');
      setCaptureFeedback(true);
      schedule(() => setCaptureFeedback(false), 520);
    }
    if (event.type === 'SAFE_CELL') audioManager.playSfx('safe_cell');
    if (event.type === 'TOKEN_ENTERED_HOME') audioManager.playSfx('reward');
    if (event.type === 'TURN_CHANGED' || event.type === 'EXTRA_TURN') {
      const current = stateRef.current;
      const player = current?.players.find((entry) => entry.id === event.playerId);
      setTurnFeedback(event.type === 'EXTRA_TURN' ? 'EXTRA TURN' : `${player?.name ?? 'Next player'}’s turn`);
      audioManager.playSfx(event.type === 'EXTRA_TURN' ? 'extra_turn' : 'turn_start');
      schedule(() => setTurnFeedback(''), 1050);
    }
    if (event.type === 'GAME_WON') {
      const winner = stateRef.current?.players.find((player) => player.id === event.playerId);
      setCelebrationText(event.playerId === 'player-1' ? 'YOU DID IT!' : `${winner?.name.toUpperCase() ?? 'PLAYER'} WINS`);
      setCelebrating(true);
      audioManager.playSfx(event.playerId === 'player-1' ? 'victory' : 'defeat');
    }
  }), [schedule]);

  useEffect(() => {
    if (!state) return;
    const before = previousState.current;
    previousState.current = state;
    if (!before) return;
    const changes: { id: string; from: number; to: number }[] = [];
    before.players.forEach((player) => player.tokens.forEach((token) => {
      const nextToken = state.players.flatMap((entry) => entry.tokens).find((next) => next.id === token.id);
      if (nextToken && nextToken.progress !== token.progress) {
        changes.push({ id: token.id, from: token.progress, to: nextToken.progress });
      }
    }));
    if (changes.length === 0) return;

    setIsMoving(true);
    let duration = 0;
    changes.forEach(({ id, from, to }) => {
      setVisualProgress((current) => ({ ...current, [id]: from }));
      if (to < 0) {
        duration = Math.max(duration, 380);
        schedule(() => {
          setVisualProgress((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        }, 380);
        return;
      }
      const steps = Math.max(1, to - from);
      for (let step = 1; step <= steps; step += 1) {
        const visualStep = step;
        const delay = (from < 0 ? 140 : 65) + visualStep * 105;
        duration = Math.max(duration, delay);
        schedule(() => {
          setVisualProgress((current) => ({ ...current, [id]: Math.min(to, Math.max(0, from + visualStep)) }));
          audioManager.playSfx(from < 0 ? 'token_enter_board' : 'token_step');
        }, delay);
      }
      schedule(() => {
        setVisualProgress((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }, (from < 0 ? 140 : 65) + steps * 105 + 80);
    });
    schedule(() => {
      setIsMoving(false);
      setHighlightedTokenId(null);
    }, duration + 220);
  }, [schedule, state]);

  useEffect(() => {
    if (!state || state.phase !== 'over' || isMoving || routedToResult.current) return;
    resultTimer.current = setTimeout(() => {
      routedToResult.current = true;
      setLocation('/result');
    }, 1700);
    return () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, [isMoving, setLocation, state]);

  const performRoll = useCallback((fromBot = false) => {
    if (!stateRef.current || stateRef.current.phase !== 'ready' || isRolling || isMoving) return;
    if (!fromBot) audioManager.playSfx('button_click');
    setIsRolling(true);
    let face = 1;
    setDisplayedDice(face);
    if (rollInterval.current) clearInterval(rollInterval.current);
    rollInterval.current = setInterval(() => {
      face = (face % 6) + 1;
      setDisplayedDice(face);
    }, 68);
    rollDice();
    schedule(() => {
      if (rollInterval.current) clearInterval(rollInterval.current);
      rollInterval.current = null;
      const rolled = stateRef.current?.lastRoll ?? null;
      setDisplayedDice(rolled);
      setIsRolling(false);
      audioManager.playSfx('dice_land');
      if (rolled === 6) audioManager.playSfx('extra_turn');
    }, 510);
  }, [isMoving, isRolling, rollDice, schedule]);

  useEffect(() => {
    if (!state || isMoving || isRolling || celebrating || confirmExit || state.phase === 'over') return;
    if (getCurrentPlayer(state).type !== 'bot') return;
    let selectionTimer: ReturnType<typeof setTimeout> | null = null;
    const botTimer = setTimeout(() => {
      const latest = stateRef.current;
      if (!latest || getCurrentPlayer(latest).type !== 'bot') return;
      if (latest.phase === 'ready') {
        performRoll(true);
        return;
      }
      if (latest.phase !== 'select-token') return;
      const move = chooseBestMove(latest, latest.validMoves, latest.config.difficulty);
      if (!move) return;
      setHighlightedTokenId(move.tokenId);
      selectionTimer = setTimeout(() => selectToken(move.tokenId), 430);
    }, 620 + Math.random() * 320);
    return () => {
      clearTimeout(botTimer);
      if (selectionTimer) clearTimeout(selectionTimer);
    };
  }, [celebrating, confirmExit, isMoving, isRolling, performRoll, selectToken, state]);

  const currentPlayer = state ? getCurrentPlayer(state) : null;
  const activeCanAct = currentPlayer?.type === 'human';
  const blocked = isRolling || isMoving || celebrating || confirmExit || !activeCanAct;
  const canRoll = !!state && state.phase === 'ready' && !blocked;
  const canSelect = !!state && state.phase === 'select-token' && !blocked;

  if (!state) {
    return <section className="game-recovery"><div className="recovery-icon"><Gamepad2Fallback/></div><h1>No game in progress</h1><p>Choose a table to start a new round.</p><Link href="/play" className="primary-action" data-testid="link-start-game"><span>CHOOSE A GAME</span><ArrowRightFallback/></Link></section>;
  }

  const playerTokenCount = (playerId: string) => state.players.find((player) => player.id === playerId)?.tokens.filter((token) => token.progress === 57).length ?? 0;
  const exit = () => {
    resetGame();
    setLocation('/');
  };

  return (
    <section className={`gameplay-page${captureFeedback ? ' capture-shake' : ''}${celebrating ? ' game-celebrating' : ''}`} data-testid="gameplay-page">
      <header className="game-hud">
        <button type="button" className="game-exit-button" onClick={() => setConfirmExit(true)} data-testid="button-exit-game"><ArrowLeft size={17}/><span>EXIT</span></button>
        <div className="game-turn-indicator" aria-live="polite" data-testid="status-turn">
          <i className={`turn-color-chip chip-${currentPlayer?.color ?? 'coral'}`}/>
          <span><b>{currentPlayer?.type === 'bot' ? 'BOT TURN' : currentPlayer?.name.toUpperCase() + ' TURN'}</b><small>{currentPlayer?.type === 'bot' ? 'THINKING…' : state.phase === 'select-token' ? 'PICK A GLOWING TOKEN' : state.phase === 'over' ? 'ROUND COMPLETE' : 'ROLL THE DICE'}</small></span>
          {currentPlayer?.type === 'bot' && <Bot size={19}/>}
        </div>
        <div className="game-counter"><Trophy size={15}/><span>{state.players.reduce((sum, player) => sum + playerTokenCount(player.id), 0)} / {state.players.length * 4} HOME</span></div>
      </header>

      <div className="game-layout">
        <div className="game-board-wrap">
          <LudoBoard players={state.players} currentPlayerId={currentPlayer?.id ?? state.players[0].id}
            validTokenIds={canSelect ? state.validMoves.map((move) => move.tokenId) : []}
            tokenVisualProgress={visualProgress} highlightedTokenId={highlightedTokenId}
            disabled={!canSelect} lastRoll={state.lastRoll} onSelectToken={selectToken}/>
          {captureFeedback && <div className="capture-callout" role="status"><Sparkles size={16}/> NICE CAPTURE</div>}
          {turnFeedback && <div className="turn-callout" role="status" data-testid="status-turn-feedback">{turnFeedback}</div>}
          {celebrating && <div className="victory-cover" role="status"><div className="victory-sparkles"><Sparkles size={30}/><Trophy size={42}/><Sparkles size={22}/></div><b>{celebrationText}</b><small>WHAT A LOVELY LITTLE WIN</small></div>}
        </div>

        <aside className="game-control-panel">
          <div className="control-panel-heading"><span className="page-eyebrow">{state.config.mode === 'bot' ? 'A FRIENDLY CHALLENGE' : 'PASS THE DEVICE'}</span><h1>{state.config.mode === 'bot' ? 'VS Bot' : 'Local game'}</h1></div>
          <div className="seat-list">
            {state.players.map((player) => {
              const isCurrent = player.id === currentPlayer?.id;
              const homeCount = playerTokenCount(player.id);
              return <div key={player.id} className={`seat-row${isCurrent ? ' current' : ''}`} data-testid={`seat-${player.id}`}>
                <span className={`seat-marker chip-${player.color}`}>{player.type === 'bot' ? <Bot size={17}/> : player.name.charAt(0)}</span>
                <span className="seat-row-copy"><b>{player.name}</b><small>{player.type === 'bot' ? 'Computer player' : player.type === 'human' && state.config.mode === 'local' ? 'Local player' : 'You'}</small></span>
                <span className="home-token-count">{homeCount}/4 <small>HOME</small></span>
              </div>;
            })}
          </div>
          <div className={`dice-control${isRolling ? ' is-rolling' : ''}${canRoll ? ' is-ready' : ''}`}>
            <span className="dice-prompt">{isRolling ? 'ROLLING…' : canRoll ? 'YOUR DICE IS READY' : state.phase === 'select-token' ? 'CHOOSE YOUR MOVE' : 'WAIT A MOMENT'}</span>
            <button type="button" className="roll-button" disabled={!canRoll}
              onClick={() => performRoll()} aria-label={canRoll ? 'Roll the dice' : 'Dice unavailable'}
              data-testid="button-roll-dice">
              <DiceFace value={isRolling ? displayedDice : state.lastRoll ?? displayedDice}/>
            </button>
            <small>{canRoll ? 'TAP TO ROLL' : isRolling ? 'GOOD LUCK!' : 'THE GAME WILL CONTINUE'}</small>
          </div>
          <div className="game-rule-note"><Shield size={15}/><span>Safe stars protect your tokens. Roll a 6 to leave your yard.</span></div>
          <div className="game-short-actions">
            <Link href="/settings" data-testid="link-game-settings"><Hand size={15}/> Sound settings</Link>
            <button type="button" onClick={() => { audioManager.playSfx('button_click'); setShowRules(true); }} data-testid="button-game-help">How to play</button>
          </div>
        </aside>
      </div>

      {showRules && <div className="game-modal-backdrop" role="presentation">
        <div className="game-modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
          <span className="modal-icon"><Sparkles size={25}/></span>
          <h2 id="rules-title">A few friendly rules</h2>
          <ul>
            <li>Roll a 6 to bring a token out of your yard.</li>
            <li>Choose one of the glowing tokens to move.</li>
            <li>Land on an opponent to send their token home; safe stars protect everyone.</li>
            <li>A 6 or a capture earns another turn. Reach the finish with all four tokens to win.</li>
          </ul>
          <button type="button" className="primary-action" onClick={() => setShowRules(false)} data-testid="button-close-game-help">GOT IT</button>
        </div>
      </div>}

      {confirmExit && <div className="game-modal-backdrop" role="presentation">
        <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="quit-title">
          <span className="modal-icon"><DoorOpen size={25}/></span><h2 id="quit-title">Leave this game?</h2>
          <p>Your current match will be lost.</p>
          <div className="modal-actions">
            <button type="button" className="outline-action" onClick={() => setConfirmExit(false)} data-testid="button-continue-game">KEEP PLAYING</button>
            <button type="button" className="danger-action" onClick={exit} data-testid="button-confirm-exit">QUIT GAME</button>
          </div>
        </div>
      </div>}
    </section>
  );
}

function Gamepad2Fallback() {
  return <div className="empty-die"><span>?</span></div>;
}

function ArrowRightFallback() {
  return <span aria-hidden="true">→</span>;
}

