import { useStore } from '@tanstack/react-store';
import { Box } from 'lucide-react';
import { useState } from 'react';
import DrawScramble from '@/components/cubing/drawScramble';
import { TimerStore } from '../timerStore';

export default function DrawScrambleCard() {
  const scramble = useStore(TimerStore, state => state.originalScramble);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-card rounded-lg border px-4 col-span-1 h-full w-1/3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <DrawScramble className="h-full w-full p-2" scramble={scramble} />
      ) : (
        <div className="w-full h-full m-auto flex flex-col items-center justify-center gap-2">
          <Box className="w-10 h-10" />
          <p>Hover to view scramble</p>
        </div>
      )}
    </div>
  );
}
