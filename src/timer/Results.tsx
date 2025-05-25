import { ColumnDef } from '@tanstack/react-table';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import DrawScramble from '@/components/cubing/drawScramble';
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
import { AnalysisResult, analyseSolve } from '@/lib/analysis/dnfAnalyser';
import { Penalty, Solve, db } from '@/lib/db';
import { AlgTable } from './AlgTable';
import ResultsStats from './ResultsStats';
import { DataTable } from './data-table';

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

function DNFReasonShorthand(dnfResult: string | undefined) {
  if (dnfResult === AnalysisResult.SOLVED) return '';
  if (dnfResult === AnalysisResult.NO_MOVES) return 'No Moves';
  if (dnfResult === AnalysisResult.PLUS_TWO) return '+2';
  if (dnfResult === AnalysisResult.UNKNOWN) return 'Unknown';
  if (dnfResult === AnalysisResult.ONE_MOVE) return '1 Move';
  if (dnfResult === AnalysisResult.MISSED_TWIST) return 'Twist';
  if (dnfResult === AnalysisResult.MISSED_FLIP) return 'Flip';
  if (dnfResult === AnalysisResult.INVERSE_ALG) return 'Inverse';
  return '';
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
  const analyse = async () => {
    const {
      result: analysis,
      extractedAlgs: algs,
      reason,
    } = await analyseSolve(solve);
    db.solves.update(solve.id, {
      algs,
      dnfReason: analysis + (reason ? ': ' + reason : ''),
    });
    navigator.clipboard.writeText(
      solve.scramble + ' == ' + solve.solution.map(s => s.move).join(' ')
    );
  };

  const deleteSolve = () => {
    db.solves.delete(solve.id);
    close(false);
  };

  const solutionStr = solve.solution.map(s => s.move).join(' ');

  const timeText =
    solve.penalty == Penalty.DNF
      ? `DNF(${convertTimeToText(solve.time)})`
      : convertSolveToText(solve);

  const twistyUrl =
    'https://alg.cubing.net/?' +
    new URLSearchParams({
      setup: solve.scramble,
      alg:
        solve.algs
          ?.map(a => {
            return `${a[0]} // ${a[1]} - ${a[2]}`;
          })
          .join('\n') || solutionStr,
    }).toString();

  const exec = solve.solution[0]?.localTimestamp
    ? solve.now - solve.solution[0].localTimestamp
    : undefined;
  const memo = exec ? solve.time - exec : undefined;

  return (
    <Dialog open={true} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solve #{idx + 1}</DialogTitle>
          <DialogDescription>
            {new Date(solve.timeStamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <h2 className="text-3xl font-bold">{timeText}</h2>
        {exec && memo && (
          <h4 className="text-m text-muted-foreground">
            {convertTimeToText(memo)} + {convertTimeToText(exec)} = {timeText}
          </h4>
        )}
        <h3 className="text-l font-bold">{solve.scramble}</h3>
        <div className="flex">
          <DrawScramble
            scramble={solve.scramble}
            className="w-full h-32 mx-auto"
          />
          <DrawScramble
            scramble={solve.scramble + ' ' + solutionStr}
            className="w-full h-32 mx-auto"
          />
        </div>
        <AlgTable solve={solve} />
        {solve.penalty == Penalty.DNF && (
          <p className="font-medium">
            DNF Reason: {solve.dnfReason || 'Not analysed'}
          </p>
        )}
        <DialogFooter>
          <Button type="submit" asChild>
            <a href={twistyUrl} target="_blank" rel="noopener noreferrer">
              Recon
            </a>
          </Button>
          <Button variant="secondary" type="button" onClick={analyse}>
            Re-Analyse
          </Button>
          <Button variant="destructive" type="submit" onClick={deleteSolve}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Results() {
  const data = useLiveQuery(() => db.solves.reverse().toArray()) ?? [];
  const [selectedSolve, setSelectedSolve] = useState<number | null>(null);

  const calculateMo3 = (idx: number): string => {
    const reverseIdx = data.length - idx - 1;
    if (reverseIdx < 2) return '-';

    const prevSolves = data.slice(idx, idx + 3);
    let sum = 0;

    for (const solve of prevSolves) {
      if (solve.penalty === Penalty.DNF) {
        return 'DNF';
      }
      sum +=
        solve.penalty === Penalty.PLUS_TWO ? solve.time + 2000 : solve.time;
    }

    return convertTimeToText(sum / 3);
  };

  const columns: ColumnDef<Solve & { originalIndex: number }>[] = [
    {
      accessorKey: 'index',
      header: '#',
      cell: ({ row }) => {
        const originalIndex = row.original.originalIndex;
        return data.length - originalIndex + '.';
      },
      size: 60,
    },
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }) => {
        return convertSolveToText(row.original);
      },
      size: 80,
    },
    {
      accessorKey: 'mo3',
      header: 'MO3',
      cell: ({ row }) => {
        const originalIndex = row.original.originalIndex;
        return calculateMo3(originalIndex);
      },
      size: 80,
    },
    {
      accessorKey: 'reason',
      header: 'Why',
      cell: ({ row }) => {
        return DNFReasonShorthand(row.original.dnfResult) ?? '';
      },
      size: 100,
    },
  ];

  const dataWithIndex = data.map((solve, idx) => ({
    ...solve,
    originalIndex: idx,
  }));

  const handleRowClick = (solve: Solve & { originalIndex: number }) => {
    setSelectedSolve(solve.originalIndex);
  };

  return (
    <>
      <ResultsStats />
      <hr />
      <ScrollArea className="flex-1 min-h-0 p-2">
        <DataTable
          columns={columns}
          data={dataWithIndex}
          onRowClick={handleRowClick}
        />
      </ScrollArea>
      {selectedSolve !== null && (
        <SolveDialog
          solve={data[selectedSolve]}
          idx={data.length - 1 - selectedSolve}
          close={open => setSelectedSolve(open ? selectedSolve : null)}
        />
      )}
    </>
  );
}
