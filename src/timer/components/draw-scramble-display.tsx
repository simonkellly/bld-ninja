import { Box } from 'lucide-react';
import { Card } from '@heroui/react';
import DrawScramble from '@/components/shared/draw-scramble';
import { TimerStore } from '../logic/timer-store';
import { useStore } from '@tanstack/react-store';

export default function DrawScrambleDisplay() {
  const scramble = useStore(TimerStore, state => state.scramble);
  return (
    <Card
      className="group"
    >
      <DrawScramble className="h-full w-full p-2 hidden group-hover:block" scramble={scramble} />
      <div className="w-full h-full m-auto flex-col items-center justify-center gap-2 flex group-hover:hidden">
        <Box className="w-10 h-10" />
        <p>Hover to view scramble</p>
      </div>
    </Card>
  );
}
