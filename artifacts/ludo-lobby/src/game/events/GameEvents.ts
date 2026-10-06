import type { GameEvent } from '../types';

type Listener = (event: GameEvent) => void;
const listeners = new Set<Listener>();

export function subscribeGameEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function emitGameEvents(events: GameEvent[]): void {
  events.forEach((event) => listeners.forEach((listener) => listener(event)));
}

