import BTCubeDisplay from '@/components/cubing/btCubeDisplay';
import CubeName from '@/components/cubing/cubeName';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@tanstack/react-store';
import { TimerStore } from './timerStore';
import { Box } from 'lucide-react';
import { useState } from 'react';

export default function LiveCubeCard() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleMoves = scramble.split(' ');
  const [isHovered, setIsHovered] = useState(false);

  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  return (
    <fieldset 
      className="bg-card rounded-lg border px-4 col-span-1 h-72"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <legend className="">
        <Badge variant="outline" className="bg-background">
          <CubeName />
        </Badge>
      </legend>
      {(isHovered || (scrambleMoves.length - scrambleIndex) > 5) ? (
        <BTCubeDisplay className="w-full h-full m-auto" />
      ) : (
        <div className="w-full h-full m-auto flex flex-col items-center justify-center gap-2">
          <Box className="w-10 h-10" />
          <p>Hover to view cube</p>
        </div>
      )}
    </fieldset>
  );
}
