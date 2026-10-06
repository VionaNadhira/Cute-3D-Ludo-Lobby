import { Bell, Settings } from 'lucide-react';

type PlayerHeaderProps = { onNotice: (message: string) => void };

export function PlayerHeader({ onNotice }: PlayerHeaderProps) {
  return (
    <header className="topbar">
      <div className="profile-wrap" data-testid="profile-player">
        <div className="profile-avatar" aria-label="Pip player avatar">P</div>
        <div className="level-block">
          <div className="level-line">LV. 24</div>
          <div className="level-track" aria-label="Level progress 68%">
            <div className="level-fill" />
          </div>
        </div>
      </div>
      <div className="resource-row">
        <div className="resource-pill" data-testid="value-coins">
          <span className="resource-icon">C</span><span className="resource-value">12,450</span>
          <button className="add-resource" aria-label="Add coins" data-testid="button-add-coins" onClick={() => onNotice('Coin shop is warming up!')}>+</button>
        </div>
        <div className="resource-pill" data-testid="value-gems">
          <span className="resource-icon gem">D</span><span className="resource-value">320</span>
          <button className="add-resource" aria-label="Add gems" data-testid="button-add-gems" onClick={() => onNotice('Gem bundles are coming soon!')}>+</button>
        </div>
      </div>
      <div className="header-actions">
        <button className="round-action" aria-label="Notifications" data-testid="button-notifications" onClick={() => onNotice('You are all caught up!')}><Bell size={18} strokeWidth={2.8}/><span className="dot"/></button>
        <button className="round-action" aria-label="Settings" data-testid="button-settings" onClick={() => onNotice('Settings will be here soon.')}><Settings size={18} strokeWidth={2.8}/></button>
      </div>
    </header>
  );
}
