import { Alg } from 'cubing/alg';
import type { KPuzzle, KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import commutator from '@/lib/vendor/commutator';

const ALG_TYPES = ['Edge', 'Corner', 'Twist', 'Flip', '2E2C', 'Unknown'] as const;

export type AlgType = (typeof ALG_TYPES)[number];

export type ExtractedAlg = [alg: string, type: AlgType, moveIdx: number];

const POSSIBLE_MOVES = ['U', 'F', 'R', 'D', 'B', 'L', 'E', 'S', 'M'];
const POSSIBLE_AMOUNTS = ['2', '', "'"];

// Based on https://mzrg.com/rubik/rotations.shtml
export function removeRotations(moves: string[], replaceRotationsWith: string = '') {
  for (let moveIdx = moves.length - 1; moveIdx >= 0; moveIdx--) {
    const move = moves[moveIdx];
    const moveFace = move[0];

    if (moveFace == 'x' || moveFace == 'y' || moveFace == 'z') {
      const rotationAmount = move.length == 1 ? 1 : move[1] == "'" ? 3 : 2;
      for (let fixIdx = moveIdx + 1; fixIdx < moves.length; fixIdx++) {
        for (
          let rotationNumber = 0;
          rotationNumber < rotationAmount;
          rotationNumber++
        ) {
          moves[fixIdx] = applyRotation(moveFace, moves[fixIdx]);
        }
      }
      moves[moveIdx] = replaceRotationsWith;
    }
  }

  return moves.filter(move => move.length > 0);
}

function applyRotation(rotation: string, move: string) {
  let applied = move;
  if (rotation == 'x') {
    applied = applied.replace(/F/g, 'T');
    applied = applied.replace(/U/g, 'F');
    applied = applied.replace(/B/g, 'U');
    applied = applied.replace(/D/g, 'B');
    applied = applied.replace(/T/g, 'D');

    applied = applied.replace(/E/g, 'T');
    applied = applied.replace(/S/g, 'E');
    applied = applied.replace(/T/g, "S'");
  } else if (rotation == 'y') {
    applied = applied.replace(/F/g, 'T');
    applied = applied.replace(/L/g, 'F');
    applied = applied.replace(/B/g, 'L');
    applied = applied.replace(/R/g, 'B');
    applied = applied.replace(/T/g, 'R');

    applied = applied.replace(/M/g, 'T');
    applied = applied.replace(/S/g, "M'");
    applied = applied.replace(/T/g, 'S');
  } else if (rotation == 'z') {
    applied = applied.replace(/U/g, 'T');
    applied = applied.replace(/R/g, 'U');
    applied = applied.replace(/D/g, 'R');
    applied = applied.replace(/L/g, 'D');
    applied = applied.replace(/T/g, 'L');

    applied = applied.replace(/M/g, 'T');
    applied = applied.replace(/E/g, "M'");
    applied = applied.replace(/T/g, 'E');
  }

  let result = applied;
  while (true) {
    const newRes = result
      .replaceAll("''", '')
      .replaceAll("2'", '')
      .replaceAll("'2", '');
    if (newRes == result) break;
    result = newRes;
  }

  return result;
}

function fixSlicesForComm(alg: Alg, puzzle: KPuzzle) {
  const transformation = puzzle.algToTransformation(alg);
  const centerPermutations =
    transformation.transformationData['CENTERS'].permutation;

  let neededMove: [string, string] | undefined;
  if (centerPermutations[0] == 0 && centerPermutations[5] == 5) {
    if (centerPermutations[1] == 4) neededMove = ["U'", 'D'];
    if (centerPermutations[1] == 2) neededMove = ['U', "D'"];
    if (centerPermutations[1] == 3) neededMove = ['U2', 'D2'];
  }

  if (centerPermutations[2] == 2 && centerPermutations[4] == 4) {
    if (centerPermutations[0] == 1) neededMove = ['F', "B'"];
    if (centerPermutations[0] == 3) neededMove = ['F', 'B'];
    if (centerPermutations[0] == 5) neededMove = ['F2', 'B2'];
  }

  if (centerPermutations[1] == 1 && centerPermutations[3] == 3) {
    if (centerPermutations[0] == 4) neededMove = ['L', "R'"];
    if (centerPermutations[0] == 2) neededMove = ["L'", 'R'];
    if (centerPermutations[0] == 5) neededMove = ['L2', 'R2'];
  }

  if (!neededMove) return alg.toString().split(' ');

  const moves = alg.toString().split(' ');

  let newMoves: string[] | undefined;
  for (let i = moves.length - 1; i >= 0; i--) {
    const move = moves[i];
    const isFirst = move == neededMove[0];
    const isSecond = move == neededMove[1];
    if (isFirst || isSecond) {
      const altMove = isFirst ? neededMove[1] : neededMove[0];
      const oppositeMove =
        altMove.length == 1
          ? altMove + "'"
          : altMove[1] == '2'
            ? altMove
            : altMove[0];
      newMoves = [
        ...moves.slice(0, i),
        oppositeMove,
        altMove,
        ...moves.slice(i),
      ];
      break;
    }
  }

  if (!newMoves) return moves;

  return removeRotations(convertToSliceMoves(newMoves));
}

export function convertToSliceMoves(moves: string[]) {
  // M = R L' x'
  // S = F' B z
  // E = U D' y'

  const opposite = {
    U: 'D',
    D: 'U',
    F: 'B',
    B: 'F',
    R: 'L',
    L: 'R',
  } as Record<string, string>;

  const newMoves: string[] = [];

  let lastMove = null as string | null;
  moves.forEach(move => {
    if (!lastMove) {
      lastMove = move;
      newMoves.push(move);
      return;
    }

    const moveFace = move[0];
    const isOppositeFaces = moveFace == opposite[lastMove[0]];
    const isBothTwo =
      move.length == 2 &&
      move[1] === '2' &&
      lastMove.length == 2 &&
      lastMove[1] === '2';
    const isAltDirections = move.length + lastMove.length == 3;

    if (!isOppositeFaces || !(isBothTwo || isAltDirections)) {
      lastMove = move;
      newMoves.push(move);
      return;
    }

    const prevMove = newMoves.pop()!;
    const lower = prevMove.charCodeAt(0) > move.charCodeAt(0) ? move : prevMove;

    if (lower == 'L') {
      newMoves.push("M'");
      newMoves.push("x'");
    }

    if (lower == "L'") {
      newMoves.push('M');
      newMoves.push('x');
    }

    if (lower == 'L2') {
      newMoves.push('M2');
      newMoves.push('x2');
    }

    if (lower == 'B') {
      newMoves.push('S');
      newMoves.push("z'");
    }

    if (lower == "B'") {
      newMoves.push("S'");
      newMoves.push('z');
    }
    if (lower == 'B2') {
      newMoves.push('S2');
      newMoves.push('z2');
    }

    if (lower == 'D') {
      newMoves.push("E'");
      newMoves.push("y'");
    }

    if (lower == "D'") {
      newMoves.push('E');
      newMoves.push('y');
    }

    if (lower == 'D2') {
      newMoves.push('E2');
      newMoves.push('y2');
    }

    lastMove = null;
  });

  return newMoves;
}

function checkTransformationIsAlg(
  transformation: KTransformation
): [
  isEdge3Cycle: boolean,
  isCorner3Cycle: boolean,
  is2E2C: boolean,
  isTwist: boolean,
  isFlip: boolean,
] {
  const corners = transformation.transformationData['CORNERS'];
  const edges = transformation.transformationData['EDGES'];

  let cornerCount = 0;
  let cornerTwist = 0;
  for (let i = 0; i < 8; i++) {
    const positionMatches = corners.permutation[i] == i;
    const orientationMatches = corners.orientationDelta[i] == 0;

    if (positionMatches && !orientationMatches) cornerTwist++;
    if (positionMatches && orientationMatches) cornerCount++;
  }

  let edgeCount = 0;
  let edgeFlip = 0;
  for (let i = 0; i < 12; i++) {
    const positionMatches = edges.permutation[i] == i;
    const orientationMatches = edges.orientationDelta[i] == 0;

    if (positionMatches && !orientationMatches) edgeFlip++;
    if (positionMatches && orientationMatches) edgeCount++;
  }

  return [
    cornerCount == 8 && edgeCount == 9 && cornerTwist == 0 && edgeFlip == 0,
    cornerCount == 5 && edgeCount == 12 && cornerTwist == 0 && edgeFlip == 0,
    cornerCount == 6 && edgeCount == 10 && cornerTwist == 0 && edgeFlip == 0,
    (edgeFlip == 0 &&
      cornerTwist == 2 &&
      edgeCount == 12 &&
      cornerCount == 6),
    (edgeFlip == 2 &&
      cornerTwist == 0 &&
      edgeCount == 10 &&
      cornerCount == 8),
  ];
}

function uncancelTransformation(
  transformation: KTransformation,
  maxLength: number
): null | {
  alg: string;
  isEdge: boolean;
  isCorner: boolean;
  is2E2C: boolean;
  isTwist: boolean;
  isFlip: boolean;
  length: number;
} {
  const initialCheck = checkTransformationIsAlg(transformation);
  if (
    initialCheck[0] ||
    initialCheck[1] ||
    initialCheck[2] ||
    initialCheck[3] ||
    initialCheck[4]
  ) {
    return {
      alg: '',
      isEdge: initialCheck[0],
      isCorner: initialCheck[1],
      is2E2C: initialCheck[2],
      isTwist: initialCheck[3],
      isFlip: initialCheck[4],
      length: 0,
    };
  }

  const queue = [
    { transformation: transformation, alg: '', depth: maxLength - 1 },
  ];
  while (queue.length > 0) {
    const { transformation, alg, depth } = queue.shift()!;
    for (const move of POSSIBLE_MOVES) {
      // TODO: This can probably be unrolled in final version
      for (const amount of POSSIBLE_AMOUNTS) {
        const newAlg = `${alg} ${move}${amount}`;
        const newTransformation = transformation.applyAlg(`${move}${amount}`);
        const check = checkTransformationIsAlg(newTransformation);
        if (check[0] || check[1] || check[2] || check[3]) {
          return {
            alg: newAlg.trimStart(),
            isEdge: check[0],
            isCorner: check[1],
            is2E2C: check[2],
            isTwist: check[3],
            isFlip: check[4],
            length: depth,
          };
        }
        if (depth > 1) {
          queue.push({
            transformation: newTransformation,
            alg: newAlg,
            depth: depth - 1,
          });
        }
      }
    }
  }
  return null;
}

export function simplify(alg: string) {
  return Alg.fromString(alg).experimentalSimplify({
    cancel: {
      puzzleSpecificModWrap: 'canonical-centered',
      directional: 'any-direction',
    },
    puzzleLoader: cube3x3x3,
    depth: 1,
  });
}

export async function extractAlgs(
  moveSet: string[],
  allowCheckInverse = true
): Promise<ExtractedAlg[]> {
  const comms: [
    alg: string,
    moveIdx: number,
    isEdge: boolean,
    isCorner: boolean,
    is2E2C: boolean,
    isTwist: boolean,
    isFlip: boolean,
  ][] = [];
  const solutionLength = moveSet.length;

  moveSet = moveSet.slice();

  let moves = '';
  let count = 0;

  const puzzle = await cube3x3x3.kpuzzle();

  let moveIdx = -1;
  while (moveSet.length > 0) {
    moveIdx++;
    const move = moveSet.shift()!;
    moves += ' ' + move;
    if (count++ < 4 || moveSet.length === 0) continue;

    const uncancelled = uncancelTransformation(
      puzzle.algToTransformation(moves),
      2
    );
    if (uncancelled == null) continue;
    if (uncancelled.length > 0 && moveSet[0][0] === uncancelled.alg[0])
      continue;

    comms.push([
      (moves + ' ' + uncancelled.alg).trim(),
      moveIdx,
      uncancelled.isEdge,
      uncancelled.isCorner,
      uncancelled.is2E2C,
      uncancelled.isTwist,
      uncancelled.isFlip,
    ]);

    count = uncancelled.length;
    // TODO: There might be a flaw in the logic....
    // Like a cancel of R2 + R = R' vs R' + R = nothing but this is not implemented
    moves = Alg.fromString(uncancelled.alg).invert().toString();
  }

  let inverseAlgs: ExtractedAlg[] = [];
  if (moves.length > 0) {
    const [isEdge, isCorner, is2E2C, isTwist, isFlip] = checkTransformationIsAlg(
      puzzle.algToTransformation(moves)
    );
    const isAnyAlg = isEdge || isCorner || isTwist || isFlip || is2E2C;
    if (!isAnyAlg && allowCheckInverse) {
      inverseAlgs = await extractAlgs(
        new Alg(moves).invert().toString().split(' '),
        false
      );
    } else comms.push([moves, moveIdx, isEdge, isCorner, is2E2C, isTwist, isFlip]);
  }

  const mappedComms = comms.map(val => {
    const comm = val[0];
    const moveIdx = val[1];
    const isEdgeComm = val[2];
    const isCornerComm = val[3];
    const is2E2C = val[4];
    const isTwist = val[5];
    const isFlip = val[6];

    const isAnyAlg = isEdgeComm || isCornerComm || isTwist || is2E2C;
    const comment = !isAnyAlg
      ? 'Unknown'
      : isEdgeComm
        ? 'Edge'
        : isCornerComm
          ? 'Corner'
          : isTwist
            ? 'Twist'
            : isFlip
              ? 'Flip'
            : '2E2C';

    return [simplify(comm).toString(), comment, moveIdx] satisfies [
      string,
      AlgType,
      number,
    ];
  });

  let startingIdx = solutionLength - 1 - (inverseAlgs.at(-1)?.[2] ?? 0);

  let last = 0;
  const lengths = inverseAlgs
    .map(val => {
      const ret = val[2] - last;
      last = val[2];
      return ret;
    })
    .reverse();

  inverseAlgs = inverseAlgs.reverse().map((val, idx) => {
    const actualAlg = new Alg(val[0]).invert().toString();
    const moveIdx = startingIdx + lengths[idx];
    startingIdx = moveIdx;
    return [actualAlg, val[1], moveIdx] satisfies [string, AlgType, number];
  });

  const extractedAlgs = [...mappedComms, ...inverseAlgs];
  
  // Optimize consecutive algorithms by combining them when they can form single commutators
  return await optimizeConsecutiveAlgs(extractedAlgs);
}

export function makeAlgToComm(
  alg: ExtractedAlg,
  puzzle: KPuzzle
): ExtractedAlg {
  const comm = alg[0];
  const algType = alg[1];
  const moveIdx = alg[2];
  const simplifiedComm = simplify(comm);
  let foundComm: string | undefined;

  if (algType == '2E2C' || algType == 'Unknown')
    return [simplifiedComm.toString(), algType, moveIdx];

  if (algType == 'Edge' || algType == 'Flip') {
    const slicesWithRotations = convertToSliceMoves(
      simplifiedComm.toString().split(' ')
    );
    const slices = removeRotations(slicesWithRotations);
    const fixedAlg = fixSlicesForComm(new Alg(slices.join(' ')), puzzle);
    foundComm = commutator.search({
      algorithm: simplify(fixedAlg.join(' ')).toString(),
      outerBracket: true,
      maxDepth: 1,
    })[0]!;

    foundComm = foundComm.replaceAll('u', 'Uw');
    foundComm = foundComm.replaceAll('f', 'Fw');
    foundComm = foundComm.replaceAll('r', 'Rw');
    foundComm = foundComm.replaceAll('b', 'Bw');
    foundComm = foundComm.replaceAll('l', 'Lw');
    foundComm = foundComm.replaceAll('d', 'Dw');

    if (algType == 'Flip') {
      return [
        (!foundComm.includes(',') ? fixedAlg.join(' ') : foundComm)
          .replaceAll(',', ', ')
          .replaceAll(':', ': ')
          .replaceAll('][', '] ['),
        algType,
        moveIdx,
      ];
    }
  }

  if (!foundComm || !foundComm.includes(',')) {
    foundComm = commutator.search({
      algorithm: simplify(comm).toString(),
      outerBracket: true,
      maxDepth: 1,
    })[0];
  }

  if (!foundComm || !foundComm.includes(',')) {
    foundComm = commutator.search({
      algorithm: comm,
      outerBracket: true,
      maxDepth: 1,
    })[0];
  }

  if (!foundComm.includes(',')) {
    return [simplify(comm.trim()).toString(), algType, moveIdx];
  }

  return [
    foundComm
      .replaceAll(',', ', ')
      .replaceAll(':', ': ')
      .replaceAll('][', '] ['),
    algType,
    moveIdx,
  ];
}

/**
 * Attempts to combine two consecutive algorithms into one if the result can be
 * expressed as a single commutator, or as separate commutators if they combine to form a twist/flip
 */
function tryCombineAlgs(
  alg1: ExtractedAlg,
  alg2: ExtractedAlg,
  puzzle: KPuzzle
): ExtractedAlg | null {
  // Don't combine if either algorithm is Unknown type
  if (alg1[1] === 'Unknown' || alg2[1] === 'Unknown') {
    return null;
  }

  // Combine the algorithms to check the result type
  const combinedAlgString = `${alg1[0]} ${alg2[0]}`;
  const simplifiedCombined = simplify(combinedAlgString);
  
  // Check what type the combined algorithm is
  const transformation = puzzle.algToTransformation(simplifiedCombined);
  const [isEdge, isCorner, is2E2C, isTwist, isFlip] = checkTransformationIsAlg(transformation);
  
  if (!isEdge && !isCorner && !is2E2C && !isTwist && !isFlip) {
    return null; // Combined alg is not a valid algorithm type
  }

  // SPECIAL CASE: If the combination results in a twist/flip, convert each algorithm 
  // to a commutator separately and concatenate them (higher priority than standard combining)
  if (isTwist || isFlip) {
    const comm1 = makeAlgToComm(alg1, puzzle);
    const comm2 = makeAlgToComm(alg2, puzzle);
    
    // Only proceed if both commutators were successfully generated (contain a comma)
    if (comm1[0].includes(',') && comm2[0].includes(',')) {
      const combinedCommutators = `${comm1[0]} ${comm2[0]}`;
      return [combinedCommutators, isTwist ? 'Twist' : 'Flip', alg1[2]];
    }
  }

  // STANDARD LOGIC: Both algorithms must be the same type to be combinable for single commutator
  if (alg1[1] !== alg2[1]) {
    return null;
  }

  // Determine the algorithm type
  let algType: AlgType;
  if (isEdge) algType = 'Edge';
  else if (isCorner) algType = 'Corner';
  else if (isTwist) algType = 'Twist';
  else if (isFlip) algType = 'Flip';
  else if (is2E2C) algType = '2E2C';
  else return null;

  // The resulting algorithm type must match the input algorithm types
  if (algType !== alg1[1]) {
    return null;
  }

  // Try to convert to commutator notation
  const tempAlg: ExtractedAlg = [simplifiedCombined.toString(), algType, alg1[2]];
  const commResult = makeAlgToComm(tempAlg, puzzle);
  
  // Check if we got a valid single commutator
  const commString = commResult[0];
  
  // A single commutator should:
  // 1. Contain a comma (indicating successful conversion)
  // 2. Not contain multiple bracket pairs (indicating multiple commutators)
  // 3. Actually be shorter or more elegant than the original combination
  
  if (!commString.includes(',')) {
    return null; // Failed to find commutator
  }
  
  // Count bracket pairs to ensure it's a single commutator
  const openBrackets = (commString.match(/\[/g) || []).length;
  const closeBrackets = (commString.match(/\]/g) || []).length;
  
  // Should have exactly one pair of main brackets for a single commutator
  // Allow for nested structures like [R, [U, R']]
  if (openBrackets !== closeBrackets || openBrackets === 0) {
    return null;
  }
  
  // Check if the commutator representation is actually beneficial
  // (shorter or same length but more readable)
  const originalLength = alg1[0].length + alg2[0].length + 1; // +1 for space
  const commLength = commString.length;
  
  if (commLength <= originalLength * 1.2) { // Allow 20% longer if it's a proper commutator
    return [commString, algType, alg1[2]];
  }
  
  return null;
}

/**
 * Optimizes a list of extracted algorithms by combining consecutive pairs
 * that can form single commutators
 */
export async function optimizeConsecutiveAlgs(
  algs: ExtractedAlg[]
): Promise<ExtractedAlg[]> {
  if (algs.length < 2) return algs;

  const puzzle = await cube3x3x3.kpuzzle();
  const optimized: ExtractedAlg[] = [];
  let i = 0;

  while (i < algs.length) {
    if (i === algs.length - 1) {
      // Last algorithm, just add it
      optimized.push(algs[i]);
      break;
    }

    // Try to combine current and next algorithm
    const combined = tryCombineAlgs(algs[i], algs[i + 1], puzzle);
    
    if (combined) {
      // Successfully combined, add the result and skip the next algorithm
      optimized.push(combined);
      i += 2;
    } else {
      // Couldn't combine, add the current algorithm and move to next
      optimized.push(algs[i]);
      i += 1;
    }
  }

  return optimized;
}
