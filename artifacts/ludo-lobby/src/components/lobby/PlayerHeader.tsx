import { Link } from 'wouter';
import { Bell, Settings } from 'lucide-react';
import { usePlayerData } from '@/game/PlayerDataContext';

export function PlayerHeader({ onNotice }: { onNotice: (message: string) => void }) {
  const { coins, gems, wins, matchesPlayed, xp } = usePlayerData();
  const level = 22 + Math.floor(xp / 1000);
  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;

  return (
    <header className="global-header">
      <Link href="/" className="brand-lockup" data-testid="link-ludo-home" aria-label="Ludo World home">
        <span className="brand-mark">L</span>
        <span className="brand-words"><b>LUDO</b><small>PIP&apos;S PLAYFIELD</small></span>
      </Link>
      <div className="header-resources" aria-label="Player resources">
        <div className="resource-pill" data-testid="value-coins">
          <span className="resource-icon">C</span>
          <span className="resource-value">{coins.toLocaleString('en-US')}</span>
          <button className="resource-plus" aria-label="Open coin shop" data-testid="button-add-coins" onClick={() => onNotice('Coin bundles are coming soon.')}>+</button>
        </div>
        <div className="resource-pill" data-testid="value-gems">
          <span className="resource-icon gem">D</span>
          <span className="resource-value">{gems.toLocaleString('en-US')}</span>
          <button className="resource-plus" aria-label="Open gem shop" data-testid="button-add-gems" onClick={() => onNotice('Gem bundles are coming soon.')}>+</button>
        </div>
      </div>
      <div className="header-player">
        <Link href="/profile" className="header-profile-link" data-testid="link-profile-header">
          <span className="header-avatar" aria-hidden="true">P</span>
          <span className="header-player-copy"><b>LV. {level}</b><small>{winRate}% win rate</small></span>
        </Link>
        <button className="header-icon-button" aria-label="Notifications" data-testid="button-notifications" onClick={() => onNotice('You are all caught up!')}>
          <Bell size={19}/><i aria-hidden="true"/>
        </button>
        <Link href="/settings" className="header-icon-button" aria-label="Settings" data-testid="link-settings-header"><Settings size={19}/></Link>
      </div>
    </header>
  );
}
