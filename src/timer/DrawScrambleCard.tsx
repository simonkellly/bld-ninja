import { useStore } from '@tanstack/react-store';
import DrawScramble from '@/components/cubing/drawScramble';
import { Badge } from '@/components/ui/badge';
import { TimerStore } from './timerStore';

export default function DrawScrambleCard() {
  const scramble = useStore(TimerStore, state => state.originalScramble);

  return (
    <fieldset className="bg-card rounded-lg border px-4 col-span-1 h-72">
      <legend className="">
        <Badge variant="outline" className="bg-background">
          Scramble
        </Badge>
      </legend>
      <DrawScramble className="h-full w-full p-2" scramble={scramble} />
    </fieldset>
  );
}
