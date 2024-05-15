import { cube3x3x3 } from "cubing/puzzles";
import type { KTransformation } from "cubing/kpuzzle";

const puzzle = await cube3x3x3.kpuzzle();

const POSSIBLE_MOVES = ["U", "F", "R", "D", "B", "L"];
const POSSIBLE_AMOUNTS = ["2", "", "'"];

function checkTransformationIs3Cycle(transformation: KTransformation): boolean {
  const corners = transformation.transformationData["CORNERS"];
  const edges = transformation.transformationData["EDGES"];

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

  return (cornerCount == 8 && edgeCount == 9) || (cornerCount == 5 && edgeCount == 12);
}

function breadthFirstTransformation(transformation: KTransformation, depth: number): string | boolean {
  const queue = [{ transformation: transformation, alg: "" }];
  while (queue.length > 0) {
    const { transformation, alg } = queue.shift()!;
    for (const move of POSSIBLE_MOVES) {
      // TODO: This can probably be unrolled in final version
      for (const amount of POSSIBLE_AMOUNTS) {
        const newAlg = `${alg} ${move}${amount}`;
        const newTransformation = transformation.applyAlg(`${move}${amount}`);
        if (checkTransformationIs3Cycle(newTransformation)) {
          return newAlg;
        }
        if (depth > 0) {
          queue.push({ transformation: newTransformation, alg: newAlg });
        }
      }
    }
  }
  return false;
}

const algExample = "R' U2 R' D' R";
const check = breadthFirstTransformation(puzzle.algToTransformation(algExample), 6);
console.log(algExample + check);
