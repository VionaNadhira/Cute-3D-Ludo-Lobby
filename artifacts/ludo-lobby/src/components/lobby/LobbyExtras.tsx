import { Crown, Dice5, Gem, Gift, Palette, ShoppingBag, UserRound } from 'lucide-react';

type ExtrasProps = { onNotice: (message: string) => void };

const shopItems = [
  { name: 'Lucky dice', Icon: Dice5, message: 'Lucky dice skin preview' },
  { name: 'Berry token', Icon: Gem, message: 'Berry token preview' },
  { name: 'Tiny crown', Icon: Crown, message: 'Tiny crown avatar preview' },
  { name: 'Candy park', Icon: Palette, message: 'Candy park board preview' },
];

export function LobbyExtras({ onNotice }: ExtrasProps) {
  return (
    <section className="lower-world" aria-label="Lobby extras">
      <div className="section-panel shop-preview">
        <div className="section-heading"><h2>TOY SHOP</h2><button className="text-action" data-testid="button-shop-see-all" onClick={() => onNotice('The Toy Shop is opening soon.')}>SEE ALL</button></div>
        <div className="shop-items">
          {shopItems.map(({ name, Icon, message }) => (
            <button className="shop-item" key={name} data-testid={`button-shop-${name.toLowerCase().replaceAll(' ', '-')}`} onClick={() => onNotice(message)}>
              <span className="shop-art"><Icon size={22} strokeWidth={2.8}/></span><span>{name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="section-panel friends-preview">
        <div className="section-heading"><h2>FRIENDS</h2><button className="text-action" data-testid="button-friends-see-all" onClick={() => onNotice('Your friend list is ready for a party.')}>SEE ALL</button></div>
        <div className="friends-list">
          <Friend name="Alex" initials="A" status="ONLINE"/>
          <Friend name="Kevin" initials="K" status="PLAYING"/>
          <Friend name="Mia" initials="M" status="ONLINE"/>
          <button className="invite-btn" data-testid="button-invite-friend" onClick={() => onNotice('Invite link copied to your clipboard!')}>+ INVITE</button>
        </div>
      </div>
      <div className="section-panel reward-preview">
        <div className="section-heading"><h2>REWARD TRACK</h2><button className="text-action" data-testid="button-rewards-details" onClick={() => onNotice('Your next prize is 3 games away.')}>DETAILS</button></div>
        <div className="mission-row">
          <span className="mission-icon"><Gift size={19}/></span>
          <div className="mission-copy"><b>Play 3 games</b><small>2 / 3 progress</small><div className="mission-progress"><i style={{ width: '68%' }}/></div></div>
          <span className="mission-reward">1 chest</span>
        </div>
      </div>
      <div className="mobile-section">
        <p className="mobile-world-note"><UserRound size={14}/> A little world made for one more round.</p>
      </div>
    </section>
  );
}

function Friend({ name, initials, status }: { name: string; initials: string; status: string }) {
  return (
    <div className="friend" data-testid={`friend-${name.toLowerCase()}`}>
      <span className="friend-avatar">{initials}</span>
      <span><span className="friend-name">{name}</span><br/><span className="friend-status">{status}</span></span>
    </div>
  );
}
