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
import { settingsWithDefaults } from '@/lib/settings';

const puzzle = await cube3x3x3.kpuzzle();

const og = puzzle.defaultPattern();

// Standard Speffz edge order mapping (24 edge stickers)
// A=UB, B=UR, C=UF, D=UL, E=LU, F=LF, G=LD, H=LB, I=FU, J=FR, K=FD, L=FL, M=RU, N=RB, O=RD, P=RF, Q=BU, R=BL, S=BD, T=BR, U=DF, V=DR, W=DB, X=DL
const edgeSpeffzOrder = [
  'UB',
  'UR',
  'UF',
  'UL',
  'LU',
  'LF',
  'LD',
  'LB',
  'FU',
  'FR',
  'FD',
  'FL',
  'RU',
  'RB',
  'RD',
  'RF',
  'BU',
  'BL',
  'BD',
  'BR',
  'DF',
  'DR',
  'DB',
  'DL',
];

// Standard Speffz corner order mapping (24 corner stickers)
// A=UBL, B=UBR, C=UFR, D=UFL, E=LUB, F=LUF, G=LDF, H=LDB, I=FUL, J=FUR, K=FDR, L=FDL, M=RUF, N=RUB, O=RDB, P=RDF, Q=BUR, R=BUL, S=BDL, T=BDR, U=DFL, V=DFR, W=DBR, X=DBL
const cornerSpeffzOrder = [
  'UBL',
  'UBR',
  'UFR',
  'UFL',
  'LUB',
  'LUF',
  'LDF',
  'LDB',
  'FUL',
  'FUR',
  'FDR',
  'FDL',
  'RUF',
  'RUB',
  'RDB',
  'RDF',
  'BUR',
  'BUL',
  'BDL',
  'BDR',
  'DFL',
  'DFR',
  'DBR',
  'DBL',
];

const edgePieceStickers = [
  ['UF', 'FU'],

  ['UR', 'RU'],

  ['UB', 'BU'],

  ['UL', 'LU'],

  ['DF', 'FD'],

  ['DR', 'RD'],

  ['DB', 'BD'],

  ['DL', 'LD'],

  ['FR', 'RF'],

  ['FL', 'LF'],

  ['BR', 'RB'],

  ['BL', 'LB'],
];

const cornerPieceStickers = [
  ['UFR', 'RUF', 'FUR'],

  ['UBR', 'RUB', 'BUR'],

  ['UBL', 'BUL', 'LUB'],

  ['UFL', 'LUF', 'FUL'],

  ['DFR', 'RDF', 'FDR'],

  ['DFL', 'FDL', 'LDF'],

  ['DBL', 'LDB', 'BDL'],

  ['DBR', 'BDR', 'RDB'],
];

interface ConversionSettings {
  edgeScheme: string;
  cornerScheme: string;
  edgeBufferOrder: string;
  cornerBufferOrder: string;
}

function convertCyclesToLetters(
  cycles: string[],
  settings?: Partial<ConversionSettings>
): string[] {
  const config = settingsWithDefaults(settings || {});

  const edgeLetters = config.edgeScheme.split('');
  const cornerLetters = config.cornerScheme.split('');
  const edgeOrder = config.edgeBufferOrder.split(' ');
  const cornerOrder = config.cornerBufferOrder.split(' ');

  return cycles.map(cycle => {
    const pieces = cycle.split('-');

    // Determine if this is an edge or corner cycle based on piece notation length
    const isEdge = pieces[0].length === 2;

    if (isEdge) {
      // Convert edge cycle to letters
      const letters = pieces.map(piece => {
        // Find the piece in the Speffz order
        const speffzIndex = edgeSpeffzOrder.indexOf(piece);
        if (speffzIndex === -1) {
          console.warn(`Edge piece ${piece} not found in Speffz order`);
          return '?';
        }

        // Map to custom letter scheme
        return edgeLetters[speffzIndex] || '?';
      });

      return letters.join('');
    } else {
      // Convert corner cycle to letters
      const letters = pieces.map(piece => {
        // Find the piece in the Speffz order
        const speffzIndex = cornerSpeffzOrder.indexOf(piece);
        if (speffzIndex === -1) {
          console.warn(`Corner piece ${piece} not found in Speffz order`);
          return '?';
        }

        // Map to custom letter scheme
        return cornerLetters[speffzIndex] || '?';
      });

      return letters.join('');
    }
  });
}

