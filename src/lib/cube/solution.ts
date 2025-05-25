import { Penalty, Solve } from '../db';
import { AnalysisResult } from './dnfAnalyser';

export function convertTimeToText(time: number) {
  if (time == -1) return 'DNF';

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const hundredths = Math.floor((time % 1000) / 10);

  let res = minutes > 0 ? `${minutes}:` : '';
  res += `${seconds < 10 && minutes > 0 ? '0' : ''}${seconds}.`;
  res += `${hundredths < 10 ? '0' : ''}${hundredths}`;

  return res;
}

export function convertSolveToText(solve: Solve) {
  if (solve.penalty === Penalty.DNF) return 'DNF';

  const isPlusTwo = solve.penalty === Penalty.PLUS_TWO;
  const time = isPlusTwo ? solve.time + 2000 : solve.time;
  const text = convertTimeToText(time);

  if (solve.penalty === Penalty.PLUS_TWO) return text + '+';
  else return text;
}

export function DNFReasonShorthand(dnfResult: string | undefined) {
  if (dnfResult === AnalysisResult.SOLVED) return '';
  if (dnfResult === AnalysisResult.NO_MOVES) return 'No Moves';
  if (dnfResult === AnalysisResult.PLUS_TWO) return '+2';
  if (dnfResult === AnalysisResult.UNKNOWN) return 'Unknown';
  if (dnfResult === AnalysisResult.ONE_MOVE) return '1 Move';
  if (dnfResult === AnalysisResult.MISSED_TWIST) return 'Twist';
  if (dnfResult === AnalysisResult.MISSED_FLIP) return 'Flip';
  if (dnfResult === AnalysisResult.INVERSE_ALG) return 'Inverse';
  return '';
}
