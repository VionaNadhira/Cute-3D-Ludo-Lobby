/**
 * Dice.tsx
 *
 * Self-contained Dice component with rich animation feedback:
 *   – Idle bounce when ready
 *   – Roll wobble on press
 *   – Number pop on result
 *   – Special glow + EXTRA TURN badge on 6
 *   – Disabled / waiting state styling
 *
 * Animation is purely presentational — does NOT affect game state.
 * All animation is CSS-driven; React state only toggles classes.
 */

import './Dice.css';

export type DiceState = 'ready' | 'rolling' | 'result' | 'disabled' | 'waiting';

export type DiceProps = {
  /** Value currently shown (null = idle dots). */
  value: number | null;
  /** Current dice button state. */
  state: DiceState;
  /** Called when player taps the dice while state === 'ready'. */
  onRoll: () => void;
  /** Whether this is the bot's dice (no tap allowed, shows "Bot" label). */
  isBot?: boolean;
};

function DicePips() {
  return (
    <span className="dice-pips" aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
    </span>
  );
}

export function Dice({ value, state, onRoll, isBot = false }: DiceProps) {
  const isReady    = state === 'ready';
  const isRolling  = state === 'rolling';
  const isResult   = state === 'result';
  const isDisabled = state === 'disabled' || state === 'waiting';
  const isSix      = value === 6;
  const canAct     = isReady && !isBot;

  const label = isRolling
    ? 'Dice rolling…'
    : canAct
    ? `Roll the dice${value ? `, current value ${value}` : ''}`
    : value
    ? `Dice shows ${value}`
    : 'Dice ready';

  return (
    <div className={`dice-widget${isReady ? ' dice-is-ready' : ''}${isRolling ? ' dice-is-rolling' : ''}${isResult ? ' dice-is-result' : ''}${isSix ? ' dice-is-six' : ''}${isDisabled ? ' dice-is-disabled' : ''}`}>
      {/* Extra-turn badge — appears briefly when a 6 is rolled */}
      <div className="dice-extra-badge" aria-hidden="true">EXTRA TURN</div>

      <button
        type="button"
        className="dice-button"
        disabled={!canAct}
        onClick={canAct ? onRoll : undefined}
        aria-label={label}
        data-testid="button-roll-dice"
      >
        {/* Face */}
        <span className={`dice-face${isSix ? ' is-six' : ''}`}>
          {value !== null
            ? <span className="dice-numeral">{value}</span>
            : <DicePips />}
        </span>

        {/* Shine sweep overlay */}
        <span className="dice-shine" aria-hidden="true" />
      </button>

      {/* Prompt label below the button */}
      <span className="dice-hint">
        {isRolling
          ? 'GOOD LUCK!'
          : canAct
          ? 'TAP TO ROLL'
          : isBot
          ? isRolling ? 'ROLLING…' : 'BOT THINKING'
          : state === 'waiting'
          ? 'CHOOSE YOUR MOVE'
          : 'PLEASE WAIT'}
      </span>
    </div>
  );
}
