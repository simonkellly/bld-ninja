import { Alg } from 'cubing/alg';
import type { KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import commutator from './vendor/commutator';

const POSSIBLE_MOVES = ['U', 'F', 'R', 'D', 'B', 'L', 'E', 'S', 'M'];
const POSSIBLE_AMOUNTS = ['2', '', "'"];

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

function checkTransformationIs3Cycle(transformation: KTransformation): boolean {
  const corners = transformation.transformationData['CORNERS'];
  const edges = transformation.transformationData['EDGES'];

  let cornerCount = 0;
  for (let i = 0; i < 8; i++) {
    const positionMatches = corners.permutation[i] == i;
    const orientationMatches = corners.orientationDelta[i] == 0;

    if (positionMatches && !orientationMatches) return false;
    if (positionMatches && orientationMatches) cornerCount++;
  }

  let edgeCount = 0;
  for (let i = 0; i < 12; i++) {
    const positionMatches = edges.permutation[i] == i;
    const orientationMatches = edges.orientationDelta[i] == 0;

    if (positionMatches && !orientationMatches) return false;
    if (positionMatches && orientationMatches) edgeCount++;
  }

  return (
    (cornerCount == 8 && edgeCount == 9) ||
    (cornerCount == 5 && edgeCount == 12)
  );
}

function uncancelTransformation(
  transformation: KTransformation,
  maxLength: number
): null | {
  alg: string;
  length: number;
} {
  if (checkTransformationIs3Cycle(transformation)) {
    return {
      alg: '',
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
        if (checkTransformationIs3Cycle(newTransformation)) {
          return {
            alg: newAlg.trimStart(),
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
  return Alg.fromString(alg)
    .experimentalSimplify({
      cancel: {
        puzzleSpecificModWrap: 'canonical-centered',
        directional: 'any-direction',
      },
      puzzleLoader: cube3x3x3,
      depth: 1,
    })
    .toString();
}

export async function extractAlgs(solution: string): Promise<string[]> {
  const moveSet = [...solution.split(' ')];
  const comms: string[] = [];

  let moves = '';
  let count = 0;

  const puzzle = await cube3x3x3.kpuzzle();

  while (moveSet.length > 0) {
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

    if (uncancelled.length > 0)
      comms.push((moves + ' ' + uncancelled.alg + '').trim());
    else comms.push((moves + ' ' + uncancelled.alg).trim());

    count = uncancelled.length;
    // TODO: There might be a flaw in the logic....
    // Like a cancel of R2 + R = R' vs R' + R = nothing but this is not implemented
    moves = Alg.fromString(uncancelled.alg).invert().toString();
  }

  if (moves.length > 0) comms.push(moves);

  return comms.map(comm => {
    const alg = simplify(
      removeRotations(convertToSliceMoves(simplify(comm).split(' '))).join(' ')
    );
    console.log(alg);
    let foundComm = commutator.search({
      algorithm: alg,
      outerBracket: true,
    })[0];

    if (foundComm.endsWith('.')) {
      foundComm = commutator.search({
        algorithm: comm,
        outerBracket: true,
      })[0];
    }

    if (foundComm.endsWith('.')) return simplify(comm.trim()) + ' // not found';
    return foundComm.replaceAll(',', ', ').replaceAll(':', ': ');
  });
}
