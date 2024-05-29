import { TwistyPlayer } from 'cubing/twisty';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import cubeImage from '/cube-colors.png';

export default function DrawScramble({
  className,
  scramble,
  reverse = false,
}: {
  className: string;
  scramble: string;
  reverse?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

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
      experimentalSetupAnchor: reverse ? 'end' : 'start',
    });

    newPlayer.style.width = '100%';
    newPlayer.style.height = '100%';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(newPlayer);
    setPlayer(newPlayer);
  }, [containerRef, reverse]);

  useEffect(() => {
    if (!player) return;

    player.alg = scramble;
  }, [player, scramble]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}
