import { useStore } from '@tanstack/react-store';
import { TwistyPlayer } from 'cubing/twisty';
import { useEffect, useRef, useState } from 'react';
import cubeImage from '/cube-colors.png';
import { CubeStore } from '@/lib/cube/smart-cube';
import { cn } from '@heroui/react';

export default function BTCubeDisplay({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

  const cube = useStore(CubeStore, state => state.cube);

  useEffect(() => {
    if (!containerRef.current) return;

    const newPlayer = new TwistyPlayer({
      visualization: 'auto',
      background: 'none',
      hintFacelets: 'none',
      controlPanel: 'none',
      cameraLatitude: 25,
      cameraLongitude: 25,
      tempoScale: 5,
      backView: 'top-right',
      experimentalDragInput: 'none',
      experimentalStickering: 'picture',
      experimentalSprite: cubeImage,
    });

    newPlayer.style.width = '100%';
    newPlayer.style.height = '100%';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(newPlayer);
    setPlayer(newPlayer);
    return () => newPlayer.remove();
  }, []);

  useEffect(() => {
    if (!player || !cube) return;

    player.alg = '';
    const sub = cube.events.state.subscribe(({ pattern }) => {
      const transformation = pattern.experimentalToTransformation();
      if (transformation) player.experimentalModel.setupTransformation.set(transformation);
    });

    return () => {
      sub.unsubscribe();
    };
  }, [player, cube]);

  const classes = cn('flex', className);

  return <div className={classes} ref={containerRef} />;
}
