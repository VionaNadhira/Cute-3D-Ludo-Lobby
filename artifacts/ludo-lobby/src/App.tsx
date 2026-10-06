import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/AppShell';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PlayerDataProvider } from '@/game/PlayerDataContext';
import { GameSessionProvider } from '@/game/GameContext';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import GamePage from '@/pages/GamePage';
import ResultPage from '@/pages/ResultPage';
import {
  BotSetupPage, FriendsPage, LocalSetupPage, PlayPage, ProfilePage,
  RewardsPage, SettingsPage, ShopPage,
} from '@/pages/MenuPages';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <AppShell>
        <Switch>
          <Route path="/" component={Home}/>
          <Route path="/play" component={PlayPage}/>
          <Route path="/play/bot" component={BotSetupPage}/>
          <Route path="/play/local" component={LocalSetupPage}/>
          <Route path="/game" component={GamePage}/>
          <Route path="/result" component={ResultPage}/>
          <Route path="/rewards" component={RewardsPage}/>
          <Route path="/shop" component={ShopPage}/>
          <Route path="/friends" component={FriendsPage}/>
          <Route path="/profile" component={ProfilePage}/>
          <Route path="/settings" component={SettingsPage}/>
          <Route component={NotFound}/>
        </Switch>
      </AppShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <PlayerDataProvider>
            <GameSessionProvider>
              <Router/>
            </GameSessionProvider>
          </PlayerDataProvider>
        </WouterRouter>
        <Toaster/>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

