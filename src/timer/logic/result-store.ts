import { Store } from "@tanstack/react-store";
import type { Solve } from "./timer-db";

export const ResultsStore = new Store({
  results: [] as Solve[],
});

globalThis.ResultsStore = ResultsStore;