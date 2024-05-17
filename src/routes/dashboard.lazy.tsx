import { createLazyFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { randomScrambleForEvent } from 'cubing/scramble';
import { useEffect, useState } from 'react';
import Twisty from '@/components/cubing/twisty';
import { CubeStore } from '@/lib/smartCube';
import { TimerStore } from '@/components/timer/timerStore';
import DrawScramble from '@/components/timer/drawScramble';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';
import { TimerRenderer, useStopwatch } from "react-use-precision-timer";

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
});

function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube?.deviceName ?? 'Connected Cube'}</>;
}

function Dashboard() {
  const { enableScope, disableScope } = useHotkeysContext();


  const stopwatch = useStopwatch();

  useEffect(() => {
    stopwatch.pause();
  })

  const scramble = useStore(TimerStore, state => state.scramble);

  useEffect(() => {
    if (scramble) return;
    randomScrambleForEvent('333').then(newScram => {
      TimerStore.setState(state => ({
        ...state,
        scramble: newScram.toString(),
      }));
    });
  }, [scramble]);

  useHotkeys(`${Key.Meta}+${Key.ArrowRight}`, () => {
    console.log("Hello");
    randomScrambleForEvent('333').then(newScram => {
      TimerStore.setState(state => ({
        ...state,
        scramble: newScram.toString(),
      }));
    });
  }, {
    scopes: ['timer'],
    preventDefault: true,
  })

  const [beenStopped, setBeenStopped] = useState(false);

  useHotkeys(' ', () => {
    stopwatch.start();
    
  }, {
    scopes: ['timer'],
    preventDefault: true,
    keyup: true,
    keydown: false,
  })

  useHotkeys(' ', () => {
    if (stopwatch.isPaused()) {
      stopwatch.stop();
      return;
    }

    setBeenStopped(true);
    stopwatch.pause();
  }, {
    scopes: ['timer'],
    preventDefault: true,
    keyup: false,
    keydown: true,
  })

  return (
    <div
      className="h-full w-full flex flex-col outline-transparent"
      tabIndex={0}
      onFocusCapture={() => enableScope('timer')}
      onBlurCapture={() => disableScope('timer')}
    >
      <h2 className="text-xl font-semibold text-center p-4 flex-none">
        {scramble}
      </h2>
      <div className="flex grow h-full items-center">
        <h1 className="text-8xl font-bold text-white text-center m-auto">
          <TimerRenderer timer={stopwatch} renderRate={30} />
        </h1>;
      </div>
      <div className="w-full grid grid-cols-3">
        <fieldset className="rounded-lg border p-4 m-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <Twisty className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border p-4 m-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            Scramble
          </legend>
          <DrawScramble className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border p-4 m-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            Results
          </legend>
          <DrawScramble className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
