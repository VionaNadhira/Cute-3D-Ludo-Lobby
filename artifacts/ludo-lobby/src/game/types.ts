export type BoardColor = 'coral' | 'blue' | 'mint' | 'gold';
export type PlayerType = 'human' | 'bot';
export type GameMode = 'bot' | 'local';
export type BotDifficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'ready' | 'select-token' | 'over';

export type TokenState = {
  id: string;
  progress: number;
};

export type PlayerState = {
  id: string;
  type: PlayerType;
  name: string;
  color: BoardColor;
  tokens: TokenState[];
};

export type GameConfig = {
  mode: GameMode;
  difficulty: BotDifficulty;
  localPlayers: 2 | 3 | 4;
};

export type ValidMove = {
  tokenId: string;
  fromProgress: number;
  toProgress: number;
  exitsYard: boolean;
  entersHome: boolean;
  reachesHome: boolean;
  captures: string[];
  isSafe: boolean;
};

export type GameState = {
  id: string;
  config: GameConfig;
  players: PlayerState[];
  currentPlayerIndex: number;
  phase: GamePhase;
  diceValue: number | null;
  lastRoll: number | null;
  validMoves: ValidMove[];
  winnerId: string | null;
  turnsTaken: number;
};

export type GameAction =
  | { type: 'ROLL_DICE'; value: number }
  | { type: 'SELECT_TOKEN'; tokenId: string };

export type GameEvent =
  | { type: 'DICE_ROLLED'; value: number; playerId: string }
  | { type: 'TOKEN_SELECTED'; tokenId: string; playerId: string }
  | { type: 'TOKEN_MOVED'; tokenId: string; playerId: string; from: number; to: number; steps: number }
  | { type: 'TOKEN_CAPTURED'; tokenId: string; playerId: string; byPlayerId: string }
  | { type: 'TOKEN_ENTERED_HOME'; tokenId: string; playerId: string }
  | { type: 'SAFE_CELL'; tokenId: string; playerId: string }
  | { type: 'TURN_CHANGED'; playerId: string }
  | { type: 'EXTRA_TURN'; playerId: string }
  | { type: 'GAME_WON'; playerId: string };

export type GameTransition = {
  state: GameState;
  events: GameEvent[];
  move?: ValidMove;
};

export const PLAYER_COLORS: BoardColor[] = ['coral', 'blue', 'gold', 'mint'];
export const START_OFFSETS: Record<BoardColor, number> = {
  coral: 42,
  blue: 3,
  gold: 16,
  mint: 29,
};
export const SAFE_CELLS = new Set([1, 14, 27, 40]);
export const HOME_PROGRESS = 57;

