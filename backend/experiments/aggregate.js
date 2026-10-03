const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw');
const PROCESSED_DIR = path.join(__dirname, 'processed');

if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

function readAllRuns(mode) {
  const dir = path.join(RAW_DIR, mode);
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const runs = files.map(f => {
    return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  });
  return runs;
}

function aggregateRuns(runs) {
  if (runs.length === 0) return {};

  const workloads = {};

  // Group by workload
  runs.forEach(runData => {
    runData.forEach(result => {
      const wName = result.workload_name;
      if (!workloads[wName]) {
        workloads[wName] = {
          workload_name: wName,
          architecture_mode: result.architecture_mode,
          runs_count: 0,
          request_count: result.request_count,
          concurrency: result.concurrency,
          mean_ms_sum: 0,
          median_ms_sum: 0,
          p95_ms_sum: 0,
          p99_ms_sum: 0,
          throughput_sum: 0,
          successful_requests_sum: 0,
          failed_requests_sum: 0,
          raw_means: [] // for standard deviation calculation
        };
      }

      workloads[wName].runs_count += 1;
      workloads[wName].mean_ms_sum += parseFloat(result.mean_ms);
      workloads[wName].median_ms_sum += parseFloat(result.median_ms);
      workloads[wName].p95_ms_sum += parseFloat(result.p95_ms);
      workloads[wName].p99_ms_sum += parseFloat(result.p99_ms);
      workloads[wName].throughput_sum += parseFloat(result.throughput_rps);
      workloads[wName].successful_requests_sum += result.successful_requests;
      workloads[wName].failed_requests_sum += result.failed_requests;
      workloads[wName].raw_means.push(parseFloat(result.mean_ms));
    });
  });

  const aggregated = {};
  for (const [wName, data] of Object.entries(workloads)) {
    const n = data.runs_count;
    const mean = data.mean_ms_sum / n;
    
    // Calculate std dev
    let variance = 0;
    data.raw_means.forEach(m => {
      variance += Math.pow(m - mean, 2);
    });
    variance /= n;
    const stdDev = Math.sqrt(variance);

    aggregated[wName] = {
      workload_name: wName,
      architecture_mode: data.architecture_mode,
      runs_count: n,
      request_count: data.request_count,
      concurrency: data.concurrency,
      mean_ms: mean.toFixed(2),
      std_dev_ms: stdDev.toFixed(2),
      cv_pct: ((stdDev / mean) * 100).toFixed(2), // Coefficient of variation
      median_ms: (data.median_ms_sum / n).toFixed(2),
      p95_ms: (data.p95_ms_sum / n).toFixed(2),
      p99_ms: (data.p99_ms_sum / n).toFixed(2),
      throughput_rps: (data.throughput_sum / n).toFixed(2),
      successful_requests: data.successful_requests_sum,
      failed_requests: data.failed_requests_sum,
      error_rate: ((data.failed_requests_sum / (data.request_count * n)) * 100).toFixed(2)
    };
  }
  return aggregated;
}

function compareAggregates(aggB1, aggB2) {
  const comparison = [];
  for (const wName of Object.keys(aggB1)) {
    if (!aggB2[wName]) continue;

    const b1 = aggB1[wName];
    const b2 = aggB2[wName];

    const meanB1 = parseFloat(b1.mean_ms);
    const meanB2 = parseFloat(b2.mean_ms);
    const overheadPct = (((meanB2 - meanB1) / meanB1) * 100).toFixed(2);

    const tpB1 = parseFloat(b1.throughput_rps);
    const tpB2 = parseFloat(b2.throughput_rps);
    const tpDiff = (tpB2 - tpB1).toFixed(2);
    const tpDiffPct = (((tpB2 - tpB1) / tpB1) * 100).toFixed(2);

    comparison.push({
      workload: wName,
      runs_count: b1.runs_count,
      B1_mean_ms: b1.mean_ms,
      B1_std_dev_ms: b1.std_dev_ms,
      B1_cv_pct: b1.cv_pct,
      B2_mean_ms: b2.mean_ms,
      B2_std_dev_ms: b2.std_dev_ms,
      B2_cv_pct: b2.cv_pct,
      latency_overhead_pct: overheadPct,
      B1_throughput_rps: b1.throughput_rps,
      B2_throughput_rps: b2.throughput_rps,
      throughput_diff: tpDiff,
      throughput_diff_pct: tpDiffPct
    });
  }
  return comparison;
}

function saveProcessedData(mode, data) {
  const jsonPath = path.join(PROCESSED_DIR, `aggregated_${mode}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  // Also save CSV
  if (Object.keys(data).length > 0) {
    const keys = Object.keys(Object.values(data)[0]);
    let csv = keys.join(',') + '\n';
    for (const val of Object.values(data)) {
      csv += keys.map(k => val[k]).join(',') + '\n';
    }
    fs.writeFileSync(path.join(PROCESSED_DIR, `aggregated_${mode}.csv`), csv);
  }
}

function main() {
  const runsB1 = readAllRuns('B1');
  const runsB2 = readAllRuns('B2');

  const aggB1 = aggregateRuns(runsB1);
  const aggB2 = aggregateRuns(runsB2);

  saveProcessedData('B1', aggB1);
  saveProcessedData('B2', aggB2);

  const comparison = compareAggregates(aggB1, aggB2);
  const compJsonPath = path.join(PROCESSED_DIR, 'comparison_summary.json');
  fs.writeFileSync(compJsonPath, JSON.stringify(comparison, null, 2));

  // Save comparison CSV
  if (comparison.length > 0) {
    const keys = Object.keys(comparison[0]);
    let csv = keys.join(',') + '\n';
    for (const val of comparison) {
      csv += keys.map(k => val[k]).join(',') + '\n';
    }
    fs.writeFileSync(path.join(PROCESSED_DIR, 'comparison_summary.csv'), csv);
  }

  console.log("Processed aggregation successfully.");
  console.table(comparison.map(c => ({
    Workload: c.workload,
    'B1 Mean (ms)': c.B1_mean_ms,
    'B2 Mean (ms)': c.B2_mean_ms,
    'Overhead %': c.latency_overhead_pct,
    'B1 RPS': c.B1_throughput_rps,
    'B2 RPS': c.B2_throughput_rps,
    'RPS Diff %': c.throughput_diff_pct
  })));
}

main();
