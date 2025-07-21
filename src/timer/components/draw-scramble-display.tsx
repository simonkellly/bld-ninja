import { Box } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@heroui/react';
import DrawScramble from '@/components/shared/draw-scramble';
import { TimerStore } from '../logic/timer-store';
import { useStore } from '@tanstack/react-store';

export default function DrawScrambleDisplay() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
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
    </Card>
  );
}
