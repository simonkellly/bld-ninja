import { Alg } from 'cubing/alg';
import { KPattern, KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import {
  ExtractedAlg,
  extractAlgs,
  makeAlgToComm,
} from '../cube/solutionParser';
import { SESSION_TYPES, type Solve } from '../db';
import { AnalysisResult } from './analysisResults';

type SessionType = (typeof SESSION_TYPES)[number];

function checkIsSolved(
  solvedPattern: KPattern,
  scrambledPattern: KPattern,
  type: SessionType
) {
  if (type === '3BLD') {
    return solvedPattern.experimentalIsSolved({
      ignoreCenterOrientation: true,
      ignorePuzzleOrientation: true,
    });
  }
  // for corners, check if all corners are solved, and that at least 10 edges match the original scrambled state
  if (type === 'Corners') {
    const corners = solvedPattern.patternData['CORNERS'];
    const edges = solvedPattern.patternData['EDGES'];
    const scrambledEdges = scrambledPattern.patternData['EDGES'];

    for (let i = 0; i < 8; i++) {
      if (corners.pieces[i] != i) return false;
      if (corners.orientation[i] != 0) return false;
    }

    let edgeMatchCount = 0;
    for (let i = 0; i < 12; i++) {
      if (edges.pieces[i] != scrambledEdges.pieces[i]) continue;
      if (edges.orientation[i] != scrambledEdges.orientation[i]) continue;
      edgeMatchCount++;
    }

    return edgeMatchCount >= 10;
  }

  // for edges check if all corners match the original scrambled state, and that at least 10 edges are solved
  if (type === 'Edges') {
    const corners = solvedPattern.patternData['CORNERS'];
    const edges = solvedPattern.patternData['EDGES'];
    const scrambledCorners = scrambledPattern.patternData['CORNERS'];

    let cornerMatchCount = 0;
    for (let i = 0; i < 8; i++) {
      if (corners.pieces[i] != scrambledCorners.pieces[i]) continue;
      if (corners.orientation[i] != scrambledCorners.orientation[i]) continue;
      cornerMatchCount++;
    }

    let edgeMatchCount = 0;
    for (let i = 0; i < 12; i++) {
      if (edges.pieces[i] != i) continue;
      if (edges.orientation[i] != 0) continue;
      edgeMatchCount++;
    }

    const solved =
      (cornerMatchCount == 8 &&
        (edgeMatchCount == 10 || edgeMatchCount == 12)) ||
      (cornerMatchCount == 6 && edgeMatchCount == 12);
    console.log('SOlveStatus', solved, cornerMatchCount, edgeMatchCount);
    return solved;
  }
}

function check1MoveOff(
  solvedState: KTransformation,
  scramble: KPattern,
  solution: string[],
  type: SessionType
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

  const scrambleCorners = scramble.patternData['CORNERS'];
  const scrambleEdges = scramble.patternData['EDGES'];

  let cornerCount = 0;
  for (let i = 0; i < 8; i++) {
    const piecePermutation = type === 'Edges' ? scrambleCorners.pieces[i] : i;
    const pieceOrientation =
      type === 'Edges' ? scrambleCorners.orientation[i] : 0;
    const positionMatches = corners.permutation[i] == piecePermutation;
    const orientationMatches = corners.orientationDelta[i] == pieceOrientation;

    if (positionMatches && orientationMatches) cornerCount++;
  }

  let edgeCount = 0;
  for (let i = 0; i < 12; i++) {
    const piecePermutation = type === 'Corners' ? scrambleEdges.pieces[i] : i;
    const pieceOrientation =
      type === 'Corners' ? scrambleEdges.orientation[i] : 0;
    const positionMatches = edges.permutation[i] == piecePermutation;
    const orientationMatches = edges.orientationDelta[i] == pieceOrientation;

    if (positionMatches && orientationMatches) edgeCount++;
  }

  const isOneMove =
    (cornerCount >= 4 && edgeCount >= 6) ||
    (cornerCount == 0 && (edgeCount == 4 || edgeCount == 2));

  console.log('Data', cornerCount, edgeCount, isOneMove);

  if (!isOneMove) {
    return {
      result: AnalysisResult.UNKNOWN,
    };
  }

  const moves = [
    "F B'", // S,
    "F' B", // S',
    'F2 B2', // S2
    "R' L", // M'
    "R L'", // M
    'R2 L2', // M2
    "U D'", // E
    "U' D", // E'
    'U2 D2', // E2
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
      const moveState = checkedState.applyAlg(move);
      const appliedState = moveState.applyAlg(remainingSolution);
      const isSolved = checkIsSolved(appliedState, scramble, type);

      if (isSolved) {
        console.log('Solved', solutionIdx, solution.length);
        if (solutionIdx == solution.length) {
          return {
            result: AnalysisResult.PLUS_TWO,
          };
        }
        if (solutionIdx === solution.length - 1) {
          const lastMove = solution[solutionIdx];
          const inverse =
            move[0] === lastMove[0] &&
            ((move.length === 1 && lastMove.endsWith("'")) ||
              (move.length === 2 && lastMove.length === 1));
          if (inverse) {
            console.log('Inverse');
            return {
              result: AnalysisResult.PLUS_TWO,
            };
          }
        }

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
  solvedState: KTransformation,
  type: SessionType
) {
  const corners = solvedState.transformationData['CORNERS'];
  const edges = solvedState.transformationData['EDGES'];
  const scrambleCorners = scrambleTransformation.transformationData['CORNERS'];
  const scrambleEdges = scrambleTransformation.transformationData['EDGES'];

  // Check corners are solved in place
  let cornerMatchCount = 0;
  for (let i = 0; i < 8; i++) {
    const piecePermutation =
      type === 'Edges' ? scrambleCorners.permutation[i] : i;
    if (corners.permutation[i] == piecePermutation) cornerMatchCount++;
  }
  if (cornerMatchCount < (type === '3BLD' ? 8 : 6)) return false;

  // Check edges are solved in place
  let edgeMatchCount = 0;
  for (let i = 0; i < 12; i++) {
    const piecePermutation =
      type === 'Corners' ? scrambleEdges.permutation[i] : i;
    if (edges.permutation[i] == piecePermutation) edgeMatchCount++;
  }
  if (edgeMatchCount < (type === '3BLD' ? 12 : 10)) return false;

  if (type !== 'Edges') {
    for (let i = 0; i < 8; i++) {
      const pieceStartingOrientation = scrambleCorners.orientationDelta[i];
      if (scrambleCorners.permutation[i] != i || pieceStartingOrientation == 0)
        continue;
      if (corners.orientationDelta[i] != pieceStartingOrientation) continue;
      if (corners.permutation[i] != i) continue;
      return AnalysisResult.MISSED_TWIST;
    }
  }

  if (type !== 'Corners') {
    for (let i = 0; i < 12; i++) {
      const pieceStartingOrientation = scrambleEdges.orientationDelta[i];
      if (scrambleEdges.permutation[i] != i || pieceStartingOrientation == 0)
        continue;
      if (edges.orientationDelta[i] != pieceStartingOrientation) continue;
      if (edges.permutation[i] != i) continue;
      return AnalysisResult.MISSED_FLIP;
    }
  }

  return false;
}

function checkInverseAlg(
  scramble: KPattern,
  algs: string[],
  type: SessionType
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
    const isSolved = checkIsSolved(innerState, scramble, type);
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
  solution: string,
  type: SessionType = '3BLD'
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

  if (checkIsSolved(solvedState.toKPattern(), scramblePattern, type))
    return {
      extractedAlgs: actualComms,
      result: AnalysisResult.SOLVED,
    };

  const isTwistFlip = checkTwistFlip(scrambleTransformation, solvedState, type);
  if (isTwistFlip)
    return {
      extractedAlgs: actualComms,
      result: isTwistFlip,
    };

  const isInverseAlgs = checkInverseAlg(
    scramblePattern,
    parsedSolution.map(s => s[0]),
    type
  );
  if (isInverseAlgs.result === AnalysisResult.INVERSE_ALG)
    return {
      extractedAlgs: actualComms,
      result: isInverseAlgs.result,
      algErrorIdx: isInverseAlgs.algErrorIdx,
      reason: `${actualComms[isInverseAlgs.algErrorIdx][0]}`,
    };

  const oneMoveOff = check1MoveOff(
    solvedState,
    scramblePattern,
    solutionMoves,
    type
  );
  if (oneMoveOff.result === AnalysisResult.PLUS_TWO) {
    return {
      extractedAlgs: actualComms,
      result: AnalysisResult.PLUS_TWO,
    };
  }
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

  return await analyseSolveString(solve.scramble, solutionStr, solve.type);
}
