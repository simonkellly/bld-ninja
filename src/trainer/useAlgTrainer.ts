import { useStore } from '@tanstack/react-store';
import { cube3x3x3 } from 'cubing/puzzles';
import {
  GanCubeEvent,
  GanCubeMove,
  cubeTimestampLinearFit,
} from 'gan-web-bluetooth';
import { useCallback, useEffect, useState } from 'react';
import { Key } from 'ts-key-enum';
import { CubeStore } from '@/lib/smartCube';
import { extractAlgs } from '@/lib/solutionParser';
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

  useEffect(() => {
    fetchGoogleSheet().then(sheet => {
      setAlgs({ ...sheet });
      TrainerStore.setState(state => ({ ...state, alg: randomAlg(sheet) }));
    });
  }, [setAlgs]);

  const processMove = useCallback(
    async (move: GanCubeMove) => {
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
        const fullMoves = CubeStore.state.lastMoves;
        const fixedMoves = fullMoves
          ? moves.length > fullMoves.length
            ? moves
            : cubeTimestampLinearFit(fullMoves).slice(-moves.length)
          : moves;
        const time =
          fixedMoves.at(-1)!.cubeTimestamp - fixedMoves.at(0)!.cubeTimestamp;
        console.log(time);
      } else {
        const analysis = await extractAlgs(solutionMoves);
        TrainerStore.setState(state => ({
          ...state,
          moves,
          analysedMoves: analysis.map(a => a[0]).join(' '),
        }));
      }
    },
    [algs]
  );

  useEffect(() => {
    const subscription = cube?.events$.subscribe((event: GanCubeEvent) => {
      if (event.type !== 'MOVE') return;
      processMove(event);
    });

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
