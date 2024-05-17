import { Store } from "@tanstack/react-store";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStopwatch } from "react-use-precision-timer";
import { randomScrambleForEvent } from "cubing/scramble";
import { CubeStore } from "@/lib/smartCube";
import { GanCubeMove } from "gan-web-bluetooth";
import { extractAlgs } from "@/lib/solutionParser";

enum TimerState {
  Inactive = "INACTIVE",
  HoldingDown = "HOLDING_DOWN",
  Active = "ACTIVE",
  Finishing =  "FINISHING",
}

const randomScramble = await randomScrambleForEvent("333bf");

export const TimerStore = new Store({
  scramble: randomScramble.toString(),
});

export const useCubeTimer = () => {
  const stopwatch = useStopwatch();

  const state = useRef<TimerState>(TimerState.Inactive);
  const moveDetails = useRef<{
    start: GanCubeMove[];
    end: GanCubeMove[];
  }>({
    start: [],
    end: [],
  });

  const startSolve = () => {
    if (CubeStore.state.solutionMoves)  moveDetails.current.start = [...CubeStore.state.solutionMoves];
    else moveDetails.current.start = [];
  };

  const finishSolve = () => {
    if (CubeStore.state.solutionMoves)  moveDetails.current.end = [...CubeStore.state.solutionMoves];
    else moveDetails.current.end = [];

    // get the ones in end which aren't in start
    const diff = moveDetails.current.end.filter(move => !moveDetails.current.start.includes(move));
    const solution = diff.map(move => move.move).join(" ");

    alert(extractAlgs(solution).join("\n"));
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
  }
};
