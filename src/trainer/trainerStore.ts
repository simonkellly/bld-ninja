import { Store } from '@tanstack/react-store';
import { Alg } from './algSheet';
import { GanCubeMove } from 'gan-web-bluetooth';

export const TrainerStore = new Store({
  alg: undefined as Alg | undefined,
  moves: [] as GanCubeMove[],
  analysedMoves: ''
});
