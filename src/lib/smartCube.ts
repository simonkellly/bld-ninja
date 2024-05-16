import { Store } from '@tanstack/store';
import * as Bluetooth from 'cubing/bluetooth';

const initialState: {
  cube: Bluetooth.BluetoothPuzzle | null,
  appliedMoves: Bluetooth.MoveEvent[],
} = {
  cube: null,
  appliedMoves: [],
};

export const CubeStore = new Store(initialState);

export const setPuzzle = (cube: Bluetooth.BluetoothPuzzle | null) => {
  CubeStore.setState((state) => ({ ...state, cube, appliedMoves: [] }));
  if (!cube) return;
  cube.addAlgLeafListener((alg) => {
    CubeStore.setState((state) => ({
      ...state,
      appliedMoves: [...state.appliedMoves, alg],
    }));
  });
};

