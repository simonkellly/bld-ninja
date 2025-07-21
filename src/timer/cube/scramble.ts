import { Alg } from 'cubing/alg';
import { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { removeRotations } from '@/timer/cube/solution-parser';

// Possible Rotations
// none
// Thinking of axes
// [UD] -> null, y, y2, y'
// [DU] -> z2, z2 y, z2 y2, z2 y'
// [FB] -> x, x y, x y2, x y'
// [BF] -> x', x' y, x' y2, x' y'
// [RL] -> z, z y, z y2, z y'
// [LR] -> z', z' y, z' y2, z' y'
export const possibleRotations = [
  '',
  'y',
  'y2',
  "y'",
  'z2',
  'z2 y',
  'z2 y2',
  "z2 y'",
  'x',
  'x y',
  'x y2',
  "x y'",
  "x'",
  "x' y",
  "x' y2",
  "x' y'",
  'z',
  'z y',
  'z y2',
  "z y'",
  "z'",
  "z' y",
  "z' y2",
  "z' y'",
];

const moveForRotation = {
  x: 'L',
  y: 'D',
  z: 'B',
};

export function solveRotation(rotation: string) {
  if (rotation.length === 0) return [];
  const moves = [];
  const rotations = rotation.split(' ');
  for (const rotation of rotations) {
    const isPrime = rotation.endsWith("'");
    const isDouble = rotation.endsWith('2');
    const move = moveForRotation[rotation[0] as keyof typeof moveForRotation];
    if (isPrime) {
      moves.push(move);
    } else if (isDouble) {
      moves.push(move + '2');
    } else {
      moves.push(move + "'");
    }
    moves.push(rotation);
  }
  return removeRotations(moves).reverse();
}

export function moveRotation(rotation: string) {
  return rotation
    .replaceAll('x', 'Rw')
    .replaceAll('y', 'Uw')
    .replaceAll('z', 'Fw');
}

let puzzle: KPuzzle;

export function getRandomRotation() {
  return possibleRotations[
    Math.floor(Math.random() * possibleRotations.length)
  ];
}

export async function adjustScramble(
  scramble: string,
  randomRotation: string,
  pattern?: KPattern
) {
  puzzle ??= await cube3x3x3.kpuzzle();
  const solvedRotation = solveRotation(randomRotation).join(' ');
  const preMoveState = puzzle
    .defaultPattern()
    .applyAlg(new Alg(solvedRotation).invert());
  const altScramPattern = preMoveState.applyAlg(new Alg(scramble).invert());

  const solved = await experimentalSolve3x3x3IgnoringCenters(
    pattern ?? puzzle.defaultPattern()
  );
  const solvedPattern = altScramPattern.applyAlg(solved.invert());

  const sol = await experimentalSolve3x3x3IgnoringCenters(solvedPattern);
  return {
    randomRotation,
    rotationMove: moveRotation(randomRotation),
    rotationlessScramble: sol.toString(),
  };
}
