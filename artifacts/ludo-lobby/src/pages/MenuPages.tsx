import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Bot, Check, Crown, Dice5, Gem, Gamepad2,
  Gift, Palette, Search, Settings as SettingsIcon, ShoppingBag, Sparkles,
  Star, Trophy, Users, Volume2, VolumeX, Zap,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { audioManager } from '@/audio/AudioManager';
import { useNotice } from '@/components/AppShell';
import { usePlayerData } from '@/game/PlayerDataContext';
import { useGameSession } from '@/game/GameContext';
import type { BotDifficulty, GameConfig } from '@/game/types';

const pageNames: Record<string, { title: string; subtitle: string }> = {
  '/play': { title: 'Pick your table', subtitle: 'Every path starts with one little roll.' },
  '/rewards': { title: 'A little something for you', subtitle: 'Daily treats, progress, and missions all live here.' },
  '/shop': { title: 'Toy shop', subtitle: 'Give your next game a little extra sparkle.' },
  '/friends': { title: 'Your playmates', subtitle: 'The best games begin with a friendly hello.' },
  '/profile': { title: 'Your player card', subtitle: 'Your adventures, all in one place.' },
  '/settings': { title: 'Make it yours', subtitle: 'Set up your sound and game preferences.' },
};

export function PageTitle({ eyebrow, title, subtitle, backHref }: {
  eyebrow: string; title: string; subtitle?: string; backHref?: string;
}) {
  return (
    <header className="page-title">
      <div>
        <div className="page-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {backHref && <Link href={backHref} className="back-button" data-testid="link-back"><ArrowLeft size={17}/> BACK</Link>}
    </header>
  );
}

export function PlayPage() {
  const modes = [
    { id: 'quick', title: 'QUICK MATCH', text: 'Find players online', badge: 'COMING SOON', Icon: Zap, color: 'sun', href: '/play' },
    { id: 'bot', title: 'VS BOT', text: 'Play against the computer', badge: 'AVAILABLE', Icon: Bot, color: 'mint', href: '/play/bot' },
    { id: 'friends', title: 'PLAY WITH FRIENDS', text: 'Create a private table', badge: 'COMING SOON', Icon: Users, color: 'berry', href: '/friends' },
    { id: 'local', title: 'LOCAL', text: 'Take turns on this device', badge: 'AVAILABLE', Icon: Gamepad2, color: 'sky', href: '/play/local' },
  ];
  return (
    <section className="page-surface">
      <PageTitle eyebrow="CHOOSE A GAME" title="Pick your table" subtitle="Play your way. Your next round is only a tap away."/>
      <div className="mode-grid">
        {modes.map(({ id, title, text, badge, Icon, color, href }) => {
          const available = badge === 'AVAILABLE';
          const inner = (
            <>
              <span className={`mode-art art-${color}`}><Icon size={33}/></span>
              <span className="mode-card-copy"><small>{badge}</small><b>{title}</b><span>{text}</span></span>
              {available && <ArrowRight className="mode-card-arrow" size={20}/>}
            </>
          );
          return available
            ? <Link key={id} href={href} className={`mode-card ${id === 'bot' ? 'mode-card-featured' : ''}`} data-testid={`link-mode-${id}`}>{inner}</Link>
            : <div key={id} className="mode-card mode-card-disabled" aria-disabled="true" data-testid={`mode-${id}`}>{inner}</div>;
        })}
      </div>
      <div className="soft-note"><Sparkles size={17}/><span>Online tables are getting ready. VS Bot and Local are open for a game now.</span></div>
    </section>
  );
}

