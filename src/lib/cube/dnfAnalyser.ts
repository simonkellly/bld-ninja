import { Alg } from 'cubing/alg';
import { KPattern, KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { type Solve } from '../db';
import { ExtractedAlg, extractAlgs, makeAlgToComm } from './solutionParser';

function checkIsSolved(pattern: KPattern) {
  return pattern.experimentalIsSolved({
    ignoreCenterOrientation: true,
    ignorePuzzleOrientation: true,
  });
}

export enum AnalysisResult {
  SOLVED = 'Solved',
  PLUS_TWO = '+2',
  UNKNOWN = 'Unknown',
  NO_MOVES = 'No recorded moves',
  ONE_MOVE = 'One move mistake',
  MISSED_TWIST = 'Missed twist',
  MISSED_FLIP = 'Missed flip',
  INVERSE_ALG = 'Inverse alg',
  // TODO
  // WRONG_ORDER = 'Wrong order',
  // TWIST_WRONG = 'Wrong twist direction
}

function check1MoveOff(
  solvedState: KTransformation,
  scramble: KPattern,
  solution: string[]
):
  | {
      result: AnalysisResult.UNKNOWN;
    }
  | {
      result: AnalysisResult.ONE_MOVE;
      idx: number;
      move: string;
    }
  | {
      result: AnalysisResult.PLUS_TWO;
    } {
  const corners = solvedState.transformationData['CORNERS'];
  const edges = solvedState.transformationData['EDGES'];

  let cornerCount = 0;
  for (let i = 0; i < 8; i++) {
    const positionMatches = corners.permutation[i] == i;
    const orientationMatches = corners.orientationDelta[i] == 0;

    if (positionMatches && orientationMatches) cornerCount++;
  }

  let edgeCount = 0;
  for (let i = 0; i < 12; i++) {
    const positionMatches = edges.permutation[i] == i;
    const orientationMatches = edges.orientationDelta[i] == 0;

    if (positionMatches && orientationMatches) edgeCount++;
  }

  const isOneMove =
    (cornerCount == 4 && edgeCount == 8) ||
    (cornerCount == 0 && edgeCount == 4);
  if (!isOneMove) {
    return {
      result: AnalysisResult.UNKNOWN,
    };
  }

  const moves = [
    'S',
    "S'",
    'S2',
    'M',
    "M'",
    'M2',
    'E',
    "E'",
    'E2',
    'U2',
    'D2',
    'R2',
    'L2',
    'F2',
    'B2',
    'U',
    'D',
    'R',
    'L',
    'F',
    'B',
    "U'",
    "D'",
    "R'",
    "L'",
    "F'",
    "B'",
  ];

  let checkedState = scramble;
  for (let solutionIdx = 0; solutionIdx <= solution.length; solutionIdx++) {
    const remainingSolution = solution.slice(solutionIdx).join(' ');

    for (const move of moves) {
      const moveState = checkedState.applyMove(move);
      const appliedState = moveState.applyAlg(remainingSolution);
      const isSolved = checkIsSolved(appliedState);

      if (isSolved) {
        if (solutionIdx == solution.length)
          return {
            result: AnalysisResult.PLUS_TWO,
          };
        return {
          result: AnalysisResult.ONE_MOVE,
          idx: solutionIdx,
          move: solution[solutionIdx],
        };
      }
    }

    if (solutionIdx == solution.length) break;
    checkedState = checkedState.applyMove(solution[solutionIdx]);
  }

  return {
    result: AnalysisResult.UNKNOWN,
  };
}

// TODO Make sure there is no more than 1 extra flip/twist in finished state
function checkTwistFlip(
  scrambleTransformation: KTransformation,
  solvedState: KTransformation
) {
  const corners = solvedState.transformationData['CORNERS'];
  const edges = solvedState.transformationData['EDGES'];
  const scrambleCorners = scrambleTransformation.transformationData['CORNERS'];
  const scrambleEdges = scrambleTransformation.transformationData['EDGES'];

  for (let i = 0; i < 8; i++) {
    if (corners.permutation[i] != i) return false;
  }

  for (let i = 0; i < 12; i++) {
    if (edges.permutation[i] != i) return false;
  }

  for (let i = 0; i < 8; i++) {
    const pieceStartingOrientation = scrambleCorners.orientationDelta[i];
    if (scrambleCorners.permutation[i] != i || pieceStartingOrientation == 0)
      continue;
    if (corners.orientationDelta[i] != pieceStartingOrientation) continue;
    if (corners.permutation[i] != i) continue;
    return AnalysisResult.MISSED_TWIST;
  }

  for (let i = 0; i < 12; i++) {
    const pieceStartingOrientation = scrambleEdges.orientationDelta[i];
    if (scrambleEdges.permutation[i] != i || pieceStartingOrientation == 0)
      continue;
    if (edges.orientationDelta[i] != pieceStartingOrientation) continue;
    if (edges.permutation[i] != i) continue;
    return AnalysisResult.MISSED_FLIP;
  }

  return false;
}

function checkInverseAlg(
  scramble: KPattern,
  algs: string[]
):
  | {
      result: AnalysisResult.UNKNOWN;
    }
  | {
      result: AnalysisResult.INVERSE_ALG;
      algErrorIdx: number;
    } {
  const actualAlgs = algs.map(a => new Alg(a));

  let checkedState = scramble;
  for (let i = 0; i < actualAlgs.length; i++) {
    const alg = actualAlgs[i];

    let innerState = checkedState.applyAlg(alg.invert());
    for (let j = i + 1; j < actualAlgs.length; j++) {
      const innerAlg = actualAlgs[j];
      innerState = innerState.applyAlg(innerAlg);
    }
    const isSolved = checkIsSolved(innerState);
    if (isSolved)
      return {
        result: AnalysisResult.INVERSE_ALG,
        algErrorIdx: i,
      };

    checkedState = checkedState.applyAlg(alg);
  }

  return {
    result: AnalysisResult.UNKNOWN,
  };
}

export type SolveAnalysis = {
  extractedAlgs: ExtractedAlg[];
  algErrorIdx?: number;
  result: AnalysisResult;
  reason?: string;
};

export async function analyseSolveString(
  scramble: string,
  solution: string
): Promise<SolveAnalysis> {
  const puzzle = await cube3x3x3.kpuzzle();

  const solutionMoves = solution.split(' ');
  const solutionStr = solution;

  const scrambleTransformation = puzzle.algToTransformation(scramble);
  const solutionTransformation = puzzle.algToTransformation(solutionStr);

  const scramblePattern = puzzle
    .defaultPattern()
    .applyTransformation(scrambleTransformation);
  const solvedState = scrambleTransformation.applyTransformation(
    solutionTransformation
  );

  const parsedSolution = await extractAlgs(solutionMoves);
  const actualComms = parsedSolution.map(s => makeAlgToComm(s, puzzle));

  if (solutionMoves.length == 0)
    return {
      extractedAlgs: actualComms,
      result: AnalysisResult.NO_MOVES,
    };

  if (checkIsSolved(solvedState.toKPattern()))
    return {
      extractedAlgs: actualComms,
      result: AnalysisResult.SOLVED,
    };

  const isTwistFlip = checkTwistFlip(scrambleTransformation, solvedState);
  if (isTwistFlip)
    return {
      extractedAlgs: actualComms,
      result: isTwistFlip,
    };

  const isInverseAlgs = checkInverseAlg(
    scramblePattern,
    parsedSolution.map(s => s[0])
  );
  if (isInverseAlgs.result === AnalysisResult.INVERSE_ALG)
    return {
      extractedAlgs: actualComms,
      result: isInverseAlgs.result,
      algErrorIdx: isInverseAlgs.algErrorIdx,
      reason: `${actualComms[isInverseAlgs.algErrorIdx][0]}`,
    };

  const oneMoveOff = check1MoveOff(solvedState, scramblePattern, solutionMoves);
  if (oneMoveOff.result === AnalysisResult.ONE_MOVE) {
    const algs = actualComms.map(a => a[2]);
    let algIdx = 0;
    while (algs[algIdx] < oneMoveOff.idx) {
      algIdx++;
    }

    // insert move at idx
    // TODO why is this needed? Make sure we can tell between the fixed comms and what was actually done
    const inverse = oneMoveOff.move.endsWith('2')
      ? oneMoveOff.move
      : oneMoveOff.move.endsWith("'")
        ? oneMoveOff.move[0] + '2'
        : oneMoveOff.move + "'";

    const fixedSolution = [
      ...solutionMoves.slice(0, oneMoveOff.idx),
      inverse,
      ...solutionMoves.slice(oneMoveOff.idx),
    ];

    const fixedAlgs = await extractAlgs(fixedSolution);

    const fixedComms = fixedAlgs.map(s => makeAlgToComm(s, puzzle));

    return {
      extractedAlgs: fixedComms,
      algErrorIdx: algIdx,
      result: AnalysisResult.ONE_MOVE,
      reason: `Messed up at comm: ${fixedComms[algIdx][0]} (${oneMoveOff.idx} -> ${oneMoveOff.move})`,
    };
  }

  return {
    extractedAlgs: actualComms,
    result: AnalysisResult.UNKNOWN,
  };
}

export async function analyseSolve(solve: Solve): Promise<SolveAnalysis> {
  const solutionMoves = solve.solution.map(s => s.move);
  const solutionStr = solutionMoves.join(' ');

  return await analyseSolveString(solve.scramble, solutionStr);
}
