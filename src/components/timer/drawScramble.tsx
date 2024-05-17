import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { TwistyPlayer } from 'cubing/twisty';
import cubeImage from '/cube-colors.png';
import { useStore } from '@tanstack/react-store';
import { TimerStore } from './timerStore';

export default function DrawScramble({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);
  const scramble = useStore(TimerStore, (state) => state.scramble);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const newPlayer = new TwistyPlayer({
      visualization: '2D',
      background: 'none',
      hintFacelets: 'none',
      controlPanel: 'none',
      cameraLatitude: 25,
      cameraLongitude: 25,
      tempoScale: 2,
      experimentalStickering: 'picture',
      experimentalSprite: cubeImage,
    });

    newPlayer.style.width = '100%';
    newPlayer.style.height = '100%';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(newPlayer);
    setPlayer(newPlayer);
  }, [containerRef]);

  useEffect(() => {
    if (!player) return;

    player.alg = scramble;
  }, [player, scramble]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}
