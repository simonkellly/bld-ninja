import { expect, test, describe } from 'bun:test';
import {
  convertToSliceMoves,
  extractAlgs,
  makeAlgToComm,
  removeRotations,
} from '@/lib/analysis/solutionParser';
import { cube3x3x3 } from 'cubing/puzzles';

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
