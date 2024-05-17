import { createLazyFileRoute } from '@tanstack/react-router';
import { Store, useStore } from '@tanstack/react-store';
import { randomScrambleForEvent } from 'cubing/scramble';
import { KeyboardEventHandler, useEffect } from 'react';
import Twisty from '@/components/cubing/twisty';
import { CubeStore } from '@/lib/smartCube';
import { cn } from '@/lib/utils';

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
});

function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube?.deviceName ?? 'Connected Cube'}</>;
}

const TimerStore = new Store({
  scramble: '',
  time: 0,
  holdingSpace: false,
});

function TimerDisplay() {
  const time = useStore(TimerStore, state => state.time);
  // Format time as: SS.HS or MM:SS.HS
  const className = cn('text-8xl font-bold text-white text-center m-auto', {
    'text-red-500': time > 0 && time < 5000,
    'text-green-500': time > 5000,
  });
  return <h1 className={className}>{time}</h1>;
}

function Dashboard() {
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

  const onKeyDown: KeyboardEventHandler<HTMLDivElement> = e => {
    console.log(e.key, 'Down');
    if (e.key === ' ')
      TimerStore.setState(state => ({ ...state, holdingSpace: true }));
  };

  const onKeyUp: KeyboardEventHandler<HTMLDivElement> = e => {
    if (e.key === ' ')
      TimerStore.setState(state => ({ ...state, holdingSpace: false }));
  };

  return (
    <div
      className="h-full w-full flex flex-col"
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      tabIndex={0}
    >
      <h2 className="text-2xl font-medium text-center p-4 flex-none">
        {scramble}
      </h2>
      <div className="flex grow h-full items-center">
        <TimerDisplay />
      </div>
      <div className="w-full grid grid-cols-3">
        <fieldset className="rounded-lg border p-4 m-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <Twisty className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
