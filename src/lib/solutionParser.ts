import { Alg } from 'cubing/alg';
import type { KPuzzle, KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import commutator from './vendor/commutator';

const POSSIBLE_MOVES = ['U', 'F', 'R', 'D', 'B', 'L', 'E', 'S', 'M'];
const POSSIBLE_AMOUNTS = ['2', '', "'"];

// Based on https://mzrg.com/rubik/rotations.shtml
export function removeRotations(moves: string[]) {
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
      moves[moveIdx] = '';
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
  // eslint-disable-next-line no-constant-condition
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

export function fixSlicesForComm(alg: Alg, puzzle: KPuzzle) {
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

export function checkTransformationIsAlg(
  transformation: KTransformation
): [
  isEdge3Cycle: boolean,
  isCorner3Cycle: boolean,
  is2E2C: boolean,
  isTwist: boolean,
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
      cornerCount == 6) ||
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
  length: number;
} {
  const initialCheck = checkTransformationIsAlg(transformation);
  if (
    initialCheck[0] ||
    initialCheck[1] ||
    initialCheck[2] ||
    initialCheck[3]
  ) {
    return {
      alg: '',
      isEdge: initialCheck[0],
      isCorner: initialCheck[1],
      is2E2C: initialCheck[2],
      isTwist: initialCheck[3],
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

// TODO: Handle AUF +2
// TODO: Try collapsing algs to see if they are just solving one case
export async function extractAlgs(
  moveSet: string[]
): Promise<[string, string, number][]> {
  const comms: [
    alg: string,
    moveIdx: number,
    isEdge: boolean,
    isCorner: boolean,
    is2E2C: boolean,
    isTwist: boolean,
  ][] = [];

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
    ]);

    count = uncancelled.length;
    // TODO: There might be a flaw in the logic....
    // Like a cancel of R2 + R = R' vs R' + R = nothing but this is not implemented
    moves = Alg.fromString(uncancelled.alg).invert().toString();
  }

  if (moves.length > 0) {
    const [isEdge, isCorner, is2E2C, isTwist] = checkTransformationIsAlg(
      puzzle.algToTransformation(moves)
    );
    comms.push([moves, moveIdx, isEdge, isCorner, is2E2C, isTwist]);
  }

  return comms.map(val => {
    const comm = val[0];
    const moveIdx = val[1];
    const isEdgeComm = val[2];
    const isCornerComm = val[3];
    const is2E2C = val[4];
    const isTwist = val[5];

    const isAnyAlg = isEdgeComm || isCornerComm || isTwist || is2E2C;
    const comment =
      ' // ' +
      (!isAnyAlg
        ? ' // ?'
        : isEdgeComm
          ? 'Edge'
          : isCornerComm
            ? 'Corner'
            : isTwist
              ? 'Twist/Flip'
              : '2E2C');

    const simplifiedComm = simplify(comm);
    let foundComm: string | undefined;

    if (is2E2C) {
      return [simplifiedComm.toString(), comment, moveIdx];
    }

    if (isEdgeComm || isTwist) {
      const slicesWithRotations = convertToSliceMoves(
        simplifiedComm.toString().split(' ')
      );
      const slices = removeRotations(slicesWithRotations);
      const fixedAlg = fixSlicesForComm(new Alg(slices.join(' ')), puzzle);
      foundComm = commutator.search({
        algorithm: simplify(fixedAlg.join(' ')).toString(),
        outerBracket: true,
      })[0];

      foundComm = foundComm.replaceAll('u', 'Uw');
      foundComm = foundComm.replaceAll('f', 'Fw');
      foundComm = foundComm.replaceAll('r', 'Rw');
      foundComm = foundComm.replaceAll('b', 'Bw');
      foundComm = foundComm.replaceAll('l', 'Lw');
      foundComm = foundComm.replaceAll('d', 'Dw');
    }

    if (!isAnyAlg) {
      return [simplify(comm.trim()).toString(), comment, moveIdx];
    }

    if (!foundComm || foundComm.endsWith('.')) {
      foundComm = commutator.search({
        algorithm: simplify(comm).toString(),
        outerBracket: true,
      })[0];
    }

    if (!foundComm || foundComm.endsWith('.')) {
      foundComm = commutator.search({
        algorithm: comm,
        outerBracket: true,
      })[0];
    }

    if (foundComm.endsWith('.')) {
      return [
        simplify(comm.trim()).toString(),
        comment + ' (comm not found)',
        moveIdx,
      ];
    }

    return [
      foundComm
        .replaceAll(',', ', ')
        .replaceAll(':', ': ')
        .replaceAll('][', '] ['),
      comment,
      moveIdx,
    ];
  });
}
