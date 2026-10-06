import { useEffect, useRef, useState } from 'react';
import { CharacterHero, DailyReward, MissionCard } from '@/components/lobby/CharacterHero';
import { PlayerHeader } from '@/components/lobby/PlayerHeader';
import { LobbyExtras } from '@/components/lobby/LobbyExtras';
import { BottomNavigation } from '@/components/lobby/BottomNavigation';

export default function Home() {
  const [notice, setNotice] = useState('');
  const [coins, setCoins] = useState(12450);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 2400);
  };
  const claimReward = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    setCoins((currentCoins) => currentCoins + 500);
    notify('Daily bonus claimed — 500 coins added!');
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <main className="lobby-shell">
      <div className="lobby-inner">
        <PlayerHeader coins={coins} onNotice={notify}/>
        <CharacterHero onPlay={notify} claimed={rewardClaimed} onDailyClaim={claimReward}/>
        <div className="mobile-section mobile-sidequests">
          <DailyReward claimed={rewardClaimed} onClaim={claimReward}/>
          <MissionCard/>
        </div>
        <LobbyExtras onNotice={notify}/>
      </div>
      <BottomNavigation onNotice={notify}/>
      {notice && <div className="toast-note" role="status" data-testid="status-lobby-notice">{notice}</div>}
    </main>
  );
}
