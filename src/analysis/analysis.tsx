import type { KPattern } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { db } from '@/lib/db';
import TimerBar from '@/timer/page/TimerBar';
import AlgSheet, { fetchGoogleSheet } from './sheet-tools';

const colorGroups = {
  ABCD: 'bg-white text-black',
  EFGH: 'bg-green-500 text-white',
  IJKL: 'bg-red-500 text-white',
  MNOP: 'bg-blue-500 text-white',
  QRST: 'bg-orange-500 text-white',
  UVWX: 'bg-yellow-500 text-black',
};

// go through all algs in the algsheet
// apply the alg to the solved cube state to get a cube state
// go through all the algs in all the solves
// figure out which case it is based on the algsheet's cube states
// then add the execution times to the algsheet's case and display it in the table

// Available sheets
const AVAILABLE_SHEETS = [
  { value: 'UFR Corners', label: 'UFR Corners' },
  { value: 'UF Edges', label: 'UF Edges' },
];

// Timing display modes
const TIMING_MODES = [
  { value: 'median', label: 'Median Time' },
  { value: 'fastest', label: 'Fastest Time' },
] as const;

type TimingMode = (typeof TIMING_MODES)[number]['value'];

// Interface for algorithm execution statistics
interface AlgExecutionStats {
  count: number;
  totalTime: number;
  averageTime: number;
  medianTime: number;
  bestTime: number;
  times: number[];
  executedAlgorithms: Set<string>; // Track unique algorithms executed for this case
}

// Map to store algorithm execution statistics by letter pair
type AlgStatsMap = Map<string, AlgExecutionStats>;

// Function to analyze algorithm execution times from solve data
async function analyzeAlgorithmExecutionTimes(
  sheet: AlgSheet
): Promise<AlgStatsMap> {
  const puzzle = await cube3x3x3.kpuzzle();
  const solvedState = puzzle.defaultPattern();

  // Precompute algToCaseMap and caseToState for efficient matching
  const algToCaseMap = new Map<string, string>();
  const caseToState = new Map<string, KPattern>();

  for (const algWrapper of sheet.algs) {
    const algString = algWrapper.expanded || algWrapper.string;
    if (algString) {
      const caseKey = algWrapper.case.first + algWrapper.case.second;
      algToCaseMap.set(algString, caseKey);
      try {
        const state = solvedState.applyAlg(algString);
        caseToState.set(caseKey, state);
      } catch (error) {
        console.error(`Invalid algorithm for case ${caseKey}: ${algString}`, error);
      }
    }
  }

  // Get all solve data
  const solves = await db.solves.toArray();
  const algStats = new Map<string, AlgExecutionStats>();

  for (const solve of solves) {
    if (!solve.algs || !solve.solution || solve.solution.length === 0) continue;

    let currentTime = solve.solution[0]?.cubeTimestamp ?? 0;

    for (const alg of solve.algs) {
      const [algString, , moveIdx] = alg;

      const endTime = solve.solution[moveIdx]?.cubeTimestamp ?? currentTime;
      const executionTime = (endTime - currentTime) / 1000;

      if (executionTime > 0) {
        const matchingCase = findMatchingCase(
          algString,
          algToCaseMap,
          caseToState,
          solvedState
        );

        if (matchingCase) {
          if (!algStats.has(matchingCase)) {
            algStats.set(matchingCase, {
              count: 0,
              totalTime: 0,
              averageTime: 0,
              medianTime: 0,
              bestTime: Infinity,
              times: [],
              executedAlgorithms: new Set(),
            });
          }

          const stats = algStats.get(matchingCase)!;
          stats.count++;
          stats.totalTime += executionTime;
          stats.times.push(executionTime);
          stats.bestTime = Math.min(stats.bestTime, executionTime);
          stats.executedAlgorithms.add(algString);
        }
      }

      currentTime = endTime;
    }
  }

  // Compute averages and medians once after collecting all data
  for (const stats of algStats.values()) {
    if (stats.count > 0) {
      stats.averageTime = stats.totalTime / stats.count;
      const sortedTimes = [...stats.times].sort((a, b) => a - b);
      const mid = Math.floor(sortedTimes.length / 2);
      stats.medianTime =
        sortedTimes.length % 2 === 0
          ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
          : sortedTimes[mid];
    }
  }

  return algStats;
}

// Function to find matching case by comparing cube states
function findMatchingCase(
  algString: string,
  algToCaseMap: Map<string, string>,
  caseToState: Map<string, KPattern>,
  solvedState: KPattern
): string | null {
  // First try direct string match
  if (algToCaseMap.has(algString)) {
    return algToCaseMap.get(algString)!;
  }

  // Compute resulting state
  let resultingState: KPattern;
  try {
    resultingState = solvedState.applyAlg(algString);
  } catch {
    return null;
  }

  // Find matching state
  for (const [caseKey, sheetState] of caseToState.entries()) {
    if (resultingState.isIdentical(sheetState)) {
      return caseKey;
    }
  }

  return null;
}

