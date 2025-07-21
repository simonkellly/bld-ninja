// So the goal of what we are trying to do here is:
// 1. From an alg, extract the swap of pieces
// -  This is broken down into a cycle of edges and corners (to support 2E2C etc.)
// - This will be starting on a specified buffer start
/*

Start by applying a transformation onto the default pattern -> isolates difference
Do the following for corners and edges seperately and combine later
Note: we will have to check after following the cycle that all cycles are accounted for

Take the list of buffers, translate that into pieces and orientation mods
*/
import { describe, expect, it } from 'bun:test';
import { cube3x3x3 } from 'cubing/puzzles';

const puzzle = await cube3x3x3.kpuzzle();

const og = puzzle.defaultPattern();

// const edgeOrder = "UF UR UB UL DF DR DB DL FR FL BR BL";
const edgeSpeffzString = 'ABCDQRSTEFGHIJKLMNOPUVWX';
const cornerSpeffzString = 'ABCDQRSTEFGHIJKLMNOPUVWX';

const edgeBuffersNormal = [
  'UF',
  'UR',
  'UB',
  'UL',
  'DF',
  'DR',
  'DB',
  'DL',
  'FR',
  'FL',
  'BR',
  'BL',
];
const edgeBuffersOne = [
  'FU',
  'RU',
  'BU',
  'LU',
  'FD',
  'RD',
  'BD',
  'LD',
  'RF',
  'LF',
  'RB',
  'LB',
];

const edgeBuffersSpeffzIdx = [2, 1, 0, 3, 20, 21, 22, 23, 9, 11, 19, 17];
const edgeBuffersSpeffzIdxOne = [8, 12, 16, 4, 10, 14, 18, 6, 15, 5, 13, 7];

const cornerBuffersNormal = [
  'UFR',
  'UBR',
  'UBL',
  'UFL',
  'DFR',
  'DFL',
  'DBL',
  'DBR',
];
const cornerBuffersOne = [
  'RUF',
  'RUB',
  'BUL',
  'LUF',
  'RDF',
  'FDL',
  'LDB',
  'BDR',
];
const cornerBuffersTwo = [
  'FUR',
  'BUR',
  'LUB',
  'FUL',
  'FDR',
  'LDF',
  'BDL',
  'RDB',
];

const cornerBuffers = [cornerBuffersNormal, cornerBuffersOne, cornerBuffersTwo];

function convertSpeffz(alg: string[]) {
  // alg like ["UF", "LF", "LB"] -> CRT
  if (alg[0].length !== 2) return null;
  return alg.map(c => {
    let speffz = edgeBuffersSpeffzIdx;
    let idx = edgeBuffersNormal.indexOf(c);
    if (idx === -1) {
      idx = edgeBuffersOne.indexOf(c);
      speffz = edgeBuffersSpeffzIdxOne;
    }

    return edgeSpeffzString[speffz[idx]];
  });
}

