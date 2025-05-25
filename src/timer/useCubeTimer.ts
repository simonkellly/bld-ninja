import { useStore } from '@tanstack/react-store';
import { randomScrambleForEvent } from 'cubing/scramble';
import { CubeMoveEvent, cubeTimestampLinearFit, now } from 'qysc-web';
import { useCallback, useEffect, useRef } from 'react';
import { useStopwatch } from 'react-use-precision-timer';
import { AnalysisResult, analyseSolve } from '@/lib/analysis/dnfAnalyser';
import { Penalty, Solve, db } from '@/lib/db';
import { CubeStore } from '@/lib/smartCube';
import { shouldIgnoreEvent } from '@/lib/utils';
import { TimerStore } from './timerStore';
import { adjustScramble, getRandomRotation, solveRotation } from '@/lib/scramble';

export enum TimerState {
  Inactive = 'INACTIVE',
  HoldingDown = 'HOLDING_DOWN',
  Active = 'ACTIVE',
  Finishing = 'FINISHING',
}

export const HOLD_DOWN_TIME = 300;

async function updateScrambleFromCubeState(scramble: string, rotation: string) {
  const { rotationlessScramble, rotationMove } = await adjustScramble(scramble, rotation, CubeStore.state.kpattern);

  TimerStore.setState(state => ({
    ...state,
    solvedRotation: solveRotation(rotation).join(' '),
    scramble: rotationlessScramble + " " + rotationMove,
    scrambleIdx: 0,
  }));
}

async function processScramblingMove(ev: CubeMoveEvent) {
  const ogScramble = TimerStore.state.originalScramble;
  const rotation = TimerStore.state.rotation;
  const scrambleMoves = TimerStore.state.scramble.split(' ');
  if (scrambleMoves.length === 0) {
    if (ogScramble.length > 0) await updateScrambleFromCubeState(ogScramble, rotation);
    return;
  }

  if (scrambleMoves.length === TimerStore.state.scrambleIdx) {
    await updateScrambleFromCubeState(ogScramble, rotation);
    return;
  }

  const currentIdx = TimerStore.state.scrambleIdx;
  const currentMove = scrambleMoves[currentIdx];
  let adjustedMove = currentMove;

  const isWideMove = currentMove.includes('w');
  const isLastMove = currentIdx === scrambleMoves.length - 1;

  if (isWideMove) {
    const solvedRotation = TimerStore.state.solvedRotation.split(' ');
    const actualMove = solvedRotation[solvedRotation.length === 1 ? 0 : isLastMove ? 0 : 1];
    const inv = actualMove.endsWith("2") ? actualMove : actualMove.endsWith("'") ? actualMove.replace("'", "") : actualMove + "'";
    adjustedMove = inv;
  }

  if (
    adjustedMove.length == 2 &&
    adjustedMove[1] === '2' &&
    ev.move[0] === adjustedMove[0]
  ) {
    const didPrime = ev.move.endsWith("'");
    const editedScramble = [...scrambleMoves];
    editedScramble[currentIdx] = currentMove.replace("2", didPrime ? "'" : "");

    const editedRotation = [...TimerStore.state.solvedRotation.split(' ')];
    const actualMove = editedRotation[editedRotation.length === 1 ? 0 : isLastMove ? 0 : 1];
    const inv = actualMove.replace('2', didPrime ? "" : "'");
    editedRotation[editedRotation.length === 1 ? 0 : isLastMove ? 0 : 1] = inv;
    TimerStore.setState(state => ({
      ...state,
      scramble: editedScramble.join(' '),
      solvedRotation: editedRotation.join(' '),
    }));

    return;
  }

  if (adjustedMove === ev.move) {
    TimerStore.setState(state => ({
      ...state,
      scrambleIdx: state.scrambleIdx + 1,
    }));

    return;
  }

  await updateScrambleFromCubeState(ogScramble, rotation);
}

async function newScramble() {
  const scramble = await randomScrambleForEvent('333');
  const str = scramble.toString();
  const rotation = getRandomRotation();
  TimerStore.setState(state => ({
    ...state,
    originalSolvedRotation: solveRotation(rotation).join(' '),
    originalScramble: str,
    rotation,
  }));
  await updateScrambleFromCubeState(str, rotation);
}

