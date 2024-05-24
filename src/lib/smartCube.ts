import { Store } from '@tanstack/react-store';
import { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import {
  connectGanCube,
  GanCubeConnection,
  GanCubeEvent,
  GanCubeMove,
  MacAddressProvider,
} from 'gan-web-bluetooth';
import { faceletsToPattern, SOLVED_STATE } from '@/lib/vendor/ganUtils';

const customMacAddressProvider: MacAddressProvider = async (
  device,
  isFallbackCall
): Promise<string | null> => {
  if (isFallbackCall) {
    return prompt(
      'Unable do determine cube MAC address!\nPlease enter MAC address manually:'
    );
  } else {
    return typeof device.watchAdvertisements == 'function'
      ? null
      : prompt(
          'Seems like your browser does not support Web Bluetooth watchAdvertisements() API. Enable following flag in Chrome:\n\nchrome://flags/#enable-experimental-web-platform-features\n\nor enter cube MAC address manually:'
        );
  }
};

type CubeStoreType = {
  cube?: GanCubeConnection | null;
  startingState?: string;
  lastMoves?: GanCubeMove[];
  kpattern?: KPattern;
  puzzle?: KPuzzle;
};

export const CubeStore = new Store({} as CubeStoreType);

async function handleMoveEvent(event: GanCubeEvent) {
  if (event.type !== 'MOVE') return;

  CubeStore.setState(state => {
    let lastMoves = state.lastMoves ?? [];
    lastMoves = [...lastMoves, event];
    if (lastMoves.length > 256) {
      lastMoves = lastMoves.slice(-256);
    }

    return {
      ...state,
      lastMoves,
      kpattern: state.kpattern?.applyMove(event.move),
    };
  });
}

function handleCubeEvent(event: GanCubeEvent) {
  if (event.type == 'MOVE') {
    handleMoveEvent(event);
  } else if (event.type == 'DISCONNECT') {
    CubeStore.setState(() => ({}) as CubeStoreType);
  }
}

export const reset = async () => {
  CubeStore.setState(state => ({ ...state, lastMoves: [] }));
  await CubeStore.state.cube?.sendCubeCommand({ type: 'REQUEST_RESET' });
};

export const connect = async () => {
  const conn = CubeStore.state.cube;

  if (conn) {
    CubeStore.setState(() => ({}) as CubeStoreType);
    conn.disconnect();
  } else {
    const newConn = await connectGanCube(customMacAddressProvider);

    let startingState: string | undefined;
    const sub = newConn.events$.subscribe(async ev => {
      if (ev.type !== 'FACELETS') return;

      if (ev.facelets == SOLVED_STATE) {
        startingState = '';
        return;
      }

      const kpattern = faceletsToPattern(ev.facelets);
      const solution = await experimentalSolve3x3x3IgnoringCenters(kpattern);
      const scramble = solution.invert();
      startingState = scramble.toString();
    });

    await newConn.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
    await newConn.sendCubeCommand({ type: 'REQUEST_BATTERY' });
    await newConn.sendCubeCommand({ type: 'REQUEST_FACELETS' });

    const kpuzzle = await cube3x3x3.kpuzzle();

    while (startingState === undefined)
      await new Promise(r => setTimeout(r, 20));

    const kpattern = kpuzzle.defaultPattern().applyAlg(startingState);

    sub.unsubscribe();

    CubeStore.setState(() => ({
      cube: newConn,
      startingState,
      puzzle: kpuzzle,
      kpattern: kpattern,
    }));

    newConn.events$.subscribe(handleCubeEvent);
  }
};
