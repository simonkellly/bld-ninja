import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { Timer, TimerRenderer } from 'react-use-precision-timer';
import Twisty from '@/components/cubing/twisty';
import DrawScramble from '@/components/timer/drawScramble';
import { TimerStore, useCubeTimer } from '@/components/timer/timerStore';
import { CubeStore } from '@/lib/smartCube';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube?.deviceName ?? 'Connected Cube'}</>;
}

function ScrambleDisplay() {
  const scramble = useStore(TimerStore, state => state.scramble);

  return (
    <h2 className="text-3xl font-semibold text-center p-4 flex-none tracking-wide">
      {scramble}
    </h2>
  );
}

function TimeDisplay(timer: Timer) {
  const time = timer.getElapsedRunningTime();

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const hundredths = Math.floor((time % 1000) / 10);

  return (
    <span>
      {minutes > 0 && `${minutes}:`}
      {seconds < 10 && minutes > 0 && '0'}
      {seconds}.{hundredths < 10 && '0'}
      {hundredths}
    </span>
  );
}

function Dashboard() {
  const cubeTimer = useCubeTimer();
  const { enableScope, disableScope } = useHotkeysContext();

  return (
    <div
      className="h-full w-full flex flex-col outline-transparent"
      tabIndex={0}
      onFocusCapture={() => enableScope('timer')}
      onBlurCapture={() => disableScope('timer')}
    >
      <ScrambleDisplay />
      <div className="flex grow h-full items-center">
        <h1 className="text-9xl font-extrabold text-white text-center m-auto font-mono py-8">
          <TimerRenderer
            timer={cubeTimer.stopwatch}
            renderRate={30}
            render={TimeDisplay}
          />
        </h1>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        <fieldset className="rounded-lg border px-4 hover:bg-muted col-span-2 md:col-span-1">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <Twisty className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border px-4 hover:bg-muted col-span-2">
          <legend className="-ml-1 px-1 text-sm font-medium">Results</legend>
          <DrawScramble className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
