import { expect, mock, test } from "bun:test";
import * as library from "btcube-web";
import type { CubeStateEvent, SmartCube } from "btcube-web";
import { KPuzzle } from "cubing/kpuzzle";
import { cube3x3x3 } from "cubing/puzzles";

const libraryExports = { ...library };

test("connection state can be applied to the app puzzle when the library uses a different instance", async () => {
	const puzzle = await cube3x3x3.kpuzzle();
	const foreignPuzzle = new KPuzzle(puzzle.definition);
	const pattern = foreignPuzzle.defaultPattern().applyAlg("R U F");
	let stateListener: ((event: CubeStateEvent) => void) | undefined;
	const inactiveStream = {
		subscribe: () => ({ unsubscribe: () => undefined }),
	};
	const cube = {
		events: {
			state: {
				subscribe(listener: (event: CubeStateEvent) => void) {
					stateListener = listener;
					listener({ type: "status", pattern });
					return {
						unsubscribe: () => {
							stateListener = undefined;
						},
					};
				},
			},
			info: inactiveStream,
			moves: inactiveStream,
		},
		commands: { disconnect: async () => undefined },
	} as unknown as SmartCube;
	mock.module("btcube-web", () => ({
		...libraryExports,
		connectSmartCube: async () => cube,
	}));
	const { connect, CubeStore } = await import("@/lib/cube/smart-cube");

	try {
		const foreignTransformation = pattern.experimentalToTransformation();
		if (!foreignTransformation)
			throw new Error("Missing foreign transformation");
		expect(() =>
			puzzle
				.identityTransformation()
				.applyTransformation(foreignTransformation),
		).toThrow("different KPuzzle");

		await connect();
		for (const incoming of [
			pattern,
			pattern.applyAlg("L D'"),
			foreignPuzzle.defaultPattern(),
		]) {
			stateListener?.({ type: "status", pattern: incoming });
			const localPattern = CubeStore.state.kpattern;
			expect(localPattern?.kpuzzle).toBe(puzzle);
			expect(localPattern?.patternData).toEqual(incoming.patternData);
			const transformation = localPattern?.experimentalToTransformation();
			if (!transformation) throw new Error("Missing local transformation");
			const displayed = puzzle
				.defaultPattern()
				.applyTransformation(transformation);
			expect(displayed.patternData).toEqual(incoming.patternData);
		}
	} finally {
		if (CubeStore.state.cube) await connect();
		mock.module("btcube-web", () => libraryExports);
	}
});
