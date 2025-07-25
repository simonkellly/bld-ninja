import { expect, test, describe } from 'bun:test';
import { cube3x3x3 } from 'cubing/puzzles';
import { randomScrambleForEvent } from 'cubing/scramble';
import {
  adjustScramble,
  getRandomRotation,
  possibleRotations,
} from '@/timer/cube/scramble';

describe('Scramble', async () => {
  const puzzle = await cube3x3x3.kpuzzle();

  test('Adjusts nothing', async () => {
    const scramble = '';
    const rotation = 'z2 y';
    const { rotationlessScramble, rotationMove } = await adjustScramble(
      scramble,
      rotation
    );
    const rotatedRealScramble = puzzle
      .defaultPattern()
      .applyAlg(scramble)
      .applyAlg(rotation);
    const displayScramble = puzzle
      .defaultPattern()
      .applyAlg(rotationlessScramble)
      .applyAlg(rotationMove);

    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  });

  test('Adjusts simple scramble', async () => {
    const scramble = 'R U F';
    const rotation = 'z2 y';
    const { rotationlessScramble, rotationMove } = await adjustScramble(
      scramble,
      rotation
    );
    const rotatedRealScramble = puzzle
      .defaultPattern()
      .applyAlg(scramble)
      .applyAlg(rotation);
    const displayScramble = puzzle
      .defaultPattern()
      .applyAlg(rotationlessScramble)
      .applyAlg(rotationMove);

    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  });

  test('Adjusts real scramble', async () => {
    const scramble = (await randomScrambleForEvent('333')).toString();
    const rotation = getRandomRotation();
    const { rotationlessScramble, rotationMove } = await adjustScramble(
      scramble,
      rotation
    );
    const rotatedRealScramble = puzzle
      .defaultPattern()
      .applyAlg(scramble)
      .applyAlg(rotation);
    const displayScramble = puzzle
      .defaultPattern()
      .applyAlg(rotationlessScramble)
      .applyAlg(rotationMove);
    expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
  });

  test('Adjusts all rotations', async () => {
    for (const rotation of possibleRotations) {
      const scramble = (await randomScrambleForEvent('333')).toString();
      const { rotationlessScramble, rotationMove } = await adjustScramble(
        scramble,
        rotation
      );
      const rotatedRealScramble = puzzle
        .defaultPattern()
        .applyAlg(scramble)
        .applyAlg(rotation);
      const displayScramble = puzzle
        .defaultPattern()
        .applyAlg(rotationlessScramble)
        .applyAlg(rotationMove);
      expect(rotatedRealScramble.isIdentical(displayScramble)).toBeTrue();
    }
  });
});


test('Swap pieces', async () => {
  const puzzle = await cube3x3x3.kpuzzle();
  const pattern = puzzle.defaultPattern();

  const algPattern = pattern.applyAlg("R U R' F' R U R' U' R' F R2 U' R'");
console.log(algPattern);
});