function convertSpeffz(
  pieces: string[],
  settings?: Partial<ConversionSettings>
): string[] | null {
  // Convert individual pieces to letters - kept for backwards compatibility
  if (pieces.length === 0) return null;

  const config = settingsWithDefaults(settings || {});
  const isEdge = pieces[0].length === 2;

  if (isEdge) {
    const edgeLetters = config.edgeScheme.split('');
    return pieces.map(piece => {
      const speffzIndex = edgeSpeffzOrder.indexOf(piece);
      return speffzIndex !== -1 ? edgeLetters[speffzIndex] : '?';
    });
  } else {
    const cornerLetters = config.cornerScheme.split('');
    return pieces.map(piece => {
      const speffzIndex = cornerSpeffzOrder.indexOf(piece);
      return speffzIndex !== -1 ? cornerLetters[speffzIndex] : '?';
    });
  }
}

function tryExtractAlg(
  alg: string,
  settings: Partial<ConversionSettings> = {}
) {
  const fresh = og.applyAlg(alg);

  const config = settingsWithDefaults(settings);

  // Build sticker mappings for custom buffer orders
  const edgeStickerToSlot: Record<string, number> = {};
  const edgeStickerToLocalOri: Record<string, number> = {};
  for (let slot = 0; slot < 12; slot++) {
    for (let ori = 0; ori < 2; ori++) {
      const st = edgePieceStickers[slot][ori];
      edgeStickerToSlot[st] = slot;
      edgeStickerToLocalOri[st] = ori;
    }
  }

  const cornerStickerToSlot: Record<string, number> = {};
  const cornerStickerToLocalOri: Record<string, number> = {};
  for (let slot = 0; slot < 8; slot++) {
    for (let ori = 0; ori < 3; ori++) {
      const st = cornerPieceStickers[slot][ori];
      cornerStickerToSlot[st] = slot;
      cornerStickerToLocalOri[st] = ori;
    }
  }

  // Set up edge buffers - use default arrays but update based on custom order
  let edgeBuffersNormal = edgePieceStickers.map(a => a[0]);
  let edgeBuffersOne = edgePieceStickers.map(a => a[1]);
  let edgeStartingMods = new Array(12).fill(0);

  const defaultEdgeBufferOrder = edgePieceStickers.map(([n]) => n);
  const edgeBufferOrderList = config.edgeBufferOrder.trim()
    ? config.edgeBufferOrder.split(' ')
    : defaultEdgeBufferOrder;

  if (edgeBufferOrderList.length === 12) {
    const used = new Set<number>();
    let orderIndex = 0;

    for (let sticker of edgeBufferOrderList) {
      if (!edgeStickerToSlot.hasOwnProperty(sticker)) continue;
      const slot = edgeStickerToSlot[sticker];
      if (used.has(slot)) continue;
      used.add(slot);

      const localOri = edgeStickerToLocalOri[sticker];
      edgeStartingMods[slot] = localOri;
      edgeBuffersNormal[slot] = sticker;
      const otherOri = 1 - localOri;
      edgeBuffersOne[slot] = edgePieceStickers[slot][otherOri];
      orderIndex++;
    }
  }

  // Similar for corners
  let cornerBuffers = [
    cornerPieceStickers.map(a => a[0]),
    cornerPieceStickers.map(a => a[1]),
    cornerPieceStickers.map(a => a[2]),
  ];
  let cornerStartingMods = new Array(8).fill(0);

  const defaultCornerBufferOrder = cornerPieceStickers.map(([n]) => n);
  const cornerBufferOrderList = config.cornerBufferOrder.trim()
    ? config.cornerBufferOrder.split(' ')
    : defaultCornerBufferOrder;

  if (cornerBufferOrderList.length === 8) {
    const used = new Set<number>();

    for (let i = 0; i < cornerBufferOrderList.length; i++) {
      const sticker = cornerBufferOrderList[i];
      if (!cornerStickerToSlot.hasOwnProperty(sticker)) continue;
      const slot = cornerStickerToSlot[sticker];
      if (used.has(slot)) continue;
      used.add(slot);

      const localOri = cornerStickerToLocalOri[sticker];
      cornerStartingMods[slot] = localOri;

      // Set custom buffers by rotating based on localOri
      const standardForSlot = cornerPieceStickers[slot];
      for (let k = 0; k < 3; k++) {
        cornerBuffers[k][slot] = standardForSlot[(k + localOri) % 3];
      }
    }
  }

  // Process edges using buffer order priority
  const edgeCycles: string[][] = [];
  const edgeChange = fresh.patternData['EDGES'];
  const handledEdges = new Set<number>();

  // Create a slot priority order based on buffer order
  const edgeSlotPriority: number[] = [];
  const seenEdgeSlots = new Set<number>();

  for (let bufferSticker of edgeBufferOrderList) {
    if (!edgeStickerToSlot.hasOwnProperty(bufferSticker)) continue;
    const slot = edgeStickerToSlot[bufferSticker];
    if (!seenEdgeSlots.has(slot)) {
      edgeSlotPriority.push(slot);
      seenEdgeSlots.add(slot);
    }
  }

  // Add any remaining slots not in buffer order
  for (let slot = 0; slot < 12; slot++) {
    if (!seenEdgeSlots.has(slot)) {
      edgeSlotPriority.push(slot);
    }
  }

  for (let slot of edgeSlotPriority) {
    if (handledEdges.has(slot)) continue;
    handledEdges.add(slot);

    const pieceInSlot = edgeChange.pieces[slot];
    const slotPieceOrientation = edgeChange.orientation[slot];

    if (pieceInSlot == slot) {
      const effectiveOrientation =
        (slotPieceOrientation + edgeStartingMods[slot]) % 2;
      if (effectiveOrientation == 0) continue;
      edgeCycles.push([edgeBuffersNormal[slot], edgeBuffersOne[slot]]);
      continue;
    }

    let edgeCycle: string[] = [];
    let currentPiece = slot;
    let currentOrientation = edgeStartingMods[slot];
    do {
      handledEdges.add(currentPiece);
      const newOrientation =
        (edgeChange.orientation[currentPiece] + currentOrientation) % 2;
      const nextPieceInSlot = edgeChange.pieces[currentPiece];

      // If currentOrientation matches the starting mod for this piece, use the user's chosen sticker
      // Otherwise, use the opposite sticker
      const sticker =
        currentOrientation === edgeStartingMods[currentPiece]
          ? edgeBuffersNormal[currentPiece]
          : edgeBuffersOne[currentPiece];
      edgeCycle.push(sticker);

      currentOrientation = newOrientation;
      currentPiece = nextPieceInSlot;
    } while (currentPiece != slot);

    edgeCycle.push(edgeCycle.shift()!);
    edgeCycle.reverse();
    edgeCycles.push(edgeCycle);
  }

  const finalEdges = edgeCycles.map(c => c.join('-'));

  // Process corners using buffer order priority
  const cornerCycles: string[][] = [];
  const cornerChange = fresh.patternData['CORNERS'];
  const handledCorners = new Set<number>();

  // Create a slot priority order based on buffer order
  const slotPriority: number[] = [];
  const seenSlots = new Set<number>();

  for (let bufferSticker of cornerBufferOrderList) {
    if (!cornerStickerToSlot.hasOwnProperty(bufferSticker)) continue;
    const slot = cornerStickerToSlot[bufferSticker];
    if (!seenSlots.has(slot)) {
      slotPriority.push(slot);
      seenSlots.add(slot);
    }
  }

  // Add any remaining slots not in buffer order
  for (let slot = 0; slot < 8; slot++) {
    if (!seenSlots.has(slot)) {
      slotPriority.push(slot);
    }
  }

  for (let slot of slotPriority) {
    if (handledCorners.has(slot)) continue;
    handledCorners.add(slot);

    const pieceInSlot = cornerChange.pieces[slot];
    const slotPieceOrientation = cornerChange.orientation[slot];

    if (pieceInSlot == slot) {
      const effectiveOrientation =
        (slotPieceOrientation - cornerStartingMods[slot] + 3) % 3;
      if (effectiveOrientation == 0) continue;
      cornerCycles.push([
        cornerBuffers[0][slot],
        cornerBuffers[effectiveOrientation][slot],
      ]);
      continue;
    }

    let cornerCycle: string[] = [];
    let currentPiece = slot;
    let currentOrientation = cornerStartingMods[slot];
    do {
      handledCorners.add(currentPiece);
      const newOrientation =
        (cornerChange.orientation[currentPiece] + currentOrientation) % 3;
      const nextPieceInSlot = cornerChange.pieces[currentPiece];

      // For corners, we need to adjust the orientation relative to the starting mod
      // If currentOrientation matches the starting mod, use orientation 0 (user's chosen sticker)
      // Otherwise, adjust by the difference from the starting mod
      const adjustedOrientation =
        (currentOrientation - cornerStartingMods[currentPiece] + 3) % 3;
      const sticker = cornerBuffers[adjustedOrientation][currentPiece];
      cornerCycle.push(sticker);

      currentOrientation = newOrientation;
      currentPiece = nextPieceInSlot;
    } while (currentPiece != slot);

    cornerCycle.push(cornerCycle.shift()!);
    cornerCycle.reverse();
    cornerCycles.push(cornerCycle);
  }

  const finalCorners = cornerCycles.map(c => c.join('-'));

  return [...finalEdges, ...finalCorners];
}

