import { useStore } from '@tanstack/react-store';
import { Copy } from 'lucide-react';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { Timer, TimerRenderer } from 'react-use-precision-timer';
import BTCubeDisplay from '@/components/cubing/btCubeDisplay';
import TimeList from '@/timer/timeList';
import { useCubeTimer } from '@/timer/useTimer';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TimerStore } from './timerStore';
import CubeName from '@/components/cubing/cubeName';

function ScrambleDisplay() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  const copyScramble = () => {
    window.navigator.clipboard.writeText(TimerStore.state.originalScramble);
  };

  // TODO: Make this not affect timer positioning
  return (
    <h2 className="text-3xl font-semibold text-center p-4 flex-none select-none">
      {scramble.length > 0 ? (
        <>
          {scramble.split(' ').map((move, i) => {
            const className = cn(
              'inline-block px-2 mx-1 py-1 text-white rounded-lg',
              {
                'bg-muted': i === scrambleIndex,
                'text-muted': i < scrambleIndex,
              }
            );
            return (
              <div
                key={scramble.length + move + 'Move' + i}
                className={className}
              >
                {move}
              </div>
            );
          })}{' '}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={copyScramble}>
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy scramble</p>
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <></>
      )}
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

export default function TimerPage() {
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
        <h1 className="text-9xl font-extrabold text-white text-center m-auto font-mono py-8 select-none">
          <TimerRenderer
            timer={cubeTimer.stopwatch}
            renderRate={30}
            render={TimeDisplay}
          />
        </h1>
      </div>
      <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        <fieldset className="rounded-lg border px-4 hover:bg-muted col-span-2 md:col-span-1">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <BTCubeDisplay className="w-full h-64 m-auto" />
        </fieldset>
        <fieldset className="rounded-lg border px-4 col-span-2">
          <legend className="-ml-1 px-1 text-sm font-medium">Results</legend>
          <TimeList className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
