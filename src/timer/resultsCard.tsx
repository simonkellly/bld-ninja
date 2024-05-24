import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState } from 'react';
import DrawScramble from '@/components/cubing/drawScramble';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Penalty, Solve, db } from '@/lib/db';
import { dnfAnalyser } from '@/lib/dnfAnalyser';

function convertTimeToText(time: number) {
  if (time == -1) return 'DNF';

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const hundredths = Math.floor((time % 1000) / 10);

  let res = minutes > 0 ? `${minutes}:` : '';
  res += `${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.`;
  res += `${hundredths < 10 ? '0' : ''}${hundredths}`;

  return res;
}

function convertSolveToText(solve: Solve) {
  if (solve.penalty === Penalty.DNF) return 'DNF';

  const isPlusTwo = solve.penalty === Penalty.PLUS_TWO;
  const time = isPlusTwo ? solve.time + 2000 : solve.time;
  const text = convertTimeToText(time);

  if (solve.penalty === Penalty.PLUS_TWO) return text + '+';
  else return text;
}

function SolveDialog({
  solve,
  idx,
  close,
}: {
  solve: Solve;
  idx: number;
  close: (open: boolean) => void;
}) {
  const [analysis, setAnalysis] = useState<string | undefined>();

  const analyse = () => {
    dnfAnalyser(solve.scramble, solve.solution).then(res => {
      setAnalysis(res);
    });
  };

  const timeText =
    solve.penalty == Penalty.DNF
      ? `DNF(${convertTimeToText(solve.time)})`
      : convertSolveToText(solve);

  return (
    <Dialog open={true} onOpenChange={close}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solve #{idx}</DialogTitle>
          <DialogDescription>
            {new Date(solve.timeStamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <h2 className="text-3xl font-bold">{timeText}</h2>
        <h2 className="text-l font-bold">{solve.scramble}</h2>
        <div className="flex">
          <DrawScramble
            scramble={solve.scramble}
            className="w-full h-32 mx-auto"
          />
          <DrawScramble
            scramble={solve.scramble + ' ' + solve.solution}
            className="w-full h-32 mx-auto"
          />
        </div>
        <ul className="rounded-md border p-2">
          <li className="font-medium">Algs in solve:</li>
          <ScrollArea className="h-64">
            {solve.parsed.map((alg, i) => (
              <li key={i + ' ' + alg}>{alg}</li>
            ))}
          </ScrollArea>
        </ul>
        {analysis && <p className="font-medium">{analysis}</p>}
        <DialogFooter>
          <Button variant="secondary" type="submit" onClick={analyse}>
            Analyse
          </Button>
          <Button variant="destructive" type="submit">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ResultsCard() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const data = useLiveQuery(() => db.solves.reverse().toArray());

  const fakeFullData = useMemo(
    () => Array.from({ length: 1 }, () => data ?? []).flat(),
    [data]
  );

  const rowVirtualizer = useVirtualizer({
    count: fakeFullData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
  });

  const items = rowVirtualizer.getVirtualItems();

  const padAmountForIdx = fakeFullData.length.toString().length;

  const [selectedSolve, setSelectedSolve] = useState<number | null>(null);

  return (
    <fieldset className="bg-card rounded-lg border col-span-1 h-72 overflow-hidden">
      <legend className="mx-4">
        <Badge variant="outline" className="bg-background">
          Results
        </Badge>
      </legend>
      <div
        ref={parentRef}
        className="h-64 px-1 w-full overflow-y-auto m-auto overflow-x-clip"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${items[0]?.start ?? 0}px)`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map(item => {
              const solve = fakeFullData[item.index];
              const timeText = convertSolveToText(solve);

              const reverseIdx = fakeFullData.length - item.index - 1;

              let mo3: string | undefined;
              if (reverseIdx < 2) mo3 = '-';
              else {
                const prevSolves = fakeFullData.slice(
                  item.index,
                  item.index + 3
                );

                let sum = 0;
                for (const solve of prevSolves) {
                  if (solve.penalty === Penalty.DNF) {
                    mo3 = 'DNF';
                    break;
                  }
                  sum +=
                    solve.penalty === Penalty.PLUS_TWO
                      ? solve.time + 2000
                      : solve.time;
                }

                if (mo3 !== 'DNF') mo3 = convertTimeToText(sum / 3);
              }

              const showModal = () => setSelectedSolve(item.index);

              return (
                <div
                  key={item.key}
                  className="flex gap-2 rounded-md text-sm my-1 py-1 px-2 hover:bg-primary hover:text-primary-foreground cursor-pointer group"
                  ref={rowVirtualizer.measureElement}
                  data-index={item.index}
                  onClick={showModal}
                >
                  <div className="">
                    <pre>
                      <span className="text-primary group-hover:text-primary-foreground">
                        {(reverseIdx + 1)
                          .toString()
                          .padStart(padAmountForIdx, ' ')}
                        .
                      </span>
                      <span>{timeText.padStart(7, ' ')}</span>
                      <span>{mo3.padStart(7, ' ')}</span>
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {selectedSolve !== null && (
          <SolveDialog
            solve={fakeFullData[selectedSolve]}
            idx={fakeFullData.length - 1 - selectedSolve}
            close={open => setSelectedSolve(open ? selectedSolve : null)}
          />
        )}
      </div>
    </fieldset>
  );
}
