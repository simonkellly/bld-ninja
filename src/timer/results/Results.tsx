import { useStore } from '@tanstack/react-store';
import { ColumnDef } from '@tanstack/react-table';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  convertSolveToText,
  convertTimeToText,
  DNFReasonShorthand,
} from '@/lib/cube/solution';
import { Penalty, Solve, db } from '@/lib/db';
import { SessionStore } from '../sessionStore';
import SolveDialog from '../solve/SolveViewer';
import ResultsStats from './ResultsStats';
import { DataTable } from './data-table';

export default function Results() {
  const activeSession = useStore(SessionStore, state => state.activeSession);

  const data =
    useLiveQuery(
      () =>
        db.solves
          .where('sessionId')
          .equals(activeSession?.id ?? -1)
          .reverse()
          .toArray(),
      [activeSession?.id]
    ) ?? [];

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
