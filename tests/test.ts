import { analyseSolveString } from '@/lib/analysis/dnfAnalyser';

const solution =
  "U L' D U' F U U F' U D' L U F' B L' U R' L F' F' R L' U L F B' U' R' U' R L' B B B' B R B' L R' U U U R' F' R F' B U' U' F B' R F R U' U L' D U' D U' R U' R' D U' D U' L B F' U L' R B' L' B L R' U' L F B' D' U R U' F' F' U R' U' R F' F' R' D D R' D R U' R' D' R D' R' R U R' D U R D R' U U R D' R' U D' R L U U R' U L' U U R U' R' U U R L U L' U R' D R U' R' D' R U' D' R D' R' U R D R' D";
const scramble = "U' B' L2 U D2 B' U2 R D' L2 F2 D B2 U2 R2 D F2 U' R U";

const analysis = await analyseSolveString(scramble, solution);
console.log(analysis);
