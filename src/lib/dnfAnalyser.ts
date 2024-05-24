import { Alg } from 'cubing/alg';
import { KPattern, KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { extractAlgs } from './solutionParser';
import { Penalty } from './db';

export const SOLVED = 'Solved';
export const PLUS_TWO = '+2';
export const DNF = 'DNF';

function checkIsSolved(pattern: KPattern) {
  return pattern.experimentalIsSolved({
    ignoreCenterOrientation: true,
    ignorePuzzleOrientation: true,
  });
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
    if (isSolved) return alg.invert().toString() + ' was inverted';

    checkedState = checkedState.applyAlg(alg);
  }

  return false;
}

async function check1MoveDnf(
  solvedState: KTransformation,
  scramble: KPattern,
  solution: string[],
  algs: string[]
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
    console.log('Not one move from state');
    return false;
  }

  // check through the moves;
  const moves = ['U', 'D', 'R', 'L', 'F', 'B'];

  console.log('Solution:', solution.join(' '));

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
          const newMove = move + (attempt == 1 ? '2' : attempt == 2 ? "'" : '');
          const solutionWithMove = solution
            .slice(0, solutionIdx)
            .concat([newMove])
            .concat(solution.slice(solutionIdx));

          const newAnalysis = await extractAlgs(solutionWithMove);
          const brokenAlgIdx = newAnalysis.findIndex(a => a[2] > solutionIdx);
          if (solutionIdx == solution.length) return PLUS_TWO;
          console.log('Broken alg:', brokenAlgIdx, newAnalysis, solutionIdx);
          return algs[brokenAlgIdx] + ' -> ' + newAnalysis[brokenAlgIdx][0];
        }
      }
    }

    if (solutionIdx == solution.length) break;
    checkedState = checkedState.applyMove(solution[solutionIdx]);
  }

  return false;
}

function checkWrongOrderAlg(scramble: KPattern, algs: string[]) {
  const actualAlgs = algs.map(a => new Alg(a));

  let checkedState = scramble;
  for (let i = 0; i < actualAlgs.length; i++) {
    const alg = actualAlgs[i];

    let innerAlg: Alg | undefined;
    let innerState = checkedState;
    for (let j = i + 1; j < actualAlgs.length; j++) {
      innerAlg = actualAlgs[j];
      innerState = innerState.applyAlg(innerAlg);

      if (j == i + 1) innerState = innerState.applyAlg(alg);
    }
    const isSolved = checkIsSolved(innerState);
    if (isSolved) return alg.toString() + ' was done before ' + innerAlg;

    checkedState = checkedState.applyAlg(alg);
  }

  return false;
}

function checkPlusTwo(solvedState: KTransformation, solvedPattern: KPattern) {
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
    console.log('Not one move from state');
    return false;
  }

  const moves = ['U', 'D', 'R', 'L', 'F', 'B'];

  const checkedState = solvedPattern;
  for (const move of moves) {
    let moveState = checkedState;
    for (let attempt = 0; attempt < 3; attempt++) {
      moveState = moveState.applyMove(move);

      const isSolved = checkIsSolved(moveState);

      if (isSolved) {
        return PLUS_TWO;
      }
    }
  }
  return false;

}

export async function penaltyChecker(scramble: string, solution: string): Promise<Penalty> {
  const puzzle = await cube3x3x3.kpuzzle();

  const scrambleTransformation = puzzle.algToTransformation(scramble);
  const solutionTransformation = puzzle.algToTransformation(solution);

  const totalTransformation = scrambleTransformation.applyTransformation(
    solutionTransformation
  );
  const totalPattern = totalTransformation.toKPattern();
  const isSolved = checkIsSolved(totalPattern);

  if (isSolved) return Penalty.SOLVED;

  const plusTwo = checkPlusTwo(totalTransformation, totalPattern);
  if (plusTwo) return Penalty.PLUS_TWO;

  return Penalty.DNF;
}

// TODO: If parsing algs failed, reverse scramble and go from other side
// TODO: Check if a wrong alg was done instead of a correct one
// TODO: Check for missed flips and twists
export async function dnfAnalyser(
  scramble: string,
  solution: string,
  algs: Awaited<ReturnType<typeof extractAlgs>>
) {
  const puzzle = await cube3x3x3.kpuzzle();

  const scrambleTransformation = puzzle.algToTransformation(scramble);
  const solutionTransformation = puzzle.algToTransformation(solution);

  const scramblePattern = scrambleTransformation.toKPattern();

  const totalTransformation = scrambleTransformation.applyTransformation(
    solutionTransformation
  );
  const isSolved = checkIsSolved(totalTransformation.toKPattern());

  if (isSolved) return SOLVED;


  const isInverseAlg = checkInverseAlg(
    scramblePattern,
    algs.map(a => a[0])
  );

  if (isInverseAlg) return isInverseAlg;

  const isOneMoveDnf = await check1MoveDnf(
    totalTransformation,
    scramblePattern,
    solution.split(' '),
    algs.map(a => a[0])
  );
  if (isOneMoveDnf) return isOneMoveDnf;

  const isWrongOrderAlg = checkWrongOrderAlg(
    scramblePattern,
    algs.map(a => a[0])
  );
  if (isWrongOrderAlg) return isWrongOrderAlg;

  return 'Unknown';
}
