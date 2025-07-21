import { Store } from "@tanstack/react-store";
import { ALG_SETS, getAlgs, type Alg } from "@/algs/logic/algs";

type AlgStore = {
  currentAlgs: Alg[] | null;
  currentAlgIdx: number;
  retries: number;
  currentSet: (typeof ALG_SETS)[number];
  selectedCases: string[];
  trainInverses: boolean;
  chunkSize: number;
  algs: Alg[];
}

export const AlgStore = new Store<AlgStore>({
  currentAlgs: null,
  currentAlgIdx: 0,
  retries: 0,
  currentSet: ALG_SETS[0],
  selectedCases: [],
  trainInverses: true,
  chunkSize: 4,
  algs: [],
});

export async function getAlgsForState() {
  const startSet = AlgStore.state.currentSet;
  const algs = await getAlgs(startSet);
  if (startSet !== AlgStore.state.currentSet) return;
  AlgStore.setState((prev) => ({ ...prev, algs: algs }));
}

getAlgsForState();

export function setCurrentSet(set: (typeof ALG_SETS)[number]) {
  AlgStore.setState((prev) => ({ ...prev, currentSet: set, algs: [] }));
  getAlgsForState();
}

export function nextAlgs() {
  const storeState = AlgStore.state;
  if (storeState.selectedCases.length === 0 || storeState.algs.length === 0) {
    AlgStore.setState((prev) => ({ ...prev, currentAlgs: null, currentAlgIdx: 0, retries: 0 }));
    return;
  }

  const validCases = storeState.algs.filter(a => storeState.selectedCases.includes(a.case.first) || (storeState.trainInverses && storeState.selectedCases.includes(a.case.second)));
  if (validCases.length === 0) {
    AlgStore.setState((prev) => ({ ...prev, currentAlgs: null, currentAlgIdx: 0, retries: 0 }));
    return;
  }

  const randomIndices = Array.from({ length: storeState.chunkSize }, () => Math.floor(Math.random() * validCases.length));
  const currentAlgs = randomIndices.map(i => validCases[i]);
  AlgStore.setState((prev) => ({ ...prev, currentAlgs, currentAlgIdx: 0, retries: 0 }));
}