import {
  connectGanCube,
  GanCubeConnection,
  MacAddressProvider,
} from 'gan-web-bluetooth';
import { Store } from '@tanstack/react-store';

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
};

export const CubeStore = new Store({} as CubeStoreType);

export const reset = async () => {
  await CubeStore.state.cube!.sendCubeCommand({ type: "REQUEST_RESET" });
}

export const connect = async () => {
  const conn = CubeStore.state.cube

  if (conn) {
    conn.disconnect();
    CubeStore.setState(() => ({}) as CubeStoreType);
  } else {
    const newConn = await connectGanCube(customMacAddressProvider);
    CubeStore.setState(() => ({
      cube: newConn,
    }));
    await newConn.sendCubeCommand({ type: 'REQUEST_HARDWARE' });
    await newConn.sendCubeCommand({ type: 'REQUEST_BATTERY' });
    await newConn.sendCubeCommand({ type: 'REQUEST_FACELETS' });
  }
}
