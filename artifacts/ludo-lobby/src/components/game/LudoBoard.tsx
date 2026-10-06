import type { KeyboardEvent } from 'react';
import './LudoBoard.css';

export type BoardColor = 'coral' | 'blue' | 'mint' | 'gold';
export type BoardToken = { id: string; progress: number };
export type BoardPlayer = { id: string; name: string; color: BoardColor; tokens: BoardToken[] };
export type LudoBoardProps = {
  players: BoardPlayer[];
  currentPlayerId: string;
  validTokenIds: string[];
  tokenVisualProgress?: Record<string, number>;
  highlightedTokenId?: string | null;
  disabled: boolean;
  lastRoll: number | null;
  onSelectToken: (tokenId: string) => void;
};

const COLORS: BoardColor[] = ['coral', 'blue', 'gold', 'mint'];
const ENTRY: Record<BoardColor, number> = { coral: 42, blue: 3, gold: 16, mint: 29 };
const COLOR_LABEL: Record<BoardColor, string> = {
  coral: 'Coral',
  blue: 'Blue',
  mint: 'Mint',
  gold: 'Gold',
};

// Clockwise path around the board. The player's entry offset determines their own start square.
const TRACK: [number, number][] = [
  [1, 6], [0, 6], [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8],
  [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6], [12, 6], [11, 6],
  [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6],
  [4, 6], [3, 6], [2, 6],
];
const HOME_LANES: Record<BoardColor, [number, number][]> = {
  coral: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  blue: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  gold: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  mint: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};
const YARDS: Record<BoardColor, { x: number; y: number }> = {
  coral: { x: 0, y: 9 },
  blue: { x: 0, y: 0 },
  gold: { x: 9, y: 0 },
  mint: { x: 9, y: 9 },
};

const cellCenter = ([row, col]: [number, number]) => ({
  x: col * 40 + 20,
  y: row * 40 + 20,
});

function yardSpot(color: BoardColor, index: number) {
  const yard = YARDS[color];
  const spots: [number, number][] = [
    [1.75, 1.75], [4.25, 1.75], [1.75, 4.25], [4.25, 4.25],
  ];
  const [x, y] = spots[index % spots.length];
  return { x: (yard.x + x) * 40, y: (yard.y + y) * 40 };
}

function tokenPosition(color: BoardColor, progress: number, index: number) {
  if (progress < 0) return yardSpot(color, index);
  if (progress < 52) return cellCenter(TRACK[(ENTRY[color] + progress) % 52]);
  if (progress <= 56) return cellCenter(HOME_LANES[color][Math.max(0, progress - 52)]);
  const finishSpots: Record<BoardColor, [number, number]> = {
    coral: [7, 6.15], blue: [6.15, 7], gold: [7, 8.85], mint: [8.85, 7],
  };
  const [row, col] = finishSpots[color];
  return { x: col * 40 + 20, y: row * 40 + 20 };
}

