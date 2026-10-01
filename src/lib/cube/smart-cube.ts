import { Store } from '@tanstack/react-store';
import type { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { connectSmartCube, type CubeInfoEvent, type CubeMoveEvent, type SmartCube } from 'btcube-web';

export type CubeStoreType = {
  cube?: SmartCube | null;
  lastMoves?: CubeMoveEvent[];
  kpattern?: KPattern;
  puzzle?: KPuzzle;
  info?: {
    battery?: number;
  }
};

export const CubeStore = new Store({} as CubeStoreType);

let connecting = false;
const subscriptions: { unsubscribe(): void }[] = [];

function clearConnection() {
  for (const subscription of subscriptions.splice(0)) subscription.unsubscribe();
  CubeStore.setState(() => ({}));
}

function handleMoveEvent(event: CubeMoveEvent) {
  CubeStore.setState(state => {
    let lastMoves = state.lastMoves ?? [];
    lastMoves = [...lastMoves, event];
    if (lastMoves.length > 256) {
      lastMoves = lastMoves.slice(-256);
    }

    return {
      ...state,
      lastMoves,
    };
  });
}

function handleInfoEvent(ev: CubeInfoEvent) {
  if (ev.type === 'battery') {
    CubeStore.setState(state => ({
      ...state,
      info: {
        ...state.info,
        battery: ev.battery,
      },
    }));
  }
}

export const reset = async () => {
  CubeStore.setState(state => ({ ...state, lastMoves: [] }));
  await CubeStore.state.cube?.commands.sync();
};

export async function refreshCube(cube: SmartCube, onMove: (event: CubeMoveEvent) => void) {
  let refreshing = false;
  let resolveState: () => void = () => undefined;
  const receivedState = new Promise<void>(resolve => {
    resolveState = resolve;
  });
  const movesSubscription = cube.events.moves.subscribe(onMove);
  const stateSubscription = cube.events.state.subscribe({
    next: event => {
      if (refreshing && (event.type === 'status' || event.type === 'freshState')) resolveState();
    },
    complete: () => resolveState(),
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    refreshing = true;
    await cube.commands.freshState();
    await Promise.race([
      receivedState,
      new Promise<void>(resolve => {
        timeout = setTimeout(resolve, 1500);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    stateSubscription.unsubscribe();
    movesSubscription.unsubscribe();
  }
}

export const connect = async () => {
  if (connecting) return;
  const conn = CubeStore.state.cube;

  if (conn) {
    clearConnection();
    await conn.commands.disconnect();
  } else {
    connecting = true;
    try {
      const newConn = await connectSmartCube({
        requestMacAddress: async device => window.prompt(`Bluetooth MAC for ${device.name ?? 'cube'}`),
      });
      CubeStore.setState(() => ({ cube: newConn, lastMoves: [] }));
      subscriptions.push(
        newConn.events.state.subscribe(({ pattern }) => {
          CubeStore.setState(state => ({ ...state, puzzle: pattern.kpuzzle, kpattern: pattern }));
        }),
        newConn.events.info.subscribe(handleInfoEvent),
        newConn.events.moves.subscribe(handleMoveEvent),
      );
      const connectionSubscription = newConn.events.connection?.subscribe(({ type }) => {
        if (type === 'disconnected' && CubeStore.state.cube === newConn) clearConnection();
      });
      if (connectionSubscription) subscriptions.push(connectionSubscription);
    } finally {
      connecting = false;
    }
  }
};
