import { useState } from 'react';
import { Home, ShoppingBag, Gift, Users, UserRound } from 'lucide-react';

const navItems = [
  { label: 'HOME', Icon: Home },
  { label: 'FRIENDS', Icon: Users },
  { label: 'SHOP', Icon: ShoppingBag },
  { label: 'REWARDS', Icon: Gift },
  { label: 'PROFILE', Icon: UserRound },
];

export function BottomNavigation({ onNotice }: { onNotice: (message: string) => void }) {
  const [active, setActive] = useState('HOME');
  return (
    <nav className="bottom-nav" aria-label="Game navigation">
      {navItems.map(({ label, Icon }) => (
        <button
          key={label}
          className={`nav-item${active === label ? ' active' : ''}`}
          data-testid={`nav-${label.toLowerCase()}`}
          aria-current={active === label ? 'page' : undefined}
          onClick={() => { setActive(label); if (label !== 'HOME') onNotice(`${label.charAt(0)}${label.slice(1).toLowerCase()} corner coming soon.`); }}
        >
          <span className="nav-icon"><Icon size={19} strokeWidth={2.8}/></span><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