function handleTokenKey(event: KeyboardEvent<SVGGElement>, tokenId: string, enabled: boolean, onSelect: (id: string) => void) {
  if (!enabled || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  onSelect(tokenId);
}

export function LudoBoard({
  players,
  currentPlayerId,
  validTokenIds,
  tokenVisualProgress,
  highlightedTokenId,
  disabled,
  lastRoll,
  onSelectToken,
}: LudoBoardProps) {
  const currentPlayer = players.find((player) => player.id === currentPlayerId);
  const valid = new Set(validTokenIds);

  return (
    <section className="ludo-board-shell" aria-label="Ludo game board" data-testid="ludo-board">
      <header className="ludo-board-heading">
        <div>
          <span className="ludo-board-eyebrow">PIP&apos;S PLAYFIELD</span>
          <h2>Race to the finish</h2>
        </div>
        <div className={`ludo-turn-chip${currentPlayer ? ` is-${currentPlayer.color}` : ''}`} aria-live="polite" data-testid="status-current-turn">
          <span className="turn-dot" />
          <span>{currentPlayer ? `${currentPlayer.name}’s turn` : 'Waiting for players'}</span>
        </div>
      </header>

      <div className="ludo-board-frame">
        <svg className="ludo-board-svg" viewBox="0 0 600 600" role="img" aria-label="Four-color Ludo board with a 52-square track and central finish">
          <defs>
            <filter id="board-shadow" x="-15%" y="-15%" width="130%" height="140%">
              <feDropShadow dx="0" dy="7" stdDeviation="4" floodColor="#76533a" floodOpacity=".2" />
            </filter>
            <linearGradient id="board-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fffdf3" />
              <stop offset="1" stopColor="#f5e8cf" />
            </linearGradient>
            <linearGradient id="token-gloss" x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".58" />
              <stop offset=".52" stopColor="#ffffff" stopOpacity=".08" />
              <stop offset="1" stopColor="#604235" stopOpacity=".18" />
            </linearGradient>
          </defs>

          <rect x="4" y="4" width="592" height="592" rx="32" className="board-wood" filter="url(#board-shadow)" />
          <rect x="14" y="14" width="572" height="572" rx="25" fill="url(#board-surface)" className="board-inner" />

          {COLORS.map((color) => {
            const yard = YARDS[color];
            return (
              <g key={`yard-${color}`} className={`yard yard-${color}`}>
                <rect x={yard.x * 40 + 7} y={yard.y * 40 + 7} width="226" height="226" rx="23" className="yard-color" />
                <rect x={yard.x * 40 + 31} y={yard.y * 40 + 31} width="178" height="178" rx="27" className="yard-inset" />
                <circle cx={yard.x * 40 + 120} cy={yard.y * 40 + 20} r="4" className="yard-stitch" />
                {[0, 1, 2, 3].map((slot) => {
                  const point = yardSpot(color, slot);
                  return <circle key={slot} cx={point.x} cy={point.y} r="16" className="yard-rest" />;
                })}
                <text x={yard.x * 40 + 120} y={yard.y * 40 + 225} className="yard-label">{COLOR_LABEL[color]}</text>
              </g>
            );
          })}

          {TRACK.map((cell, index) => {
            const point = cellCenter(cell);
            const startColor = COLORS.find((color) => ENTRY[color] === index);
            const isSafe = [1, 14, 27, 40].includes(index);
            return (
              <g key={`track-${index}`}>
                <rect x={point.x - 18} y={point.y - 18} width="36" height="36" rx="7" className={`track-cell${startColor ? ` start-${startColor}` : ''}${isSafe ? ' safe-cell' : ''}`} />
                {startColor && <circle cx={point.x} cy={point.y} r="5" className="start-mark" />}
                {isSafe && !startColor && <path d={`M${point.x} ${point.y - 6}l1.7 4.3 4.6.2-3.6 2.8 1.3 4.5-4-2.6-3.9 2.6 1.2-4.5-3.6-2.8 4.6-.2z`} className="safe-star" />}
              </g>
            );
          })}

          {COLORS.map((color) => HOME_LANES[color].map((cell, index) => {
            const point = cellCenter(cell);
            return <rect key={`lane-${color}-${index}`} x={point.x - 18} y={point.y - 18} width="36" height="36" rx="7" className={`lane-cell lane-${color}`} />;
          }))}

          <g className="finish">
            <path d="M240 240H360L300 300Z" className="finish-blue" />
            <path d="M360 240V360L300 300Z" className="finish-gold" />
            <path d="M360 360H240L300 300Z" className="finish-mint" />
            <path d="M240 360V240L300 300Z" className="finish-coral" />
            <circle cx="300" cy="300" r="15" className="finish-center" />
            <path d="M300 287v26M287 300h26" className="finish-seam" />
          </g>

          {players.flatMap((player) => player.tokens.map((token, index) => {
            const progress = tokenVisualProgress?.[token.id] ?? token.progress;
            const point = tokenPosition(player.color, progress, index);
            const canSelect = !disabled && valid.has(token.id);
            const highlighted = highlightedTokenId === token.id;
            const playerTurn = player.id === currentPlayerId;
            const tokenLabel = `${player.name}, ${COLOR_LABEL[player.color]} token ${index + 1}${progress === 57 ? ', finished' : progress < 0 ? ', in yard' : ''}`;
            return (
              <g
                key={token.id}
                className={`board-token token-${player.color}${canSelect ? ' is-valid' : ''}${highlighted ? ' is-highlighted' : ''}${playerTurn ? ' is-current' : ''}`}
                transform={`translate(${point.x} ${point.y})`}
                role={canSelect ? 'button' : undefined}
                tabIndex={canSelect ? 0 : undefined}
                aria-label={canSelect ? `${tokenLabel}. Select this token.` : tokenLabel}
                aria-disabled={canSelect ? undefined : 'true'}
                data-testid={`ludo-token-${token.id}`}
                onClick={canSelect ? () => onSelectToken(token.id) : undefined}
                onKeyDown={canSelect ? (event) => handleTokenKey(event, token.id, canSelect, onSelectToken) : undefined}
              >
                {canSelect && <circle r="19" className="valid-radiance" />}
                <ellipse cx="0" cy="11" rx="12" ry="4" className="token-shadow" />
                <circle r="13.5" className="token-body" />
                <circle r="13.5" className="token-gloss" />
                <circle r="6.3" className="token-core" />
                <circle cx="-4.3" cy="-5.2" r="2.2" className="token-shine" />
              </g>
            );
          }))}
        </svg>
      </div>

      <footer className="ludo-board-footer">
        <div className="board-key" aria-label="Board key">
          {players.map((player) => (
            <span className={`board-player-tag${player.id === currentPlayerId ? ' active' : ''}`} key={player.id} data-testid={`board-player-${player.id}`}>
              <i className={`player-swatch swatch-${player.color}`} />
              <span>{player.name}</span>
            </span>
          ))}
        </div>
        <div className="last-roll">
          <span>LAST ROLL</span>
          <b aria-live="polite" data-testid="value-last-roll">{lastRoll ?? '—'}</b>
        </div>
      </footer>
    </section>
  );
}
