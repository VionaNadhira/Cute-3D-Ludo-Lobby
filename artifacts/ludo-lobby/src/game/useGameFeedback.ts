/**
 * useGameFeedback.ts
 *
 * Centralised hook that subscribes to GameEvents and drives all
 * presentational side-effects (audio, haptics, UI state flags).
 *
 * This hook NEVER writes to game state — only reads events and
 * updates local React state for animations / sounds.
 *
 * Architecture:
 *   Game Engine → GameEvent → useGameFeedback → sounds + animation flags
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { audioManager } from '@/audio/AudioManager';
import { haptic } from '@/audio/haptics';
import { subscribeGameEvents } from '@/game/events/GameEvents';
import type { GameState } from '@/game/types';

export type FeedbackCallout =
  | { kind: 'turn'; text: string }
  | { kind: 'extra'; text: string }
  | { kind: 'capture'; text: string }
  | { kind: 'safe'; text: string }
  | { kind: 'home'; text: string };

export function useGameFeedback(stateRef: MutableRefObject<GameState | null>) {
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const [callout, setCallout]           = useState<FeedbackCallout | null>(null);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [homeFlash, setHomeFlash]       = useState(false);
  const [safeFlash, setSafeFlash]       = useState(false);
  const [celebrating, setCelebrating]   = useState(false);
  const [celebrationText, setCelebrationText] = useState('YOU DID IT!');
  const [lastSix, setLastSix]           = useState(false);

  const schedule = useCallback((cb: () => void, delay: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      cb();
    }, delay);
    timers.current.add(id);
  }, []);

  // Clear all pending timers on unmount / game reset
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  useEffect(() => () => clearAll(), [clearAll]);

  useEffect(() => subscribeGameEvents((event) => {
    switch (event.type) {
      case 'DICE_ROLLED': {
        const isSix = event.value === 6;
        // dice_land / dice_shake / dice_pickup are handled with timing in
        // GamePage.performRoll. Here we only drive the post-result state flags.
        haptic.roll();
        setLastSix(isSix);
        if (isSix) haptic.extraTurn();
        schedule(() => setLastSix(false), 2200);
        break;
      }

      case 'TOKEN_SELECTED':
        audioManager.playSfx('token_select');
        haptic.tap();
        break;

      case 'TOKEN_CAPTURED':
        audioManager.playSfx('capture');
        haptic.capture();
        setCaptureFlash(true);
        setCallout({ kind: 'capture', text: 'NICE CAPTURE!' });
        schedule(() => setCaptureFlash(false), 520);
        schedule(() => setCallout(null), 1100);
        break;

      case 'TOKEN_ENTERED_HOME':
        audioManager.playSfx('token_enter_home');
        audioManager.playSfx('reward');
        haptic.home();
        setHomeFlash(true);
        setCallout({ kind: 'home', text: '🏠 HOME!' });
        schedule(() => setHomeFlash(false), 900);
        schedule(() => setCallout(null), 1300);
        break;

      case 'SAFE_CELL':
        audioManager.playSfx('safe_cell');
        setSafeFlash(true);
        setCallout({ kind: 'safe', text: '⭐ SAFE SPOT' });
        schedule(() => setSafeFlash(false), 600);
        schedule(() => setCallout(null), 950);
        break;

      case 'EXTRA_TURN': {
        const player = stateRef.current?.players.find((p) => p.id === event.playerId);
        setCallout({ kind: 'extra', text: player?.type === 'bot' ? "BOT'S EXTRA TURN" : 'EXTRA TURN!' });
        audioManager.playSfx('extra_turn');
        schedule(() => setCallout(null), 1050);
        break;
      }

      case 'TURN_CHANGED': {
        const player = stateRef.current?.players.find((p) => p.id === event.playerId);
        setCallout({
          kind: 'turn',
          text: player
            ? player.type === 'bot'
              ? "BOT'S TURN"
              : player.name === 'You'
              ? 'YOUR TURN'
              : `${player.name.toUpperCase()}'S TURN`
            : 'NEXT TURN',
        });
        audioManager.playSfx('turn_start');
        schedule(() => setCallout(null), 1050);
        break;
      }

      case 'GAME_WON': {
        const winner = stateRef.current?.players.find((p) => p.id === event.playerId);
        const isHuman = event.playerId === 'player-1';
        setCelebrationText(isHuman ? 'YOU DID IT!' : `${winner?.name.toUpperCase() ?? 'PLAYER'} WINS`);
        setCelebrating(true);
        if (isHuman) {
          audioManager.playVictoryFanfare();
          haptic.victory();
        } else {
          audioManager.playSfx('defeat');
        }
        break;
      }
    }
  }), [schedule, stateRef]);

  return {
    callout,
    captureFlash,
    homeFlash,
    safeFlash,
    celebrating,
    celebrationText,
    lastSix,
    setCelebrating,
    clearAll,
  };
}
