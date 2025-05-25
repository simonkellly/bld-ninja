import { useLiveQuery } from 'dexie-react-hooks';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';
import { Penalty, Solve, db } from '@/lib/db';

function convertTimeToText(time: number) {
  if (time == -1) return 'DNF';

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const hundredths = Math.floor((time % 1000) / 10);

  let res = minutes > 0 ? `${minutes}:` : '';
  res += `${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.`;
  res += `${hundredths < 10 ? '0' : ''}${hundredths}`;

  return res;
}

function convertSolveToText(solve: Solve) {
  if (solve.penalty === Penalty.DNF) return 'DNF';

  const isPlusTwo = solve.penalty === Penalty.PLUS_TWO;
  const time = isPlusTwo ? solve.time + 2000 : solve.time;
  const text = convertTimeToText(time);

  if (solve.penalty === Penalty.PLUS_TWO) return text + '+';
  else return text;
}

function getSolveTime(solve: Solve): number | null {
  if (solve.penalty === Penalty.DNF) return null;
  return solve.penalty === Penalty.PLUS_TWO ? solve.time + 2000 : solve.time;
}

function calculateAverage(solves: Solve[], count: number): string {
  if (solves.length < count) return 'DNF';

  const recentSolves = solves.slice(0, count);
  const times: (number | null)[] = recentSolves.map(getSolveTime);

  const dnfCount = times.filter(time => time === null).length;

  if (count >= 5) {
    if (dnfCount > 1) return 'DNF';

    const validTimes = times.filter(time => time !== null) as number[];
    if (validTimes.length < count - 1) return 'DNF';

    validTimes.sort((a, b) => a - b);

    const trimmedTimes = validTimes.slice(1, -1);
    const sum = trimmedTimes.reduce((acc, time) => acc + time, 0);

    return convertTimeToText(sum / trimmedTimes.length);
  } else {
    if (dnfCount > 0) return 'DNF';

    const validTimes = times.filter(time => time !== null) as number[];
    const sum = validTimes.reduce((acc, time) => acc + time, 0);

    return convertTimeToText(sum / validTimes.length);
  }
}

function calculateBestAverage(solves: Solve[], count: number): string {
  if (solves.length < count) return 'DNF';

  let bestAvg: number | null = null;

  for (let i = 0; i <= solves.length - count; i++) {
    const window = solves.slice(i, i + count);
    const times: (number | null)[] = window.map(getSolveTime);
    const dnfCount = times.filter(time => time === null).length;

    let avgTime: number | null = null;

    if (count >= 5) {
      if (dnfCount <= 1) {
        const validTimes = times.filter(time => time !== null) as number[];
        if (validTimes.length >= count - 1) {
          validTimes.sort((a, b) => a - b);
          const trimmedTimes = validTimes.slice(1, -1);
          avgTime =
            trimmedTimes.reduce((acc, time) => acc + time, 0) /
            trimmedTimes.length;
        }
      }
    } else {
      if (dnfCount === 0) {
        const validTimes = times.filter(time => time !== null) as number[];
        avgTime =
          validTimes.reduce((acc, time) => acc + time, 0) / validTimes.length;
      }
    }

    if (avgTime !== null && (bestAvg === null || avgTime < bestAvg)) {
      bestAvg = avgTime;
    }
  }

  return bestAvg !== null ? convertTimeToText(bestAvg) : 'DNF';
}

function calculateBestSingle(solves: Solve[]): string {
  if (solves.length === 0) return 'DNF';

  const validSolves = solves.filter(solve => solve.penalty !== Penalty.DNF);
  if (validSolves.length === 0) return 'DNF';

  const bestSolve = validSolves.reduce((best, current) => {
    const currentTime = getSolveTime(current);
    const bestTime = getSolveTime(best);

    if (currentTime === null) return best;
    if (bestTime === null) return current;

    return currentTime < bestTime ? current : best;
  });

  return convertSolveToText(bestSolve);
}

function calculateMean(solves: Solve[]): string {
  if (solves.length === 0) return 'DNF';

  const validTimes = solves
    .map(getSolveTime)
    .filter(time => time !== null) as number[];

  if (validTimes.length === 0) return 'DNF';

  const sum = validTimes.reduce((acc, time) => acc + time, 0);
  return convertTimeToText(sum / validTimes.length);
}

function StatItem({
  label,
  current,
  best,
}: {
  label: string;
  current: string;
  best: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="flex gap-4">
        <span className="font-mono text-sm font-medium w-16 text-right">
          {current}
        </span>
        <span className="font-mono text-sm font-medium w-16 text-right">
          {best}
        </span>
      </div>
    </div>
  );
}

const averageConfigs = [
  { count: 3, label: 'mo3' },
  { count: 5, label: 'ao5' },
  { count: 12, label: 'ao12' },
  { count: 25, label: 'ao25' },
  { count: 50, label: 'ao50' },
  { count: 100, label: 'ao100' },
  { count: 200, label: 'ao200' },
  { count: 500, label: 'ao500' },
  { count: 1000, label: 'ao1000' },
  { count: 2000, label: 'ao2000' },
];

export function SessionSelector() {
  return (
    <Select value="3bld">
      <SelectTrigger className="max-w-40 h-full py-0">
        <SelectValue placeholder="Sessions" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sessions</SelectLabel>
          <SelectItem value="3bld">3BLD</SelectItem>
          <SelectItem value="edges" disabled>
            Edges
          </SelectItem>
          <SelectItem value="corners" disabled>
            Corners
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function ResultsStats() {
  const data = useLiveQuery(() => db.solves.reverse().toArray()) ?? [];
  const solveCount = data.length;

  const relevantAverages = averageConfigs.filter(
    config => solveCount >= config.count
  );

  const currentSingle = data.length > 0 ? convertSolveToText(data[0]) : 'DNF';
  const bestSingle = calculateBestSingle(data);

  const mean = calculateMean(data);
  const successes = data.filter(solve => solve.penalty !== Penalty.DNF).length;
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">3BLD</h3>
        <div className="flex gap-4 text-sm font-semibold text-muted-foreground">
          <span className="w-16 text-right">Current</span>
          <span className="w-16 text-right">Best</span>
        </div>
      </div>
      <div className="space-y-1">
        <StatItem label="single" current={currentSingle} best={bestSingle} />
        {relevantAverages.map(({ count, label }) => (
          <StatItem
            key={label}
            label={label}
            current={calculateAverage(data, count)}
            best={calculateBestAverage(data, count)}
          />
        ))}
      </div>
      <div className="text-center">
        <div className="font-semibold text-sm">
          Solves: {successes}/{solveCount} (
          {((successes / solveCount) * 100).toFixed(2)}%)
        </div>
        <div className="font-semibold text-sm">Global: {mean}</div>
      </div>
    </div>
  );
}
