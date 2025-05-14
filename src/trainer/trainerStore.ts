import { Store } from '@tanstack/react-store';
import { Alg } from './algSheet';
import { CubeMoveEvent } from 'qysc-web';

export const TrainerStore = new Store({
  alg: undefined as Alg | undefined,
  moves: [] as CubeMoveEvent[],
  analysedMoves: '',
});
