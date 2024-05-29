import Dexie, { Table } from 'dexie';
import { GanCubeMove } from 'gan-web-bluetooth';
import { ExtractedAlg } from './analysis/solutionParser';
import { AnalysisResult } from './analysis/dnfAnalyser';

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
  solution: GanCubeMove[];
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
