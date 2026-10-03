const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');

if (!fs.existsSync(RESULTS_DIR)) {
  console.log('No results directory found.');
  process.exit(1);
}

const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));

let b1Files = files.filter(f => f.includes('_B1_')).sort().reverse();
let b2Files = files.filter(f => f.includes('_B2_')).sort().reverse();

if (b1Files.length === 0 || b2Files.length === 0) {
  console.log('Experiment not yet executed for both modes. Need at least one B1 and one B2 result.');
  process.exit(1);
}

// Compare the latest of each
const b1Latest = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, b1Files[0]), 'utf8'));
const b2Latest = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, b2Files[0]), 'utf8'));

const comparison = [];

for (const b1Row of b1Latest) {
  const b2Row = b2Latest.find(r => r.workload_name === b1Row.workload_name);
  if (!b2Row) continue;

  const b1Time = parseFloat(b1Row.mean_ms);
  const b2Time = parseFloat(b2Row.mean_ms);
  let timeOverhead = 0;
  if (b1Time > 0) {
    timeOverhead = ((b2Time - b1Time) / b1Time) * 100;
  }

  const b1Throughput = parseFloat(b1Row.throughput_rps);
  const b2Throughput = parseFloat(b2Row.throughput_rps);
  let throughputOverhead = 0;
  if (b1Throughput > 0) {
    throughputOverhead = ((b2Throughput - b1Throughput) / b1Throughput) * 100; // usually negative if B2 is slower
  }

  comparison.push({
    workload: b1Row.workload_name,
    B1_mean_ms: b1Time.toFixed(2),
    B2_mean_ms: b2Time.toFixed(2),
    overhead_pct: timeOverhead.toFixed(2),
    B1_throughput: b1Throughput.toFixed(2),
    B2_throughput: b2Throughput.toFixed(2),
    throughput_diff_pct: throughputOverhead.toFixed(2)
  });
}

const comparisonFilename = path.join(RESULTS_DIR, `comparison_${Date.now()}.json`);
fs.writeFileSync(comparisonFilename, JSON.stringify(comparison, null, 2));

console.log('B1 vs B2');
console.table(comparison);
console.log(`\nComparison saved to ${comparisonFilename}`);
