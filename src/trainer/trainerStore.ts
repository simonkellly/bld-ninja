import { Store } from '@tanstack/react-store';
import { CubeMoveEvent } from 'qysc-web';
import { Alg } from './algSheet';

export const TrainerStore = new Store({
  alg: undefined as Alg | undefined,
  moves: [] as CubeMoveEvent[],
  analysedMoves: '',
});
