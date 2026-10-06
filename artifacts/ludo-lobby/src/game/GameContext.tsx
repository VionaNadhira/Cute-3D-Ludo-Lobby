import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createGame, reduceGame } from './engine';
import { emitGameEvents } from './events/GameEvents';
import { readStoredValue, writeStoredValue } from './storage';
import type { GameConfig, GameState } from './types';

type GameContextValue = {
  state: GameState | null;
  config: GameConfig | null;
  result: GameState | null;
  startGame: (config: GameConfig) => void;
  rollDice: () => void;
  selectToken: (tokenId: string) => void;
  resetGame: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(() => readStoredValue('ludo.active-match', null));
  const stateRef = useRef(state);
  const [config, setConfig] = useState<GameConfig | null>(() => readStoredValue('ludo.last-config', null));
  const [result, setResult] = useState<GameState | null>(() => readStoredValue('ludo.last-result', null));

  const apply = useCallback((action: Parameters<typeof reduceGame>[1]) => {
    const current = stateRef.current;
    if (!current) return;
    const transition = reduceGame(current, action);
    if (transition.state === current && transition.events.length === 0) return;
    stateRef.current = transition.state;
    setState(transition.state);
    if (transition.state.phase === 'over') {
      setResult(transition.state);
      writeStoredValue('ludo.last-result', transition.state);
    }
    writeStoredValue('ludo.active-match', transition.state.phase === 'over' ? null : transition.state);
    emitGameEvents(transition.events);
  }, []);

  const startGame = useCallback((nextConfig: GameConfig) => {
    const next = createGame(nextConfig);
    stateRef.current = next;
    setConfig(nextConfig);
    setState(next);
    setResult(null);
    writeStoredValue('ludo.last-config', nextConfig);
    writeStoredValue('ludo.active-match', next);
    writeStoredValue('ludo.last-result', null);
  }, []);

  const rollDice = useCallback(() => {
    apply({ type: 'ROLL_DICE', value: Math.floor(Math.random() * 6) + 1 });
  }, [apply]);

  const selectToken = useCallback((tokenId: string) => {
    apply({ type: 'SELECT_TOKEN', tokenId });
  }, [apply]);

  const resetGame = useCallback(() => {
    stateRef.current = null;
    setState(null);
    setResult(null);
    writeStoredValue('ludo.active-match', null);
  }, []);

  const value = useMemo(() => ({ state, config, result, startGame, rollDice, selectToken, resetGame }), [
    state, config, result, startGame, rollDice, selectToken, resetGame,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameSession(): GameContextValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGameSession must be used inside GameSessionProvider');
  return value;
}

