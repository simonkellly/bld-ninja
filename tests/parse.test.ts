import { expect, test } from 'bun:test';
import { extractAlgs } from '@/lib/solutionParser';

test('Extract valid comm', () => {
  const extracted = extractAlgs("R U' R' D' R U2 R' D R U' R'");
  expect(extracted.length).toBe(1);
  expect(extracted[0]).toBe("[R U': [R' D' R, U2]]");
});

test('Extract invalid comm', () => {
  const extracted = extractAlgs("R U' R' ");
  expect(extracted.length).toBe(1);
  expect(extracted[0]).toBe("R U' R'");
});
