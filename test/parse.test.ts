import { extractAlgs } from "@/timer/cube/solution-parser";
import { expect, test } from "bun:test";

test("Combined alg correctly extracted", async () => {
  const moves = "R' D' R U U R' D R U' R' D' R U' R' D R";
  const algs = await extractAlgs(moves.split(' '));
  console.log(algs);
});