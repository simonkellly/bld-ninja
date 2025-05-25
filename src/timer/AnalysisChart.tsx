import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { AnalysisResult } from '@/lib/analysis/dnfAnalyser';
import { Penalty, db } from '@/lib/db';

const chartConfig = {
  noMoves: {
    label: 'No Moves',
    color: 'var(--color-orange-900)',
  },

  plusTwo: {
    label: '+2',
    color: 'var(--color-orange-800)',
  },
  unknown: {
    label: 'Unknown',
    color: 'var(--color-orange-700)',
  },
  solved: {
    label: 'Solved',
    color: 'var(--color-orange-600)',
  },
  oneMove: {
    label: 'One Move',
    color: 'var(--color-orange-500)',
  },
  missedTwist: {
    label: 'Missed Twist',
    color: 'var(--color-orange-400)',
  },
  missedFlip: {
    label: 'Missed Flip',
    color: 'var(--color-orange-300)',
  },
  inverseAlg: {
    label: 'Inverse Alg',
    color: 'var(--color-orange-200)',
  },
};

function getDnfKey(dnfResult: string | undefined): keyof typeof chartConfig {
  switch (dnfResult) {
    case AnalysisResult.SOLVED:
      return 'solved';
    case AnalysisResult.PLUS_TWO:
      return 'plusTwo';
    case AnalysisResult.NO_MOVES:
      return 'noMoves';
    case AnalysisResult.ONE_MOVE:
      return 'oneMove';
    case AnalysisResult.MISSED_TWIST:
      return 'missedTwist';
    case AnalysisResult.MISSED_FLIP:
      return 'missedFlip';
    case AnalysisResult.INVERSE_ALG:
      return 'inverseAlg';
    case AnalysisResult.UNKNOWN:
    default:
      return 'unknown';
  }
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: { label: string; count: number; percentage: number } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
        <p className="font-medium text-sm">{data.label}</p>
        <p className="text-xs text-muted-foreground">
          {data.count} solves ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
}

function getResultIcon(key: string) {
  switch (key) {
    case 'solved':
      return CheckCircle;
    case 'plusTwo':
      return AlertTriangle;
    case 'unknown':
      return HelpCircle;
    default:
      return XCircle;
  }
}

export default function DNFDistributionChart() {
  const solves = useLiveQuery(() => db.solves.toArray()) ?? [];

  const solveCounts = solves.reduce(
    (acc, solve) => {
      let key: keyof typeof chartConfig;

      if (solve.penalty === Penalty.DNF && solve.dnfResult) {
        key = getDnfKey(solve.dnfResult);
      } else if (solve.penalty === Penalty.PLUS_TWO) {
        key = 'plusTwo';
      } else {
        key = 'solved';
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<keyof typeof chartConfig, number>
  );

  const totalResults = Object.values(solveCounts).reduce(
    (sum, count) => sum + (count as number),
    0
  );

  const chartData = Object.entries(solveCounts)
    .map(([key, count]) => ({
      dnfType: key,
      count: count as number,
      percentage:
        totalResults > 0 ? ((count as number) / totalResults) * 100 : 0,
      label: chartConfig[key as keyof typeof chartConfig].label,
      fill: chartConfig[key as keyof typeof chartConfig].color,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <Card className="col-span-1 h-full w-1/3 flex flex-row py-3 px-3">
        <div className="flex-1 flex flex-col justify-center pr-2">
          <CardTitle className="text-sm flex items-center gap-1 mb-1">
            <HelpCircle className="h-3 w-3" />
            Solve Results
          </CardTitle>
          <CardDescription className="text-xs mb-2">
            No data available
          </CardDescription>
          <p className="text-muted-foreground text-xs">
            Start solving to see your results distribution
          </p>
        </div>
        <div className="w-32 flex items-center justify-center">
          <div className="text-4xl opacity-50">📊</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 h-full w-1/3 flex flex-row py-3 px-3">
      <div className="flex-1 flex flex-col justify-between pr-2">
        <div>
          <CardTitle className="text-sm flex items-center gap-1 mb-1">
            Analysis
          </CardTitle>
          <CardDescription className="text-xs mb-2">
            {totalResults} results
          </CardDescription>

          <div className="space-y-1">
            {chartData.slice(0, 3).map((item, index) => {
              const Icon = getResultIcon(item.dnfType);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1">
                    <Icon
                      className="h-2.5 w-2.5"
                      style={{ color: item.fill }}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px]">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            {chartData.length > 3 && (
              <div className="text-[10px] text-muted-foreground">
                +{chartData.length - 3} more
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Success rate</span>
            <span className="font-mono font-medium">
              {(() => {
                const successCount = solveCounts.solved || 0;
                const successRate =
                  totalResults > 0 ? (successCount / totalResults) * 100 : 0;
                return `${successRate.toFixed(1)}%`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Chart */}
      <div className="w-1/2 items-center justify-center hidden lg:flex">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <PieChart>
            <ChartTooltip cursor={false} content={<CustomTooltip />} />
            <Pie data={chartData} dataKey="count" nameKey="label">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
    </Card>
  );
}
