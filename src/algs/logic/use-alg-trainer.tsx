import { CubeStore } from "@/lib/cube/smart-cube";
import { useStore } from "@tanstack/react-store";
import { cubeTimestampLinearFit, type CubeMoveEvent } from "qysc-web";
import { useCallback, useEffect } from "react";
import { AlgStore, nextAlgs } from "@/algs/logic/alg-store";
import { cube3x3x3 } from "cubing/puzzles";
import type { KPuzzle, KTransformation } from "cubing/kpuzzle";
import { shouldIgnoreEvent } from "@/lib/ui/keyboard";
import { algDb, type AlgAttempt } from "@/algs/logic/alg-db";
import { addToast } from "@heroui/react";
import { Store } from "@tanstack/react-store";

export const MoveStore = new Store({
  showMoves: false,
  moves: [] as CubeMoveEvent[],
})

function checkIdentical(t1: KTransformation, t2: KTransformation) {
  const c1 = t1.transformationData['CORNERS'];
  const c2 = t2.transformationData['CORNERS'];
  for (let i = 0; i < 8; i++) {
    if (c1.orientationDelta[i] !== c2.orientationDelta[i]) return false;
    if (c1.permutation[i] !== c2.permutation[i]) return false;
  }

  const e1 = t1.transformationData['EDGES'];
  const e2 = t2.transformationData['EDGES'];
  for (let i = 0; i < 12; i++) {
    if (e1.orientationDelta[i] !== e2.orientationDelta[i]) return false;
    if (e1.permutation[i] !== e2.permutation[i]) return false;
  }
  return true;
}

let kpuzzlePromise: Promise<KPuzzle> | null = null;
function getKpuzzle(): Promise<KPuzzle> {
  if (!kpuzzlePromise) {
    kpuzzlePromise = cube3x3x3.kpuzzle();
  }
  return kpuzzlePromise;
}

let pendingMoves: CubeMoveEvent[][] = [];

async function processCubeMoves(kpuzzle: KPuzzle, moves: CubeMoveEvent[]) {
  // TODO: We can check multiple cases in the set, to see if a user cancelled a move.
  // In that case then we need to uncancel the move and calculate the timings
  // We can use the code from the main timing suite for that later on...

  const algs = AlgStore.state.currentAlgs;
  if (!algs) return;

  const currentAlgIdx = AlgStore.state.currentAlgIdx;
  const alg = algs[currentAlgIdx];
  const retries = AlgStore.state.retries;

  const caseTransform = kpuzzle.algToTransformation(alg.alg);
  const movesTransform = kpuzzle.algToTransformation(moves.map(m => m.move).join(" "));

  if (!checkIdentical(caseTransform, movesTransform)) {
    if (checkIdentical(caseTransform, movesTransform.invert())) {
      addToast({
        title: "Inverse",
        description: `You did the inverse of the alg ${alg.case.first + alg.case.second}`,
        color: "primary",
        variant: "solid",
      });
      await algDb.inversePerformed.add({
        set: AlgStore.state.currentSet,
        case: alg.case.first + alg.case.second,
        timestamp: Date.now(),
      });
    }
    return;
  }
  if (currentAlgIdx >= algs.length - 1) {
    nextAlgs();
  } else {
    AlgStore.setState((prev) => ({ ...prev, currentAlgIdx: prev.currentAlgIdx + 1, retries: 0 }));
  }

  // TODO: We should be able to use more moves from the cube to get a better fit
  const solutionMoves = cubeTimestampLinearFit(moves);

  const algAttempt: AlgAttempt = {
    set: AlgStore.state.currentSet,
    case: alg.case.first + alg.case.second,
    firstCase: currentAlgIdx === 0,
    retries,
    timestamp: Date.now(),
    time: solutionMoves[solutionMoves.length - 1].cubeTimestamp - solutionMoves[0].cubeTimestamp,
  }

  await algDb.algAttempts.add(algAttempt);
}


async function processCubeMovesQueue(nextMoves: CubeMoveEvent[]) {
  if (pendingMoves.length !== 0) {
    pendingMoves.push(nextMoves);
    return;
  }
  pendingMoves.push(nextMoves);
  
  while (pendingMoves.length > 0) {
    const kpuzzle = await getKpuzzle();
    const moves = pendingMoves.shift();
    if (!moves) continue;

    await processCubeMoves(kpuzzle, moves);
  }
}

export function useAlgTrainer() {
  const cube = useStore(CubeStore, state => state.cube);

  const algs = useStore(AlgStore, state => state.algs);
  const selectedCases = useStore(AlgStore, state => state.selectedCases);
  const trainInverses = useStore(AlgStore, state => state.trainInverses);
  const chunkSize = useStore(AlgStore, state => state.chunkSize);

  useEffect(() => {
    nextAlgs();
  }, [algs, selectedCases, trainInverses, chunkSize]);

  const currentAlgs = useStore(AlgStore, state => state.currentAlgs);
  const currentAlgIdx = useStore(AlgStore, state => state.currentAlgIdx);
  useEffect(() => {
    MoveStore.setState((prev) => ({ ...prev, moves: [] }));
  }, [currentAlgs, currentAlgIdx]);

  useEffect(() => {
    const subscription = cube?.events.moves.subscribe(
      (event: CubeMoveEvent) => {
        const newMoves = [...MoveStore.state.moves, event];
        MoveStore.setState((prev) => ({ ...prev, moves: newMoves }));
        processCubeMovesQueue(newMoves);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [cube]);

  const handleKeyboard = useCallback((ev: KeyboardEvent) => {
    if (shouldIgnoreEvent(ev)) return;

    switch (ev.key) {
      case " ":
        MoveStore.setState((prev) => ({ ...prev, moves: [] }));
        AlgStore.setState((prev) => ({ ...prev, retries: prev.retries + 1 }));
        break;
      case "Enter":
        nextAlgs();
        break;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboard);
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [handleKeyboard]);
}