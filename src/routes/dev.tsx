import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { analyseSolve } from '@/lib/cube/dnfAnalyser';
import { Solve, db } from '@/lib/db';

export const Route = createFileRoute('/dev')({
  component: Dev,
});

function resetData() {
  db.delete();
  db.open();
  localStorage.clear();
}

function Dev() {
  const [leftToAnalyse, setLeftToAnalyse] = useState(0);

  const analyse = async (solve: Solve) => {
    const {
      result: analysis,
      extractedAlgs: algs,
      reason,
    } = await analyseSolve(solve);
    db.solves.update(solve.id, {
      algs,
      dnfResult: analysis,
      dnfReason: reason,
    });
  };

  const reanalyzeSolves = async () => {
    const solves = await db.solves.toArray();
    setLeftToAnalyse(solves.length);
    for (const solve of solves) {
      if (solve.solution) {
        await analyse(solve);
      }
      setLeftToAnalyse(state => state - 1);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-2">
        <Button onClick={reanalyzeSolves} disabled={leftToAnalyse > 0}>
          {leftToAnalyse > 0
            ? `${leftToAnalyse} solves left`
            : 'Reanalyze All Solves'}
        </Button>
        <Button onClick={resetData} variant="destructive">
          Reset All Data
        </Button>
      </div>
    </div>
  );
}
