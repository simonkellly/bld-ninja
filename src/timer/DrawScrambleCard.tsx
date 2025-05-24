import { useStore } from '@tanstack/react-store';
import DrawScramble from '@/components/cubing/drawScramble';
import { Badge } from '@/components/ui/badge';
import { TimerStore } from './timerStore';
import { Box } from 'lucide-react';
import { useState } from 'react';

export default function DrawScrambleCard() {
  const scramble = useStore(TimerStore, state => state.originalScramble);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <fieldset 
      className="bg-card rounded-lg border px-4 col-span-1 h-72"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <legend className="">
        <Badge variant="outline" className="bg-background">
          Scramble
        </Badge>
      </legend>
      {isHovered ? (
        <DrawScramble className="h-full w-full p-2" scramble={scramble} />
      ) : (
        <div className="w-full h-full m-auto flex flex-col items-center justify-center gap-2">
          <Box className="w-10 h-10" />
          <p>Hover to view scramble</p>
        </div>
      )}
    </fieldset>
  );
}
