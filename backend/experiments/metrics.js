function calculatePercentile(arr, p) {
  if (arr.length === 0) return 0;
  if (typeof p !== 'number') throw new TypeError('p must be a number');
  if (p <= 0) return arr[0];
  if (p >= 100) return arr[arr.length - 1];

  const index = (p / 100) * (arr.length - 1);
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;

  if (upper >= arr.length) return arr[lower];
  return arr[lower] * (1 - weight) + arr[upper] * weight;
}

function calculateMetrics(durations, totalTimeMs) {
  if (durations.length === 0) {
    return {
      min_ms: 0,
      max_ms: 0,
      mean_ms: 0,
      median_ms: 0,
      p95_ms: 0,
      p99_ms: 0,
      throughput_rps: 0
    };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  const mean = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = calculatePercentile(sorted, 50);
  const p95 = calculatePercentile(sorted, 95);
  const p99 = calculatePercentile(sorted, 99);

  // Throughput: total successful requests / (total execution time in seconds)
  const throughput_rps = totalTimeMs > 0 ? (durations.length / (totalTimeMs / 1000)) : 0;

  return {
    min_ms: min.toFixed(2),
    max_ms: max.toFixed(2),
    mean_ms: mean.toFixed(2),
    median_ms: median.toFixed(2),
    p95_ms: p95.toFixed(2),
    p99_ms: p99.toFixed(2),
    throughput_rps: throughput_rps.toFixed(2)
  };
}

module.exports = { calculateMetrics };
