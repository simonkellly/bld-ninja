import { Alg } from 'cubing/alg';
import type { KTransformation } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import commutator from './commutator';

const POSSIBLE_MOVES = ['U', 'F', 'R', 'D', 'B', 'L', 'E', 'S', 'M'];
const POSSIBLE_AMOUNTS = ['2', '', "'"];

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
    // TODO: This is a good place to handle slice moves
    const foundComms = commutator.search({
      algorithm: comm,
      outerBracket: true,
    });
    const foundComm = foundComms[0];
    if (foundComm.endsWith('.')) return comm.trim();
    return foundComm.replaceAll(',', ', ').replaceAll(':', ': ');
  });
}
