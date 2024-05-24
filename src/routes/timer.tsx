import { createFileRoute } from '@tanstack/react-router';
import {
  Timer as PrecisionTimer,
  TimerRenderer,
} from 'react-use-precision-timer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import TimerBar from '@/timer/TimerBar';
import DrawScrambleCard from '@/timer/drawScrambleCard';
import LiveCubeCard from '@/timer/liveCubeCard';
import ResultsCard from '@/timer/resultsCard';
import ScrambleDisplay from '@/timer/scrambleDisplay';
import useCubeTimer, {
  HOLD_DOWN_TIME,
  TimerState,
} from '@/timer/useCubeTimer';

export const Route = createFileRoute('/timer')({
  component: Timer,
});

function TimeDisplay(cubeTimer: ReturnType<typeof useCubeTimer>) {
  return (timer: PrecisionTimer) => {
    const holdingDown = cubeTimer.state.current === TimerState.HoldingDown;
    const runningTime = timer.getElapsedRunningTime();
    const time = holdingDown ? 0 : runningTime;

    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const hundredths = Math.floor((time % 1000) / 10);

    const color = cn({
      'text-primary': holdingDown && runningTime >= HOLD_DOWN_TIME,
    });

    return (
      <span className={color}>
        {minutes > 0 && `${minutes}:`}
        {seconds < 10 && minutes > 0 && '0'}
        {seconds}.{hundredths < 10 && '0'}
        {hundredths}
      </span>
    );
  };
}

function Timer() {
  const cubeTimer = useCubeTimer();

  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2">
      <TimerBar />
      <div className="bg-card rounded-lg border w-full relative grow mt-2">
        <ScrambleDisplay />
        <div className="absolute top-0 left-0 w-full h-full flex">
          <h1 className="m-auto text-6xl sm:text-7xl md:text-9xl font-extrabold select-none">
            <TimerRenderer
              timer={cubeTimer.stopwatch}
              renderRate={40}
              render={TimeDisplay(cubeTimer)}
            />
          </h1>
        </div>
      </div>
      <ScrollArea className="h-72 mt-2 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <LiveCubeCard />
          <ResultsCard />
          <DrawScrambleCard />
        </div>
      </ScrollArea>
    </div>
  );
}
