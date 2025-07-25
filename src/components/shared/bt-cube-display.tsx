import { useStore } from '@tanstack/react-store';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { TwistyPlayer } from 'cubing/twisty';
import { type CubeMoveEvent } from 'qysc-web';
import { useEffect, useRef, useState } from 'react';
import cubeImage from '/cube-colors.png';
import { CubeStore } from '@/lib/cube/smart-cube';
import { cn } from '@heroui/react';

export default function BTCubeDisplay({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

  const cube = useStore(CubeStore, state => state.cube);
  const startingState = useStore(CubeStore, state => state.startingState);

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
  }, [containerRef]);

  useEffect(() => {
    if (!player || !cube) return;

    player.alg = startingState ?? '';

    const moves: CubeMoveEvent[] = [];
    let sub = cube.events.moves.subscribe(ev => {
      moves.push(ev);
    });

    experimentalSolve3x3x3IgnoringCenters(CubeStore.state.kpattern!).then(
      solution => {
        player.alg = solution.invert();

        sub.unsubscribe();
        moves.forEach(move => {
          player.experimentalAddMove(move.move);
        });

        sub = cube.events.moves.subscribe(ev => {
          player.experimentalAddMove(ev.move);
        });
      }
    );

    return () => {
      sub.unsubscribe();
    };
  }, [player, startingState, cube]);

  const classes = cn('flex', className);

  return <div className={classes} ref={containerRef} />;
}
