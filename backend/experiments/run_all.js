const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.resolve(__dirname, '..');
const DB_ORIGINAL = path.join(BACKEND_DIR, 'smartcare.db');
const DB_EXPERIMENT = path.join(BACKEND_DIR, 'experiment.db');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startBackend(mode) {
  console.log(`\n--- Starting Backend in ${mode} mode ---`);
  // Copy current db to experiment db to ensure consistency
  if (fs.existsSync(DB_ORIGINAL)) {
    fs.copyFileSync(DB_ORIGINAL, DB_EXPERIMENT);
    execSync('node setupDb.js', { cwd: __dirname, stdio: 'inherit' });
  }

  const env = Object.assign({}, process.env, {
    ARCHITECTURE_MODE: mode,
    DB_NAME: 'experiment.db'
  });

  const backendProcess = spawn('node', ['index.js'], {
    cwd: BACKEND_DIR,
    env,
    stdio: ['ignore', 'ignore', 'ignore'] // avoid cluttering output
  });

  return backendProcess;
}

async function checkHealth() {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://localhost:5000/api/health');
      if (res.ok) return true;
    } catch (err) {}
    await wait(1000);
  }
  return false;
}

function runExperiment(mode) {
  console.log(`\n--- Running Experiment for ${mode} ---`);
  execSync(`node runner.js ${mode}`, { cwd: __dirname, stdio: 'inherit' });
}

function runCompare() {
  console.log(`\n--- Comparing Results ---`);
  execSync(`node compare.js`, { cwd: __dirname, stdio: 'inherit' });
}

async function main() {
  const NUM_RUNS = 3;
  for (let run = 1; run <= NUM_RUNS; run++) {
    console.log(`\n\n========================================`);
    console.log(`======== STARTING RUN ${run} OF ${NUM_RUNS} ========`);
    console.log(`========================================`);

    // Step 1: Run B1
    let backend = startBackend('B1');
    const isB1Healthy = await checkHealth();
    if (!isB1Healthy) {
      console.error('B1 Backend failed to start');
      backend.kill();
      process.exit(1);
    }
    runExperiment('B1');
    backend.kill();
    await wait(2000);

    // Step 2: Run B2
    backend = startBackend('B2');
    const isB2Healthy = await checkHealth();
    if (!isB2Healthy) {
      console.error('B2 Backend failed to start');
      backend.kill();
      process.exit(1);
    }
    runExperiment('B2');
    backend.kill();
    await wait(2000);
  }

  // Cleanup
  if (fs.existsSync(DB_EXPERIMENT)) {
    fs.unlinkSync(DB_EXPERIMENT);
  }
}

main().catch(console.error);
