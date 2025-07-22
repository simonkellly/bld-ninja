/* Ideas for analysis:
- We can see if we in memo swapped to the wrong side of a piece
- Combining algs for twists/flips
- We should be able to print a full report in the reconstruction
*/

import { cube3x3x3 } from "cubing/puzzles";
import type { Solve } from "@/timer/logic/timer-db";
import { KPattern } from "cubing/kpuzzle";
import { extractAlgs, makeAlgToComm, removeRotations } from "@/timer/cube/solution-parser";
import { Alg } from "cubing/alg";
import type { Comm, AnalysisResult } from "@/timer/logic/timer-db";
import { experimentalSolve3x3x3IgnoringCenters } from "cubing/search";

type AnalysisCandidate = Omit<Solve, 'solveState' | 'analysis'>;

export function checkIsSolved(state: KPattern) {
  return state.experimentalIsSolved({
    ignoreCenterOrientation: true,
    ignorePuzzleOrientation: true,
  })
}

const POSSIBLE_MOVES = [
  "F' B z",
  "F B' z'",
  "R L' x'",
  "R' L x",
  "U D' y'",
  "U' D y",
  "F2 B2 z2",
  "R2 L2 x2",
  "U2 D2 y2",
  "U2",
  "D2",
  "R2",
  "L2",
  "F2",
  "B2",
  "U",
  "D",
  "R",
  "L",
  "F",
  "B",
  "U'",
  "D'",
  "R'",
  "L'",
  "F'",
  "B'",
];

function checkOneMove(
  scramble: KPattern,
  solution: string[]
) {
  let checkedState = scramble;
  for (let solutionIdx = 0; solutionIdx <= solution.length; solutionIdx++) {
    const remainingSolution = solution.slice(solutionIdx).join(' ');

    for (const move of POSSIBLE_MOVES) {
      const moveState = checkedState.applyAlg(move);
      const appliedState = moveState.applyAlg(remainingSolution);
      const isSolved = checkIsSolved(appliedState);

      if (isSolved) {
        return {
          idx: solutionIdx,
          move,
        };
      }
    }

    if (solutionIdx == solution.length) break;
    checkedState = checkedState.applyMove(solution[solutionIdx]);
  }

  return false;
}

type MoveAddition = [move: string, idx: number];

type AnyMove = {
  move: string;
  timestamp: number;
}

async function standardAnalysis(solve: AnalysisCandidate, additionalMoves: MoveAddition[]) {
  const puzzle = await cube3x3x3.kpuzzle();
  const combinedSolution = [...solve.moves] as AnyMove[];

  for (const [move, idx] of additionalMoves) {
    const subMoves = move.split(' ');
    combinedSolution.splice(idx, 0, ...subMoves.map(m => ({
      move: m,
      timestamp: -1
    })));
  }
  const rotationlessMoves = removeRotations(combinedSolution.map(m => m.move), "ROT");
  const rotationlessSolution: AnyMove[] = [];
  for (let i = 0; i < combinedSolution.length; i++) {
    const move = combinedSolution[i];
    if (move.move.startsWith('x') || move.move.startsWith('y') || move.move.startsWith('z')) {
      continue;
    }
    rotationlessSolution.push({
      move: rotationlessMoves[i],
      timestamp: move.timestamp,
    });
  }

  const newAlgs = await extractAlgs(rotationlessSolution.map(s => s.move), true);
  const parsedSolution = newAlgs.map(s => makeAlgToComm(s, puzzle));

  const durations = [] as number[];
  let currentTime = rotationlessSolution.find(s => s.timestamp > 0)?.timestamp ?? 0;
  for (let i = 0; i < parsedSolution.length; i++) {
    const alg = parsedSolution[i];
    let moveIdx = alg[2];
    let endingTimestamp = -1;
    while (endingTimestamp === -1 && moveIdx < rotationlessSolution.length) {
      endingTimestamp = rotationlessSolution[moveIdx].timestamp;
      moveIdx++;
    }
    
    // If we couldn't find a valid timestamp, use the current time as fallback
    if (endingTimestamp === -1) {
      endingTimestamp = currentTime;
    }
    
    const duration = endingTimestamp - currentTime;
    durations.push(duration);
    currentTime = endingTimestamp;
  }

  const comms: Comm[] = parsedSolution.map((alg, algIndex) => {
    const type = alg[1];
    const startIdx = alg[2];
    const algStr = alg[0];

    // Find the end index for this alg (start of next alg or end of solution)
    const nextStartIdx = algIndex < parsedSolution.length - 1 
      ? parsedSolution[algIndex + 1][2] 
      : rotationlessSolution.length;

    // Check from startIdx to the next startIdx in the rotationlessSolution
    // if any move has a timestamp of -1 then mark the issue as 'One Move'
    let hasOneMove = false;
    const algMoves = rotationlessSolution.slice(startIdx, nextStartIdx);
    
    for (const move of algMoves) {
      if (move.timestamp === -1) {
        hasOneMove = true;
        break;
      }
    }

    return {
      alg: algStr,
      issue: hasOneMove ? 'One Move' : 'NONE',
      type,
      startIdx,
      duration: durations[algIndex],
    } as Comm;
  });

  return {
    algs: comms,
  } as AnalysisResult;
}

