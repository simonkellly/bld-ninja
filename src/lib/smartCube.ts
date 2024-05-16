import { Store } from '@tanstack/store';
import * as Bluetooth from 'cubing/bluetooth';

const initialState: { cube: Bluetooth.BluetoothPuzzle | null } = {
  cube: null,
};

export const CubeStore = new Store(initialState);
