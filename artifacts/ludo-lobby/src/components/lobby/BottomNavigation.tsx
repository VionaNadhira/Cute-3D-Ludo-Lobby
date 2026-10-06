import { Gift, Home, Play, ShoppingBag, UserRound } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { label: 'HOME', href: '/', Icon: Home },
  { label: 'PLAY', href: '/play', Icon: Play },
  { label: 'REWARDS', href: '/rewards', Icon: Gift },
  { label: 'SHOP', href: '/shop', Icon: ShoppingBag },
  { label: 'PROFILE', href: '/profile', Icon: UserRound },
];

export function BottomNavigation() {
  const [location] = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ label, href, Icon }) => {
        const active = location === href || (href !== '/' && location.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`nav-item${active ? ' active' : ''}`}
            data-testid={`nav-${label.toLowerCase()}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon"><Icon size={19} strokeWidth={2.7}/></span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
