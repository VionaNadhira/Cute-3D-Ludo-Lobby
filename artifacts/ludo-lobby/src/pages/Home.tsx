import { useEffect, useRef, useState } from 'react';
import { CharacterHero, DailyReward, MissionCard } from '@/components/lobby/CharacterHero';
import { PlayerHeader } from '@/components/lobby/PlayerHeader';
import { LobbyExtras } from '@/components/lobby/LobbyExtras';
import { BottomNavigation } from '@/components/lobby/BottomNavigation';

export default function Home() {
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 2400);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <main className="lobby-shell">
      <div className="lobby-inner">
        <PlayerHeader onNotice={notify}/>
        <CharacterHero onPlay={notify}/>
        <div className="mobile-section mobile-sidequests">
          <DailyReward onClaim={() => notify('Daily bonus claimed — 500 coins added!')}/>
          <MissionCard/>
        </div>
        <LobbyExtras onNotice={notify}/>
      </div>
      <BottomNavigation onNotice={notify}/>
      {notice && <div className="toast-note" role="status" data-testid="status-lobby-notice">{notice}</div>}
    </main>
  );
}
