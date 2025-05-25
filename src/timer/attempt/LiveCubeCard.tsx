import { useStore } from '@tanstack/react-store';
import { Box } from 'lucide-react';
import { useState } from 'react';
import BTCubeDisplay from '@/components/cubing/btCubeDisplay';
import { TimerStore } from '../timerStore';

export default function LiveCubeCard() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleMoves = scramble.split(' ');
  const [isHovered, setIsHovered] = useState(false);

  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  return (
    <div
      className="bg-card rounded-lg border px-4 col-span-1 h-full w-1/3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered || scrambleMoves.length - scrambleIndex > 5 ? (
        <BTCubeDisplay className="w-full h-full m-auto" />
      ) : (
        <div className="w-full h-full m-auto flex flex-col items-center justify-center gap-2">
          <Box className="w-10 h-10" />
          <p>Hover to view cube</p>
        </div>
      )}
    </div>
  );
}
