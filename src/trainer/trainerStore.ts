import { Store } from '@tanstack/react-store';
import { GanCubeMove } from 'gan-web-bluetooth';
import { Alg } from './algSheet';

export const TrainerStore = new Store({
  alg: undefined as Alg | undefined,
  moves: [] as GanCubeMove[],
  analysedMoves: '',
});
