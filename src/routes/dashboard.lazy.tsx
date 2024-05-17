import { createLazyFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import Twisty from '@/components/cubing/twisty';
import { CubeStore } from '@/lib/smartCube';
import { TimerStore, useCubeTimer } from '@/components/timer/timerStore';
import DrawScramble from '@/components/timer/drawScramble';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { Timer, TimerRenderer } from 'react-use-precision-timer';

export const Route = createLazyFileRoute('/dashboard')({
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
        <h1 className="text-9xl font-extrabold text-white text-center m-auto font-mono">
          <TimerRenderer
            timer={cubeTimer.stopwatch}
            renderRate={30}
            render={TimeDisplay}
          />
        </h1>
      </div>
      <div className="w-full grid grid-cols-3 gap-4 p-4">
        <fieldset className="rounded-lg border px-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <Twisty className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border px-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            Scramble
          </legend>
          <DrawScramble className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border px-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            Results
          </legend>
          <DrawScramble className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
