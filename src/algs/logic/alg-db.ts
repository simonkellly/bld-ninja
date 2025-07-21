import Dexie, { type EntityTable } from 'dexie';
import { AlgStore } from './alg-store';

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

    // print the top 10 cases that are slowest by median (show how many attempts this case was for)
    const setAttempts = await algDb.algAttempts.where('set').equals(AlgStore.state.currentSet).toArray();
    const algAttemptsGroupedByCase = setAttempts.reduce((acc, curr) => {
      if (!acc[curr.case]) {
        acc[curr.case] = [];
      }
      acc[curr.case].push(curr.time);
      return acc;
    }, {} as Record<string, number[]>);

    const casesWithMedianTime = Object.entries(algAttemptsGroupedByCase)
      .filter(([_, times]) => times.length >= 4) // Only include cases with at least 4 attempts
      .map(([caseName, times]) => {
        const sortedTimes = times.sort((a, b) => a - b);
        const length = sortedTimes.length;
        const median = length % 2 === 0 
          ? (sortedTimes[length / 2 - 1] + sortedTimes[length / 2]) / 2
          : sortedTimes[Math.floor(length / 2)];
        
        return {
          case: caseName,
          medianTime: median,
          attemptCount: length
        };
      });

    const sortedByMedianTime = casesWithMedianTime.sort((a, b) => b.medianTime - a.medianTime);
    console.log('Top 10 slowest cases by median time:');
    console.log(sortedByMedianTime.slice(0, 10).map(item => 
      `${item.case}: ${item.medianTime.toFixed(2)}ms (${item.attemptCount} attempts)`
    ));

};

export type { AlgAttempt };
export { algDb };