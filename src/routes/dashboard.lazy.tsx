import { createLazyFileRoute } from '@tanstack/react-router';
import * as Bluetooth from 'cubing/bluetooth';
import * as Scramble from 'cubing/scramble';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { extractAlgs } from '@/lib/solutionParser';

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const [scramble, setScramble] = useState<string | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [algs, setAlgs] = useState<string[]>([]);

  const onClick = async () => {
    console.log('clicked');
    Bluetooth.enableDebugLogging(true);
    const device = await Bluetooth.connectSmartPuzzle({});
    console.log(device);
    device.addAlgLeafListener(alg => {
      console.log(alg.latestAlgLeaf.toString());
      setMoves(prev => [...prev, alg.latestAlgLeaf.toString()]);
    });
  };

  const analyse = () => {
    setAlgs(extractAlgs(moves.join(' ')));
  };

  useEffect(() => {
    Scramble.randomScrambleForEvent('333').then(scramble => {
      setScramble(scramble.toString());
    });
  }, [setScramble]);

  if (!scramble) return <></>;
  return (
    <div>
      <h1>Hello dashboard!</h1>
      <Button onClick={onClick}>Connect Scrambled Cube</Button>
      <br />
      <p>{scramble}</p>
      <p>{moves.join(' ')}</p>
      <Button onClick={analyse}>Analyse</Button>
      <code>
        <pre>{algs.join('\n')}</pre>
      </code>
    </div>
  );
}
