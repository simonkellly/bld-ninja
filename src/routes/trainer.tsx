import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import LiveCubeCard from '@/timer/liveCubeCard';
import DrawSolutionCard from '@/trainer/DrawSolutionCard';
import SolutionDisplay from '@/trainer/SolutionDisplay';
import TrainerBar from '@/trainer/TrainerBar';
import { TrainerStore } from '@/trainer/trainerStore';
import useAlgTrainer from '@/trainer/useAlgTrainer';

export const Route = createFileRoute('/trainer')({
  component: Trainer,
});

function Trainer() {
  useAlgTrainer();
  const alg = useStore(TrainerStore, state => state.alg);

  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2">
      <TrainerBar />
      <div className="bg-card rounded-lg border w-full relative grow mt-2">
        <SolutionDisplay />
        <div className="absolute top-0 left-0 w-full h-full flex">
          <h1 className="m-auto text-6xl sm:text-7xl md:text-9xl font-extrabold select-none">
            {alg ? (
              <>
                {alg.case.first}
                {alg.case.second}
              </>
            ) : (
              '--'
            )}
          </h1>
        </div>
      </div>
      <ScrollArea className="h-72 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <LiveCubeCard />
          <DrawSolutionCard />
        </div>
      </ScrollArea>
    </div>
  );
}
