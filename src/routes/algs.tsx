import { AlgStore } from '@/algs/logic/alg-store';
import CaseSettings from '@/algs/components/case-settings';
import LiveCubeDisplay from '@/algs/components/live-cube-display';
import { useAlgTrainer } from '@/algs/logic/use-alg-trainer';
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store';
import ResultsDisplay from '@/algs/components/results-display';
import StatDisplay from '@/algs/components/stat-display';
import HotColdDisplay from '@/algs/components/hot-cold-display';
import { Card } from '@heroui/react';

export const Route = createFileRoute('/algs')({
  component: Algs,
})

function Sidebar() {
  return (
    <div className="w-96 flex-none flex flex-col rounded-large p-4 border-small border-default-200 rounded-r-none">
      <h1 className="font-bold text-3xl">Alg Trainer</h1>
      <h2 className="font-normal text-1xl">Customise the cases to train</h2>
      <CaseSettings />
      <div className="flex-grow" />
      <div className="flex-none h-64">
        <LiveCubeDisplay />
      </div>
    </div>
  );
}

function AlgTrainer() {
  useAlgTrainer();

  return <></>
}

function AlgDisplay() {
  const currentAlgs = useStore(AlgStore, state => state.currentAlgs)?.map(a => a.case.first + a.case.second);
  const currentAlgIdx = useStore(AlgStore, state => state.currentAlgIdx);

  if (!currentAlgs) return <>...</>

  return currentAlgs.map((a, idx) => (
    <div className={`px-2 ${idx < currentAlgIdx ? "text-primary" : ""}`} key={a + idx}>
      {a}
    </div>
  ))
}

function Algs() {
  return (
    <div className="px-4 pb-4 h-full w-full relative flex">
      <Sidebar />
      <div className="flex-grow flex flex-col rounded-large p-4 border-small border-default-200 border-l-0 rounded-l-none">
        <div className="flex-grow  flex items-center justify-center">
          <div className="text-7xl text-center font-extrabold select-none flex flex-wrap justify-center">
            <AlgDisplay />
          </div>
        </div>
        <div className="flex-none grid grid-cols-3 h-64 gap-4">
          {/* TODO: Add the algs */}
          <ResultsDisplay />
          <StatDisplay />
          <HotColdDisplay />
        </div>
      </div>
      <AlgTrainer />
    </div>
  )
} 