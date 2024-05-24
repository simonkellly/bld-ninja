import { useStore } from '@tanstack/react-store';
import DrawScramble from '@/components/cubing/drawScramble';
import { Badge } from '@/components/ui/badge';
import { TrainerStore } from './trainerStore';

export default function DrawSolutionCard() {
  const scramble = useStore(TrainerStore, state => state.moves).map(m => m.move).join(' ');

  return (
    <fieldset className="bg-card rounded-lg border px-4 col-span-1 h-72">
      <legend className="">
        <Badge variant="outline" className="bg-background">
          Solution
        </Badge>
      </legend>
      <DrawScramble className="h-full w-full p-2" scramble={scramble} />
    </fieldset>
  );
}
