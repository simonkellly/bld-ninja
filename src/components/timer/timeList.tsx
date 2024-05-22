import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Solve, db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
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

function SolveDialog({
  solve,
  idx,
  close,
}: {
  solve: Solve;
  idx: number;
  close: (open: boolean) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={close}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solve #{idx}</DialogTitle>
          <DialogDescription>
            {new Date(solve.timeStamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <h2 className="text-3xl font-bold">{convertTimeToText(solve.time)}</h2>
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
        <DialogFooter>
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
            const timeText = convertTimeToText(solve.time);

            const reverseIdx = fakeFullData.length - item.index - 1;

            let mo3: string | undefined;
            if (reverseIdx < 2) mo3 = '-';
            else {
              const prevSolves = fakeFullData.slice(reverseIdx - 2, reverseIdx);
              const mean =
                prevSolves.reduce((acc, cur) => acc + cur.time, 0) / 3;
              mo3 = convertTimeToText(mean);
            }

            return (
              <div
                key={item.key}
                className="flex gap-2 rounded-md font-mono py-1 pl-2 my-1 hover:bg-gray-900 cursor-pointer"
                ref={rowVirtualizer.measureElement}
                data-index={item.index}
                onClick={() => setSelectedSolve(item.index)}
              >
                <div className="text-gray-500 my-auto">
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
                  <Button variant="ghost" size="sm">
                    <X className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Plus className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
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
