import { adjustScramble, getRandomRotation } from "@/lib/scramble";
import { expect, test, describe } from 'bun:test';
import { cube3x3x3 } from "cubing/puzzles";
import { randomScrambleForEvent } from "cubing/scramble";

describe('Scramble', async () => {
  const puzzle = await cube3x3x3.kpuzzle();

  test('Adjusts nothing', async () => {
    const scramble = "";
    const rotation = 'z2 y';
    const { rotationlessScramble, rotationMove } = await adjustScramble(scramble, rotation);
    const rotatedRealScramble = puzzle.defaultPattern().applyAlg(scramble).applyAlg(rotation);
    const displayScramble = puzzle.defaultPattern().applyAlg(rotationlessScramble).applyAlg(rotationMove);

    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  });

  test('Adjusts simple scramble', async () => {
    const scramble = "R U F";
    const rotation = 'z2 y';
    const { rotationlessScramble, rotationMove } = await adjustScramble(scramble, rotation);
    const rotatedRealScramble = puzzle.defaultPattern().applyAlg(scramble).applyAlg(rotation);
    const displayScramble = puzzle.defaultPattern().applyAlg(rotationlessScramble).applyAlg(rotationMove);

    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  });

  test('Adjusts real scramble', async () => {
    const scramble = (await randomScrambleForEvent('333')).toString();
    const rotation = getRandomRotation();
    const { rotationlessScramble, rotationMove } = await adjustScramble(scramble, rotation);
    const rotatedRealScramble = puzzle.defaultPattern().applyAlg(scramble).applyAlg(rotation);
    const displayScramble = puzzle.defaultPattern().applyAlg(rotationlessScramble).applyAlg(rotationMove);
    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  }, {
    repeats: 10,
  });
});