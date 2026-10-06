import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { audioManager } from '@/audio/AudioManager';
import { subscribeGameEvents } from './events/GameEvents';
import { readStoredValue, writeStoredValue } from './storage';

export type PlayerSettings = {
  sfx: boolean;
  music: boolean;
  sfxVolume: number;
  musicVolume: number;
};

export type PlayerData = {
  coins: number;
  gems: number;
  matchesPlayed: number;
  wins: number;
  missionWins: number;
  xp: number;
  rollsOfSix: number;
  captures: number;
  rewardClaimed: boolean;
  claimedMissions: string[];
  ownedItems: string[];
  settings: PlayerSettings;
  claimDailyReward: () => boolean;
  claimMission: (id: string, reward: number) => void;
  purchaseItem: (id: string, cost: number) => boolean;
  completeMatch: (matchId: string, won: boolean) => void;
  updateSettings: (settings: Partial<PlayerSettings>) => void;
};

const defaultSettings = audioManager.getSettings();
const PlayerDataContext = createContext<PlayerData | null>(null);
const currentLocalDay = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function PlayerDataProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(() => readStoredValue('ludo.coins', 12450));
  const [gems] = useState(() => readStoredValue('ludo.gems', 320));
  const [matchesPlayed, setMatchesPlayed] = useState(() => readStoredValue('ludo.matches-played', 24));
  const [wins, setWins] = useState(() => readStoredValue('ludo.wins', 17));
  const [missionWins, setMissionWins] = useState(() => readStoredValue('ludo.mission-wins', 0));
  const [xp, setXp] = useState(() => readStoredValue('ludo.xp', 2400));
  const [rollsOfSix, setRollsOfSix] = useState(() => readStoredValue('ludo.rolls-of-six', 0));
  const [captures, setCaptures] = useState(() => readStoredValue('ludo.captures', 0));
  const [dailyClaimDay, setDailyClaimDay] = useState(() => readStoredValue(
    'ludo.daily-claim-day',
    readStoredValue('ludo.daily-claimed', false) ? currentLocalDay() : '',
  ));
  const rewardClaimed = dailyClaimDay === currentLocalDay();
  const [claimedMissions, setClaimedMissions] = useState<string[]>(() => readStoredValue('ludo.claimed-missions', []));
  const [ownedItems, setOwnedItems] = useState<string[]>(() => readStoredValue('ludo.owned-items', []));
  const [settings, setSettings] = useState<PlayerSettings>(() => ({ ...defaultSettings, ...readStoredValue('ludo.audio', {}) }));

  const claimDailyReward = useCallback(() => {
    const today = currentLocalDay();
    if (dailyClaimDay === today) return false;
    setDailyClaimDay(today);
    writeStoredValue('ludo.daily-claim-day', today);
    writeStoredValue('ludo.daily-claimed', true);
    setCoins((current) => {
      const next = current + 500;
      writeStoredValue('ludo.coins', next);
      return next;
    });
    writeStoredValue('ludo.daily-claimed', true);
    audioManager.playSfx('reward');
    return true;
  }, [dailyClaimDay]);

  const claimMission = useCallback((id: string, reward: number) => {
    if (claimedMissions.includes(id)) return;
    const next = [...claimedMissions, id];
    setClaimedMissions(next);
    writeStoredValue('ludo.claimed-missions', next);
    setCoins((balance) => {
      const updated = balance + reward;
      writeStoredValue('ludo.coins', updated);
      return updated;
    });
    audioManager.playSfx('reward');
  }, [claimedMissions]);

  const purchaseItem = useCallback((id: string, cost: number) => {
    if (ownedItems.includes(id) || coins < cost) return ownedItems.includes(id);
    const nextItems = [...ownedItems, id];
    setOwnedItems(nextItems);
    writeStoredValue('ludo.owned-items', nextItems);
    setCoins((balance) => {
      const updated = balance - cost;
      writeStoredValue('ludo.coins', updated);
      return updated;
    });
    audioManager.playSfx('reward');
    return true;
  }, [coins, ownedItems]);

  const completeMatch = useCallback((matchId: string, won: boolean) => {
    const completed = readStoredValue<string[]>('ludo.completed-match-ids', []);
    if (completed.includes(matchId)) return;
    writeStoredValue('ludo.completed-match-ids', [...completed, matchId]);
    setMatchesPlayed((current) => {
      const next = current + 1;
      writeStoredValue('ludo.matches-played', next);
      return next;
    });
    if (won) {
      setWins((current) => {
        const next = current + 1;
        writeStoredValue('ludo.wins', next);
        return next;
      });
      setMissionWins((current) => {
        const next = current + 1;
        writeStoredValue('ludo.mission-wins', next);
        return next;
      });
    }
    setCoins((current) => {
      const next = current + (won ? 250 : 100);
      writeStoredValue('ludo.coins', next);
      return next;
    });
    setXp((current) => {
      const next = current + 100;
      writeStoredValue('ludo.xp', next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<PlayerSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      audioManager.setSfxEnabled(next.sfx);
      audioManager.setMusicEnabled(next.music);
      audioManager.setSfxVolume(next.sfxVolume);
      audioManager.setMusicVolume(next.musicVolume);
      writeStoredValue('ludo.audio', next);
      return next;
    });
  }, []);

  // Mission counters follow the same deterministic events that drive the board.
  useEffect(() => subscribeGameEvents((event) => {
    if (event.type === 'DICE_ROLLED' && event.value === 6 && event.playerId === 'player-1') {
      setRollsOfSix((current) => {
        const next = current + 1;
        writeStoredValue('ludo.rolls-of-six', next);
        return next;
      });
    }
    if (event.type === 'TOKEN_CAPTURED' && event.byPlayerId === 'player-1') {
      setCaptures((current) => {
        const next = current + 1;
        writeStoredValue('ludo.captures', next);
        return next;
      });
    }
  }), []);

  const value = useMemo(() => ({
    coins, gems, matchesPlayed, wins, missionWins, xp, rollsOfSix, captures,
    rewardClaimed, claimedMissions, ownedItems, settings, claimDailyReward, claimMission, purchaseItem,
    completeMatch, updateSettings,
  }), [
    coins, gems, matchesPlayed, wins, missionWins, xp, rollsOfSix, captures, rewardClaimed,
    claimedMissions, ownedItems, settings, claimDailyReward, claimMission, purchaseItem, completeMatch, updateSettings,
  ]);

  return <PlayerDataContext.Provider value={value}>{children}</PlayerDataContext.Provider>;
}

export function usePlayerData(): PlayerData {
  const value = useContext(PlayerDataContext);
  if (!value) throw new Error('usePlayerData must be used inside PlayerDataProvider');
  return value;
}

