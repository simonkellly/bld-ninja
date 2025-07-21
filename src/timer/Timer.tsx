import { useEffect, useState } from 'react';
import {
  Timer as PrecisionTimer,
  TimerRenderer,
} from 'react-use-precision-timer';
import { cn } from '@/lib/utils';
import AnalysisChart from '@/timer/results/AnalysisChart';
import DrawScrambleCard from './attempt/DrawScrambleCard';
import LiveCubeCard from './attempt/LiveCubeCard';
import ScrambleDisplay from './attempt/ScrambleDisplay';
import TimerBar from './page/TimerBar';
import Results from './results/Results';
import { setup as setupSessions } from './sessionStore';
import useCubeTimer, { TimerState, HOLD_DOWN_TIME } from './useCubeTimer';

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

async function prepare(callback: (status: boolean) => void) {
  await setupSessions();
  callback(true);
}

export default function Timer() {
  const cubeTimer = useCubeTimer();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    prepare(setIsReady);
  }, []);

  if (!isReady) return <div></div>;

  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2 gap-2">
      <TimerBar />
      <div id="timer" className="flex gap-2 flex-1 min-h-0">
        <div
          id="sidebar"
          className="flex flex-col w-72 flex-none bg-card rounded-lg border"
        >
          <Results />
        </div>
        <div id="main" className="flex flex-col gap-2 grow">
          <div
            id="time-view"
            className="bg-card rounded-lg border grow relative"
          >
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
          <div id="bottom-bar" className="flex gap-2 h-64">
            <LiveCubeCard />
            <DrawScrambleCard />
            <AnalysisChart />
          </div>
        </div>
      </div>
    </div>
  );
}
