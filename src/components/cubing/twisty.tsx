import * as Cubing from 'cubing/twisty';
import { useEffect, useRef, useState } from 'react';
import cubeImage from '/cube-colors.png';
import { cn } from '@/lib/utils';
import { useStore } from '@tanstack/react-store';
import { CubeStore } from '@/lib/smartCube';
import { MoveEvent } from 'cubing/bluetooth';

export default function Twisty({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Cubing.TwistyPlayer | null>(null);
  const algs = useStore(CubeStore, (state) => state.appliedMoves);

  useEffect(() => {
    if (!containerRef.current) return;
    console.log('Twisty mounted');
    const newViewer = new Cubing.TwistyPlayer({
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

    newViewer.style.width = '100%';
    newViewer.style.height = '100%';

    containerRef.current?.replaceChildren(newViewer);
    setPlayer(newViewer);
  }, [containerRef]);

  useEffect(() => {
    if (!player) return;

    const modifiedPlayer = (player as unknown as { APPLIEDMOVES: Set<MoveEvent> | undefined});
    const alreadyApplied = modifiedPlayer.APPLIEDMOVES ??= new Set();
    algs.forEach((alg) => {
      if (alreadyApplied.has(alg)) return;
      player.experimentalAddAlgLeaf(alg.latestAlgLeaf);
      alreadyApplied.add(alg);
    });
  }, [player, algs]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}
