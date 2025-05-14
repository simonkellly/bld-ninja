import Dexie, { Table } from 'dexie';
import { AnalysisResult } from './analysis/dnfAnalyser';
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
  dnfReason?: AnalysisResult;
  penalty?: Penalty;
}

export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  solves!: Table<Solve>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      solves: '++id, timestamp',
    });
  }
}

export const db = new MySubClassedDexie();
