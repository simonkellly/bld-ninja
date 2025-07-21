import { PopoverPortal } from '@radix-ui/react-popover';
import DrawScramble from '@/components/cubing/drawScramble';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Solve } from '@/lib/db';

export function AlgTable({ solve }: { solve: Solve }) {
  const solutionStr = solve.solution.map(s => s.move).join(' ');

  if (!solve.algs)
    return (
      <ul className="rounded-md border p-2">
        <li className="font-medium">Algs in solve:</li>
        <ScrollArea className="h-64">{solutionStr}</ScrollArea>
      </ul>
    );

  let time = solve.solution[0]?.cubeTimestamp ?? 0;

  return (
    <ScrollArea className="h-64 w-full rounded-md border p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Alg</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solve.algs.map(alg => {
            const moveIdx = alg[2];
            const algTime =
              ((solve.solution[moveIdx]?.cubeTimestamp ?? 0) - time) / 1000;
            time = solve.solution[moveIdx]?.cubeTimestamp ?? 0;

            return (
              <Popover key={alg[2] + algTime}>
                <PopoverTrigger asChild>
                  <TableRow>
                    <TableCell>{algTime.toFixed(2)}s</TableCell>
                    <TableCell>{alg[0]}</TableCell>
                    <TableCell className="text-left">{alg[1]}</TableCell>
                  </TableRow>
                </PopoverTrigger>
                <PopoverPortal>
                  <PopoverContent side="right" hideWhenDetached>
                    <DrawScramble
                      scramble={alg[0]}
                      className="w-32 h-32 mx-auto"
                      reverse
                    />
                  </PopoverContent>
                </PopoverPortal>
              </Popover>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
