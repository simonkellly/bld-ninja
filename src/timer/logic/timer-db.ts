import Dexie, { type EntityTable } from "dexie";
import type { AlgType } from "../cube/solution-parser";

const SOLVE_STATES = ['SOLVED', 'DNF', 'PLUS_TWO'] as const;
type SolveState = (typeof SOLVE_STATES)[number];

const TIMER_MODES = ['3BLD', 'Edges', 'Corners'] as const;
type TimerMode = (typeof TIMER_MODES)[number];

export interface Session {
  id?: number;
  name: string;
  lastUsed: number
  type: TimerMode;
}

export interface Move {
  move: "U" | "U'" | "R" | "R'" | "F" | "F'" | "L" | "L'" | "B" | "B'" | "D" | "D'";
  timestamp: number;
}

export type Comm = {
  alg: string;
  issue: 'NONE' | 'One Move' | 'Inverse' | 'Alg Order';
  type: AlgType;
  startIdx: number;
  duration: number;
}

export type AnalysisResult = {
  algs: Comm[];
  dnfReason?: 'Unknown' | 'Flips/Twists' | 'One Move' | 'Inverse' | 'Alg Order';
}

export interface Solve {
  id?: number;
  sessionId: number;
  timestamp: number;
  mode: TimerMode;
  scramble: string;
  solveTime: number;
  execTime?: number;
  finishTimestamp: number;
  moves: Move[];
  solveState: SolveState;
  analysis?: AnalysisResult;
}

export const timerDb = new Dexie('timer') as Dexie & {
  sessions: EntityTable<Session, 'id'>;
  solves: EntityTable<Solve, 'id'>;
}

timerDb.version(1).stores({
  sessions: '++id, name, lastUsed, type',
  solves: '++id, sessionId, timestamp, mode, scramble, solveTime, execTime, finishTimestamp, moves, solveState, analysis'
});
