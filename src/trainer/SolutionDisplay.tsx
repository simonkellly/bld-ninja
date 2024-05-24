import { useStore } from '@tanstack/react-store';
import { simplify } from '@/lib/solutionParser';
import { cn } from '@/lib/utils';
import { TrainerStore } from './trainerStore';

export default function SolutionDisplay() {
  const moves = useStore(TrainerStore, state => state.moves).map(m => m.move);
  const analysed = useStore(TrainerStore, state => state.analysedMoves);
  const movesTotal = simplify(moves.join(' ')).toString();
  const splitMoves = movesTotal.split(' ');

  return (
    <>
      <h2 className="text-1xl sm:text-3xl font-semibold text-center p-4 pb-0 flex-none select-none">
        {splitMoves.map((move, i) => {
          const className = cn(
            'inline-block px-1 mx-0.5 py-0.5 sm:px-2 sm:mx-1 sm:py-1 rounded-lg'
          );
          return (
            <div key={movesTotal + ' ' + i} className={className}>
              <pre>{move.padEnd(2, ' ')}</pre>
            </div>
          );
        })}
      </h2>
      <h3 className="text-xl sm:text-1xl font-semibold text-secondary text-center p-1 select-none">
        {analysed}
      </h3>
    </>
  );
}
