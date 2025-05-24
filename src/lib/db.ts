import Dexie, { Table } from 'dexie';
import { ExtractedAlg } from './analysis/solutionParser';
import { CubeMoveEvent } from 'qysc-web';

export enum Penalty {
  SOLVED = 0,
  PLUS_TWO = 1,
  DNF = 2,
}

export interface Solve {
  id?: number;
  timeStamp: number;
  time: number;
  now: number;
  scramble: string;
  solution: CubeMoveEvent[];
  algs?: ExtractedAlg[];
  dnfReason?: string;
  penalty?: Penalty;
}

export class MySubClassedDexie extends Dexie {
  solves!: Table<Solve>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      solves: '++id, timestamp',
    });
  }
}

export const db = new MySubClassedDexie();
