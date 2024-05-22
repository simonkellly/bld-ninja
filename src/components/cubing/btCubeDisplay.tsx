import { useStore } from '@tanstack/react-store';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { TwistyPlayer } from 'cubing/twisty';
import { GanCubeConnection, GanCubeMove } from 'gan-web-bluetooth';
import { Bluetooth } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CubeStore } from '@/lib/smartCube';
import { cn } from '@/lib/utils';
import cubeImage from '/cube-colors.png';

function CubeDisplay({
  className,
  cube,
}: {
  className: string;
  cube: GanCubeConnection;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

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

    const moves: GanCubeMove[] = [];
    let sub = cube.events$.subscribe(ev => {
      if (ev.type !== 'MOVE') return;
      moves.push(ev);
    });

    experimentalSolve3x3x3IgnoringCenters(CubeStore.state.kpattern!).then(
      solution => {
        player.alg = solution.invert();

        sub.unsubscribe();
        moves.forEach(move => {
          player.experimentalAddMove(move.move);
        });

        sub = cube.events$.subscribe(ev => {
          if (ev.type !== 'MOVE') return;
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

export default function BTCubeDisplay({ className }: { className: string }) {
  const cube = useStore(CubeStore, state => state.cube);

  if (!cube) {
    return (
      <div className="flex items-center justify-center text-4xl font-bold my-auto h-full min-h-32">
        <Bluetooth className="size-12" />
      </div>
    );
  }

  return <CubeDisplay className={className} cube={cube} />;
}
