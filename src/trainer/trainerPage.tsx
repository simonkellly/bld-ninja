import { fetchGoogleSheet } from "./algSheet";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trainerStore } from "./trainerStore";
import { useStore } from "@tanstack/react-store";
import { useEffect, useState } from "react";
import BTCubeDisplay from "@/components/cubing/btCubeDisplay";
import CubeName from "@/components/cubing/cubeName";
import { cn } from "@/lib/utils";
import { useTrainer } from "./useTrainer";
import { extractAlgs } from "@/lib/solutionParser";

function SolutionDisplay({ solution }: { solution: string[] }) {
  const [algs, setAlgs] = useState<string[]>([]);

  useEffect(() => {
    extractAlgs(solution).then((a) => {
      const actualAlgs = a.map(alg => alg[0]);
      setAlgs(actualAlgs);
    });
  });

  // TODO: Make this not affect timer positioning
  return (
    <>
      <h2 className="text-3xl font-semibold text-center p-4 pb-0 flex-none select-none">
        {solution.map((move, i) => {
          return (
            <div
              key={solution.length + move + 'Move' + i}
              className="inline-block px-2 mx-1 py-1"
            >
              {move}
            </div>
          );
        })}
      </h2>
      <h3 className="text-2xl font-medium text-center p-4 pt-0 flex-none select-none text-gray-500">
        {algs.join(' ')}
      </h3>
    </>
  );
}

function CaseSelector({ className }: { className?: string }) {
  const algSheet = useStore(trainerStore, (state) => state.algSheet);
  const selectedLetters = useStore(trainerStore, (state) => state.selectedLetters);
  const includeInverse = useStore(trainerStore, (state) => state.includeInverse);

  if (!algSheet) return null;

  const classes = cn(className, '');

  return (
    <div className={classes}>
      {algSheet.letters.map((letter: string) => (
        <Toggle
          key={letter}
          className="m-1 w-10"
          variant="default"
          pressed={selectedLetters.includes(letter)}
          onPressedChange={(pressed) => trainerStore.setState((state) => ({ ...state, selectedLetters: pressed ? [...state.selectedLetters, letter] : state.selectedLetters.filter((l) => l !== letter) }))}
        >
          {letter}
        </Toggle>
      ))}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => trainerStore.setState((state) => ({ ...state, selectedLetters: selectedLetters.length === algSheet.letters.length ? [] : algSheet.letters.slice() }))}
        >{selectedLetters.length === algSheet.letters.length ? "Select none" : "Select all"}</Button>
        <div className="flex items-center space-x-2">
          <Switch
            id="include-inverses"
            checked={includeInverse}
            onCheckedChange={(checked) => trainerStore.setState((state) => ({ ...state, includeInverse: checked }))}
          />
          <Label htmlFor="include-inverses">Include inverses</Label>
        </div>
      </div>
    </div>
  );
}

export default function TrainerPage() {
  const algSheet = useStore(trainerStore, (state) => state.algSheet);

  const { isPending, error, data } = useQuery({
    queryKey: ['algData'],
    queryFn: fetchGoogleSheet,
    initialData: algSheet,
  });

  useEffect(() => {
    if (data) {
      trainerStore.setState((state) => ({ ...state, algSheet: data }));
    }
  }, [data]);

  const trainer = useTrainer();

  if (isPending || !data) return (<div>Loading...</div>);

  if (error) return (<div>Error: {error.message}</div>);

  return (
    <div
      className="h-full w-full flex flex-col outline-transparent"
    >
      <SolutionDisplay solution={trainer.solution} />
      <div className="flex grow h-full items-center">
        <h1 className="text-9xl font-extrabold text-white text-center m-auto font-mono py-8 select-none">
          SK
        </h1>
      </div>
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        <fieldset className="rounded-lg border px-4 hover:bg-muted col-span-2 md:col-span-1">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <BTCubeDisplay className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border px-4 col-span-2">
          <legend className="-ml-1 px-1 text-sm font-medium">Case selector</legend>
          <CaseSelector className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}