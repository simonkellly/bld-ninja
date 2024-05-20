import { Store, useStore } from '@tanstack/react-store';
import { randomScrambleForEvent } from 'cubing/scramble';
import { GanCubeEvent, GanCubeMove } from 'gan-web-bluetooth';
import { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStopwatch } from 'react-use-precision-timer';
import { CubeStore } from '@/lib/smartCube';
import { extractAlgs } from '@/lib/solutionParser';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { Alg } from 'cubing/alg';

enum TimerState {
  Inactive = 'INACTIVE',
  HoldingDown = 'HOLDING_DOWN',
  Active = 'ACTIVE',
  Finishing = 'FINISHING',
}

export const TimerStore = new Store({
  scramble: '',
  originalScramble: '',
  scrambleIdx: 0,
  solutionMoves: [],
});

async function setScrambleFromCubeState(originalScramble: Alg | string) {
  const ogScrambleStr = originalScramble.toString();
  if (!CubeStore.state.kpattern) {
    TimerStore.setState(state => ({
      ...state,
      scramble: ogScrambleStr,
      originalScramble: ogScrambleStr,
      scrambleIdx: 0,
    }));
    return;
  }

  const scrambleAlg = typeof originalScramble === 'string' ? new Alg(originalScramble) : originalScramble;
  const solved = await experimentalSolve3x3x3IgnoringCenters(CubeStore.state.kpattern!);
  const newPattern = CubeStore.state.puzzle!.defaultPattern()
    .applyAlg(scrambleAlg.invert())
    .applyAlg(solved.invert());

  const newScramble = await experimentalSolve3x3x3IgnoringCenters(newPattern);
  TimerStore.setState(state => ({
    ...state,
    scrambleAlg: scrambleAlg.toString(),
    scrambleIdx: 0,
    scramble: newScramble.toString(),
  }));
}

async function processScrambleMove(ev: GanCubeMove) {
  const ogScramble = TimerStore.state.originalScramble;
  const scrambleMoves = TimerStore.state.scramble.split(' ');
  if (scrambleMoves.length === 0) {
    if (ogScramble.length > 0) await setScrambleFromCubeState(ogScramble);
    return;
  }

  if (scrambleMoves.length === TimerStore.state.scrambleIdx) {
    await setScrambleFromCubeState(ogScramble);
    return;
  }

  const currentIdx = TimerStore.state.scrambleIdx;
  const currentMove = scrambleMoves[currentIdx];
  
  // If its a double move, and you are turning that face, just redo that move
  if (currentMove.length == 2 && currentMove[1] === '2' && ev.move[0] === currentMove[0]) {
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
  
  await setScrambleFromCubeState(ogScramble);
}

export const useCubeTimer = () => {
  const cube = useStore(CubeStore, (state) => state.cube);

  const stopwatch = useStopwatch();

  useEffect(() => {
    const subscription = cube?.events$.subscribe((event: GanCubeEvent) => {
      if (event.type !== 'MOVE') return;

      if (stopwatch.isRunning()) return;
      processScrambleMove(event);
    });

    setScrambleFromCubeState(TimerStore.state.originalScramble);

    return () => {
      subscription?.unsubscribe();
    };
  }, [cube, stopwatch]);

  useEffect(() => {
    randomScrambleForEvent('333').then(async scramble => {
      if (TimerStore.state.originalScramble) return;

      await setScrambleFromCubeState(scramble.toString());
    });
  }, []);

  const state = useRef<TimerState>(TimerState.Inactive);
  const moveDetails = useRef<{
    start: GanCubeMove[];
    end: GanCubeMove[];
  }>({
    start: [],
    end: [],
  });

  const startSolve = () => {
    if (CubeStore.state.lastMoves)
      moveDetails.current.start = [...CubeStore.state.lastMoves];
    else moveDetails.current.start = [];
  };

  const finishSolve = async () => {
    if (CubeStore.state.lastMoves)
      moveDetails.current.end = [...CubeStore.state.lastMoves];
    else moveDetails.current.end = [];

    // get the ones in end which aren't in start
    const diff = moveDetails.current.end.filter(
      move => !moveDetails.current.start.includes(move)
    );

    const solution = diff.map(move => move.move).join(' ');

    const [newScramble, algs] = await Promise.all([randomScrambleForEvent('333'), extractAlgs(solution)]);

    console.log("Scramble:", TimerStore.state.originalScramble)
    console.log(algs.join('\n'));

    const newScrambleAlg = newScramble.toString();
    TimerStore.setState(state => ({
      ...state,
      scramble: newScrambleAlg,
      originalScramble: newScrambleAlg,
      scrambleIdx: 0,
    }));
  };

  const pressSpaceBar = (up: boolean) => {
    const currentState = state.current;
    if (currentState === TimerState.Inactive) {
      if (!up) {
        state.current = TimerState.HoldingDown;
        stopwatch.stop();
      }
    } else if (currentState === TimerState.HoldingDown) {
      if (up) {
        state.current = TimerState.Active;
        stopwatch.start();
        startSolve();
      }
    } else if (currentState === TimerState.Active) {
      if (!up) {
        state.current = TimerState.Finishing;
        stopwatch.pause();
        finishSolve();
      }
    } else if (currentState === TimerState.Finishing) {
      if (up) {
        state.current = TimerState.Inactive;
      }
    }
  };

  useHotkeys(' ', () => pressSpaceBar(false), { keyup: false });
  useHotkeys(' ', () => pressSpaceBar(true), { keyup: true });

  return {
    stopwatch,
    pressSpaceBar,
  };
};
