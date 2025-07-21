import { Card } from "@heroui/react";
import { ResultsStore } from "../logic/result-store";
import { useStore } from "@tanstack/react-store";
import { useMemo } from "react";
import type { Solve } from "../logic/timer-db";

// TODO: These stats are calculated wrong

function BigCard({ title, time }: { title: string, time: string }) {
  return (
    <Card className="row-span-2">
      <div className="text-xs pt-2 pl-3">{title}</div>
      <div className="absolute top-0 left-0 w-full h-full flex">
        <h1 className="m-auto text-4xl font-bold text-center p-0">
          {time}
        </h1>
      </div>
    </Card>
  );
}

function SmallCard({ title, time }: { title: string, time: string }) {
  return (
    <Card className="h-16">
      <div className="text-xs pt-2 pl-3">{title}</div>
      <div className="">
        <h1 className="m-auto text-xl font-bold text-center p-0">
          {time}
        </h1>
      </div>
    </Card>
  );
}

export function convertTimeToText(time: number | null) {
  if (time == null) return ' ';
  if (time == -1) return 'DNF';

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const hundredths = Math.floor((time % 1000) / 10);

  let res = minutes > 0 ? `${minutes}:` : '';
  res += `${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.`;
  res += `${hundredths < 10 ? '0' : ''}${hundredths}`;

  return res;
}

function calculateRecentStats(results: Solve[]) {
  if (results.length === 0) return null;
  
  const recent = results.slice(-5); // Only need last 5 for both Mo3 and Ao5
  const validRecent = recent.filter(solve => solve.solveState === 'SOLVED');
  
  let currentMo3 = 'DNF' as string | number;
  let currentAo5 = 'DNF' as string | number;
  
  // Current Mo3 (last 3 solves)
  if (recent.length >= 3) {
    const last3Valid = recent.slice(-3).filter(solve => solve.solveState === 'SOLVED');
    if (last3Valid.length === 3) {
      currentMo3 = last3Valid.reduce((sum, solve) => sum + solve.solveTime, 0) / last3Valid.length;
    }
  }
  
  // Current Ao5 (last 5 solves)
  if (recent.length >= 5 && validRecent.length >= 4) {
    const times = validRecent.map(solve => solve.solveTime).sort((a, b) => a - b);
    if (times.length === 5) {
      // Remove best and worst, average middle 3
      currentAo5 = times.slice(1, -1).reduce((sum, time) => sum + time, 0) / 3;
    } else if (times.length >= 4) {
      // If one DNF, average all valid times
      currentAo5 = times.reduce((sum, time) => sum + time, 0) / times.length;
    }
  }
  
  return { currentMo3, currentAo5 };
}

function calculateHistoricalBests(results: Solve[]) {
  if (results.length < 3) return { pbMo3: null, pbAo5: null };
  
  let pbMo3 = null;
  let pbAo5 = null;
  
  // For Mo3 - check every possible window of 3 consecutive solves
  for (let i = 2; i < results.length; i++) {
    const window = results.slice(i - 2, i + 1);
    const validInWindow = window.filter(solve => solve.solveState === 'SOLVED');
    
    if (validInWindow.length === 3) {
      const mean = validInWindow.reduce((sum, solve) => sum + solve.solveTime, 0) / validInWindow.length;
      if (pbMo3 === null || mean < pbMo3) {
        pbMo3 = mean;
      }
    }
  }
  
  // For Ao5 - check every possible window of 5 consecutive solves
  for (let i = 4; i < results.length; i++) {
    const window = results.slice(i - 4, i + 1);
    const validInWindow = window.filter(solve => solve.solveState === 'SOLVED');
    
    if (validInWindow.length >= 4) {
      const times = validInWindow.map(solve => solve.solveTime).sort((a, b) => a - b);
      
      let average;
      if (times.length === 5) {
        // Remove best and worst, average middle 3
        average = times.slice(1, -1).reduce((sum, time) => sum + time, 0) / 3;
      } else {
        // If there are DNFs, average all valid times
        average = times.reduce((sum, time) => sum + time, 0) / times.length;
      }
      
      if (pbAo5 === null || average < pbAo5) {
        pbAo5 = average;
      }
    }
  }
  
  return { pbMo3, pbAo5 };
}

export default function ResultsStats() {
  const results = useStore(ResultsStore, state => state.results);

  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        bestTime: null,
        currentTime: null,
        currentMo3: null,
        currentAo5: null,
        pbMo3: null,
        pbAo5: null,
        allTimeAverage: null
      };
    }

    // Best time - single pass through valid solves
    const validSolves = results.filter(solve => solve.solveState === 'SOLVED');
    const bestTime = validSolves.length > 0 
      ? Math.min(...validSolves.map(solve => solve.solveTime))
      : null;
    
    // Current time
    const lastSolve = results[results.length - 1];
    const currentTime = lastSolve?.solveState === 'SOLVED' ? lastSolve.solveTime : 'DNF';
    
    // Recent stats (Mo3, Ao5)
    const recentStats = calculateRecentStats(results);
    
    // Historical bests
    const historicalBests = calculateHistoricalBests(results);
    
    // All time average
    const allTimeAverage = validSolves.length > 0
      ? validSolves.reduce((sum, solve) => sum + solve.solveTime, 0) / validSolves.length
      : null;

    return {
      bestTime,
      currentTime,
      currentMo3: recentStats?.currentMo3 ?? null,
      currentAo5: recentStats?.currentAo5 ?? null,
      pbMo3: historicalBests.pbMo3,
      pbAo5: historicalBests.pbAo5,
      allTimeAverage
    };
  }, [results]);

  return (
    <div className="my-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid grid-rows-4 gap-2">
          <BigCard title="Best" time={convertTimeToText(stats.bestTime)} />
          <SmallCard title="PB Mo3" time={convertTimeToText(stats.pbMo3)} />
          <SmallCard title="PB Ao5" time={convertTimeToText(stats.pbAo5)} />
        </div>
        <div className="grid grid-rows-4 gap-2">
          <SmallCard title="Now" time={stats.currentTime === 'DNF' ? stats.currentTime : convertTimeToText(stats.currentTime as number)} />
          <SmallCard title="Mo3" time={stats.currentMo3 === 'DNF' ? stats.currentMo3 : convertTimeToText(stats.currentMo3 as number)} />
          <SmallCard title="Ao5" time={stats.currentAo5 === 'DNF' ? stats.currentAo5 : convertTimeToText(stats.currentAo5 as number)} />
          <SmallCard title="All" time={convertTimeToText(stats.allTimeAverage)} />
        </div>
      </div>
    </div>
  );
}