import { ArrowRight, Bot, Gamepad2, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { audioManager } from '@/audio/AudioManager';

const shortcuts = [
  { title: 'QUICK MATCH', detail: 'Find players online', Icon: Zap, href: '/play', tone: 'butter', status: 'SOON' },
  { title: 'VS BOT', detail: 'Play against Pip Bot', Icon: Bot, href: '/play/bot', tone: 'mint', status: 'READY' },
  { title: 'FRIENDS', detail: 'Meet at your table', Icon: Users, href: '/friends', tone: 'rose', status: '' },
  { title: 'LOCAL', detail: 'Pass the device around', Icon: Gamepad2, href: '/play/local', tone: 'lavender', status: 'READY' },
];

export default function Home() {
  return (
    <section className="home-page" aria-label="Ludo World lobby">
      <div className="home-copy">
        <span className="eyebrow"><Sparkles size={14}/> YOUR LITTLE WORLD OF LUDO</span>
        <h1>One more round<br/><em>with friends.</em></h1>
        <p>Pick a table, roll the dice, and see where the path takes you.</p>
        <Link href="/play" className="home-play-button" data-testid="button-play-now" onClick={() => audioManager.playSfx('button_click')}>
          <span><b>PLAY NOW</b><small>CHOOSE YOUR ADVENTURE</small></span><ArrowRight size={22}/>
        </Link>
      </div>

      <div className="home-world" aria-label="A playful toy Ludo world">
        <div className="world-orbit orbit-one"/>
        <div className="world-orbit orbit-two"/>
        <div className="world-spark spark-one"><Sparkles size={22}/></div>
        <div className="world-spark spark-two"><Sparkles size={17}/></div>
        <div className="floating-token token-coral"/>
        <div className="floating-token token-blue"/>
        <div className="home-mascot" aria-label="A friendly mint game companion">
          <span className="mascot-leaf leaf-one"/><span className="mascot-leaf leaf-two"/>
          <span className="mascot-eye eye-left"/><span className="mascot-eye eye-right"/>
          <span className="mascot-cheek cheek-left"/><span className="mascot-cheek cheek-right"/>
          <span className="mascot-smile"/>
          <span className="mascot-arm arm-left"/><span className="mascot-arm arm-right"/>
        </div>
        <div className="world-die" aria-label="Lucky die">6</div>
        <div className="world-caption"><span className="caption-dot"/> THE BOARD IS YOURS</div>
      </div>

      <div className="home-modes" aria-label="Game shortcuts">
        {shortcuts.map(({ title, detail, Icon, href, tone, status }) => (
          <Link key={title} href={href} className={`home-mode mode-${tone}`} data-testid={`shortcut-${title.toLowerCase().replaceAll(' ', '-')}`} onClick={() => audioManager.playSfx('button_click')}>
            <span className="home-mode-icon"><Icon size={21}/></span>
            <span className="home-mode-copy"><b>{title}</b><small>{detail}</small></span>
            {status && <span className={`mode-status${status === 'SOON' ? ' status-soon' : ''}`}>{status}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
