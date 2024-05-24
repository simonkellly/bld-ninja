import { Store } from '@tanstack/react-store';

export const TimerStore = new Store({
  scramble: '',
  originalScramble: '',
  scrambleIdx: 0,
  solutionMoves: [],
});
