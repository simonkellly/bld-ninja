import { Box } from 'lucide-react';
import { Card, cn } from '@heroui/react';
import BTCubeDisplay from '@/components/shared/bt-cube-display';
import { TimerStore } from '../logic/timer-store';
import { useStore } from '@tanstack/react-store';

export default function LiveCubeCard() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleMoves = scramble.split(' ');

  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  const shouldHide = scrambleMoves.length - scrambleIndex <= 5;

  return (
    <Card
      className="h-full w-full group"
    >
      <BTCubeDisplay className={cn("w-full h-full m-auto", {
        "hidden group-hover:block": shouldHide,
        "block": !shouldHide,
      })!} />
      <div className={cn("w-full h-full m-auto flex-col items-center justify-center gap-2", {
        "flex group-hover:hidden": shouldHide,
        "hidden": !shouldHide,
      })}>
        <Box className="w-10 h-10" />
        <p>Hover to view cube</p>
      </div>
    </Card>
  );
}
