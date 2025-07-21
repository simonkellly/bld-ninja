import { useStore } from '@tanstack/react-store';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionStore } from '../sessionStore';
import { TimerStore } from '../timerStore';

export default function ScrambleDisplay() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const originalScramble = useStore(
    TimerStore,
    state => state.originalScramble
  );
  const scrambleMoves = scramble.split(' ');

  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  const sessionType = useStore(SessionStore, state => state.activeSession.type);

  const showParity = sessionType === 'Edges';
  const parity =
    originalScramble.split(' ').filter(m => !m.endsWith('2')).length % 2 === 1;

  return (
    <>
      <h2 className="text-1xl sm:text-3xl font-semibold text-center p-4 flex-none select-none">
        {scrambleIndex < scrambleMoves.length &&
          scrambleMoves.map((move, i) => {
            const className = cn(
              'inline-block px-1 mx-0.5 py-0.5 sm:px-2 sm:mx-1 sm:py-1 rounded-lg',
              {
                'bg-primary text-primary-foreground': i === scrambleIndex,
                'text-secondary': i < scrambleIndex,
              }
            );
            return (
              <div key={scramble + ' ' + i} className={className}>
                <pre>{move.padEnd(2, ' ')}</pre>
              </div>
            );
          })}
        {scrambleIndex === scrambleMoves.length && (
          <Check className="m-auto h-8 w-8 text-primary" strokeWidth={3} />
        )}
      </h2>
      {showParity && (
        <h3 className="text-md font-semibold text-center flex-none select-none">
          {parity ? 'Parity' : 'No Parity'}
        </h3>
      )}
    </>
  );
}
