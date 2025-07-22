// TODO: make a way to be able to use the 3d drag view of the scramble
import { useLiveQuery } from "dexie-react-hooks";
import { 
  Button, 
  Card, 
  CardBody, 
  Chip, 
  Modal, 
  ModalBody, 
  ModalContent, 
  ModalFooter, 
  ModalHeader, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell, 
  Tooltip 
} from "@heroui/react";
import DrawScramble from "@/components/shared/draw-scramble";
import { convertTimeToText } from "./results-table";
import type { Solve } from "../logic/timer-db";
import { timerDb } from "../logic/timer-db";
import { processNewSolve } from "../cube/solve-analysis";

interface SolveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  solveId: number | null;
  solveIndex: number;
}

function getDisplayTime(solve: Solve): string {
  if (solve.solveState === 'DNF') {
    return `DNF(${convertTimeToText(solve.solveTime)})`;
  } else if (solve.solveState === 'PLUS_TWO') {
    return `${convertTimeToText(solve.solveTime + 2000)}+`;
  } else {
    return convertTimeToText(solve.solveTime);
  }
}

function AlgTable({ solve }: { solve: Solve }) {
  if (!solve.analysis?.algs || solve.analysis.algs.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-default-500">No algorithm analysis available</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Table aria-label="Algorithm analysis" isCompact>
      <TableHeader>
        <TableColumn>Time</TableColumn>
        <TableColumn>Algorithm</TableColumn>
        <TableColumn>Type</TableColumn>
      </TableHeader>
      <TableBody>
        {solve.analysis.algs.map((alg: any, index: number) => (
          <TableRow key={index}>
            <TableCell className="text-sm">
              {alg.duration ? `${(alg.duration / 1000).toFixed(2)}s` : '-'}
            </TableCell>
            <TableCell className="font-mono text-sm flex gap-2">
            <Tooltip
                placement="left"
                content={
                  <DrawScramble
                    reverse
                    scramble={alg.alg}
                    className="w-36 h-36"
                  />
                }
                shouldCloseOnBlur={false}
              >
                <div className="w-full flex gap-2">
                  {alg.alg}
                  {alg.issue !== 'NONE' && (
                    <Chip color="danger" variant="faded" size="sm">
                      {alg.issue}
                    </Chip>
                  )}
                </div>
              </Tooltip>
            </TableCell>
            <TableCell className="text-sm">{alg.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SolveDialog({ isOpen, onOpenChange, solveId, solveIndex }: SolveDialogProps) {
  const solve = useLiveQuery(() => 
    solveId ? timerDb.solves.get(solveId) : undefined, 
    [solveId]
  );

  if (!solve) return null;

  const handleDelete = async () => {
    if (solve.id) {
      await timerDb.solves.delete(solve.id);
      onOpenChange(false);
    }
  };

  const handleReanalyze = async () => {
    if (solve.id) {
      const reanalyzed = await processNewSolve(solve);
      
      await timerDb.solves.update(solve.id, {
        solveState: reanalyzed.solveState,
        analysis: reanalyzed.analysis
      });
    }
  };

  const solutionStr = solve.moves.map((m: any) => m.move).join(' ');
  const twistyUrl = `https://alg.cubing.net/?${new URLSearchParams({
    setup: solve.scramble,
    alg: solve.analysis?.algs?.map((a: any) => `${a.alg} // ${a.type}`).join('\n') || solutionStr,
  }).toString()}`;

  const execTime = solve.execTime ? convertTimeToText(solve.execTime) : undefined;
  const memoTime = solve.execTime ? convertTimeToText(solve.solveTime - solve.execTime) : undefined;
  const totalTime = getDisplayTime(solve);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2>Solve #{solveIndex + 1}</h2>
          <p className="text-sm text-default-500">
            {new Date(solve.timestamp).toLocaleString()}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-4xl font-bold">{totalTime}</span>
              {solve.execTime && (
                <span className="text-lg text-default-500">
                {memoTime} + {execTime} = {totalTime}
              </span>
            )}
            </div>
            <div className="font-bold font-mono text-lg">
              {solve.scramble}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardBody>
                  <h5 className="text-sm font-medium mb-2">Scrambled</h5>
                  <DrawScramble
                    scramble={solve.scramble}
                    className="w-full h-32"
                  />
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <h5 className="text-sm font-medium mb-2">Solved</h5>
                  <DrawScramble
                    scramble={solve.scramble + ' ' + solutionStr}
                    className="w-full h-32"
                  />
                </CardBody>
              </Card>
            </div>
            {solve.solveState === 'DNF' && solve.analysis?.dnfReason && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger-800 font-medium">
                  DNF Reason: {solve.analysis.dnfReason}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-lg font-semibold mb-2">Solution</h4>
              <AlgTable solve={solve} />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="faded" onPress={handleDelete}>
            Delete
          </Button>
          <Button color="secondary" variant="faded" onPress={handleReanalyze}>
            Re-analyze
          </Button>
          <Button 
            variant="faded"
            color="primary" 
            as="a" 
            href={twistyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Recon
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
