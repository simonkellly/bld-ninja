import { useStore } from '@tanstack/react-store';
import { cube3x3x3 } from 'cubing/puzzles';
import { CubeMoveEvent } from 'qysc-web';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Key } from 'ts-key-enum';
import { extractAlgs } from '@/lib/analysis/solutionParser';
import { CubeStore } from '@/lib/smartCube';
import { shouldIgnoreEvent } from '@/lib/utils';
import { AlgSheet, fetchGoogleSheet } from './algSheet';
import { TrainerStore } from './trainerStore';

function randomAlg(sheet: AlgSheet) {
  const randomLetter =
    sheet.letters[Math.floor(Math.random() * sheet.letters.length)];
  const algSet = sheet.algs[randomLetter];
  const algLetters = Object.keys(algSet);
  const randomCase = algLetters[Math.floor(Math.random() * algLetters.length)];
  return algSet[randomCase];
}

export default function useAlgTrainer() {
  const [algs, setAlgs] = useState<AlgSheet | undefined>();
  const cube = useStore(CubeStore, state => state.cube);
  const isProcessing = useRef(false);
  const moveQueue = useRef<CubeMoveEvent[]>([]);

  useEffect(() => {
    fetchGoogleSheet().then(sheet => {
      setAlgs({ ...sheet });
      TrainerStore.setState(state => ({ ...state, alg: randomAlg(sheet) }));
    });
  }, [setAlgs]);

  const processNextMove = useCallback(async () => {
    if (isProcessing.current || moveQueue.current.length === 0) return;

    isProcessing.current = true;
    const move = moveQueue.current.shift()!;

    try {
      const moves = [...TrainerStore.state.moves, move];

      const currentAlg = TrainerStore.state.alg?.alg;
      if (!algs || !currentAlg) return;
      const puzzle = await cube3x3x3.kpuzzle();
      const solutionMoves = moves.map(m => m.move);
      const isSolved = puzzle
        .algToTransformation(currentAlg)
        .invert()
        .applyAlg(solutionMoves.join(' '))
        .toKPattern()
        .experimentalIsSolved({
          ignoreCenterOrientation: true,
          ignorePuzzleOrientation: true,
        });

      if (isSolved) {
        TrainerStore.setState(state => ({
          ...state,
          moves: [],
          analysedMoves: '',
          alg: randomAlg(algs),
        }));
      } else {
        const analysis = await extractAlgs(solutionMoves);
        TrainerStore.setState(state => ({
          ...state,
          moves,
          analysedMoves: analysis.map(a => a[0]).join(' '),
        }));
      }
    } finally {
      isProcessing.current = false;
      // Process next move in queue if any
      processNextMove();
    }
  }, [algs]);

  const processMove = useCallback(
    (move: CubeMoveEvent) => {
      moveQueue.current.push(move);
      processNextMove();
    },
    [processNextMove]
  );

  useEffect(() => {
    const subscription = cube?.events.moves.subscribe(
      (event: CubeMoveEvent) => {
        processMove(event);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [cube, processMove]);

  useEffect(() => {
    if (!algs) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (shouldIgnoreEvent(ev)) {
        return;
      }

      if (ev.key === ' ') {
        ev.preventDefault();
        ev.stopImmediatePropagation();

        TrainerStore.setState(state => ({
          ...state,
          moves: [],
          analysedMoves: '',
        }));
      }

      if (ev.key === Key.Escape) {
        ev.preventDefault();
        ev.stopImmediatePropagation();

        TrainerStore.setState(state => ({
          ...state,
          moves: [],
          analysedMoves: '',
          alg: randomAlg(algs),
        }));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [algs]);

  return {
    algs,
  };
}
