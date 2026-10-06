import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Coins, House, RotateCw, Sparkles, Trophy } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { audioManager } from '@/audio/AudioManager';
import { useGameSession } from '@/game/GameContext';
import { usePlayerData } from '@/game/PlayerDataContext';

export default function ResultPage() {
  const [, setLocation] = useLocation();
  const { result, startGame } = useGameSession();
  const { completeMatch } = usePlayerData();
  const [countedCoins, setCountedCoins] = useState(0);
  const [countedXp, setCountedXp] = useState(0);
  const won = !!result?.winnerId && result.winnerId === result.players[0]?.id;
  const winner = result?.players.find((player) => player.id === result.winnerId);

  useEffect(() => {
    if (!result) return;
    completeMatch(result.id, won);
    audioManager.playSfx(won ? 'victory' : 'defeat');
  }, [completeMatch, result, won]);

  useEffect(() => {
    const coinTarget = won ? 250 : 100;
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / duration);
      setCountedCoins(Math.round(coinTarget * ratio));
      setCountedXp(Math.round(100 * ratio));
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [won]);

  if (!result || !winner) {
    return <section className="game-recovery"><span className="recovery-icon"><Trophy size={28}/></span><h1>No results yet</h1><p>Finish a game to see your rewards.</p><Link href="/play" className="primary-action" data-testid="link-result-play"><span>CHOOSE A GAME</span><ArrowRight size={19}/></Link></section>;
  }

  const playAgain = () => {
    startGame(result.config);
    setLocation('/game');
  };

  return (
    <section className={`result-page${won ? ' result-win' : ' result-loss'}`} data-testid="result-page">
      <div className="result-confetti" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="result-card">
        <span className="result-emblem">{won ? <Trophy size={36}/> : <Sparkles size={36}/>}</span>
        <span className="page-eyebrow">MATCH COMPLETE</span>
        <h1>{won ? 'YOU WIN!' : `${winner.name.toUpperCase()} WINS`}</h1>
        <p>{won ? 'A lovely little victory. You played beautifully.' : 'The next round could be yours. Fancy another?'}</p>
        <div className="result-payout">
          <div><span className="payout-icon coins"><Coins size={19}/></span><span><small>COINS EARNED</small><b data-testid="value-result-coins">+{countedCoins}</b></span></div>
          <div><span className="payout-icon xp">XP</span><span><small>EXPERIENCE</small><b data-testid="value-result-xp">+{countedXp}</b></span></div>
        </div>
        <div className="result-actions">
          <button type="button" className="primary-action" onClick={playAgain} data-testid="button-play-again"><span>PLAY AGAIN</span><RotateCw size={18}/></button>
          <Link href="/" className="outline-action" data-testid="link-result-home"><House size={16}/> HOME</Link>
        </div>
        <Link href="/play" className="result-other-play" data-testid="link-result-other-mode"><ArrowLeft size={15}/> CHOOSE ANOTHER GAME</Link>
      </div>
    </section>
  );
}

