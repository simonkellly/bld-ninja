import { Card } from "@heroui/react";

import { CardHeader } from "@heroui/react";
import { useStore } from "@tanstack/react-store";
import { ResultsStore } from "../logic/result-store";

export default function SuccessDisplay() {
  const results = useStore(ResultsStore, res => res.results);
  const successes = results.slice(-12).map(r => r.solveState !== 'DNF');
  const paddedSuccesses = [...Array(12 - successes.length).fill(null), ...successes];

  return (
    <Card className="w-full h-full">
      <CardHeader className="text-2xl font-bold">Success Rate</CardHeader>
      <div className="flex flex-row h-3/4 w-full gap-1 p-4 pt-0">
        {paddedSuccesses.map((success, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-full ${success === null ? 'bg-gray-500' : success ? 'bg-success' : 'bg-danger'}`}
          />
        ))}
      </div>
    </Card>
  );
}