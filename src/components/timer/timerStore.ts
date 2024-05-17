import { Store } from "@tanstack/react-store";
import { setInterval, setTimeout } from "timers/promises";

enum TimerState {
  Inactive =  "INACTIVE",
  HoldingDown = "HOLDING_DOWN",
  Active = "ACTIVE",
}

export const TimerStore = new Store({
  scramble: '',
  time: 0,
  startTime: 0,
  endTime: 0,
  holdingSpace: false,
});

const timer = () => {
  let state: TimerState = TimerState.Inactive;

  const pressSpaceBar = (up: boolean) => {
    if (state === TimerState.Inactive) {
      if (!up) {
        state = TimerState.HoldingDown;
      }
    } else if (state === TimerState.HoldingDown) {
      if (up) {
        state = TimerState.Active;
        TimerStore.setState(state => ({ ...state, startTime: Date.now() }));
      }
    } else if (state === TimerState.Active) {
      if (!up) {
        state = TimerState.Inactive;
        TimerStore.setState(state => ({ ...state, endTime: Date.now() }));
        clearInterval(interval!);
      }
    }
  };

  return {
    currentState: () => state,
    pressSpaceBar,
  }
}
