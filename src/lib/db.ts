import Dexie, { Table } from 'dexie';

export enum Penalty {
  PLUS_TWO = 1,
  DNF = 2,
}

export interface Solve {
  id?: number;
  timeStamp: number;
  time: number;
  scramble: string;
  solution: string;
  parsed: string[];
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