function checkInverse(scramble: KPattern, algs: Comm[]) {
  for (let idx = 0; idx < algs.length; idx++) {
    let state = scramble;
    for (let i = 0; i < algs.length; i++) {
      const alg = algs[i];
      if (i === idx) {
        state = state.applyAlg(new Alg(alg.alg).invert());
      } else {
        state = state.applyAlg(alg.alg);
      }
    }
    if (checkIsSolved(state)) {
      return {
        idx,
      }
    }
  };
  return false;
}

function checkAlgOrder(scramble: KPattern, algs: Comm[]) {
  for (let idx = 0; idx < algs.length; idx++) {
    for (let newLoc = 0; newLoc <= algs.length; newLoc++) {
      if (newLoc === idx) {
        continue;
      }

      let state = scramble;
      const applied = [];
      for (let sequenceIdx = 0; sequenceIdx < algs.length; sequenceIdx++) {
        if (sequenceIdx === idx) {
          continue;
        }

        if (sequenceIdx === newLoc) {
          applied.push(idx);
          state = state.applyAlg(algs[idx].alg);
        }

        state = state.applyAlg(algs[sequenceIdx].alg);
        applied.push(sequenceIdx);
      }

      if (newLoc === algs.length) {
        state = state.applyAlg(algs[idx].alg);
        applied.push(idx);
      }

      const isSolved = checkIsSolved(state);
      if (isSolved) {
        return {
          idx,
        }
      }
    }
  }
  return false;
}

function swapForEdges(pattern: KPattern) {
  const copy = new KPattern(pattern.kpuzzle, pattern.patternData);
  [copy.patternData['EDGES'].pieces[0], copy.patternData['EDGES'].pieces[1]]
    = [copy.patternData['EDGES'].pieces[1], copy.patternData['EDGES'].pieces[0]];
  
  [copy.patternData['EDGES'].orientation[0], copy.patternData['EDGES'].orientation[1]]
    = [copy.patternData['EDGES'].orientation[1], copy.patternData['EDGES'].orientation[0]];
  return copy;
}

function swapForCorners(pattern: KPattern, pos1: number, pos2: number, orientation: number) {
  const copy = new KPattern(pattern.kpuzzle, pattern.patternData);
  [copy.patternData['EDGES'].pieces[pos1], copy.patternData['EDGES'].pieces[pos2]]
    = [copy.patternData['EDGES'].pieces[pos2], copy.patternData['EDGES'].pieces[pos1]];
  
  [copy.patternData['EDGES'].orientation[pos1], copy.patternData['EDGES'].orientation[pos2]] = [orientation, orientation];
  return copy;
}

