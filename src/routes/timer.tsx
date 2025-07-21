import { createFileRoute } from '@tanstack/react-router'
import Sidebar from '@/timer/components/sidebar';
import ScrambleMoves from '@/timer/components/scramble-moves';
import LiveCubeDisplay from '@/timer/components/live-cube-display';
import DrawScrambleDisplay from '@/timer/components/draw-scramble-display';
import SuccessDisplay from '@/timer/components/success-display';
import {
  type Timer as PrecisionTimer,
  TimerRenderer,
} from 'react-use-precision-timer';
import useCubeTimer from '@/timer/logic/use-cube-timer';
import { cn } from '@heroui/react';
import { HOLD_DOWN_TIME } from '@/timer/logic/use-cube-timer';
import { useEffect } from 'react';
import { useState } from 'react';
import { setup as setupSessions } from '@/timer/logic/session-store';

export const Route = createFileRoute('/timer')({
  component: Timer,
});

function RenderTime(cubeTimer: ReturnType<typeof useCubeTimer>) {
  return (timer: PrecisionTimer) => {
    const holdingDown = cubeTimer.state.current === 'HOLDING_DOWN';
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

function TimeDisplay() {
  const cubeTimer = useCubeTimer();

  return (
    <TimerRenderer
      timer={cubeTimer.stopwatch}
      renderRate={40}
      render={RenderTime(cubeTimer)}
    />
  );
}

async function prepare(callback: (status: boolean) => void) {
  await setupSessions();
  callback(true);
}

function Timer() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    prepare(setIsReady);
  }, []);

  if (!isReady) return <div></div>;

  return (
    <div className="px-4 pb-4 h-full w-full relative flex">
      <Sidebar />
      <div className="flex-grow flex flex-col rounded-large p-4 border-small border-default-200 border-l-0 rounded-l-none">
      <div
        id="time-view"
        className="grow relative"
      >
        <ScrambleMoves />
        <div className="absolute top-0 left-0 w-full h-full flex">
          <h1 className="m-auto text-6xl sm:text-7xl md:text-9xl font-extrabold select-none font-mono">
            <TimeDisplay />
          </h1>
        </div>
      </div>
        <div className="flex-none grid grid-cols-3 h-64 gap-4">
          <LiveCubeDisplay />
          <DrawScrambleDisplay />
          <SuccessDisplay />
        </div>
      </div>
    </div>
  )
} 