export function BotSetupPage() {
  const [, setLocation] = useLocation();
  const { startGame } = useGameSession();
  const [difficulty, setDifficulty] = useState<BotDifficulty>('normal');
  const options: { id: BotDifficulty; title: string; detail: string }[] = [
    { id: 'easy', title: 'EASY', detail: 'A relaxed first game' },
    { id: 'normal', title: 'NORMAL', detail: 'A little bit clever' },
    { id: 'hard', title: 'HARD', detail: 'A sharper challenge' },
  ];
  const launch = () => {
    startGame({ mode: 'bot', difficulty, localPlayers: 2 });
    audioManager.playSfx('menu_open');
    setLocation('/game');
  };
  return (
    <section className="page-surface setup-page">
      <PageTitle eyebrow="GAME SETUP" title="VS Bot" subtitle="One player, one clever little computer opponent." backHref="/play"/>
      <div className="setup-stage">
        <div className="opponent-pair">
          <div className="opponent-tile player-tile"><span className="opponent-avatar avatar-coral">P</span><small>YOUR COLOR</small><b>Coral</b></div>
          <div className="versus-badge">VS</div>
          <div className="opponent-tile bot-tile"><span className="bot-face"><Bot size={30}/></span><small>YOUR OPPONENT</small><b>Pip Bot</b></div>
        </div>
        <div className="setup-section">
          <div className="setup-label">CHOOSE YOUR CHALLENGE</div>
          <div className="difficulty-options">
            {options.map((option) => (
              <button key={option.id} type="button" className={`difficulty-option${difficulty === option.id ? ' selected' : ''}`}
                onClick={() => { setDifficulty(option.id); audioManager.playSfx('button_click'); }}
                aria-pressed={difficulty === option.id} data-testid={`button-difficulty-${option.id}`}>
                <span className="difficulty-stars" aria-hidden="true">{option.id === 'easy' ? <Star size={14}/> : option.id === 'normal' ? <><Star size={14}/><Star size={14}/></> : <><Star size={14}/><Star size={14}/><Star size={14}/></>}</span>
                <b>{option.title}</b><small>{option.detail}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="setup-player-count"><span>PLAYERS</span><b>1 PLAYER <i/> 1 BOT</b></div>
        <button type="button" className="primary-action" onClick={launch} data-testid="button-start-bot-game"><span>START GAME</span><ArrowRight size={20}/></button>
      </div>
    </section>
  );
}

export function LocalSetupPage() {
  const [, setLocation] = useLocation();
  const { startGame } = useGameSession();
  const [players, setPlayers] = useState<2 | 3 | 4>(2);
  const start = () => {
    const config: GameConfig = { mode: 'local', difficulty: 'normal', localPlayers: players };
    startGame(config);
    setLocation('/game');
  };
  return (
    <section className="page-surface setup-page">
      <PageTitle eyebrow="SAME-DEVICE GAME" title="Local table" subtitle="Pass the device around and take turns together." backHref="/play"/>
      <div className="setup-stage local-setup">
        <div className="setup-section">
          <div className="setup-label">HOW MANY PLAYERS?</div>
          <div className="player-count-options">
            {([2, 3, 4] as const).map((count) => (
              <button key={count} type="button" className={`count-option${players === count ? ' selected' : ''}`}
                onClick={() => setPlayers(count)} aria-pressed={players === count} data-testid={`button-player-count-${count}`}>
                <strong>{count}</strong><small>PLAYERS</small>
              </button>
            ))}
          </div>
        </div>
        <div className="setup-section">
          <div className="setup-label">COLORFUL SEATS</div>
          <div className="seat-colors">
            {['CORAL', 'BLUE', 'GOLD', 'MINT'].slice(0, players).map((color) => <span key={color} className={`seat-color seat-${color.toLowerCase()}`}><i/>{color}</span>)}
          </div>
        </div>
        <div className="setup-player-count"><span>CONTROLS</span><b>ONE DEVICE, EVERY PLAYER</b></div>
        <button type="button" className="primary-action" onClick={start} data-testid="button-start-local-game"><span>START LOCAL GAME</span><ArrowRight size={20}/></button>
      </div>
    </section>
  );
}

type RewardsTab = 'daily' | 'track' | 'missions';
const missions = [
  { id: 'win-two', title: 'Win 2 matches', target: 2, reward: 250, progress: (data: ReturnType<typeof usePlayerData>) => Math.min(2, data.missionWins) },
  { id: 'roll-six', title: 'Roll a 6 three times', target: 3, reward: 150, progress: (data: ReturnType<typeof usePlayerData>) => Math.min(3, data.rollsOfSix) },
  { id: 'capture-two', title: 'Capture 2 tokens', target: 2, reward: 300, progress: (data: ReturnType<typeof usePlayerData>) => Math.min(2, data.captures) },
];

export function RewardsPage() {
  const data = usePlayerData();
  const [tab, setTab] = useState<RewardsTab>('daily');
  const tabLabels: { id: RewardsTab; label: string }[] = [
    { id: 'daily', label: 'DAILY' }, { id: 'track', label: 'TRACK' }, { id: 'missions', label: 'MISSIONS' },
  ];
  const progress = data.matchesPlayed % 3;
  return (
    <section className="page-surface rewards-page">
      <PageTitle eyebrow="GOOD THINGS AHEAD" title={pageNames['/rewards'].title} subtitle={pageNames['/rewards'].subtitle}/>
      <div className="segmented-tabs" role="tablist" aria-label="Reward sections">
        {tabLabels.map(({ id, label }) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'selected' : ''}
            onClick={() => setTab(id)} data-testid={`tab-rewards-${id}`}>{label}</button>
        ))}
      </div>

      {tab === 'daily' && (
        <div className="daily-reward-layout" role="tabpanel">
          <div className="daily-card">
            <div className="daily-card-copy"><span className="page-eyebrow">YOUR DAILY TREAT</span><h2>Seven days of<br/>little surprises.</h2>
              <p>Come back each day to collect a new goodie. Today's gift is waiting for you.</p>
              <div className="daily-current"><span>DAY 07</span><b>+500</b><small>COINS</small></div>
              <button type="button" className="claim-large" disabled={data.rewardClaimed}
                onClick={data.claimDailyReward} data-testid="button-claim-daily-reward">
                {data.rewardClaimed ? <><Check size={17}/> CLAIMED</> : <><Gift size={17}/> CLAIM 500 COINS</>}
              </button>
            </div>
            <img src="/pip-mascot-cutout.png" alt="Pip the fox holding a lucky die" className="reward-pip"/>
            <div className="daily-glow"/>
          </div>
          <div className="week-track">
            {Array.from({ length: 7 }, (_, index) => {
              const day = index + 1;
              const isCurrent = day === 7;
              return <div key={day} className={`week-day${isCurrent ? ' current' : ''}${day < 7 ? ' passed' : ''}`} data-testid={`reward-day-${day}`}>
                <span>DAY {String(day).padStart(2, '0')}</span><b>{day === 7 ? <Gift size={19}/> : <Check size={17}/>}</b>
                <small>{day === 7 ? '500 COINS' : day % 2 ? '50 COINS' : '1 GEM'}</small>
              </div>;
            })}
          </div>
        </div>
      )}

      {tab === 'track' && (
        <div className="track-panel" role="tabpanel">
          <div className="track-emblem"><Trophy size={43}/></div>
          <div className="track-copy"><span className="page-eyebrow">REWARD TRACK</span><h2>Play 3 games</h2><p>Your next little prize is just around the corner.</p>
            <div className="track-progress"><span style={{ width: `${progress / 3 * 100}%` }}/></div>
            <small>{progress} / 3 GAMES PLAYED</small>
          </div>
          <div className="track-prize"><span>NEXT REWARD</span><b>+1000</b><small>COINS</small><button type="button" className="outline-action" onClick={() => setTab('missions')} data-testid="button-track-details">VIEW MISSIONS</button></div>
        </div>
      )}

      {tab === 'missions' && (
        <div className="missions-list" role="tabpanel">
          {missions.map((mission) => {
            const current = mission.progress(data);
            const done = current >= mission.target;
            const claimed = data.claimedMissions.includes(mission.id);
            return <article className="mission-card" key={mission.id} data-testid={`mission-${mission.id}`}>
              <span className="mission-badge"><Zap size={20}/></span>
              <div className="mission-card-copy"><small>TODAY&apos;S MISSION</small><b>{mission.title}</b>
                <div className="mission-bar"><i style={{ width: `${Math.min(100, current / mission.target * 100)}%` }}/></div>
                <span>{current} / {mission.target} complete</span>
              </div>
              <div className="mission-card-reward"><b>+{mission.reward}</b><small>COINS</small>
                <button type="button" disabled={!done || claimed} onClick={() => data.claimMission(mission.id, mission.reward)}
                  data-testid={`button-claim-mission-${mission.id}`}>{claimed ? 'CLAIMED' : done ? 'CLAIM' : 'IN PROGRESS'}</button>
              </div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}

type ShopCategory = 'DICE' | 'TOKENS' | 'AVATARS' | 'BOARDS';
const shopItems: { id: string; category: ShopCategory; title: string; description: string; cost: number; Icon: typeof Dice5; color: string }[] = [
  { id: 'lucky-dice', category: 'DICE', title: 'Lucky Dice', description: 'A tiny spark of good luck.', cost: 900, Icon: Dice5, color: 'amber' },
  { id: 'berry-token', category: 'TOKENS', title: 'Berry Token', description: 'Sweeten every move.', cost: 1200, Icon: Gem, color: 'pink' },
  { id: 'tiny-crown', category: 'AVATARS', title: 'Tiny Crown', description: 'A royal little look.', cost: 1800, Icon: Crown, color: 'green' },
  { id: 'candy-park', category: 'BOARDS', title: 'Candy Park', description: 'A stroll through sugar hills.', cost: 2500, Icon: Palette, color: 'blue' },
];

export function ShopPage() {
  const [category, setCategory] = useState<ShopCategory>('DICE');
  const [notice, setLocalNotice] = useState('');
  const data = usePlayerData();
  const visible = shopItems.filter((item) => item.category === category);
  const categories: ShopCategory[] = ['DICE', 'TOKENS', 'AVATARS', 'BOARDS'];
  const buy = (id: string, cost: number, title: string) => {
    const success = data.purchaseItem(id, cost);
    if (!success) setLocalNotice('You need a few more coins for this toy.');
    else {
      setLocalNotice(`${title} added to your collection!`);
      audioManager.playSfx('button_click');
    }
  };
  return (
    <section className="page-surface">
      <PageTitle eyebrow="MAKE IT YOURS" title={pageNames['/shop'].title} subtitle={pageNames['/shop'].subtitle}/>
      <div className="shop-categories" role="tablist" aria-label="Shop categories">
        {categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'selected' : ''}
          onClick={() => setCategory(item)} data-testid={`tab-shop-${item.toLowerCase()}`}>{item}</button>)}
      </div>
      <div className="shop-feature-grid">
        {visible.map(({ id, title, description, cost, Icon, color }) => {
          const owned = data.ownedItems.includes(id);
          return <article className="shop-feature" key={id} data-testid={`shop-item-${id}`}>
            <div className={`shop-item-art shop-art-${color}`}><span className="art-shine"/><Icon size={48}/></div>
            <div className="shop-feature-copy"><small>{category} COLLECTIBLE</small><h2>{title}</h2><p>{description}</p>
              <button type="button" className={`buy-toy${owned ? ' owned' : ''}`} disabled={owned}
                onClick={() => buy(id, cost, title)} data-testid={`button-buy-${id}`}>
                {owned ? <><Check size={16}/> OWNED</> : <><span className="coin-mini">C</span> {cost.toLocaleString('en-US')}</>}
              </button>
            </div>
          </article>;
        })}
      </div>
      {notice && <p className="inline-feedback" role="status" data-testid="status-shop-feedback">{notice}</p>}
      <p className="shop-note"><ShoppingBag size={15}/> These are local demo items. No real purchase or checkout is connected.</p>
    </section>
  );
}

const friends = [
  { name: 'Alex', initials: 'A', state: 'ONLINE', color: 'peach' },
  { name: 'Kevin', initials: 'K', state: 'PLAYING', color: 'mint' },
  { name: 'Mia', initials: 'M', state: 'ONLINE', color: 'lavender' },
  { name: 'Jamie', initials: 'J', state: 'OFFLINE', color: 'sky' },
];

export function FriendsPage() {
  const [query, setQuery] = useState('');
  const notify = useNotice();
  const onlineFriends = useMemo(() => friends.filter((friend) => friend.name.toLowerCase().includes(query.toLowerCase()) && friend.state === 'ONLINE'), [query]);
  const playingFriends = useMemo(() => friends.filter((friend) => friend.name.toLowerCase().includes(query.toLowerCase()) && friend.state === 'PLAYING'), [query]);
  const offlineFriends = useMemo(() => friends.filter((friend) => friend.name.toLowerCase().includes(query.toLowerCase()) && friend.state === 'OFFLINE'), [query]);
  const groups = [{ title: 'ONLINE', list: onlineFriends }, { title: 'PLAYING', list: playingFriends }, { title: 'OFFLINE', list: offlineFriends }];
  return (
    <section className="page-surface">
      <PageTitle eyebrow="SOCIAL CORNER" title={pageNames['/friends'].title} subtitle={pageNames['/friends'].subtitle}/>
      <div className="friends-toolbar">
        <label className="friend-search"><Search size={18}/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a friend" aria-label="Search friends" data-testid="input-search-friends"/></label>
        <button type="button" className="invite-friend" onClick={() => notify('Invite link copied to your clipboard!')} data-testid="button-invite-friend"><Users size={17}/> INVITE FRIEND</button>
      </div>
      <div className="friend-groups">
        {groups.map(({ title, list }) => <section key={title} className="friend-group">
          <h2>{title}<span>{list.length}</span></h2>
          {list.length > 0 ? list.map((friend) => <article className="friend-row" key={friend.name} data-testid={`friend-${friend.name.toLowerCase()}`}>
            <span className={`friend-avatar friend-${friend.color}`}>{friend.initials}<i/></span>
            <span className="friend-row-copy"><b>{friend.name}</b><small>{friend.state === 'PLAYING' ? 'Enjoying a game' : friend.state === 'ONLINE' ? 'Ready for a round' : 'Last seen earlier'}</small></span>
            <span className={`friend-state state-${friend.state.toLowerCase()}`}>{friend.state}</span>
            {friend.state !== 'OFFLINE' && <button type="button" className="friend-action" onClick={() => notify(`A game invite is ready for ${friend.name}.`)} data-testid={`button-invite-${friend.name.toLowerCase()}`}>INVITE</button>}
            <button type="button" className="friend-profile" aria-label={`View ${friend.name}'s profile`} onClick={() => notify(`${friend.name}'s player card is coming soon.`)} data-testid={`button-profile-${friend.name.toLowerCase()}`}><ArrowRight size={17}/></button>
          </article>) : <p className="friend-empty">No {title.toLowerCase()} friends found.</p>}
        </section>)}
      </div>
      <p className="shop-note"><Users size={15}/> Friend presence is sample data; live social play is not connected yet.</p>
    </section>
  );
}

export function ProfilePage() {
  const data = usePlayerData();
  const rate = data.matchesPlayed ? Math.round(data.wins / data.matchesPlayed * 100) : 0;
  const level = 22 + Math.floor(data.xp / 1000);
  return (
    <section className="page-surface">
      <PageTitle eyebrow="PLAYER PROFILE" title={pageNames['/profile'].title} subtitle={pageNames['/profile'].subtitle}/>
      <div className="profile-card">
        <div className="profile-card-top"><div className="profile-big-avatar">P<span>LV {level}</span></div><div className="profile-card-name"><span className="page-eyebrow">PLAYER</span><h2>Pip&apos;s Pal</h2><p>Little steps, big adventures.</p></div><Link href="/settings" className="outline-action" data-testid="link-profile-settings"><SettingsIcon size={16}/> SETTINGS</Link></div>
        <div className="profile-xp"><div><b>LEVEL {level}</b><span>{data.xp % 1000} / 1000 XP</span></div><div className="profile-progress"><i style={{ width: `${data.xp % 1000 / 10}%` }}/></div></div>
      </div>
      <div className="stat-grid">
        <article><span>MATCHES</span><b>{data.matchesPlayed}</b><small>rounds played</small></article>
        <article><span>WINS</span><b>{data.wins}</b><small>victory dances</small></article>
        <article><span>WIN RATE</span><b>{rate}%</b><small>looking good</small></article>
      </div>
      <Link href="/settings" className="settings-shortcut" data-testid="link-settings-profile"><SettingsIcon size={18}/><span><b>Game settings</b><small>Sound, music and notifications</small></span><ArrowRight size={18}/></Link>
    </section>
  );
}

export function SettingsPage() {
  const data = usePlayerData();
  return (
    <section className="page-surface">
      <PageTitle eyebrow="PREFERENCES" title={pageNames['/settings'].title} subtitle={pageNames['/settings'].subtitle} backHref="/profile"/>
      <div className="settings-list">
        <div className="settings-row"><span className="settings-icon"><Volume2 size={19}/></span><span className="settings-copy"><b>Sound effects</b><small>Dice, tokens, and little game sounds</small></span>
          <button type="button" className={`toggle-switch${data.settings.sfx ? ' on' : ''}`} role="switch" aria-checked={data.settings.sfx} aria-label="Sound effects" onClick={() => data.updateSettings({ sfx: !data.settings.sfx })} data-testid="switch-sfx"><i/></button></div>
        <div className="settings-row"><span className="settings-icon"><VolumeX size={19}/></span><span className="settings-copy"><b>Music</b><small>Background music control; tracks not bundled yet</small></span>
          <button type="button" className={`toggle-switch${data.settings.music ? ' on' : ''}`} role="switch" aria-checked={data.settings.music} aria-label="Music" onClick={() => data.updateSettings({ music: !data.settings.music })} data-testid="switch-music"><i/></button></div>
        <label className="volume-row"><span><b>SFX volume</b><small>{data.settings.sfxVolume}%</small></span><input type="range" min="0" max="100" value={data.settings.sfxVolume} onChange={(event) => data.updateSettings({ sfxVolume: Number(event.target.value) })} data-testid="slider-sfx-volume"/></label>
        <label className="volume-row"><span><b>Music volume</b><small>{data.settings.musicVolume}%</small></span><input type="range" min="0" max="100" value={data.settings.musicVolume} onChange={(event) => data.updateSettings({ musicVolume: Number(event.target.value) })} data-testid="slider-music-volume"/></label>
        <button type="button" className="settings-row settings-action" onClick={() => audioManager.playSfx('button_click')} data-testid="button-notification-preferences">
          <span className="settings-icon"><Bell size={19}/></span><span className="settings-copy"><b>Notifications</b><small>You're all caught up</small></span><Check size={18}/>
        </button>
      </div>
      <p className="shop-note"><Sparkles size={15}/> Sound effects are synthesized locally. Missing audio files never interrupt a game.</p>
    </section>
  );
}

