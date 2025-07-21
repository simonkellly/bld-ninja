import { Card, CardHeader, CardBody, Button } from "@heroui/react";
import { useStore } from "@tanstack/react-store";
import { AlgStore } from "../logic/alg-store";
import { useLiveQuery } from "dexie-react-hooks";
import { algDb } from "../logic/alg-db";
import { useMemo } from "react";

// Development flag: true for median, false for fastest time
const USE_MEDIAN = false;

export default function HotColdDisplay() {
  const currentSet = useStore(AlgStore, state => state.currentSet);
  const selectedCases = useStore(AlgStore, state => state.selectedCases);
  const trainInverses = useStore(AlgStore, state => state.trainInverses);
  const attempts = useLiveQuery(() => algDb.algAttempts.where("set").equals(currentSet).toArray(), [currentSet]);

  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    
    // If no cases are selected, show all attempts
    if (selectedCases.length === 0) return attempts;
    
    return attempts.filter(att => 
      selectedCases.includes(att.case[0]) || 
      (trainInverses && selectedCases.includes(att.case[1]))
    );
  }, [attempts, selectedCases, trainInverses]);

  const caseMedians = useMemo(() => {
    if (!filteredAttempts) return {};
    const grouped = filteredAttempts.reduce((acc, att) => {
      if (!acc[att.case]) acc[att.case] = [];
      acc[att.case].push(att.time);
      return acc;
    }, {} as Record<string, number[]>);
    const results: Record<string, number> = {};
    for (const cas in grouped) {
      const times = grouped[cas].sort((a, b) => a - b);
      const len = times.length;
      if (len === 0) continue;
      let value;
      if (USE_MEDIAN) {
        if (len % 2 === 1) {
          value = times[Math.floor(len / 2)];
        } else {
          value = (times[len / 2 - 1] + times[len / 2]) / 2;
        }
      } else {
        value = times[0];
      }
      results[cas] = value / 1000;
    }
    return results;
  }, [filteredAttempts]);

  const sortedCases = useMemo(() => {
    return Object.entries(caseMedians).sort((a, b) => a[1] - b[1]);
  }, [caseMedians]);

  const hottest = sortedCases.slice(0, 4);
  const coldest = sortedCases.slice(-4).reverse();

  if (!attempts || sortedCases.length === 0) {
    return <Card><CardBody>No data yet</CardBody></Card>;
  }

  const trainCases = () => {
    const chunkSize = AlgStore.state.chunkSize;
    const cases = sortedCases.slice(-8).map(([cas]) => cas);
    const randomIndices = Array.from({ length: chunkSize }, () => Math.floor(Math.random() * cases.length));
    const algs = AlgStore.state.algs;
    const algCases = cases.map(cas => algs.find(a => a.case.first === cas[0] && a.case.second === cas[1])).filter(a => a !== undefined);
    const currentAlgs = randomIndices.map(i => algCases[i]);

    AlgStore.setState((prev) => ({ ...prev, currentAlgs: currentAlgs, currentAlgIdx: 0, retries: 0 }));
  }

  return (
    <Card className="w-full">
      <CardHeader className="grid grid-cols-2 gap-4 text-2xl font-bold">
        <h3 className="mr-auto">Fast</h3>
        <div className="flex flex-row gap-4">
          <h3 className="mr-auto">Slow</h3>
          <Button size="sm" variant="bordered" onPress={trainCases}>
            Train
          </Button>
        </div>
      </CardHeader>
      <CardBody className="flex flex-row gap-4 mx-auto pt-0">
        <div className="flex-1">
          <ul className="space-y-2">
            {hottest.map(([cas, time], idx) => (
              <li key={idx} className="flex justify-between items-center p-1.75 bg-success-50 rounded-lg">
                <span className="font-medium">{cas}</span>
                <span className="text-success-700">{time.toFixed(2)}s</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <ul className="space-y-2">
            {coldest.map(([cas, time], idx) => (
              <li key={idx} className="flex justify-between items-center p-1.75 bg-danger-50 rounded-lg">
                <span className="font-medium">{cas}</span>
                <span className="text-danger-700">{time.toFixed(2)}s</span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
