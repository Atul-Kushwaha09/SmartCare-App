const fs = require('fs');
const path = require('path');
const config = require('./config');
const workloads = require('./workloads');
const { calculateMetrics } = require('./metrics');

// We will create mode-specific directories later
let tokens = {
  patient: null,
  doctor: null
};

async function authenticate() {
  console.log('Authenticating users...');
  
  // Patient
  let res = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config.credentials.patient)
  });
  let data = await res.json();
  if (data.token) {
    tokens.patient = data.token;
  } else {
    throw new Error('Failed to authenticate patient: ' + JSON.stringify(data));
  }

  // Doctor
  res = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config.credentials.doctor)
  });
  data = await res.json();
  if (data.token) {
    tokens.doctor = data.token;
  } else {
    throw new Error('Failed to authenticate doctor: ' + JSON.stringify(data));
  }
}

async function executeRequest(workload) {
  const url = `${config.baseUrl}${workload.endpoint}`;
  const options = {
    method: workload.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (workload.requiresAuth) {
    options.headers['Authorization'] = `Bearer ${tokens[workload.role]}`;
  }

  if (workload.getBody) {
    options.body = JSON.stringify(workload.getBody());
  }

  const start = process.hrtime.bigint();
  
  try {
    const response = await fetch(url, options);
    // consume body to ensure request completes
    const _ = await response.text(); 
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    
    return {
      success: response.ok,
      status: response.status,
      durationMs
    };
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    return {
      success: false,
      status: 0,
      durationMs,
      error: err.message
    };
  }
}

async function runWorkload(workload, mode) {
  console.log(`\n--- Running workload: ${workload.name} ---`);
  
  // Warmup
  console.log(`Warming up (${config.experimentParams.WARMUP_REQUESTS} requests)...`);
  for (let i = 0; i < config.experimentParams.WARMUP_REQUESTS; i++) {
    await executeRequest(workload);
  }

  // Actual
  console.log(`Executing ${config.experimentParams.REQUEST_COUNT} requests with concurrency ${config.experimentParams.CONCURRENCY}...`);
  
  const results = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const totalStartTime = process.hrtime.bigint();
  
  // Execute in batches based on concurrency
  for (let i = 0; i < config.experimentParams.REQUEST_COUNT; i += config.experimentParams.CONCURRENCY) {
    const batchSize = Math.min(config.experimentParams.CONCURRENCY, config.experimentParams.REQUEST_COUNT - i);
    const promises = [];
    for (let j = 0; j < batchSize; j++) {
      promises.push(executeRequest(workload));
    }
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      results.push(r.durationMs);
      if (r.success) successfulRequests++;
      else failedRequests++;
    }
  }

  const totalEndTime = process.hrtime.bigint();
  const totalExecutionTimeMs = Number(totalEndTime - totalStartTime) / 1_000_000;

  const metrics = calculateMetrics(results, totalExecutionTimeMs);
  
  return {
    workload_name: workload.name,
    architecture_mode: mode,
    request_count: config.experimentParams.REQUEST_COUNT,
    concurrency: config.experimentParams.CONCURRENCY,
    successful_requests: successfulRequests,
    failed_requests: failedRequests,
    error_rate: ((failedRequests / config.experimentParams.REQUEST_COUNT) * 100).toFixed(2),
    ...metrics,
    timestamp: new Date().toISOString()
  };
}

async function getSystemMetrics() {
  try {
    const res = await fetch(`${config.baseUrl}/api/health`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching system metrics', err);
    return null;
  }
}

async function main() {
  const mode = process.argv[2];
  if (!mode || (mode !== 'B1' && mode !== 'B2')) {
    console.error('Usage: node runner.js <B1|B2>');
    process.exit(1);
  }

  console.log(`Starting experiment in ${mode} mode...`);

  // Verify health
  try {
    const health = await fetch(`${config.baseUrl}/api/health`);
    if (!health.ok) throw new Error('Backend not ready');
    console.log('Backend health verified.');
  } catch (err) {
    console.error('Backend is not reachable. Ensure it is running.', err.message);
    process.exit(1);
  }

  await authenticate();

  const allResults = [];
  const sysMetricsBefore = await getSystemMetrics();
  
  for (const workload of workloads) {
    const result = await runWorkload(workload, mode);
    allResults.push(result);
  }
  
  const sysMetricsAfter = await getSystemMetrics();

  // Calculate simple diff for metrics
  let cpuAvg = 0;
  let cpuPeak = 0;
  let memAvg = 0;
  let memPeak = 0;

  if (sysMetricsBefore && sysMetricsAfter) {
    const cpuDiffUser = sysMetricsAfter.cpu.user - sysMetricsBefore.cpu.user;
    const cpuDiffSystem = sysMetricsAfter.cpu.system - sysMetricsBefore.cpu.system;
    const uptimeDiff = sysMetricsAfter.uptime - sysMetricsBefore.uptime;
    
    // microseconds to seconds
    const totalCpuTimeSeconds = (cpuDiffUser + cpuDiffSystem) / 1_000_000;
    // approximate avg cpu utilization % across the test duration
    cpuAvg = uptimeDiff > 0 ? (totalCpuTimeSeconds / uptimeDiff) * 100 : 0;
    cpuPeak = cpuAvg; // Hard to measure peak exactly without polling during the run, approximation
    
    memAvg = (sysMetricsBefore.memory.rss + sysMetricsAfter.memory.rss) / 2;
    memPeak = sysMetricsAfter.memory.rss; // Assumption: grows over time
  }

  const finalReport = allResults.map(r => ({
    ...r,
    cpu_avg: cpuAvg.toFixed(2),
    cpu_peak: cpuPeak.toFixed(2),
    memory_avg: memAvg,
    memory_peak: memPeak
  }));

  const resultsDir = path.join(__dirname, 'raw', mode);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const jsonFilename = path.join(resultsDir, `experiment_${mode}_${timestamp}.json`);
  fs.writeFileSync(jsonFilename, JSON.stringify(finalReport, null, 2));

  let csvContent = 'workload_name,architecture_mode,request_count,concurrency,successful_requests,failed_requests,error_rate,min_ms,max_ms,mean_ms,median_ms,p95_ms,p99_ms,throughput_rps,cpu_avg,cpu_peak,memory_avg,memory_peak\n';
  finalReport.forEach(r => {
    csvContent += `${r.workload_name},${r.architecture_mode},${r.request_count},${r.concurrency},${r.successful_requests},${r.failed_requests},${r.error_rate},${r.min_ms},${r.max_ms},${r.mean_ms},${r.median_ms},${r.p95_ms},${r.p99_ms},${r.throughput_rps},${r.cpu_avg},${r.cpu_peak},${r.memory_avg},${r.memory_peak}\n`;
  });
  
  const csvFilename = path.join(resultsDir, `experiment_${mode}_${timestamp}.csv`);
  fs.writeFileSync(csvFilename, csvContent);
  
  console.log(`\nExperiment completed. Results saved to ${jsonFilename} and .csv`);
}

main().catch(console.error);
