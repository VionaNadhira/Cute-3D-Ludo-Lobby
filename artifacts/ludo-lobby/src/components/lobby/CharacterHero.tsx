import { Gamepad2, Sparkles, Users, Zap } from 'lucide-react';

type CharacterHeroProps = {
  onPlay: (mode: string) => void;
  claimed: boolean;
  onDailyClaim: () => void;
};

export function CharacterHero({ onPlay, claimed, onDailyClaim }: CharacterHeroProps) {
  return (
    <section className="hero" aria-label="Game lobby">
      <div className="hero-title" aria-label="Pip's Playfield">
        <div className="logo-word">LUDO</div>
        <div className="logo-sub">PIP&apos;S PLAYFIELD</div>
      </div>
      <aside className="world-side left">
        <DailyReward claimed={claimed} onClaim={onDailyClaim} />
      </aside>
      <div className="hero-center">
        <div className="character-stage">
          <span className="spark s1"><Sparkles size={22}/></span>
          <span className="spark s2"><Sparkles size={17}/></span>
          <span className="spark s3"><Sparkles size={13}/></span>
          <div className="token t1" aria-hidden="true"/>
          <div className="token t2" aria-hidden="true"/>
          <img className="mascot" src="/pip-mascot-cutout.png" alt="Pip the fox holding a lucky die" />
          <div className="floating-die" aria-hidden="true">5</div>
        </div>
        <button className="play-button" data-testid="button-play-now" onClick={() => onPlay('Finding your next game…')}>
          <strong>PLAY NOW</strong><span>YOUR NEXT ADVENTURE</span>
        </button>
        <div className="game-modes" aria-label="Game modes">
          <button className="mode-button" data-testid="button-quick-match" onClick={() => onPlay('Quick Match selected — finding players…')}>
            <span className="mode-icon"><Zap size={18} fill="currentColor"/></span><span><b>QUICK MATCH</b><small>Find players instantly</small></span>
          </button>
          <button className="mode-button" data-testid="button-friends-mode" onClick={() => onPlay('Invite a friend to your table!')}>
            <span className="mode-icon"><Users size={18} fill="currentColor"/></span><span><b>FRIENDS</b><small>Play with friends</small></span>
          </button>
          <button className="mode-button" data-testid="button-local-mode" onClick={() => onPlay('Local table ready for 2–4 players.')}>
            <span className="mode-icon"><Gamepad2 size={18}/></span><span><b>LOCAL</b><small>Play on this device</small></span>
          </button>
        </div>
      </div>
      <aside className="world-side right">
        <MissionCard />
      </aside>
    </section>
  );
}

export function DailyReward({
  onClaim,
  claimed,
}: {
  onClaim: () => void;
  claimed: boolean;
}) {
  return (
    <div className="mini-panel reward-panel">
      <div className="panel-kicker">DAILY BONUS · DAY 07</div>
      <div className="reward-line">
        <div className="coin-stack" aria-hidden="true"><i>C</i><i>C</i></div>
        <div className="reward-amount">+500</div>
      </div>
      <button className={`claim-button${claimed ? ' claimed' : ''}`} data-testid="button-claim-daily" onClick={() => { if (!claimed) onClaim(); }}>
        {claimed ? 'CLAIMED' : 'CLAIM REWARD'}
      </button>
    </div>
  );
}

export function MissionCard() {
  return (
    <div className="mini-panel">
      <div className="panel-kicker">TODAY&apos;S MISSION</div>
      <div className="mission-row">
        <span className="mission-icon"><Zap size={19} fill="currentColor"/></span>
        <div className="mission-copy"><b>Win 2 matches</b><small>1 / 2 complete</small><div className="mission-progress"><i/></div></div>
        <span className="mission-reward">+250</span>
      </div>
    </div>
  );
}
