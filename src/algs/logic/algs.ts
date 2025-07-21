import { fetchGoogleSheet } from "@/algs/logic/sheets-tools";

export const ALG_SETS = ['UFR Corners', 'UF Edges'] as const;

export type Alg = {
  case: {
    first: string;
    second: string;
  };
  alg: string;
}

export async function getAlgs(set: (typeof ALG_SETS)[number]): Promise<Alg[]> {
  const algs = await fetchGoogleSheet(set);
  return algs.algs.map((alg) => {
    return {
      case: {
        first: alg.case.first,
        second: alg.case.second,
      },
      alg: alg.string!,
    }
  })
}