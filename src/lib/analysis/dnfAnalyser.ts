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
  MISSED_TWIST_FLIP = 'Missed twist or flip',
  INVERSE_ALG = 'Inverse alg',
  // TODO
  // WRONG_ORDER = 'Wrong order',
  // TWIST_WRONG = 'Wrong twist direction
}

function check1MoveOff(
  solvedState: KTransformation,
  scramble: KPattern,
  solution: string[]
) {
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

  const isOneMove = cornerCount == 4 && edgeCount == 8;
  if (!isOneMove) {
    return false;
  }

  const moves = ['U', 'D', 'R', 'L', 'F', 'B'];

  let checkedState = scramble;
  for (let solutionIdx = 0; solutionIdx <= solution.length; solutionIdx++) {
    const remainingSolution = solution.slice(solutionIdx).join(' ');

    for (const move of moves) {
      let moveState = checkedState;
      for (let attempt = 0; attempt < 3; attempt++) {
        moveState = moveState.applyMove(move);

        const appliedState = moveState.applyAlg(remainingSolution);
        const isSolved = checkIsSolved(appliedState);

        if (isSolved) {
          if (solutionIdx == solution.length) return AnalysisResult.PLUS_TWO;
          return AnalysisResult.ONE_MOVE;
        }
      }
    }

    if (solutionIdx == solution.length) break;
    checkedState = checkedState.applyMove(solution[solutionIdx]);
  }

  return false;
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
    return AnalysisResult.MISSED_TWIST_FLIP;
  }

  for (let i = 0; i < 12; i++) {
    const pieceStartingOrientation = scrambleEdges.orientationDelta[i];
    if (scrambleEdges.permutation[i] != i || pieceStartingOrientation == 0)
      continue;
    if (edges.orientationDelta[i] != pieceStartingOrientation) continue;
    if (edges.permutation[i] != i) continue;
    return AnalysisResult.MISSED_TWIST_FLIP;
  }

  return false;
}

function checkInverseAlg(scramble: KPattern, algs: string[]) {
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
    if (isSolved) return AnalysisResult.INVERSE_ALG;

    checkedState = checkedState.applyAlg(alg);
  }

  return false;
}

export async function analyseSolveString(
  scramble: string,
  solution: string,
): Promise<[AnalysisResult, ExtractedAlg[]]> {
  const puzzle = await cube3x3x3.kpuzzle();

  const solutionMoves = solution.split(' ');
  const solutionStr = solution

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

  if (solutionMoves.length == 0) return [AnalysisResult.NO_MOVES, actualComms];

  if (checkIsSolved(solvedState.toKPattern()))
    return [AnalysisResult.SOLVED, actualComms];

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

  const isOneMove = cornerCount == 4 && edgeCount == 8;
  if (isOneMove) {
    const oneMoveOff = check1MoveOff(
      solvedState,
      scramblePattern,
      solutionMoves
    );
    if (oneMoveOff) return [oneMoveOff, actualComms];
  }

  const isTwistFlip = checkTwistFlip(scrambleTransformation, solvedState);
  if (isTwistFlip) return [isTwistFlip, actualComms];

  const isInverseAlgs = checkInverseAlg(
    scramblePattern,
    parsedSolution.map(s => s[0])
  );
  if (isInverseAlgs) return [isInverseAlgs, actualComms];

  return [AnalysisResult.UNKNOWN, actualComms];
}


export async function analyseSolve(
  solve: Solve
): Promise<[AnalysisResult, ExtractedAlg[]]> {
  const solutionMoves = solve.solution.map(s => s.move);
  const solutionStr = solutionMoves.join(' ');

  return await analyseSolveString(solve.scramble, solutionStr);
}