function tryExtractAlg(alg: string) {
  const fresh = og.applyAlg(alg);

  const edgeCycles = []; // will need to be reversed
  const edgeChange = fresh.patternData['EDGES'];
  const handledEdges = new Set<number>();
  // TODO: This should not be sequental but follow the settings of buffer order
  for (let slot = 0; slot < 12; slot++) {
    if (handledEdges.has(slot)) continue;
    handledEdges.add(slot);

    const pieceInSlot = edgeChange.pieces[slot];
    const slotPieceOrientation = edgeChange.orientation[slot];

    if (pieceInSlot == slot) {
      if (slotPieceOrientation == 0) continue;
      edgeCycles.push([edgeBuffersNormal[slot], edgeBuffersOne[slot]]);
      continue;
    }

    // Find where the piece is meant to go
    // We want to end when we reach the current slot
    // We start on the piece that is in the slot
    let edgeCycle = [];
    let currentPiece = slot;
    let currentOrientation = 0; // This would have to be changed if using Like FU buffer e.g.
    do {
      handledEdges.add(currentPiece);
      const newOrientation =
        (edgeChange.orientation[currentPiece] + currentOrientation) % 2;
      const nextPieceInSlot = edgeChange.pieces[currentPiece];

      const sticker =
        currentOrientation === 1 ? edgeBuffersOne : edgeBuffersNormal;
      edgeCycle.push(sticker[currentPiece]);

      currentOrientation = newOrientation;
      currentPiece = nextPieceInSlot;
    } while (currentPiece != slot);

    edgeCycle.push(edgeCycle.shift()); // Move start to the end so we can reverse it and start correctly
    edgeCycle.reverse(); // Reverse as we tracked backwards
    edgeCycles.push(edgeCycle);
  }

  const finalEdges = edgeCycles.map(c => c.join('-'));

  const cornerCycles = [];
  const cornerChange = fresh.patternData['CORNERS'];
  const handledCorners = new Set<number>();
  for (let slot = 0; slot < 8; slot++) {
    if (handledCorners.has(slot)) continue;
    handledCorners.add(slot);

    const pieceInSlot = cornerChange.pieces[slot];
    const slotPieceOrientation = cornerChange.orientation[slot];

    if (pieceInSlot == slot) {
      if (slotPieceOrientation == 0) continue;
      cornerCycles.push([cornerBuffersNormal[slot], cornerBuffersOne[slot]]);
      continue;
    }

    let cornerCycle = [];
    let currentPiece = slot;
    let currentOrientation = 0;
    do {
      handledCorners.add(currentPiece);
      const newOrientation =
        (cornerChange.orientation[currentPiece] + currentOrientation) % 3;
      const nextPieceInSlot = cornerChange.pieces[currentPiece];

      const sticker = cornerBuffers[currentOrientation];
      cornerCycle.push(sticker[currentPiece]);

      currentOrientation = newOrientation;
      currentPiece = nextPieceInSlot;
    } while (currentPiece != slot);

    cornerCycle.push(cornerCycle.shift()); // Move start to the end so we can reverse it and start correctly
    cornerCycle.reverse(); // Reverse as we tracked backwards
    cornerCycles.push(cornerCycle);
  }

  const finalCorners = cornerCycles.map(c => c.join('-'));

  return [...finalEdges, ...finalCorners];
}

describe('3-cycles extraction', () => {
  it('extracts edge only 3-cycles', () => {
    expect(tryExtractAlg("[L,U S' U']")).toEqual(['UF-LF-LD']);
    expect(tryExtractAlg("[M: [U' M' U,L]]")).toEqual(['UF-UL-BL']);
    expect(tryExtractAlg("[U' l U:[M',U2]]")).toEqual(['UF-LU-BL']);
    expect(tryExtractAlg("[U':[R E' R',U']]")).toEqual(['UF-UL-LB']);
    expect(tryExtractAlg("[S:[U',R E' R']]")).toEqual(['UF-LU-LB']);
    expect(tryExtractAlg("[L':[L',U M2 U']]")).toEqual(['DF-DL-FL']);
  });

  it('extracts edge flip', () => {
    expect(tryExtractAlg("L E2 L' U' L E2 L2 E L U L' E' L")).toEqual([
      'UB-BU',
      'BR-RB',
    ]);
  });

  it('extracts corner only 3-cycles', () => {
    expect(tryExtractAlg("[R' D' R, U]")).toEqual(['UFR-UBR-RDF']);
    expect(tryExtractAlg("[D' R' D:[R U R', D2]]")).toEqual(['UBR-FDR-BDR']);
    expect(tryExtractAlg("[U R' U': [R U R', D']]")).toEqual(['UFR-BUR-DFR']);
    expect(tryExtractAlg("[R' D':[U',R' D' R]]")).toEqual(['UBR-RDF-LUF']);
    expect(tryExtractAlg("[D2 R: [R D' R', U]]")).toEqual(['UFR-LUB-DFR']);
    expect(tryExtractAlg("[D2 R:[R D' R', U']]")).toEqual(['UFR-LDB-DFR']);
  });
});
