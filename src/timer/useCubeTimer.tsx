import { useStore } from '@tanstack/react-store';
import { Alg } from 'cubing/alg';
import { randomScrambleForEvent } from 'cubing/scramble';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import {
  GanCubeEvent,
  GanCubeMove,
  cubeTimestampLinearFit,
} from 'gan-web-bluetooth';
import { useCallback, useEffect, useRef } from 'react';
import { useStopwatch } from 'react-use-precision-timer';
import { Key } from 'ts-key-enum';
import { useToast } from '@/components/ui/use-toast';
import { Solve, db } from '@/lib/db';
import { SOLVED, dnfAnalyser } from '@/lib/dnfAnalyser';
import { CubeStore } from '@/lib/smartCube';
import { extractAlgs } from '@/lib/solutionParser';
import { TimerStore } from './timerStore';
import { shouldIgnoreEvent } from '@/lib/utils';

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

async function processScramblingMove(ev: GanCubeMove) {
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
  const moves = useRef<GanCubeMove[]>([]);

  const cube = useStore(CubeStore, state => state.cube);
  const { toast } = useToast();

  const startSolve = useCallback(() => {
    moves.current = [];
  }, []);

  const finishSolve = useCallback(async () => {
    const endTime = stopwatch.getElapsedRunningTime();
    const solutionMoves = cubeTimestampLinearFit(moves.current);
    const solution = solutionMoves.map(move => move.move);

    console.log('Solution:', solution.join(' '));

    const algs = await extractAlgs(solution);

    console.log('Scramble:', TimerStore.state.originalScramble);
    let last = solutionMoves.length > 0 ? solutionMoves[0].cubeTimestamp : 0;
    console.table(
      algs.map(([alg, comment, idx]) => {
        const ms = solutionMoves[idx].cubeTimestamp - last;
        const time = (ms / 1000).toFixed(2);
        last = solutionMoves[idx].cubeTimestamp;
        return [alg + comment, time];
      })
    );

    newScramble();

    const solutionStr = solution.join(' ');
    console.log(solutionStr);
    const solve = {
      time: endTime,
      timeStamp: Date.now(),
      scramble: TimerStore.state.originalScramble,
      solution: solutionStr,
      parsed: algs.map(([alg]) => alg),
    } as Solve;

    await db.solves.add(solve);

    const dnfAnalysis = await dnfAnalyser(solve.scramble, solve.solution);
    if (dnfAnalysis !== SOLVED) {
      toast({
        title: 'DNF',
        description: dnfAnalysis,
      });
    }
  }, [stopwatch, toast]);

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
    const subscription = cube?.events$.subscribe((event: GanCubeEvent) => {
      if (event.type !== 'MOVE') return;

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
