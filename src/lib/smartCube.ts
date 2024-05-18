import { Store } from '@tanstack/react-store';
import {
  connectGanCube,
  GanCubeConnection,
  GanCubeEvent,
  GanCubeMove,
  MacAddressProvider,
} from 'gan-web-bluetooth';

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
  solutionMoves?: GanCubeMove[];
};

export const CubeStore = new Store({} as CubeStoreType);

async function handleMoveEvent(event: GanCubeEvent) {
  if (event.type !== 'MOVE') return;

  CubeStore.setState(state => ({
    ...state,
    solutionMoves: (state.solutionMoves ?? []).concat([event]),
  }));
}

function handleCubeEvent(event: GanCubeEvent) {
  if (event.type == 'MOVE') {
    handleMoveEvent(event);
  } else if (event.type == 'FACELETS') {
    // handleFaceletsEvent(event);
  } else if (event.type == 'DISCONNECT') {
    connect();
  }
}

export const reset = async () => {
  CubeStore.setState(state => ({ ...state, solutionMoves: [] }));
  await CubeStore.state.cube!.sendCubeCommand({ type: 'REQUEST_RESET' });
};

export const connect = async () => {
  const conn = CubeStore.state.cube;

  if (conn) {
    conn.disconnect();
    CubeStore.setState(() => ({}) as CubeStoreType);
  } else {
    const newConn = await connectGanCube(customMacAddressProvider);

    await newConn.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
    await newConn.sendCubeCommand({ type: 'REQUEST_BATTERY' });
    await newConn.sendCubeCommand({ type: 'REQUEST_FACELETS' });

    CubeStore.setState(() => ({
      cube: newConn,
    }));

    newConn.events$.subscribe(handleCubeEvent);
  }
};
