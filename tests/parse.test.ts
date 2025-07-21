import { expect, test, describe } from 'bun:test';
import { cube3x3x3 } from 'cubing/puzzles';
import { AnalysisResult } from '@/lib/analysis/analysisResults';
import { analyseSolveString } from '@/lib/analysis/dnf3BLD';
import {
  convertToSliceMoves,
  extractAlgs,
  makeAlgToComm,
  removeRotations,
} from '@/lib/cube/solutionParser';

async function extractComm(alg: string[]) {
  const puzzle = await cube3x3x3.kpuzzle();
  const extracted = await extractAlgs(alg);
  return extracted.map(a => makeAlgToComm(a, puzzle));
}

describe('Slice Moves', () => {
  test('Converts slice moves M', () => {
    const alg = "R' L";
    const converted = convertToSliceMoves(alg.split(' '));
    expect(converted.join(' ')).toBe("M' x'");
  });

  test('Converts slice moves E', () => {
    const alg = "U D'";
    const converted = convertToSliceMoves(alg.split(' '));
    expect(converted.join(' ')).toBe('E y');
  });

  test('Converts slice moves S', () => {
    const alg = "F B'";
    const converted = convertToSliceMoves(alg.split(' '));
    expect(converted.join(' ')).toBe("S' z");
  });

  test('Converts double slice moves', () => {
    const alg = 'F2 B2';
    const converted = convertToSliceMoves(alg.split(' '));
    expect(converted.join(' ')).toBe('S2 z2');
  });

  test('Converts slice moves and rotations (DO)', () => {
    const alg = "U' L' R B' R' L U' L' R B' R' L";
    const converted = convertToSliceMoves(alg.split(' '));
    const rotationsRemoves = removeRotations(converted);
    expect(rotationsRemoves.join(' ')).toBe("U' M U' M' U' M U' M'");
  });
});

// Test algs are notated as per UFRBLD letter scheme
describe('Extract Comms', () => {
  test('Extract valid comm (EP)', async () => {
    const extracted = await extractComm(
      "R U' R' D' R U2 R' D R U' R'".split(' ')
    );
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[R U': [R' D' R, U2]]");
  });

  test('Extract valid comm (BG)', async () => {
    const extracted = await extractComm("D' R' D R U R' D' R U' D".split(' '));
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[D': [R' D R, U]]");
  });

  test('Extract invalid comm', async () => {
    const extracted = await extractComm("R U' R'".split(' '));
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("R U' R'");
  });

  test('Extract slice alg (FK)', async () => {
    const extracted = await extractComm(
      "F' B L D L' R F' F' L R' D L' F B'".split(' ')
    );
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[S U L: [E', L2]]");
  });

  test('Extract slice alg (GJ) with double moves', async () => {
    const extracted = await extractComm(
      "R' L F R' F' L R' D R D' L L R' R'".split(' ')
    );
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[M': [U R' U', M']]");
  });

  test('Extract slice alg (FK) with extra moves', async () => {
    const extracted = await extractComm(
      "R U B D D' B' U' R' F' B L D L' R F' F' L R' D L' F B'".split(' ')
    );
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[S U L: [E', L2]]");
  });

  test('Extract slice alg (RI) with wide move canceling', async () => {
    const extracted = await extractComm(
      "U' R L' B' R' B F' U B U' F B' L U".split(' ')
    );
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[U' M: [U', R' E R]]");
  });

  test('Extract slice alg (IM) with wide move canceling', async () => {
    const extracted = await extractComm("R U R' U' R' L F R F' L'".split(' '));
    expect(extracted.length).toBe(1);
    expect(extracted[0][0]).toBe("[R: [U R' U', M']]");
  });
});

describe('Analyse Solve', () => {
  test('Valid solve', async () => {
    const scramble = "R2 B2 U2 R B D2 F' U2 R D2 F2 U B2 L2 U2 R2 D' R2 L2 U";
    const solution =
      "D' U' R' D R U R' D' R D U' R D' R' U R' D R U R' D' R U' R D R' U' R' U' R D' R' U' R D R' U U R U R U' R' R' B F' U U F B' U R' L' U U L F' B D' L D F B' L' U L R' R' F B' D F D' B F' R F' R R L' B R B' L R' L R' F R' F' R L' U R' F' R F' B U' F U B' F U' R F' D R' U' R D' R' U R F R' L R' F R' B F' U U F B' R' F' R L' R' D U' B U' B' U D' R U R U R' F' R U R' U' R' F R R U' R' U'";
    const analysis = await analyseSolveString(scramble, solution);
    expect(analysis.result).toBe(AnalysisResult.SOLVED);
    expect(analysis.extractedAlgs.length).toBe(12);
  });

  test('One move mistake', async () => {
    const scramble = "R2 B2 U2 R B D2 F' U2 R D2 F2 U B2 L2 U2 R2 D' R2 L2 U";
    const solution =
      "D' U' R' D R U R' D' R D U' R D' R' U R' D R U R D' R U' R D R' U' R' U' R D' R' U' R D R' U U R U R U' R' R' B F' U U F B' U R' L' U U L F' B D' L D F B' L' U L R' R' F B' D F D' B F' R F' R R L' B R B' L R' L R' F R' F' R L' U R' F' R F' B U' F U B' F U' R F' D R' U' R D' R' U R F R' L R' F R' B F' U U F B' R' F' R L' R' D U' B U' B' U D' R U R U R' F' R U R' U' R' F R R U' R' U'";
    const analysis = await analyseSolveString(scramble, solution);
    expect(analysis.result).toBe(AnalysisResult.ONE_MOVE);
    expect(analysis.extractedAlgs.length).toBe(12);
  });

  test('Another one move mistake', async () => {
    const scramble =
      "F2 U2 R2 U' R' L' D' F' U2 B D2 F2 U2 R2 F' R2 U2 F2 D R2 F2";
    const solution =
      "U2 M U2' M' L' U L2 S' L' S U' L L F' R' F M F' R F M' L' L' B' M' B2 M B2' B L U' E' R E' R2 E R2' R' E U R' U' E' R E R2 E' R2' R' E U R U2 S U' S U' S U' S' U' S U' S U' S U' S' U R' B D' R U R' D R U' R' B' R U' D' R' U' R' D R U R' D' R R D U R U' R' R' U R D R' U' R D' R U R' D' R D' R' U' R D R' U D R' D R U R' D' R U'";
    const analysis = await analyseSolveString(scramble, solution);
    expect(analysis.result).toBe(AnalysisResult.ONE_MOVE);
    expect(analysis.extractedAlgs.length).toBe(12);
  });

  test('Inverse comm', async () => {
    const scramble = "R2 B2 U2 R B D2 F' U2 R D2 F2 U B2 L2 U2 R2 D' R2 L2 U";
    const solution =
      "D' U' R' D R U R' D' R D U' R D' R' U R' D R U R' D' R U' R D R' U' R' U' R D' R' U' R D R' U U R U R U' R' R' B F' U U F B' U R' L' U U L F' B D' L D F B' L' U L R' R' F B' D F D' B F' R F' R R L' B R B' L R' L R' F R' F' R L' U R' F' R F' B U' F U B' F U' R F' R' U' R D R' U R D' F R' L R' F R' B F' U U F B' R' F' R L' R' D U' B U' B' U D' R U R U R' F' R U R' U' R' F R R U' R' U'";
    const analysis = await analyseSolveString(scramble, solution);
    expect(analysis.result).toBe(AnalysisResult.INVERSE_ALG);
    expect(analysis.extractedAlgs.length).toBe(12);
  });
});
