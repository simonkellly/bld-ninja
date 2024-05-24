import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Minus, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
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
import { cn } from '@/lib/utils';
import DrawScramble from './drawScramble';

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

export default function TimeList({ className }: { className: string }) {
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

  const classes = cn('no-scrollbar', className);

  const padAmountForIdx = fakeFullData.length.toString().length;

  const [selectedSolve, setSelectedSolve] = useState<number | null>(null);

  const setPenalty = (solve: Solve, penalty: Penalty | undefined) => {
    db.solves.update(solve.id!, { penalty });
  };

  const deleteSolve = (solve: Solve) => {
    db.solves.delete(solve.id!);
  };

  return (
    <div
      ref={parentRef}
      className={classes}
      style={{
        overflowY: 'auto',
        contain: 'strict',
      }}
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
              const prevSolves = fakeFullData.slice(item.index, item.index + 3);

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
                className="flex gap-2 rounded-md font-mono py-1 pl-2 my-1 hover:bg-card hover:text-card-foreground cursor-pointer"
                ref={rowVirtualizer.measureElement}
                data-index={item.index}
                onClick={showModal}
              >
                <div className="text-primary my-auto">
                  <pre>
                    {reverseIdx.toString().padStart(padAmountForIdx, ' ')}.
                  </pre>
                </div>
                <div className="text-right px-1 my-auto">
                  <pre>{timeText.padStart(7, ' ')}</pre>
                </div>
                <div className="text-right px-1 my-auto">
                  <pre>{mo3.padStart(7, ' ')}</pre>
                </div>
                <div className="text-right px-1 grow">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setPenalty(
                        solve,
                        solve.penalty === Penalty.DNF ? undefined : Penalty.DNF
                      );
                    }}
                  >
                    {solve.penalty === Penalty.DNF ? (
                      <Check className="size-4" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setPenalty(
                        solve,
                        solve.penalty === Penalty.PLUS_TWO
                          ? undefined
                          : Penalty.PLUS_TWO
                      );
                    }}
                  >
                    {solve.penalty === Penalty.PLUS_TWO ? (
                      <Minus className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      deleteSolve(solve);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
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
  );
}
