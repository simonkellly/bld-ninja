import { Chip, cn, ScrollShadow, useDisclosure } from "@heroui/react";
import { useStore } from "@tanstack/react-store";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { ResultsStore } from "../logic/result-store";
import type { Solve } from "../logic/timer-db";
import SolveDialog from "./solve-dialog";

interface ResultData {
  id: number;
  time: string;
  mo3: string;
  reason: string;
}

const columns = [
  { key: "id", label: "#" },
  { key: "time", label: "Time" },
  { key: "mo3", label: "Mo3" },
  { key: "reason", label: "Reason" },
];

export function convertTimeToText(time: number, plusTwo: boolean = false) {
  if (time == -1) return 'DNF';

  let adjustedTime = time + (plusTwo ? 2000 : 0);
  const minutes = Math.floor(adjustedTime / 60000);
  const seconds = Math.floor((adjustedTime % 60000) / 1000);
  const hundredths = Math.floor((adjustedTime % 1000) / 10);

  let res = minutes > 0 ? `${minutes}:` : '';
  res += `${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.`;
  res += `${hundredths < 10 ? '0' : ''}${hundredths}`;

  if (plusTwo) {
    res += '+';
  }

  return res;
}

function calculateMo3(solves: Solve[], currentIndex: number): string {
  if (currentIndex < 2) return "-";
  
  const lastThree = solves.slice(currentIndex - 2, currentIndex + 1);
  
  if (lastThree.some(solve => solve.solveState === 'DNF')) return "DNF";
  
  const average = lastThree.reduce(
    (sum, solve) =>
      sum + (solve.solveState === 'PLUS_TWO' ? solve.solveTime + 200 : solve.solveTime),
    0) / lastThree.length;
  return convertTimeToText(average);
}

function getReasonText(solve: Solve): string {
  return solve.analysis?.dnfReason ?? '';
}

function processResults(results: Solve[]): ResultData[] {
  return results.map((_, displayIndex) => {
    const actualIndex = results.length - 1 - displayIndex;
    const result = results[actualIndex];
    return {
      id: (actualIndex + 1),
      time: result.solveState === 'DNF' ? 'DNF' : convertTimeToText(result.solveTime, result.solveState === 'PLUS_TWO'),
      mo3: calculateMo3(results, actualIndex),
      reason: getReasonText(result),
    };
  });
}

export default function ResultsTable() {
  const results = useStore(ResultsStore, state => state.results);
  const processedResults = processResults(results);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedSolveId, setSelectedSolveId] = useState<number | null>(null);
  const [selectedSolveIndex, setSelectedSolveIndex] = useState<number>(0);

  const parentRef = useRef<HTMLDivElement>(null);

  const handleSolveClick = (displayIndex: number) => {
    const actualIndex = results.length - 1 - displayIndex;
    const solve = results[actualIndex];
    setSelectedSolveId(solve.id ?? null);
    setSelectedSolveIndex(actualIndex);
    onOpen();
  };

  const virtualizer = useVirtualizer({
    count: processedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>      
      <div className="h-full flex flex-col rounded-large bg-content1 shadow-medium">
        <div className="flex items-center px-4 py-3 rounded-t-large text-foreground shadow-medium bg-content1">
          <div className="flex-1 grid grid-cols-8 gap-4">
            {columns.map((column) => (
              <div key={column.key} className={cn(
                "text-sm font-semibold",
                column.key === "id" ? "col-span-1" : column.key === "reason" ? "col-span-3" : "col-span-2"
              )}>
                {column.label}
              </div>
            ))}
          </div>
        </div>
        <ScrollShadow
          ref={parentRef}
          className="flex-grow h-48"
          hideScrollBar
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {processedResults.length > 0 && virtualItems.map((virtualItem) => {
              const item = processedResults[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div 
                    className="flex items-center px-4 py-3 border-b border-divider hover:bg-default-100 cursor-pointer transition-colors"
                    onClick={() => handleSolveClick(virtualItem.index)}
                  >
                    <div className="flex-1 grid grid-cols-8 gap-4 text-sm font-medium">
                      <div className="col-span-1">{item.id}.</div>
                      <div className="col-span-2">{item.time}</div>
                      <div className="col-span-2">{item.mo3}</div>
                      <div className="col-span-3">
                       {item.reason && (
                        <Chip color="primary" variant="flat" size="sm" className="text-xs">
                          {item.reason}
                        </Chip>
                       )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollShadow>
      </div>
      <SolveDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        solveId={selectedSolveId}
        solveIndex={selectedSolveIndex}
      />
    </>
  );
}