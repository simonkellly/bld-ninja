import { db } from "@/lib/db";

function formatTime(timeInSeconds: number): string {
  return timeInSeconds.toFixed(2) + 's';
}

function formatTimeRange(median: number, min: number, max: number): string {
  return `${formatTime(median)} (${formatTime(min)} - ${formatTime(max)})`;
}

function formatFastestTimeRange(min: number, max: number): string {
  if (min === max) {
    return formatTime(min); // Only one result, no range needed
  }
  return `${formatTime(min)} (${formatTime(min)} - ${formatTime(max)})`;
}

function printAlgorithmReport(algorithms: any[], title: string) {
  console.log(`\n=== ${title} ===`);
  console.log(`Found ${algorithms.length} algorithms with 2+ occurrences\n`);
  
  if (algorithms.length === 0) {
    console.log("No algorithms found with sufficient data.\n");
    return;
  }
  
  // Sort by median time ascending
  const sortedAlgs = algorithms.sort((a, b) => a.medianTime - b.medianTime);
  
  console.log("Rank | Algorithm | Count | Median Time (Range)");
  console.log("-----|-----------|-------|--------------------");
  
  if (sortedAlgs.length <= 20) {
    // Show all algorithms
    sortedAlgs.forEach((alg, index) => {
      const rank = (index + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatTimeRange(alg.medianTime, minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    });
  } else {
    // Show first 10, then "...", then last 10
    for (let i = 0; i < 10; i++) {
      const alg = sortedAlgs[i];
      const rank = (i + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatTimeRange(alg.medianTime, minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    }
    
    console.log(" ... | ...                       |   ... |                       ...");
    
    for (let i = sortedAlgs.length - 10; i < sortedAlgs.length; i++) {
      const alg = sortedAlgs[i];
      const rank = (i + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatTimeRange(alg.medianTime, minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    }
  }
  
  console.log("");
}

function printFastestTimeReport(algorithms: any[], title: string) {
  console.log(`\n=== ${title} - FASTEST TIMES ===`);
  console.log(`Found ${algorithms.length} algorithms with 1+ occurrences\n`);
  
  if (algorithms.length === 0) {
    console.log("No algorithms found.\n");
    return;
  }
  
  // Sort by fastest time ascending
  const sortedAlgs = algorithms.sort((a, b) => {
    const aMin = Math.min(...a.allTimes);
    const bMin = Math.min(...b.allTimes);
    return aMin - bMin;
  });
  
  console.log("Rank | Algorithm | Count | Fastest Time (Range)");
  console.log("-----|-----------|-------|---------------------");
  
  if (sortedAlgs.length <= 20) {
    // Show all algorithms
    sortedAlgs.forEach((alg, index) => {
      const rank = (index + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatFastestTimeRange(minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    });
  } else {
    // Show first 10, then "...", then last 10
    for (let i = 0; i < 10; i++) {
      const alg = sortedAlgs[i];
      const rank = (i + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatFastestTimeRange(minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    }
    
    console.log(" ... | ...                       |   ... |                       ...");
    
    for (let i = sortedAlgs.length - 10; i < sortedAlgs.length; i++) {
      const alg = sortedAlgs[i];
      const rank = (i + 1).toString().padStart(4);
      const algorithm = alg.algorithm.padEnd(25);
      const count = alg.count.toString().padStart(5);
      const minTime = Math.min(...alg.allTimes);
      const maxTime = Math.max(...alg.allTimes);
      const timeRange = formatFastestTimeRange(minTime, maxTime).padStart(25);
      console.log(`${rank} | ${algorithm} | ${count} | ${timeRange}`);
    }
  }
  
  console.log("");
}

async function analyse() {
  const solves = await db.solves.toArray();

  const algs = solves.map(s => s.algs).flat();
  // go through algs, and then make a list of algs, count appearnaces, and median time to execute
  
  // Create a map to track algorithm statistics
  const algStats = new Map<string, { count: number; times: number[]; type: string }>();
  
  // Process each solve to extract algorithm timing data
  for (const solve of solves) {
    if (!solve.algs || !solve.solution) continue;
    
    let time = solve.solution[0]?.cubeTimestamp ?? 0;
    
    for (const alg of solve.algs) {
      const [algString, algType, moveIdx] = alg;
      
      // Calculate execution time for this algorithm instance
      const algTime = ((solve.solution[moveIdx]?.cubeTimestamp ?? 0) - time) / 1000;
      time = solve.solution[moveIdx]?.cubeTimestamp ?? 0;
      
      // Only include valid positive times
      if (algTime > 0) {
        if (!algStats.has(algString)) {
          algStats.set(algString, { count: 0, times: [], type: algType });
        }
        
        const stats = algStats.get(algString)!;
        stats.count++;
        stats.times.push(algTime);
      }
    }
  }
  
  // Calculate median times and create final results
  const algAnalysis = Array.from(algStats.entries()).map(([alg, stats]) => {
    // Sort times to calculate median
    const sortedTimes = stats.times.slice().sort((a, b) => a - b);
    const medianTime = sortedTimes.length > 0 
      ? sortedTimes.length % 2 === 0
        ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
        : sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0;
    
    return {
      algorithm: alg,
      type: stats.type,
      count: stats.count,
      medianTime: medianTime,
      allTimes: stats.times
    };
  });
  
  // Filter algorithms with at least 2 results
  const algorithmsWithSufficientData = algAnalysis.filter(alg => alg.count >= 2);
  
  // Separate by algorithm type
  const edgeAlgorithms = algorithmsWithSufficientData.filter(alg => alg.type === 'Edge');
  const cornerAlgorithms = algorithmsWithSufficientData.filter(alg => alg.type === 'Corner');
  
  // For fastest time reports, include all algorithms with 1+ occurrences
  const allAlgorithmsForFastest = algAnalysis.filter(alg => alg.count >= 1);
  const edgeAlgorithmsForFastest = allAlgorithmsForFastest.filter(alg => alg.type === 'Edge');
  const cornerAlgorithmsForFastest = allAlgorithmsForFastest.filter(alg => alg.type === 'Corner');
  
  // Print reports
  console.log("\n🔍 ALGORITHM PERFORMANCE ANALYSIS");
  console.log("================================");
  
  printAlgorithmReport(edgeAlgorithms, "EDGE ALGORITHMS");
  printAlgorithmReport(cornerAlgorithms, "CORNER ALGORITHMS");
  printFastestTimeReport(edgeAlgorithmsForFastest, "EDGE ALGORITHMS");
  printFastestTimeReport(cornerAlgorithmsForFastest, "CORNER ALGORITHMS");
  
  console.log(`📊 Summary: Analyzed ${solves.length} solves`);
  console.log(`   • ${edgeAlgorithms.length} edge algorithms with 2+ occurrences`);
  console.log(`   • ${cornerAlgorithms.length} corner algorithms with 2+ occurrences`);
  console.log(`   • ${edgeAlgorithmsForFastest.length} edge algorithms total (including single occurrences)`);
  console.log(`   • ${cornerAlgorithmsForFastest.length} corner algorithms total (including single occurrences)`);
  
  return algAnalysis;
}

export default function setup() {
  (globalThis as any).analyse = analyse;
}