async function preprocessSolve(solve: AnalysisCandidate) {
  if (solve.mode === '3BLD') return solve;

  // NOTE: This only works for UF UR swap currently
  // TODO: Add support for other swaps (maybe we just brute force all them??);
  const solveCopy = { ...solve };

  const puzzle = await cube3x3x3.kpuzzle();
  
  const scramble = solve.scramble;
  const scrambleTransformation = puzzle.algToTransformation(scramble);
  const scrambleHasParity = (solve.scramble.split(' ').filter(s => s.length === 1 || s[1] !== '2').length % 2) === 1

  if (solve.mode === 'Corners') {
    // solve edges first
    let edgesSolved = new KPattern(puzzle, {
      EDGES: {
        pieces: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        orientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      CORNERS: {
        pieces: [0, 1, 2, 3, 4, 5, 6, 7],
        orientation: [0, 0, 0, 0, 0, 0, 0, 0],
      },
      CENTERS: {
        pieces: [0, 1, 2, 3, 4, 5],
        orientation: [0, 0, 0, 0, 0, 0],
        orientationMod: [1, 1, 1, 1, 1, 1],
      },
    });
      
    if (scrambleHasParity) {
      edgesSolved = swapForEdges(edgesSolved);
    } 

    edgesSolved = edgesSolved.applyTransformation(scrambleTransformation);
    
    edgesSolved.patternData['CORNERS'] = {
      pieces: [0, 1, 2, 3, 4, 5, 6, 7],
      orientation: [0, 0, 0, 0, 0, 0, 0, 0],
    }

    const edgesSolution = await experimentalSolve3x3x3IgnoringCenters(edgesSolved);
    solveCopy.scramble = (solveCopy.scramble + ' ' + edgesSolution.toString()).trim();
  }

  if (solve.mode === 'Edges') {
    let cornersSolved = new KPattern(puzzle, {
      EDGES: {
        pieces: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        orientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      CORNERS: {
        pieces: [0, 1, 2, 3, 4, 5, 6, 7],
        orientation: [0, 0, 0, 0, 0, 0, 0, 0],
      },
      CENTERS: {
        pieces: [0, 1, 2, 3, 4, 5],
        orientation: [0, 0, 0, 0, 0, 0],
        orientationMod: [1, 1, 1, 1, 1, 1],
      },
    });    

    cornersSolved = cornersSolved.applyTransformation(scrambleTransformation);
  
    const edgesData = cornersSolved.patternData['EDGES'];

    const pos1 = edgesData.pieces.indexOf(0);
    const pos2 = edgesData.pieces.indexOf(1);  

    const orientation = edgesData.orientation[pos1] === edgesData.orientation[pos2] ? 0 : 1;

    cornersSolved.patternData['EDGES'] = {
      pieces: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      orientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    if (scrambleHasParity) {
      cornersSolved = swapForCorners(cornersSolved, pos1, pos2, orientation);
    }

    const cornersSolution = await experimentalSolve3x3x3IgnoringCenters(cornersSolved);
    solveCopy.scramble = (solveCopy.scramble + ' ' + cornersSolution.toString()).trim();
  }

  return solveCopy;
}

async function analyseSolve(solve: AnalysisCandidate): Promise<Solve> {
  const puzzle = await cube3x3x3.kpuzzle();

  const solutionMoves = solve.moves.map(m => m.move);
  const solutionStr = solutionMoves.join(' ');

  const scrambleTransformation = puzzle.algToTransformation(solve.scramble);
  const solutionTransformation = puzzle.algToTransformation(solutionStr);

  const scramblePattern = puzzle.defaultPattern().applyTransformation(scrambleTransformation);
  const solvedState = scrambleTransformation.applyTransformation(solutionTransformation);

  const corners = solvedState.transformationData['CORNERS'];
  const edges = solvedState.transformationData['EDGES'];

  const scrambledCorners = scrambleTransformation.transformationData['CORNERS'];
  const scrambledEdges = scrambleTransformation.transformationData['EDGES'];
  
  let cornersSolved = 0;
  let cornersMisoriented = 0;
  let missedCornerTwists = 0;
  for (let i = 0; i < 8; i++) {
    const positionMatches = corners.permutation[i] == i;
    const orientationMatches = corners.orientationDelta[i] == 0;
    const scrambledSolvedPosition = scrambledCorners.permutation[i] == i;

    if (positionMatches && orientationMatches) {
      cornersSolved++;
    } else if (positionMatches && !orientationMatches) {
      cornersMisoriented++;
      if (scrambledSolvedPosition) {
        missedCornerTwists++;
      }
    }
  }

  let edgesSolved = 0;
  let edgesMisoriented = 0;
  let missedEdgeFlips = 0;
  for (let i = 0; i < 12; i++) {
    const positionMatches = edges.permutation[i] == i;
    const orientationMatches = edges.orientationDelta[i] == 0;
    const scrambledSolvedPosition = scrambledEdges.permutation[i] == i;

    if (positionMatches && orientationMatches) {
      edgesSolved++;
    } else if (positionMatches && !orientationMatches) {
      edgesMisoriented++;
      if (scrambledSolvedPosition) {
        missedEdgeFlips++;
      }
    }
  }
  
  if (cornersSolved === 8 && edgesSolved === 12) {
    return {
      ...solve,
      solveState: 'SOLVED',
      analysis: await standardAnalysis(solve, [])
    };
  }

  const totalMisoriented = cornersMisoriented + edgesMisoriented;
  const totalMissed = missedCornerTwists + missedEdgeFlips;
  const allPiecesInCorrectPosition = (cornersSolved + cornersMisoriented === 8) && (edgesSolved + edgesMisoriented === 12);
  
  const missedOffByOneOrZero = (totalMisoriented - totalMissed) === 0 || (totalMisoriented - totalMissed) === 1;

  if (allPiecesInCorrectPosition && missedOffByOneOrZero && totalMissed > 0) {
    return {
      ...solve,
      solveState: 'DNF',
      analysis: {
        ...await standardAnalysis(solve, []),
        dnfReason: 'Flips/Twists',
      }
    };
  }

  const mightBeOneMove = (cornersSolved <= 4 && edgesSolved <= 8);
  if (mightBeOneMove) {
    const oneMove = checkOneMove(scramblePattern, solutionMoves);
    if (oneMove) {
      // to check if its a plus two, we need to see if we can move the one move to the end of the solution
      // and still have a valid solution
      const isPlusTwo = oneMove.move.length < 3 && checkIsSolved(scramblePattern.applyTransformation(solutionTransformation).applyMove(oneMove.move));
      return {
        ...solve,
        solveState: isPlusTwo ? 'PLUS_TWO' : 'DNF',
        analysis: {
          ...await standardAnalysis(solve, [[oneMove.move, oneMove.idx]]),
          dnfReason: 'One Move',
        }
      };
    }
  }

  const standardAnalysisResult = await standardAnalysis(solve, []);

  const algOrder = checkAlgOrder(scramblePattern, standardAnalysisResult.algs);
  if (algOrder) {
    const algs = standardAnalysisResult.algs;
    algs[algOrder.idx].issue = 'Alg Order';
    return {
      ...solve,
      solveState: 'DNF',
      analysis: {
        ...standardAnalysisResult,
        dnfReason: 'Alg Order',
      }
    };
  }

  const inverse = checkInverse(scramblePattern, standardAnalysisResult.algs);
  if (inverse) {
    const algs = standardAnalysisResult.algs;
    algs[inverse.idx].issue = 'Inverse';
    return {
      ...solve,
      solveState: 'DNF',
      analysis: {
        ...standardAnalysisResult,
        dnfReason: 'Inverse',
      }
    };
  }

  return {
    ...solve,
    solveState: 'DNF',
    analysis: {
      ...await standardAnalysis(solve, []),
      dnfReason: 'Unknown',
    }
  };
}

export async function processNewSolve(rawSolve: AnalysisCandidate): Promise<Solve> {
  const solve = await preprocessSolve(rawSolve);
  const analysedSolve = await analyseSolve(solve);
  return {
    ...analysedSolve,
    scramble: rawSolve.scramble,
  }
}