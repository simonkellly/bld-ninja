import { Store } from '@tanstack/react-store';

export const TimerStore = new Store({
  scramble: '',
  solvedRotation: '',
  originalScramble: '',
  originalSolvedRotation: '',
  rotation: '',
  scrambleIdx: 0,
  solutionMoves: [],
});
