import BTCubeDisplay from "@/components/shared/bt-cube-display";
import { Card, CardBody } from "@heroui/react";
import { TwistyPlayer } from 'cubing/twisty';
import { useEffect, useRef, useState } from 'react';
import cubeImage from '/cube-colors.png';
import { cn } from '@heroui/react';
import { MoveStore } from "../logic/use-alg-trainer";
import { useStore } from "@tanstack/react-store";
import type { CubeMoveEvent } from "qysc-web";

function DrawLiveMoves({
  className,
  moves,
}: {
  className: string;
  moves: CubeMoveEvent[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TwistyPlayer | null>(null);

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
      experimentalDragInput: "auto",
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

    player.alg = moves.map(m => m.move).join(" ");
  }, [player, moves]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}


export default function LiveCubeDisplay() {
  const moves = useStore(MoveStore, state => state.moves);
  const showMoves = useStore(MoveStore, state => state.showMoves);
  return (
    <Card className='w-full h-full group'>
      <CardBody>
        {showMoves && <DrawLiveMoves moves={moves} className='w-full h-full' />}
        {!showMoves && <BTCubeDisplay className='w-full h-full' />}
      </CardBody>
    </Card>
  );
}