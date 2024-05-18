import { useStore } from '@tanstack/react-store';
import { TwistyPlayer } from 'cubing/twisty';
import { useEffect, useRef, useState } from 'react';
import { CubeStore } from '@/lib/smartCube';
import { cn } from '@/lib/utils';
import cubeImage from '/cube-colors.png';

export default function Twisty({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);
  const moves = useStore(CubeStore, state => state.solutionMoves);

  useEffect(() => {
    if (!containerRef.current) return;

    const newPlayer = new TwistyPlayer({
      visualization: 'auto',
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

    player.alg = '';
    moves?.forEach(move => {
      player.experimentalAddMove(move.move);
    });
  }, [player, moves]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}