export default function useCubeTimer() {
  const stopwatch = useStopwatch();

  const state = useRef<TimerState>(TimerState.Inactive);
  const moves = useRef<CubeMoveEvent[]>([]);

  const cube = useStore(CubeStore, state => state.cube);

  const startSolve = useCallback(() => {
    moves.current = [];
  }, []);

  const finishSolve = useCallback(async () => {
    const endTime = stopwatch.getElapsedRunningTime();

    const cube = CubeStore.state.cube;
    if (cube) {
      let newEventHappened = false;
      const newMovesSub = cube.events.moves.subscribe(sub => {
        moves.current.push(sub);
      });

      const newEventSub = cube.events.state.subscribe(sub => {
        if (sub.type !== 'freshState') return;
        newEventHappened = true;
        newEventSub!.unsubscribe();
        newMovesSub.unsubscribe();
      });

      await cube.freshState();
      while (!newEventHappened) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }

    const solutionMoves = cubeTimestampLinearFit(moves.current);

    const solve: Solve = {
      time: endTime,
      timeStamp: Date.now(),
      now: now(),
      scramble: TimerStore.state.originalScramble,
      solution: solutionMoves,
    };

    const {
      result: analysis,
      extractedAlgs: parsedAlgs,
      reason,
    } = await analyseSolve(solve);

    solve.dnfResult = analysis;
    solve.dnfReason = reason;
    solve.algs = parsedAlgs;

    solve.penalty =
      analysis == AnalysisResult.SOLVED
        ? Penalty.SOLVED
        : analysis == AnalysisResult.PLUS_TWO
          ? Penalty.PLUS_TWO
          : Penalty.DNF;

    newScramble();

    await db.solves.add(solve);
  }, [stopwatch]);

  const updateStateFromSpaceBar = useCallback(
    (holdingDown: boolean) => {
      const currentState = state.current;
      if (currentState === TimerState.Inactive) {
        if (holdingDown) {
          state.current = TimerState.HoldingDown;
          stopwatch.start();
        }
      } else if (currentState === TimerState.HoldingDown) {
        if (!holdingDown) {
          const currentTime = stopwatch.getElapsedRunningTime();
          if (currentTime < HOLD_DOWN_TIME) {
            state.current = TimerState.Inactive;
            stopwatch.stop();
          } else {
            state.current = TimerState.Active;
            stopwatch.start();
            startSolve();
          }
        }
      } else if (currentState === TimerState.Active) {
        if (holdingDown) {
          state.current = TimerState.Finishing;
          stopwatch.pause();
          finishSolve();
        }
      } else if (currentState === TimerState.Finishing) {
        if (!holdingDown) {
          state.current = TimerState.Inactive;
        }
      }
    },
    [stopwatch, startSolve, finishSolve]
  );

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (shouldIgnoreEvent(ev)) {
        return;
      }

      if (ev.key === ' ') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        updateStateFromSpaceBar(true);
      } else if (
        ev.key.length === 1 &&
        ev.key.toUpperCase() !== ev.key.toLowerCase()
      ) {
        if (state.current === TimerState.Active) {
          updateStateFromSpaceBar(true);
        }
      }

      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        stopwatch.stop();
        state.current = TimerState.Inactive;
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      if (shouldIgnoreEvent(ev)) {
        return;
      }

      if (ev.key === ' ') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        updateStateFromSpaceBar(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [stopwatch, updateStateFromSpaceBar]);

  useEffect(() => {
    const subscription = cube?.events.moves.subscribe(
      (event: CubeMoveEvent) => {
        if (stopwatch.isRunning()) {
          moves.current.push(event);
          return;
        }
        processScramblingMove(event);
      }
    );

    if (TimerStore.state.originalScramble) updateScrambleFromCubeState(TimerStore.state.originalScramble, TimerStore.state.rotation);

    return () => {
      subscription?.unsubscribe();
    };
  }, [cube, stopwatch]);

  useEffect(() => {
    newScramble();
  }, []);

  return {
    stopwatch,
    state,
  };
}
