import DrawScramble from '@/components/cubing/drawScramble';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Dialog } from '@/components/ui/dialog';
import { analyseSolve } from '@/lib/cube/dnfAnalyser';
import { convertSolveToText, convertTimeToText } from '@/lib/cube/solution';
import { db, Penalty, Solve } from '@/lib/db';
import { AlgTable } from './AlgTable';

export default function SolveDialog({
  solve,
  idx,
  close,
}: {
  solve: Solve;
  idx: number;
  close: (open: boolean) => void;
}) {
  const analyse = async () => {
    const {
      result: analysis,
      extractedAlgs: algs,
      reason,
    } = await analyseSolve(solve);
    db.solves.update(solve.id, {
      algs,
      dnfReason: analysis + (reason ? ': ' + reason : ''),
    });
    navigator.clipboard.writeText(
      solve.scramble + ' == ' + solve.solution.map(s => s.move).join(' ')
    );
  };

  const deleteSolve = () => {
    db.solves.delete(solve.id);
    close(false);
  };

  const solutionStr = solve.solution.map(s => s.move).join(' ');

  const timeText =
    solve.penalty == Penalty.DNF
      ? `DNF(${convertTimeToText(solve.time)})`
      : convertSolveToText(solve);

  const twistyUrl =
    'https://alg.cubing.net/?' +
    new URLSearchParams({
      setup: solve.scramble,
      alg:
        solve.algs
          ?.map(a => {
            return `${a[0]} // ${a[1]} - ${a[2]}`;
          })
          .join('\n') || solutionStr,
    }).toString();

  const exec = solve.solution[0]?.localTimestamp
    ? solve.now - solve.solution[0].localTimestamp
    : undefined;
  const memo = exec ? solve.time - exec : undefined;

  return (
    <Dialog open={true} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solve #{idx + 1}</DialogTitle>
          <DialogDescription>
            {new Date(solve.timeStamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <h2 className="text-3xl font-bold">{timeText}</h2>
        {exec && memo && (
          <h4 className="text-m text-muted-foreground">
            {convertTimeToText(memo)} + {convertTimeToText(exec)} = {timeText}
          </h4>
        )}
        <h3 className="text-l font-bold">{solve.scramble}</h3>
        <div className="flex">
          <DrawScramble
            scramble={solve.scramble}
            className="w-full h-32 mx-auto"
          />
          <DrawScramble
            scramble={solve.scramble + ' ' + solutionStr}
            className="w-full h-32 mx-auto"
          />
        </div>
        <AlgTable solve={solve} />
        {solve.penalty == Penalty.DNF && (
          <p className="font-medium">
            DNF Reason: {solve.dnfReason || 'Not analysed'}
          </p>
        )}
        <DialogFooter>
          <Button type="submit" asChild>
            <a href={twistyUrl} target="_blank" rel="noopener noreferrer">
              Recon
            </a>
          </Button>
          <Button variant="secondary" type="button" onClick={analyse}>
            Re-Analyse
          </Button>
          <Button variant="destructive" type="submit" onClick={deleteSolve}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
