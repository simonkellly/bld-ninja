import { Alg as CubingAlg } from "cubing/alg";
import { z } from "zod";

const SHEET_ID = "1NEYh8MeTqHwnwA4s_CAYBGWU76pqdlutxR0SA2hNZKk";
const SHEET_NAME = "UFR Corners";

const letter = z.string().length(1);

const letterPair = z.object({
  first: letter,
  second: letter,
})

const alg = z.object({
  case: letterPair,
  alg: z.string(),
})

type Alg = z.infer<typeof alg>;

const algSet = z.record(letter, alg);

type AlgSet = z.infer<typeof algSet>;

const algCollection = z.record(letter, algSet);

type AlgCollection = z.infer<typeof algCollection>;

export const algSheet = z.object({
  letters: z.array(letter),
  algs: algCollection,
});

export type AlgSheet = z.infer<typeof algSheet>;

function getAlgFromInverse(first: string, second: string, algArray: AlgCollection): Alg {
  const algSet = algArray[second];
  if (algSet == undefined) {
    throw new Error(`No inverse for ${first}${second}`);
  }
  const alg = algSet[first];
  if (alg == undefined) {
    throw new Error(`No inverse for ${first}${second}`);
  }
  return { case: { first, second }, alg: new CubingAlg(alg.alg).invert().toString() }
}

export async function fetchGoogleSheet(): Promise<AlgSheet> {
  const apiURL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_NAME}`;
  const sheetReq = await fetch(apiURL);
  const sheetData = await sheetReq.text();

  const sheetTrimmed = sheetData
    .split("\n", 2)[1]
    .replace(/google.visualization.Query.setResponse\(|\);/g, "");
  const data = JSON.parse(sheetTrimmed);

  const rows = data.table.rows.slice(1);

  const firstLetters: string[] = data.table.rows[0].c
    .slice(1)
    .map((cell: { v: string }) => cell?.v?.substring(0, 1));
  const secondLetters = rows
    .slice(1)
    .map((row: { c: { v: string }[] }) => row?.c[0]?.v?.substring(0, 1));

  const algArray: AlgCollection = {};

  firstLetters.forEach((firstLetter: string, firstIndex: number) => {
    const algSet: AlgSet = {};
    secondLetters.forEach((secondLetter: string, secondIndex: number) => {
      const alg = rows[secondIndex + 1].c[firstIndex + 1]?.v;
      if (alg != undefined) {
        algSet[secondLetter] = { case: { first: firstLetter, second: secondLetter }, alg };
      }
    });
    algArray[firstLetter] = algSet;
  });

  const inverses: AlgCollection = {};
    for (const first in algArray) {
      for (const second in algArray[first]) {
        if (
          algArray[second] == undefined || algArray[second][first] == undefined
        )
        inverses[second] ??= {};
        inverses[second][first] = getAlgFromInverse(second, first, algArray);
      }
    }

    for (const first in inverses) {
      for (const second in inverses[first]) {
        algArray[first] ??= {};
        algArray[first][second] = inverses[first][second];
      }
    }

  return {
    letters: firstLetters,
    algs: algArray,
  };
}