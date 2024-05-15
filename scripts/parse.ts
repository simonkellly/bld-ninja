import { cube3x3x3 } from "cubing/puzzles";
import { Alg } from "cubing/alg";
import type { KTransformation } from "cubing/kpuzzle";

const puzzle = await cube3x3x3.kpuzzle();

const POSSIBLE_MOVES = ["U", "F", "R", "D", "B", "L", "E", "S", "M"];
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

function uncancelTransformation(transformation: KTransformation, maxLength: number): null | {
  alg: string,
  length: number,
} {
  if (checkTransformationIs3Cycle(transformation)) {
    return {
      alg: "",
      length: 0,
    };
  }

  const queue = [{ transformation: transformation, alg: "", depth: maxLength - 1 }];
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
          queue.push({ transformation: newTransformation, alg: newAlg, depth: depth - 1});
        }
      }
    }
  }
  return null;
}

/*
// Memo: 5.72
y

// Edges: 4.00 (10.00 STPS)
E' R E R2' E' R E // [E' R: [E, R2']]
l' U' l' S l U l' S' l2 // [l': [U', l' S l]]
R S2' R' U R S2' R' // [R S2' R', U] cancel into
L U M U' L' U M' U2' // [U: [L, U M U']]
U R' E R U2 R' E' R U // [U: [R' E R, U2]]

// Corners: 3.10 (10.97 STPS)
R' U2 R' D' R U2 R' D R // [R': [U2, R' D' R]] cancel into
U R2 D' R' U R D R' U' R' U' R2 // [R' U R: [R D' R', U]] cancel into
D' R' D R U' R' R R' D' R D U R' // [R D': [R' D R, U']] lose grip before last R'

// Total Execution: 7.10 (10.42 STPS)
*/
//                                      (Converted to no rotations)
const edgeSolution = "E' R E R2' E' R E R' F' R' S' R F R' S R2 R S2' R' U R S2' R' L U M U' L' U M' U2' U R' E R U2 R' E' R U"
const cornerSolution = "R' U2 R' D' R U2 R' D R U R2 D' R' U R D R' U' R' U' R2 D' R' D R U' R' R R' D' R D U R'"

const moveSet = [...edgeSolution.split(" "), ...cornerSolution.split(" ")];

const comms: string[] = [];

let moves = "";
let count = 0;

while (moveSet.length > 0) {
  const move = moveSet.shift()!;
  moves += " " + move;
  if (count++ < 4 || moveSet.length === 0) continue;

  const uncancelled = uncancelTransformation(puzzle.algToTransformation(moves), 2);
  if (uncancelled == null) continue;
  if (uncancelled.length > 0 && moveSet[0][0] === uncancelled.alg[0]) continue;

  comms.push((moves + " (" + uncancelled.alg + ")").trim());
  
  count = uncancelled.length;
  // TODO: There is a flaw in the logic....
  // Like a cancel of R2 + R = R' vs R' + R = nothing but this is not implemented
  moves = Alg.fromString(uncancelled.alg).invert().toString();
}

comms.push(moves);

console.log("Original: " + cornerSolution);
comms.forEach((comm, i) => console.log("Alg " + (i + 1) + ": " + comm));