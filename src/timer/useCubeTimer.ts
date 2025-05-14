import { useStore } from '@tanstack/react-store';
import { Alg } from 'cubing/alg';
import { randomScrambleForEvent } from 'cubing/scramble';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { useCallback, useEffect, useRef } from 'react';
import { useStopwatch } from 'react-use-precision-timer';
import { Key } from 'ts-key-enum';
import { AnalysisResult, analyseSolve } from '@/lib/analysis/dnfAnalyser';
import { Penalty, Solve, db } from '@/lib/db';
import { CubeStore } from '@/lib/smartCube';
import { shouldIgnoreEvent } from '@/lib/utils';
import { TimerStore } from './timerStore';
import { CubeMoveEvent, cubeTimestampLinearFit, now } from 'qysc-web';

export enum TimerState {
  Inactive = 'INACTIVE',
  HoldingDown = 'HOLDING_DOWN',
  Active = 'ACTIVE',
  Finishing = 'FINISHING',
}

export const HOLD_DOWN_TIME = 300;

async function updateScrambleFromCubeState(originalScramble: Alg | string) {
  const ogScrambleStr = originalScramble.toString();
  if (!CubeStore.state.kpattern) {
    TimerStore.setState(state => ({
      ...state,
      scramble: ogScrambleStr,
      scrambleIdx: 0,
    }));
    return;
  }

  const scrambleAlg =
    typeof originalScramble === 'string'
      ? new Alg(originalScramble)
      : originalScramble;
  const solved = await experimentalSolve3x3x3IgnoringCenters(
    CubeStore.state.kpattern!
  );
  const newPattern = CubeStore.state
    .puzzle!.defaultPattern()
    .applyAlg(scrambleAlg.invert())
    .applyAlg(solved.invert());

  const customScramble =
    await experimentalSolve3x3x3IgnoringCenters(newPattern);
  TimerStore.setState(state => ({
    ...state,
    scrambleAlg: scrambleAlg.toString(),
    scrambleIdx: 0,
    scramble: customScramble.toString(),
  }));
}

async function processScramblingMove(ev: CubeMoveEvent) {
  const ogScramble = TimerStore.state.originalScramble;
  const scrambleMoves = TimerStore.state.scramble.split(' ');
  if (scrambleMoves.length === 0) {
    if (ogScramble.length > 0) await updateScrambleFromCubeState(ogScramble);
    return;
  }

  if (scrambleMoves.length === TimerStore.state.scrambleIdx) {
    await updateScrambleFromCubeState(ogScramble);
    return;
  }

  const currentIdx = TimerStore.state.scrambleIdx;
  const currentMove = scrambleMoves[currentIdx];

  // If its a double move, and you are turning that face, just redo that move
  if (
    currentMove.length == 2 &&
    currentMove[1] === '2' &&
    ev.move[0] === currentMove[0]
  ) {
    TimerStore.setState(state => ({
      ...state,
      scramble: state.scramble.replace(currentMove, ev.move),
    }));

    return;
  }

  if (currentMove === ev.move) {
    TimerStore.setState(state => ({
      ...state,
      scrambleIdx: state.scrambleIdx + 1,
    }));

    return;
  }

  await updateScrambleFromCubeState(ogScramble);
}

async function newScramble() {
  const scramble = await randomScrambleForEvent('333');
  TimerStore.setState(state => ({
    ...state,
    originalScramble: scramble.toString(),
  }));
  await updateScrambleFromCubeState(scramble.toString());
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
    const fullMoves = CubeStore.state.lastMoves;
    const solutionMoves = fullMoves
      ? moves.current.length > fullMoves.length
        ? moves.current
        : moves.current.length > 0
          ? cubeTimestampLinearFit(fullMoves).slice(-moves.current.length)
          : moves.current
      : moves.current;

    const solve = {
      time: endTime,
      timeStamp: Date.now(),
      now: now(),
      scramble: TimerStore.state.originalScramble,
      solution: solutionMoves,
    } as Solve;

    const [analysis, parsedAlgs] = await analyseSolve(solve);

    solve.penalty =
      analysis == AnalysisResult.SOLVED
        ? Penalty.SOLVED
        : analysis == AnalysisResult.PLUS_TWO
          ? Penalty.PLUS_TWO
          : Penalty.DNF;
    solve.algs = parsedAlgs;
    solve.dnfReason = analysis;

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
      }

      if (ev.key === Key.Escape) {
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
    const subscription = cube?.events.moves.subscribe((event: CubeMoveEvent) => {
      if (stopwatch.isRunning()) {
        moves.current.push(event);
        return;
      }
      processScramblingMove(event);
    });

    if (TimerStore.state.originalScramble)
      updateScrambleFromCubeState(TimerStore.state.originalScramble);

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
