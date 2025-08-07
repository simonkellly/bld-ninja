import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";
import {
  Card,
  CardHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { AlgStore } from "@/algs/logic/alg-store";
import { useLiveQuery } from "dexie-react-hooks";
import { algDb } from "../logic/alg-db";

export default function StatDisplay() {
  const [timeRange, setTimeRange] = useState("all-time");
  
  const color = "success";
  const categories = ["<0.7s", "<1s", "<1.3s", "1.3s+", "No results"];

  const algs = useStore(AlgStore, state => state.algs);
  const inverse = useStore(AlgStore, state => state.trainInverses);
  const selected = useStore(AlgStore, state => state.selectedCases);
  const currentSet = useStore(AlgStore, state => state.currentSet);

  const minTimestamp = (() => {
    const now = Date.now();
    switch (timeRange) {
      case "last-day":
        return now - (24 * 60 * 60 * 1000)
      case "last-month":
        return now - (30 * 24 * 60 * 60 * 1000);
      case "all-time":
      default:
        return 0;
    }
  })();
  
  const validCases = algs.filter(alg => selected.includes(alg.case.first) || (inverse && selected.includes(alg.case.second)));
  const allCases = validCases.length > 0 ? validCases : algs;

  const results = useLiveQuery(() =>
    algDb.algAttempts
      .where("set").equals(currentSet)
      .and(x => x.timestamp > minTimestamp)
      .and(x => selected.length > 0 ? (selected.includes(x.case[0]) || (inverse && selected.includes(x.case[1]))) : true)
      .toArray(), [currentSet, minTimestamp, selected, inverse]);

  const minCaseTime = (results || []).reduce((acc, attempt) => {
    const caseKey = attempt.case
    if (!acc[caseKey] || attempt.time < acc[caseKey]) {
      acc[caseKey] = attempt.time;
    }
    return acc;
  }, {} as Record<string, number>);

  const boundaries = [0, 700, 1000, 1300, Infinity];
  const caseMinsInRange = boundaries.slice(1).map((boundary, index) => {
    const prevBoundary = boundaries[index];
    return Object.values(minCaseTime).filter(time => time >= prevBoundary && time < boundary).length;
  });

  const casesWithNoResults = allCases.length - Object.keys(minCaseTime).length;

  // Log cases with no results
  const casesWithResults = new Set(Object.keys(minCaseTime));
  const casesWithoutResults = allCases.filter(alg => {
    const caseKey = alg.case.first + alg.case.second;
    return !casesWithResults.has(caseKey);
  });
  
  if (casesWithoutResults.length > 0) {
    console.log("Cases with no results:", casesWithoutResults.map(alg => alg.case.first + alg.case.second));
  }

  const chartData = categories.map((category, index) => ({
    name: category,
    value: index < caseMinsInRange.length ? (caseMinsInRange[index] || 0) : casesWithNoResults
  }));
  
  const minTimeAverage = Object.values(minCaseTime).reduce((acc, time) => acc + time, 0) / (1000 * Object.values(minCaseTime).length) ;

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-bold">Speed</h3>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="justify-between">
        <h3 className="text-2xl font-bold">Speed</h3>
        <Select
          aria-label="Time range"
          className="w-24"
          selectedKeys={[timeRange]}
          onSelectionChange={(keys) => setTimeRange(keys.currentKey ?? "all-time")}
          listboxProps={{
            itemClasses: {
              title: "text-tiny",
            },
          }}
          size="sm"
        >
          <SelectItem key="all-time">All</SelectItem>
          <SelectItem key="last-day">Day</SelectItem>
          <SelectItem key="last-month">Month</SelectItem>
        </Select>
      </CardHeader>
      <div className="flex h-full flex-wrap items-center justify-center gap-x-2 lg:flex-nowrap">
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height="100%"
          width="100%"
        >
          <PieChart accessibilityLayer margin={{top: 0, right: 0, left: 0, bottom: 0}}>
            <Tooltip
              content={({label, payload}) => (
                <div className="flex h-8 min-w-[120px] items-center gap-x-2 rounded-medium bg-background px-1 text-tiny shadow-small">
                  <span className="font-medium text-foreground">{label}</span>
                  {payload?.map((p, index) => {
                    const name = p.name;
                    const value = p.value;
                    const category = categories.find((c) => c.toLowerCase() === name) ?? name;

                    return (
                      <div key={`${index}-${name}`} className="flex w-full items-center gap-x-2">
                        <div
                          className="h-2 w-2 flex-none rounded-full"
                          style={{
                            backgroundColor: `hsl(var(--heroui-${color}-${(index + 1) * 200}))`,
                          }}
                        />
                        <div className="flex w-full items-center justify-between gap-x-2 pr-1 text-xs text-default-700">
                          <span className="text-default-500">{category}</span>
                          <span className="font-mono font-medium text-default-700">
                            {value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              cursor={false}
            />
            <Pie
              animationDuration={1000}
              animationEasing="ease"
              data={chartData}
              dataKey="value"
              innerRadius="68%"
              nameKey="name"
              paddingAngle={-20}
              strokeWidth={0}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === categories.length - 1 
                    ? "hsl(var(--heroui-default-300))" 
                    : `hsl(var(--heroui-${color}-${(index + 1) * 200}))`
                  }
                />
              ))}
            </Pie>
            <g>
              <text dominantBaseline="auto" textAnchor="middle" x="50%" y="50%">
                <tspan fill="hsl(var(--heroui-default-700))" fontSize="20" fontWeight="600" x="50%" y="50%">{minTimeAverage.toFixed(2)}s</tspan>
                <tspan fill="hsl(var(--heroui-default-500))" fontSize="12" fontWeight="500" x="50%" y="60%">Average</tspan>
              </text>
            </g>
          </PieChart>
        </ResponsiveContainer>

        <div className="flex w-full flex-col justify-center gap-4 p-4 text-tiny text-default-500 lg:p-0">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: index === categories.length - 1 
                    ? "hsl(var(--heroui-default-300))" 
                    : `hsl(var(--heroui-${color}-${(index + 1) * 200}))`,
                }}
              />
              <span className="capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
