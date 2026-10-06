import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Gift, Home, Play, ShoppingBag, Users, UserRound } from 'lucide-react';
import { PlayerHeader } from '@/components/lobby/PlayerHeader';
import { BottomNavigation } from '@/components/lobby/BottomNavigation';

const NoticeContext = createContext<(message: string) => void>(() => undefined);

const desktopItems = [
  { label: 'HOME', href: '/', Icon: Home },
  { label: 'PLAY', href: '/play', Icon: Play },
  { label: 'REWARDS', href: '/rewards', Icon: Gift },
  { label: 'SHOP', href: '/shop', Icon: ShoppingBag },
  { label: 'FRIENDS', href: '/friends', Icon: Users },
  { label: 'PROFILE', href: '/profile', Icon: UserRound },
];

export function useNotice(): (message: string) => void {
  return useContext(NoticeContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 2300);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const quietChrome = location === '/game' || location === '/result';

  return (
    <NoticeContext.Provider value={notify}>
      <div className={`game-app${quietChrome ? ' game-app--quiet' : ''}`}>
        {!quietChrome && (
          <>
            <PlayerHeader onNotice={notify}/>
            <nav className="desktop-nav" aria-label="Main navigation">
              {desktopItems.map(({ label, href, Icon }) => {
                const active = location === href || (href !== '/' && location.startsWith(`${href}/`));
                return (
                  <Link key={href} href={href} className={`desktop-nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined} data-testid={`desktop-nav-${label.toLowerCase()}`}>
                    <Icon size={17}/><span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </>
        )}
        <main className="game-app-main">{children}</main>
        {!quietChrome && <BottomNavigation/>}
        {notice && <div className="global-toast" role="status" data-testid="status-notice">{notice}</div>}
      </div>
    </NoticeContext.Provider>
  );
}