// Function to get beautiful timing-based color for algorithm execution
function getTimingColor(
  stats: AlgExecutionStats | undefined,
  mode: TimingMode
): string {
  if (!stats || stats.count === 0) {
    return ''; // No color for cases with algorithm but no timing data
  }

  const timeValue = mode === 'median' ? stats.medianTime : stats.bestTime;

  // Beautiful gradient based on absolute timing ranges - stronger colors with dark mode support
  if (timeValue < 0.6)
    return 'bg-emerald-200 dark:bg-emerald-800 dark:text-emerald-100'; // 0.5-0.6s - Fastest
  if (timeValue < 0.7)
    return 'bg-green-200 dark:bg-green-800 dark:text-green-100'; // 0.6-0.7s - Very fast
  if (timeValue < 0.8) return 'bg-lime-200 dark:bg-lime-800 dark:text-lime-100'; // 0.7-0.8s - Fast
  if (timeValue < 0.9)
    return 'bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100'; // 0.8-0.9s - Good
  if (timeValue < 1.0)
    return 'bg-amber-200 dark:bg-amber-800 dark:text-amber-100'; // 0.9-1.0s - Average
  if (timeValue < 1.2)
    return 'bg-orange-200 dark:bg-orange-800 dark:text-orange-100'; // 1.0-1.2s - Slow
  if (timeValue < 1.4) return 'bg-red-200 dark:bg-red-800 dark:text-red-100'; // 1.2-1.4s - Very slow
  if (timeValue < 1.6) return 'bg-red-300 dark:bg-red-700 dark:text-red-100'; // 1.4-1.6s - Quite slow
  if (timeValue < 1.8) return 'bg-red-400 dark:bg-red-600 dark:text-red-100'; // 1.6-1.8s - Really slow
  return 'bg-red-500 dark:bg-red-500 dark:text-red-100'; // 1.8s+ - Needs practice!
}

