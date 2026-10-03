const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '../raw');
const PROCESSED_DIR = path.join(__dirname, '../processed');

if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

function readAllRuns(mode) {
  const dir = path.join(RAW_DIR, mode);
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
}

function aggregateRaw(runs) {
  if (runs.length === 0) return {};

  const workloads = {};

  runs.forEach(runData => {
    runData.forEach(result => {
      const wName = result.workload_name;
      if (!workloads[wName]) {
        workloads[wName] = {
          raw_means: [],
          raw_medians: [],
          raw_p95: [],
          raw_p99: [],
          raw_min: [],
          raw_max: [],
          raw_throughput: []
        };
      }
      
      workloads[wName].raw_means.push(parseFloat(result.mean_ms));
      workloads[wName].raw_medians.push(parseFloat(result.median_ms));
      workloads[wName].raw_p95.push(parseFloat(result.p95_ms));
      workloads[wName].raw_p99.push(parseFloat(result.p99_ms));
      workloads[wName].raw_min.push(parseFloat(result.min_ms));
      workloads[wName].raw_max.push(parseFloat(result.max_ms));
      workloads[wName].raw_throughput.push(parseFloat(result.throughput_rps));
    });
  });

  const aggregated = {};
  for (const [wName, data] of Object.entries(workloads)) {
    const n = data.raw_means.length;
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    const mean = avg(data.raw_means);
    const median = avg(data.raw_medians);
    const p95 = avg(data.raw_p95);
    const p99 = avg(data.raw_p99);
    const min = Math.min(...data.raw_min);
    const max = Math.max(...data.raw_max);
    const throughput = avg(data.raw_throughput);
    
    let variance = 0;
    data.raw_means.forEach(m => {
      variance += Math.pow(m - mean, 2);
    });
    variance /= n;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    aggregated[wName] = {
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      stdDev: stdDev.toFixed(2),
      cv: cv.toFixed(2),
      throughput: throughput.toFixed(2)
    };
  }
  return aggregated;
}

const runsB1 = readAllRuns('B1');
const runsB2 = readAllRuns('B2');

const aggB1 = aggregateRaw(runsB1);
const aggB2 = aggregateRaw(runsB2);

const researchAnalysis = [];
let csvLines = ["Workload,B1 Mean,B2 Mean,Latency Difference,Latency Overhead %,B1 Throughput,B2 Throughput,Throughput Change %"];
let detailedCsvLines = ["Workload,B1 Median,B2 Median,B1 P95,B2 P95,B1 P99,B2 P99,B1 Min,B2 Min,B1 Max,B2 Max,B1 StdDev,B2 StdDev,B1 CV,B2 CV"];

for (const wName of Object.keys(aggB1)) {
  if (!aggB2[wName]) continue;
  
  const b1 = aggB1[wName];
  const b2 = aggB2[wName];
  
  const meanB1 = parseFloat(b1.mean);
  const meanB2 = parseFloat(b2.mean);
  const latencyDiff = (meanB2 - meanB1).toFixed(2);
  const overheadPct = (((meanB2 - meanB1) / meanB1) * 100).toFixed(2);
  
  const tpB1 = parseFloat(b1.throughput);
  const tpB2 = parseFloat(b2.throughput);
  const tpDiff = (tpB2 - tpB1).toFixed(2);
  const tpDiffPct = (((tpB2 - tpB1) / tpB1) * 100).toFixed(2);
  
  researchAnalysis.push({
    workload: wName,
    B1: b1,
    B2: b2,
    latency_difference: latencyDiff,
    latency_overhead_pct: overheadPct,
    throughput_difference: tpDiff,
    throughput_change_pct: tpDiffPct
  });

  csvLines.push(`${wName},${b1.mean},${b2.mean},${latencyDiff},${overheadPct},${b1.throughput},${b2.throughput},${tpDiffPct}`);
  detailedCsvLines.push(`${wName},${b1.median},${b2.median},${b1.p95},${b2.p95},${b1.p99},${b2.p99},${b1.min},${b2.min},${b1.max},${b2.max},${b1.stdDev},${b2.stdDev},${b1.cv},${b2.cv}`);
}

fs.writeFileSync(path.join(PROCESSED_DIR, 'research_analysis.json'), JSON.stringify(researchAnalysis, null, 2));
fs.writeFileSync(path.join(PROCESSED_DIR, 'research_tables.csv'), csvLines.join('\n') + '\n\n' + detailedCsvLines.join('\n'));

console.log("Research analysis completed.");
