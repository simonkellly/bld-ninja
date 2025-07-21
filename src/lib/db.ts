import Dexie, { Table } from 'dexie';
import { CubeMoveEvent } from 'qysc-web';
import { ExtractedAlg } from './cube/solutionParser';

export enum Penalty {
  SOLVED = 0,
  PLUS_TWO = 1,
  DNF = 2,
}

export const SESSION_TYPES = ['3BLD', 'Edges', 'Corners'] as const;

export interface Solve {
  id?: number;
  sessionId: number;
  type: (typeof SESSION_TYPES)[number];
  timeStamp: number;
  time: number;
  now: number;
  scramble: string;
  solution: CubeMoveEvent[];
  algs?: ExtractedAlg[];
  dnfResult?: string;
  dnfReason?: string;
  penalty?: Penalty;
}

export interface Session {
  id?: number;
  name: string;
  type: (typeof SESSION_TYPES)[number];
  lastUsed?: number;
}

export class MySubClassedDexie extends Dexie {
  solves!: Table<Solve>;
  sessions!: Table<Session>;

  constructor() {
    super('myDatabase');
    this.version(1).stores({
      solves: '++id, timestamp, sessionId',
      sessions: '++id, name, type, lastUsed',
    });
  }
}

export const db = new MySubClassedDexie();

db.on('ready', async () => {
  let sessions = await db.sessions.toArray();
  if (sessions.length === 0) {
    await db.sessions.add({
      name: '3BLD Session',
      type: '3BLD',
      lastUsed: Date.now(),
    });
    sessions = await db.sessions.toArray();
  }
});
