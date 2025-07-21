import { processNewSolve } from "@/timer/cube/solve-analysis";
import type { Solve } from "@/timer/logic/timer-db";
import { expect, test } from "bun:test";

async function analyseSolveString(scramble: string, solution: string, mode: '3BLD' | 'Corners') {
  const moves = solution.split(' ').map((move, index) => ({
    move: move.trim() as any, // The Move type is more restrictive but this is for testing
    timestamp: index * 100, // Mock timestamps
  }));

  const mockSolve: Omit<Solve, 'solveState' | 'analysis'> = {
    sessionId: 1,
    timestamp: Date.now(),
    mode: mode,
    scramble,
    solveTime: 10000, // Mock solve time
    finishTimestamp: Date.now(),
    moves,
  };

  const result = await processNewSolve(mockSolve);
  
  return {
    result: result.solveState,
    extractedAlgs: result.analysis?.algs || [],
    dnfReason: result.analysis?.dnfReason,
  };
}


test('Corners only analysis works', async () => {
  
});