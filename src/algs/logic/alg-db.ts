import Dexie, { type EntityTable } from 'dexie';

interface AlgAttempt {
  id?: number;
  set: string;
  case: string;
  firstCase: boolean;
  retries: number;
  timestamp: number;
  time: number;
}

interface InversePerformed {
  id?: number;
  set: string;
  case: string;
  timestamp: number;
}

const algDb = new Dexie('algs') as Dexie & {
  algAttempts: EntityTable<
    AlgAttempt,
    'id'
  >;
  inversePerformed: EntityTable<
    InversePerformed,
    'id'
  >;
};

algDb.version(1).stores({
  algAttempts: '++id, set, case, firstCase, retries, timestamp, time',
  inversePerformed: '++id, set, case, timestamp'
});

(globalThis as unknown as any).customAnalysis = async () => {
  // print the total number of alg attempts
  const algAttemptsCount = await algDb.algAttempts.count();
  console.log(`Total number of alg attempts: ${algAttemptsCount}`);

  // print the top 10 cases where inverses were performed and the count;
  const inversePerformed = await algDb.inversePerformed.toArray();
  const inversePerformedCount = inversePerformed.reduce((acc, curr) => {
    acc[curr.case] = (acc[curr.case] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sortedInversePerformedCount = Object.entries(inversePerformedCount).sort((a, b) => b[1] - a[1]);
  console.log(sortedInversePerformedCount.slice(0, 10));

  // print the top 10 cases that had to be retried on the most attempts
  const algAttempts = await algDb.algAttempts.toArray();
  const algAttemptsRetriesCount = algAttempts.reduce((acc, curr) => {
    acc[curr.case] = (acc[curr.case] || 0) + curr.retries;
    return acc;
  }, {} as Record<string, number>);
  const sortedAlgAttemptsRetriesCount = Object.entries(algAttemptsRetriesCount).sort((a, b) => b[1] - a[1]);
  console.log(sortedAlgAttemptsRetriesCount.slice(0, 10));
};

export type { AlgAttempt };
export { algDb };