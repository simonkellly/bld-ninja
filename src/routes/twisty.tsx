import { createFileRoute } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import BTCubeDisplay from '@/components/cubing/btCubeDisplay';
import TimeList from '@/components/timer/timeList';
import { db } from '@/lib/db';

export const Route = createFileRoute('/twisty')({
  component: TwistyExample,
});

export function SolveList() {
  const friends = useLiveQuery(() => db.solves.toArray());

  return (
    <ul>
      {friends?.map(friend => (
        <li key={friend.id}>
          ({friend.id}): {friend.time} - {friend.parsed} - {friend.solution}
        </li>
      ))}
    </ul>
  );
}

function TwistyExample() {
  return (
    <>
      <BTCubeDisplay className="w-64 h-64" />
      <TimeList className="h-64" />
      {/* <SolveList /> */}
    </>
  );
}
