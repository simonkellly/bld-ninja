import { Chip, cn } from '@heroui/react';
import { Check } from 'lucide-react';
import { TimerStore } from '../logic/timer-store';
import { useStore } from '@tanstack/react-store';
import { SessionStore } from '../logic/session-store';

export default function ScrambleMoves() {
  const scramble = useStore(TimerStore, state => state.scramble);
  const scrambleMoves = scramble.split(' ');
  const scrambleIndex = useStore(TimerStore, state => state.scrambleIdx);

  const solveType = useStore(SessionStore, state => state.activeSession.type);
  const hasParity = useStore(TimerStore, state => state.originalScramble.split(' ').filter(s => s.length === 1 || s[1] !== '2').length % 2) === 1;

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-1xl sm:text-3xl font-semibold text-center p-4 flex-none select-none">
        {scrambleIndex < scrambleMoves.length &&
          scrambleMoves.map((move, i) => {
            const className = cn(
              'inline-block px-1 mx-0.5 py-0.5 sm:px-2 sm:mx-1 sm:py-1 rounded-lg',
              {
                'bg-primary text-primary-foreground': i === scrambleIndex,
                'text-primary': i < scrambleIndex,
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
      {hasParity && solveType === 'Edges' && (
        <Chip size="lg" variant="solid" color="secondary">
          Parity
        </Chip>
      )}
    </div>
  );
}
