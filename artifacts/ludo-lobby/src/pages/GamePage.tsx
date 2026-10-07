import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, DoorOpen, Hand, Shield, Sparkles, Trophy } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { LudoBoard } from '@/components/game/LudoBoard';
import { Dice } from '@/components/game/Dice';
import type { DiceState } from '@/components/game/Dice';
import { audioManager } from '@/audio/AudioManager';
import { haptic } from '@/audio/haptics';
import { chooseBestMove } from '@/game/BotStrategy';
import { getCurrentPlayer } from '@/game/engine';
import { useGameSession } from '@/game/GameContext';
import { useGameFeedback } from '@/game/useGameFeedback';
import type { GameState } from '@/game/types';

// ─── debug flag — reactive, read per-render from window ──────────────
function isDebug() {
  return typeof window !== 'undefined' && (window as Record<string, unknown>)['DEBUG_GAME'] === true;
}

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { state, rollDice, selectToken, resetGame, startGame, config } = useGameSession();

  // ─── animation / interaction state ───────────────────────────────
  const [isRolling, setIsRolling]   = useState(false);
  const [isMoving, setIsMoving]     = useState(false);
  const [displayedDice, setDisplayedDice] = useState<number | null>(null);
  const [visualProgress, setVisualProgress] = useState<Record<string, number>>({});
  const [highlightedTokenId, setHighlightedTokenId] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showRules, setShowRules]   = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [homeTokenIds, setHomeTokenIds] = useState<Set<string>>(new Set());

  // ─── refs ─────────────────────────────────────────────────────────
  const timers       = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef     = useRef<GameState | null>(state);
  // Track previous TOKEN PROGRESS values only (not the full state object).
  // This avoids spurious movement detection on phase-only transitions.
  // Initialized from the current state so that on first render, if state
  // already exists (loaded from localStorage), the snapshot is correct.
  const prevProgressRef = useRef<Record<string, number>>(
    (() => {
      if (!state) return {};
      const snap: Record<string, number> = {};
      state.players.forEach((p) => p.tokens.forEach((t) => { snap[t.id] = t.progress; }));
      return snap;
    })()
  );
  const routedToResult  = useRef(false);
  const resultTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  stateRef.current = state;

  // ─── centralised event-driven feedback hook ───────────────────────
  const {
    callout,
    captureFlash,
    celebrating,
    celebrationText,
    lastSix,
    setCelebrating,
    clearAll: clearFeedbackTimers,
  } = useGameFeedback(stateRef);

  // ─── safe schedule helper ─────────────────────────────────────────
  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, delay);
    timers.current.add(id);
    return id;
  }, []);

  // ─── cleanup everything on unmount ────────────────────────────────
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    clearFeedbackTimers();
    if (rollInterval.current) clearInterval(rollInterval.current);
    if (resultTimer.current)  clearTimeout(resultTimer.current);
  }, [clearFeedbackTimers]);

  // ─── reset ALL local animation state when game ID changes ─────────
  // This ensures "play again" (same component, new game) starts clean.
  const gameId = state?.id;
  const prevGameId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!gameId || gameId === prevGameId.current) return;
    prevGameId.current = gameId;
    // Clear stale animation state from the previous game
    setIsRolling(false);
    setIsMoving(false);
    setDisplayedDice(null);
    setVisualProgress({});
    setHighlightedTokenId(null);
    setShowResult(false);
    setHomeTokenIds(new Set());
    // Reset the progress snapshot to the new game's initial token positions
    if (state) {
      const snap: Record<string, number> = {};
      state.players.forEach((p) => p.tokens.forEach((t) => { snap[t.id] = t.progress; }));
      prevProgressRef.current = snap;
    }
    // Clear any in-flight timers from a previous game
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    if (rollInterval.current) { clearInterval(rollInterval.current); rollInterval.current = null; }
    if (resultTimer.current)  { clearTimeout(resultTimer.current); resultTimer.current = null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // ─── token step-by-step movement animation ────────────────────────
  // Compares current token progress values against the PREVIOUS snapshot.
  // Using a progress snapshot (not the full state ref) means phase-only
  // transitions (ready → select-token) never trigger false animations.
  useEffect(() => {
    if (!state) return;

    // Build current progress snapshot
    const currentSnap: Record<string, number> = {};
    state.players.forEach((p) => p.tokens.forEach((t) => { currentSnap[t.id] = t.progress; }));

    // Find tokens whose progress actually changed
    const changes: { id: string; from: number; to: number; color: string }[] = [];
    state.players.forEach((player) =>
      player.tokens.forEach((token) => {
        const prev = prevProgressRef.current[token.id];
        if (prev !== undefined && prev !== token.progress) {
          changes.push({ id: token.id, from: prev, to: token.progress, color: player.color });
        }
      })
    );

    // Always update the snapshot BEFORE the early return so the next
    // call has the correct baseline.
    prevProgressRef.current = currentSnap;

    if (changes.length === 0) return;

    console.log('[GAME] Movement detected:', changes.map(c => `${c.id}: ${c.from}→${c.to}`));

    setIsMoving(true);
    let maxDelay = 0;

    changes.forEach(({ id, from, to }) => {
      setVisualProgress((cur) => ({ ...cur, [id]: from }));

      // Token returning to yard (captured)
      if (to < 0) {
        maxDelay = Math.max(maxDelay, 380);
        schedule(() => {
          setVisualProgress((cur) => { const n = { ...cur }; delete n[id]; return n; });
        }, 380);
        return;
      }

      // Step-by-step movement with pitch variation
      const steps = Math.max(1, from < 0 ? 1 : to - from);
      const pitches = [0.93, 1.0, 1.07, 0.97, 1.03];

      for (let step = 1; step <= steps; step++) {
        const s = step;
        const delay = (from < 0 ? 140 : 65) + s * 105;
        maxDelay = Math.max(maxDelay, delay);
        schedule(() => {
          setVisualProgress((cur) => ({
            ...cur,
            [id]: from < 0 ? 0 : Math.min(to, from + s),
          }));
          audioManager.playSfx(from < 0 ? 'token_enter_board' : 'token_step',
            pitches[(s - 1) % pitches.length]);
        }, delay);
      }

      // Landing
      const landDelay = (from < 0 ? 140 : 65) + steps * 105;
      schedule(() => {
        audioManager.playSfx('token_land');
        if (to >= 52) {
          haptic.home();
          setHomeTokenIds((prev) => { const n = new Set(prev); n.add(id); return n; });
          schedule(() => setHomeTokenIds((prev) => { const n = new Set(prev); n.delete(id); return n; }), 1200);
        }
        setVisualProgress((cur) => { const n = { ...cur }; delete n[id]; return n; });
      }, landDelay + 80);
    });

    schedule(() => {
      setIsMoving(false);
      setHighlightedTokenId(null);
    }, maxDelay + 220);
  }, [schedule, state]);

  // ─── route to result after game-over ─────────────────────────────
  useEffect(() => {
    if (!state || state.phase !== 'over' || isMoving || routedToResult.current) return;
    resultTimer.current = setTimeout(() => {
      routedToResult.current = true;
      setLocation('/result');
    }, 2200);
    return () => { if (resultTimer.current) clearTimeout(resultTimer.current); };
  }, [isMoving, setLocation, state]);

  // ─── roll handler ─────────────────────────────────────────────────
  const performRoll = useCallback((fromBot = false) => {
    if (!stateRef.current || stateRef.current.phase !== 'ready' || isRolling || isMoving) return;

    if (!fromBot) {
      audioManager.playSfx('button_click');
      haptic.roll();
    }
    audioManager.playSfx('dice_pickup');

    setIsRolling(true);
    setShowResult(false);
    let face = 1;
    setDisplayedDice(face);

    if (rollInterval.current) clearInterval(rollInterval.current);
    let shakeCount = 0;
    rollInterval.current = setInterval(() => {
      face = (face % 6) + 1;
      setDisplayedDice(face);
      shakeCount++;
      if (shakeCount % 3 === 0) audioManager.playSfx('dice_shake');
    }, 68);

    // Dispatch the actual roll to the engine NOW (not after the animation).
    // The engine immediately transitions the state; isRolling=true keeps the
    // board locked until the animation finishes.
    rollDice();

    schedule(() => {
      if (rollInterval.current) { clearInterval(rollInterval.current); rollInterval.current = null; }
      const rolled = stateRef.current?.lastRoll ?? null;
      setDisplayedDice(rolled);
      setIsRolling(false);   // ← unblocks token selection
      setShowResult(true);

      console.log('[GAME] Dice settled:', rolled);
      console.log('[GAME] Phase after roll:', stateRef.current?.phase);
      console.log('[GAME] Valid moves:', stateRef.current?.validMoves?.map(m => m.tokenId));
      console.log('[GAME] Current player:', stateRef.current ? getCurrentPlayer(stateRef.current) : null);

      audioManager.playSfx('dice_land');
      if (rolled === 6) audioManager.playSfx('extra_turn');
      schedule(() => setShowResult(false), 1400);
    }, 510);
  }, [isMoving, isRolling, rollDice, schedule]);

  // ─── bot turn orchestration ───────────────────────────────────────
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

  // ─── invalid token tap ────────────────────────────────────────────
  const handleInvalidTokenTap = useCallback(() => {
    audioManager.playSfx('invalid_move');
    haptic.tap();
  }, []);

  // ─── derived state ────────────────────────────────────────────────
  const currentPlayer = state ? getCurrentPlayer(state) : null;
  const activeCanAct  = currentPlayer?.type === 'human';

  // isMoving blocks everything. isRolling blocks everything.
  // celebrating/confirmExit block everything.
  // !activeCanAct blocks human actions on bot's turn.
  const blocked  = isRolling || isMoving || celebrating || confirmExit || !activeCanAct;
  const canRoll  = !!state && state.phase === 'ready'        && !blocked;
  const canSelect = !!state && state.phase === 'select-token' && !blocked;
  const isBot    = currentPlayer?.type === 'bot';

  const diceState: DiceState = (() => {
    if (isRolling)  return 'rolling';
    if (showResult) return 'result';
    if (!activeCanAct || celebrating) return isBot ? 'waiting' : 'disabled';
    if (state?.phase === 'select-token') return 'waiting';
    if (canRoll) return 'ready';
    return 'disabled';
  })();

  const playerTokenCount = (playerId: string) =>
    state?.players.find((p) => p.id === playerId)?.tokens.filter((t) => t.progress === 57).length ?? 0;

  const exit = () => { resetGame(); setLocation('/'); };

  // ─── play again ───────────────────────────────────────────────────
  // startGame() changes state.id, which triggers the game-id effect above
  // to reset all local animation state before the first render of the new game.
  const playAgain = useCallback(() => {
    if (!config) { setLocation('/play'); return; }
    routedToResult.current = false;
    setCelebrating(false);
    startGame(config);
    setLocation('/game');
  }, [config, setCelebrating, setLocation, startGame]);

  if (!state) {
    return (
      <section className="game-recovery">
        <div className="recovery-icon"><Gamepad2Fallback /></div>
        <h1>No game in progress</h1>
        <p>Choose a table to start a new round.</p>
        <Link href="/play" className="primary-action" data-testid="link-start-game">
          <span>CHOOSE A GAME</span><ArrowRightFallback />
        </Link>
      </section>
    );
  }

  const calloutClass = callout
    ? callout.kind === 'capture' ? 'callout-capture'
    : callout.kind === 'extra'   ? 'callout-extra'
    : callout.kind === 'home'    ? 'callout-home'
    : callout.kind === 'safe'    ? 'callout-safe'
    : 'callout-turn'
    : '';

  const validTokenIds = canSelect ? state.validMoves.map((m) => m.tokenId) : [];

  return (
    <section
      className={`gameplay-page${captureFlash ? ' capture-shake' : ''}${celebrating ? ' game-celebrating' : ''}`}
      data-testid="gameplay-page"
    >
      {/* ── HUD ──────────────────────────────────────────────────── */}
      <header className="game-hud">
        <button
          type="button"
          className="game-exit-button"
          onClick={() => { audioManager.playSfx('button_click'); setConfirmExit(true); }}
          data-testid="button-exit-game"
        >
          <ArrowLeft size={17} /><span>EXIT</span>
        </button>

        <div className="game-turn-indicator" aria-live="polite" data-testid="status-turn">
          <i className={`turn-color-chip chip-${currentPlayer?.color ?? 'coral'}`} />
          <span>
            <b>{isBot ? 'BOT TURN' : `${currentPlayer?.name.toUpperCase()} TURN`}</b>
            <small className={isBot ? 'bot-thinking-label' : ''}>
              {isBot
                ? state.phase === 'select-token' ? 'CHOOSING TOKEN…' : 'THINKING…'
                : state.phase === 'select-token'
                ? 'PICK A GLOWING TOKEN'
                : state.phase === 'over'
                ? 'ROUND COMPLETE'
                : 'ROLL THE DICE'}
            </small>
          </span>
          {isBot && <Bot size={19} />}
        </div>

        <div className="game-counter">
          <Trophy size={15} />
          <span>
            {state.players.reduce((s, p) => s + playerTokenCount(p.id), 0)} /{' '}
            {state.players.length * 4} HOME
          </span>
        </div>
      </header>

      {/* ── Layout ───────────────────────────────────────────────── */}
      <div className="game-layout">
        {/* ── Board + overlays ─────────────────────────────────── */}
        <div className="game-board-wrap">
          <LudoBoard
            players={state.players}
            currentPlayerId={currentPlayer?.id ?? state.players[0].id}
            validTokenIds={validTokenIds}
            tokenVisualProgress={visualProgress}
            highlightedTokenId={highlightedTokenId}
            homeTokenIds={homeTokenIds}
            disabled={!canSelect}
            lastRoll={state.lastRoll}
            onSelectToken={selectToken}
            onInvalidTokenTap={handleInvalidTokenTap}
          />

          {callout && (
            <div className={`game-callout ${calloutClass}`} role="status" data-testid="status-turn-feedback">
              {callout.kind === 'capture' && <Sparkles size={14} />}
              {callout.kind === 'home' && <Trophy size={14} />}
              {callout.text}
            </div>
          )}

          {celebrating && (
            <div className="victory-cover" role="status">
              <div className="victory-sparkles">
                <Sparkles size={28} />
                <Trophy size={42} />
                <Sparkles size={20} />
              </div>
              <b className="victory-text">{celebrationText}</b>
              <small>
                {celebrationText.includes('YOU') ? 'WHAT A LOVELY LITTLE WIN' : 'WELL PLAYED BY ALL'}
              </small>
              {celebrationText.includes('YOU') && (
                <button
                  type="button"
                  className="victory-play-again"
                  onClick={playAgain}
                  data-testid="button-victory-play-again"
                >
                  PLAY AGAIN
                </button>
              )}
            </div>
          )}

          {/* Debug overlay — activate: window.DEBUG_GAME = true  (then re-render) */}
          {isDebug() && state && (
            <div style={{
              position: 'absolute', top: 4, left: 4, zIndex: 999,
              background: 'rgba(0,0,0,.82)', color: '#0f0', fontFamily: 'monospace',
              fontSize: 10, padding: '6px 9px', borderRadius: 6, pointerEvents: 'none',
              lineHeight: 1.55,
            }}>
              <b>PHASE:</b> {state.phase}<br />
              <b>PLAYER:</b> {getCurrentPlayer(state).name} ({getCurrentPlayer(state).type})<br />
              <b>DICE:</b> {state.lastRoll ?? '—'}<br />
              <b>isRolling:</b> {String(isRolling)}<br />
              <b>isMoving:</b> {String(isMoving)}<br />
              <b>canSelect:</b> {String(canSelect)}<br />
              <b>VALID MOVES:</b><br />
              {state.validMoves.length === 0
                ? '  (none)'
                : state.validMoves.map(m => `  ${m.tokenId}`).join('\n')}
            </div>
          )}
        </div>

        {/* ── Control panel ─────────────────────────────────────── */}
        <aside className="game-control-panel">
          <div className="control-panel-heading">
            <span className="page-eyebrow">
              {state.config.mode === 'bot' ? 'A FRIENDLY CHALLENGE' : 'PASS THE DEVICE'}
            </span>
            <h1>{state.config.mode === 'bot' ? 'VS Bot' : 'Local game'}</h1>
          </div>

          <div className="seat-list">
            {state.players.map((player) => {
              const isCurrent = player.id === currentPlayer?.id;
              const homeCount = playerTokenCount(player.id);
              return (
                <div
                  key={player.id}
                  className={`seat-row${isCurrent ? ' current' : ''}`}
                  data-testid={`seat-${player.id}`}
                >
                  <span className={`seat-marker chip-${player.color}`}>
                    {player.type === 'bot' ? <Bot size={17} /> : player.name.charAt(0)}
                  </span>
                  <span className="seat-row-copy">
                    <b>{player.name}</b>
                    <small>
                      {player.type === 'bot'
                        ? 'Computer player'
                        : state.config.mode === 'local'
                        ? 'Local player'
                        : 'You'}
                    </small>
                  </span>
                  <span className="home-token-count">
                    {homeCount}/4 <small>HOME</small>
                  </span>
                </div>
              );
            })}
          </div>

          <div className={`dice-control${isRolling ? ' is-rolling' : ''}${canRoll ? ' is-ready' : ''}`}>
            <span className="dice-prompt">
              {isRolling
                ? 'ROLLING…'
                : canRoll
                ? 'YOUR DICE IS READY'
                : state.phase === 'select-token'
                ? 'CHOOSE YOUR MOVE'
                : isBot
                ? 'BOT IS THINKING'
                : 'WAIT A MOMENT'}
            </span>
            <Dice
              value={isRolling ? displayedDice : (state.lastRoll ?? displayedDice)}
              state={diceState}
              onRoll={() => performRoll(false)}
              isBot={isBot}
            />
            {lastSix && !isRolling && (
              <span className="six-badge" aria-live="polite">6! EXTRA TURN 🎉</span>
            )}
          </div>

          <div className="game-rule-note">
            <Shield size={15} />
            <span>Safe stars protect your tokens. Roll a 6 to leave your yard.</span>
          </div>

          <div className="game-short-actions">
            <Link href="/settings" data-testid="link-game-settings">
              <Hand size={15} /> Sound settings
            </Link>
            <button
              type="button"
              onClick={() => { audioManager.playSfx('button_click'); setShowRules(true); }}
              data-testid="button-game-help"
            >
              How to play
            </button>
          </div>
        </aside>
      </div>

      {showRules && (
        <div className="game-modal-backdrop" role="presentation">
          <div className="game-modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
            <span className="modal-icon"><Sparkles size={25} /></span>
            <h2 id="rules-title">A few friendly rules</h2>
            <ul>
              <li>Roll a 6 to bring a token out of your yard.</li>
              <li>Choose one of the glowing tokens to move.</li>
              <li>Land on an opponent to send their token home; safe stars protect everyone.</li>
              <li>A 6 or a capture earns another turn. Reach the finish with all four tokens to win.</li>
            </ul>
            <button
              type="button"
              className="primary-action"
              onClick={() => { audioManager.playSfx('button_click'); setShowRules(false); }}
              data-testid="button-close-game-help"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="game-modal-backdrop" role="presentation">
          <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="quit-title">
            <span className="modal-icon"><DoorOpen size={25} /></span>
            <h2 id="quit-title">Leave this game?</h2>
            <p>Your current match will be lost.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="outline-action"
                onClick={() => { audioManager.playSfx('button_click'); setConfirmExit(false); }}
                data-testid="button-continue-game"
              >
                KEEP PLAYING
              </button>
              <button
                type="button"
                className="danger-action"
                onClick={exit}
                data-testid="button-confirm-exit"
              >
                QUIT GAME
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Gamepad2Fallback() {
  return <div className="empty-die"><span>?</span></div>;
}

function ArrowRightFallback() {
  return <span aria-hidden="true">→</span>;
}