// Export functions for use in other parts of the application
export { tryExtractAlg, convertSpeffz, convertCyclesToLetters };

describe('3-cycles extraction', () => {
  it('extracts edge only 3-cycles', () => {
    expect(tryExtractAlg("[L,U S' U']")).toEqual(['UF-LF-LD']);
    expect(tryExtractAlg("[M: [U' M' U,L]]")).toEqual(['UF-UL-BL']);
    expect(tryExtractAlg("[U' l U:[M',U2]]")).toEqual(['UF-LU-BL']);
    expect(tryExtractAlg("[U':[R E' R',U']]")).toEqual(['UF-UL-LB']);
    expect(tryExtractAlg("[S:[U',R E' R']]")).toEqual(['UF-LU-LB']);
    expect(tryExtractAlg("[L':[L',U M2 U']]")).toEqual(['FL-DF-DL']);
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

describe('Letter scheme conversion', () => {
  it('converts edge cycles to default Speffz letters', () => {
    const cycles = ['UF-LF-LD'];
    const letters = convertCyclesToLetters(cycles);
    expect(letters).toEqual(['CFG']);
  });

  it('converts corner cycles to default Speffz letters', () => {
    const cycles = ['UFR-UBR-RDF'];
    const letters = convertCyclesToLetters(cycles);
    expect(letters).toEqual(['CBP']);
  });

  it('converts multiple cycles', () => {
    const cycles = ['UF-LF-LD', 'UFR-UBR-RDF'];
    const letters = convertCyclesToLetters(cycles);
    expect(letters).toEqual(['CFG', 'CBP']);
  });

  it('handles edge flips', () => {
    const cycles = ['UB-BU', 'BR-RB'];
    const letters = convertCyclesToLetters(cycles);
    expect(letters).toEqual(['AQ', 'TN']);
  });

  it('supports custom letter schemes', () => {
    const cycles = ['UF-LF-LD'];
    const customSettings = {
      edgeScheme: 'XYZW123456789ABCDEFGHIJK',
    };
    const letters = convertCyclesToLetters(cycles, customSettings);
    expect(letters).toEqual(['Z23']);
  });

  it('converts individual pieces using convertSpeffz (backwards compatibility)', () => {
    const pieces = ['UF', 'LF', 'LD'];
    const letters = convertSpeffz(pieces);
    expect(letters).toEqual(['C', 'F', 'G']);
  });

  it('handles corner pieces with convertSpeffz', () => {
    const pieces = ['UFR', 'UBR', 'RDF'];
    const letters = convertSpeffz(pieces);
    expect(letters).toEqual(['C', 'B', 'P']);
  });
});

describe('Custom buffer orders', () => {
  it('uses custom edge buffer order', () => {
    const customSettings = {
      edgeBufferOrder: 'RU BU UF LU FD RD BD LD RF LF RB LB',
    };
    const cycles = tryExtractAlg("[L,U S' U']", customSettings);
    // This should extract the same cycle but potentially with different starting point
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('-');
  });

  it('uses custom corner buffer order', () => {
    const customSettings = {
      cornerBufferOrder: 'RUF RUB BUL LUF RDF FDL LDB BDR',
    };
    const cycles = tryExtractAlg("[R' D' R, U]", customSettings);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('-');
  });

  it('handles mixed custom orders', () => {
    const customSettings = {
      edgeBufferOrder: 'FU RU BU LU FD RD BD LD RF LF RB LB',
      cornerBufferOrder: 'FUR BUR LUB FUL FDR LDF BDL RDB',
    };
    const cycles = tryExtractAlg("[U R' U': [R U R', D']]", customSettings);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('demonstrates buffer order affects sticker representation', () => {
    // Default order (UF buffer)
    const defaultCycles = tryExtractAlg("[L,U S' U']");
    expect(defaultCycles).toEqual(['UF-LF-LD']);

    // Custom order with FU buffer instead
    const customCycles = tryExtractAlg("[L,U S' U']", {
      edgeBufferOrder: 'FU UR UB UL DF DR DB DL FR FL BR BL',
    });
    // Should now correctly start with FU since that's the specified buffer
    expect(customCycles.length).toBe(1);
    expect(customCycles[0]).toBe('FU-FL-DL');
  });

  it('demonstrates corner buffer order affects sticker representation', () => {
    // Default corner order (UFR buffer)
    const defaultCycles = tryExtractAlg("[R' D' R, U]");
    expect(defaultCycles).toEqual(['UFR-UBR-RDF']);

    // Custom order with RUF buffer instead (different orientation of same piece)
    const customCycles = tryExtractAlg("[R' D' R, U]", {
      cornerBufferOrder: 'RUF UBR UBL UFL DFR DFL DBL DBR',
    });

    // Should now correctly start with RUF and use consistent orientations throughout
    expect(customCycles.length).toBe(1);
    expect(customCycles[0]).toBe('RUF-RUB-FDR');
  });

  it('order of buffer order matters', () => {
    // Default corner order (UFR buffer)
    const defaultCycles = tryExtractAlg("[R' D' R, U]");
    expect(defaultCycles).toEqual(['UFR-UBR-RDF']);

    const customCycles = tryExtractAlg("[R' D' R, U]", {
      cornerBufferOrder: 'RUB RUF UBL UFL DFR DFL DBL DBR',
    });

    // Should now correctly start with RUB and use consistent orientations throughout
    expect(customCycles.length).toBe(1);
    expect(customCycles[0]).toBe('RUB-FDR-FUR');
  });
});