function AlgTable() {
  const [sheet, setSheet] = useState<AlgSheet | null>(null);
  const [algStats, setAlgStats] = useState<AlgStatsMap>(new Map());
  const [selectedSheet, setSelectedSheet] = useState<string>('UFR Corners');
  const [timingMode, setTimingMode] = useState<TimingMode>('median');
  const [error, setError] = useState<string | null>(null);

  // Watch for changes in solve data to trigger re-analysis
  const solvesCount = useLiveQuery(() => db.solves.count()) ?? 0;

  useEffect(() => {
    setSheet(null);
    setError(null);
    fetchGoogleSheet(selectedSheet).then(setSheet)
      .catch((err) => setError(err.message));
  }, [selectedSheet]);

  useEffect(() => {
    if (sheet) {
      analyzeAlgorithmExecutionTimes(sheet).then(setAlgStats);
    }
  }, [sheet, solvesCount]);

  const getColorClass = (letter: string): string => {
    for (const [group, colorClass] of Object.entries(colorGroups)) {
      if (group.includes(letter)) {
        return colorClass;
      }
    }
    return 'bg-white text-black'; // Default fallback
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-red-500">
        Error loading sheet: {error}
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-pulse text-lg">
            Loading algorithm sheet...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-4">
        <h1 className="text-2xl font-bold">Algorithm Sheet Analysis</h1>

        <div className="flex items-center gap-4">
          {/* Sheet selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sheet:</label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SHEETS.map(sheetOption => (
                  <SelectItem key={sheetOption.value} value={sheetOption.value}>
                    {sheetOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timing mode toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Display:</label>
            <div className="flex border rounded-md">
              {TIMING_MODES.map(mode => (
                <Button
                  key={mode.value}
                  variant={timingMode === mode.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimingMode(mode.value)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="border border-accent-foreground m-4 w-max">
          <table className="border-collapse w-max table-auto">
            <thead>
              <tr>
                <th className="border border-accent-foreground p-1 text-left font-semibold sticky left-0 z-10 text-xs min-w-[60px] bg-muted">
                  {/* Empty corner cell */}
                </th>
                {sheet?.letters.map(letter => (
                  <th
                    key={letter}
                    className={`border p-1 text-left font-semibold border-accent-foreground text-xs min-w-[80px] ${getColorClass(letter)}`}
                  >
                    {letter}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet?.letters.map(rowLetter => (
                <tr key={rowLetter}>
                  <td
                    className={`border border-accent-foreground p-1 text-left font-semibold sticky left-0 z-10 text-xs min-w-[60px] ${getColorClass(rowLetter)}`}
                  >
                    {rowLetter}
                  </td>
                  {sheet.letters.map(colLetter => {
                    const alg = sheet.getAlg(rowLetter, colLetter);
                    const isEmpty = !alg;
                    const caseKey = rowLetter + colLetter;
                    const stats = algStats.get(caseKey);
                    const timingColor = getTimingColor(stats, timingMode);

                    // Determine cell styling based on state
                    let cellClasses =
                      'border border-accent-foreground p-1 text-left text-xs min-w-[80px] ';

                    if (isEmpty) {
                      // Empty cells (no algorithm) - grey
                      cellClasses += 'bg-muted';
                    } else if (timingColor) {
                      // Cells with timing data - colored based on performance
                      cellClasses += `${timingColor} hover:bg-accent-foreground/10`;
                    } else {
                      // Cells with algorithm but no timing data - no background color
                      cellClasses += 'hover:bg-accent-foreground/10';
                    }

                    return (
                      <td
                        key={`${rowLetter}-${colLetter}`}
                        className={cellClasses}
                      >
                        {alg ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="font-mono text-xs cursor-help">
                                  {alg.string}
                                </div>
                              </TooltipTrigger>
                              {stats && stats.count > 0 && (
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p>
                                      <strong>Executions:</strong> {stats.count}
                                    </p>
                                    <p>
                                      <strong>Median:</strong>{' '}
                                      {stats.medianTime.toFixed(2)}s
                                    </p>
                                    <p>
                                      <strong>Average:</strong>{' '}
                                      {stats.averageTime.toFixed(2)}s
                                    </p>
                                    <p>
                                      <strong>Best:</strong>{' '}
                                      {stats.bestTime.toFixed(2)}s
                                    </p>
                                    <p>
                                      <strong>Recent times:</strong>{' '}
                                      {stats.times
                                        .slice(-3)
                                        .map(t => t.toFixed(2))
                                        .join(', ')}
                                      s
                                    </p>
                                    {stats.executedAlgorithms.size > 0 && (
                                      <div className="mt-2 pt-2 border-t border-border">
                                        <p className="text-xs font-semibold mb-1">
                                          Other algorithms used for this case:
                                        </p>
                                        <div className="space-y-1">
                                          {Array.from(stats.executedAlgorithms)
                                            .filter(algStr => algStr !== alg.string)
                                            .slice(0, 5) // Limit to 5 to avoid overly long tooltips
                                            .map((algStr, idx) => (
                                              <p key={idx} className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                                                {algStr}
                                              </p>
                                            ))}
                                          {Array.from(stats.executedAlgorithms).length > 5 && (
                                            <p className="text-xs text-muted-foreground">
                                              ...and {stats.executedAlgorithms.size - 5} more
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-accent-foreground m-4">
          <p>Total algorithms loaded: {sheet?.algs.length ?? 0}</p>
          <p>Letters: {sheet?.letters.join(', ') ?? ''}</p>

          {/* Color legend */}
          <div className="mt-4">
            <p className="font-semibold mb-2">Execution Speed Legend:</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-emerald-200 dark:bg-emerald-800 border border-accent-foreground rounded"></div>
                <span>Fastest (0.5-0.6s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-200 dark:bg-green-800 border border-accent-foreground rounded"></div>
                <span>Very fast (0.6-0.7s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-lime-200 dark:bg-lime-800 border border-accent-foreground rounded"></div>
                <span>Fast (0.7-0.8s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-800 border border-accent-foreground rounded"></div>
                <span>Good (0.8-0.9s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-amber-200 dark:bg-amber-800 border border-accent-foreground rounded"></div>
                <span>Average (0.9-1.0s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-200 dark:bg-orange-800 border border-accent-foreground rounded"></div>
                <span>Slow (1.0-1.2s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-200 dark:bg-red-800 border border-accent-foreground rounded"></div>
                <span>Very slow (1.2-1.4s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-300 dark:bg-red-700 border border-accent-foreground rounded"></div>
                <span>Quite slow (1.4-1.6s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-400 dark:bg-red-600 border border-accent-foreground rounded"></div>
                <span>Really slow (1.6-1.8s)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 dark:bg-red-500 border border-accent-foreground rounded"></div>
                <span>Needs practice (1.8s+)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs mt-3 pt-3 border-t border-accent-foreground/20">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white border border-accent-foreground rounded"></div>
                <span>Algorithm with no timing data</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <span>Empty cell (no algorithm)</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Colors show your {timingMode === 'median' ? 'median' : 'fastest'}{' '}
              execution speed. Hover over algorithms to see detailed timing
              statistics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Analysis() {
  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2 gap-2">
      <TimerBar showSessionEditor={false} />
      {/* Show the table below, be able to scroll horizontally */}
      <AlgTable />
    </div>
  );
}
