import { expect, test } from 'bun:test';
import { convertToSliceMoves, extractAlgs, removeRotations } from '@/lib/solutionParser';

test('Extract valid comm (EP)', async () => {
  const extracted = await extractAlgs("R U' R' D' R U2 R' D R U' R'");
  expect(extracted.length).toBe(1);
  expect(extracted[0]).toBe("[R U': [R' D' R, U2]]");
});

test('Extract valid comm (BG)', async () => {
  const extracted = await extractAlgs("D' R' D R U R' D' R U' D");
  expect(extracted.length).toBe(1);
  expect(extracted[0]).toBe("[D': [R' D R, U]]");
});

test('Extract invalid comm', async () => {
  const extracted = await extractAlgs("R U' R' ");
  expect(extracted.length).toBe(1);
  expect(extracted[0]).toBe("R U' R' // not found");
});

test('Converts slice moves and rotations', () => {
  const alg = "U' L' R B' R' L U' L' R B' R' L";
  const converted = convertToSliceMoves(alg.split(' '));
  const rotationsRemoves = removeRotations(converted);
  expect(rotationsRemoves.join(' ')).toBe("U' M U' M' U' M U' M'");
});

test('Converts slice moves M', () => {
  const alg = "R' L";
  const converted = convertToSliceMoves(alg.split(' '));
  expect(converted.join(' ')).toBe("M' x'");
});

test('Converts slice moves E', () => {
  const alg = "U D'";
  const converted = convertToSliceMoves(alg.split(' '));
  expect(converted.join(' ')).toBe("E y");
});

test('Converts slice moves S', () => {
  const alg = "F B'";
  const converted = convertToSliceMoves(alg.split(' '));
  expect(converted.join(' ')).toBe("S' z");
});
