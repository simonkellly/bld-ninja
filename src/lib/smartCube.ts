import { Store } from '@tanstack/react-store';
import { KPattern, KPuzzle } from 'cubing/kpuzzle';
import { cube3x3x3 } from 'cubing/puzzles';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import { connectQYSC, CubeMoveEvent, QYSC } from 'qysc-web';

type CubeStoreType = {
  cube?: QYSC | null;
  startingState?: string;
  lastMoves?: CubeMoveEvent[];
  kpattern?: KPattern;
  puzzle?: KPuzzle;
};

export const CubeStore = new Store({} as CubeStoreType);

async function handleMoveEvent(event: CubeMoveEvent) {
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

export const reset = async () => {
  CubeStore.setState(state => ({ ...state, lastMoves: [] }));
  await CubeStore.state.cube?.sync();
};

export const connect = async () => {
  const conn = CubeStore.state.cube;

  if (conn) {
    CubeStore.setState(() => ({}) as CubeStoreType);
    conn.disconnect();
    CubeStore.setState(() => ({}) as CubeStoreType);
  } else {
    const newConn = await connectQYSC();

    let startingState: string | undefined;
    const sub = newConn.events.state.subscribe(async ev => {
      if (startingState && (ev.type === 'state' || ev.type === 'freshState')) return;
      const solution = await experimentalSolve3x3x3IgnoringCenters(ev.pattern as any);
      const scramble = solution.invert();
      startingState = scramble.toString();
    });

    await newConn.freshState();

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

    newConn.events.moves.subscribe(handleMoveEvent);
  }
};
