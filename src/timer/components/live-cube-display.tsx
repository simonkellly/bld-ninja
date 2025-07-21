import { Box } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@heroui/react';
import BTCubeDisplay from '@/components/shared/bt-cube-display';
import { TimerStore } from '../logic/timer-store';
import { useStore } from '@tanstack/react-store';

export default function LiveCubeCard() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleMoves = scramble.split(' ');
  const [isHovered, setIsHovered] = useState(false);

  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full group"
    >
      {isHovered || scrambleMoves.length - scrambleIndex > 5 ? (
        <BTCubeDisplay className="w-full h-full m-auto" />
      ) : (
        <div className="w-full h-full m-auto flex flex-col items-center justify-center gap-2">
          <Box className="w-10 h-10" />
          <p>Hover to view cube</p>
        </div>
      )}
    </Card>
  );
}
