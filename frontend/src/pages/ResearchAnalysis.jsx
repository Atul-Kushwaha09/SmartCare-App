import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import researchData from '../data/research_analysis.json';

const ResearchAnalysis = () => {
  const [data, setData] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Process data for charts
    const formattedData = researchData.map(item => ({
      name: item.workload,
      B1_Mean: parseFloat(item.B1.mean),
      B2_Mean: parseFloat(item.B2.mean),
      B1_Median: parseFloat(item.B1.median),
      B2_Median: parseFloat(item.B2.median),
      B1_P95: parseFloat(item.B1.p95),
      B2_P95: parseFloat(item.B2.p95),
      B1_Throughput: parseFloat(item.B1.throughput),
      B2_Throughput: parseFloat(item.B2.throughput),
      Latency_Overhead_Pct: parseFloat(item.latency_overhead_pct),
      Throughput_Change_Pct: parseFloat(item.throughput_change_pct)
    }));
    setData(formattedData);
  }, []);

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-20 text-red-600 text-xl">Access Denied. Only authorized researchers/admins can view this page.</div>;
  }

  const getHighestLatencyOverhead = () => {
    if (!data.length) return { name: 'N/A', val: 0 };
    return data.reduce((max, item) => (item.Latency_Overhead_Pct > max.val ? { name: item.name, val: item.Latency_Overhead_Pct } : max), { name: '', val: -Infinity });
  };

  const getLargestThroughputDecrease = () => {
    if (!data.length) return { name: 'N/A', val: 0 };
    return data.reduce((min, item) => (item.Throughput_Change_Pct < min.val ? { name: item.name, val: item.Throughput_Change_Pct } : min), { name: '', val: Infinity });
  };

  const highestOverhead = getHighestLatencyOverhead();
  const largestTpDecrease = getLargestThroughputDecrease();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">SmartCare Research Analysis</h1>
        <p className="text-xl text-gray-600 mt-2">Performance and Security Trade-off Analysis of Privacy-Preserving Cloud-Based Telemedicine Architectures</p>
        <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded">
          Research prototype — results are environment-specific
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Experiment Configuration</h2>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Architecture:</strong> B1 (Baseline) vs B2 (Privacy-Preserving)</li>
            <li><strong>Requests per workload per run:</strong> 100</li>
            <li><strong>Concurrency:</strong> 10</li>
            <li><strong>Warm-up:</strong> 10 requests</li>
            <li><strong>Independent runs:</strong> 3</li>
            <li><strong>Database:</strong> SQLite</li>
            <li><strong>Environment:</strong> Local Windows Node.js</li>
            <li><strong>Dataset:</strong> Synthetic/Demo</li>
            <li><strong>Experiment date:</strong> 2026-10-03</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Summary Cards</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded text-center">
              <div className="text-sm text-gray-500">Workloads Tested</div>
              <div className="text-2xl font-bold text-blue-700">{data.length}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded text-center">
              <div className="text-sm text-gray-500">Total Requests per Architecture</div>
              <div className="text-2xl font-bold text-blue-700">{data.length * 100 * 3}</div>
            </div>
            <div className="bg-red-50 p-4 rounded text-center col-span-2">
              <div className="text-sm text-gray-500">Highest Latency Overhead</div>
              <div className="text-xl font-bold text-red-700">{highestOverhead.name} (+{highestOverhead.val}%)</div>
            </div>
            <div className="bg-red-50 p-4 rounded text-center col-span-2">
              <div className="text-sm text-gray-500">Largest Throughput Decrease</div>
              <div className="text-xl font-bold text-red-700">{largestTpDecrease.name} ({largestTpDecrease.val}%)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Visualizations</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">Mean Latency (ms)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="B1_Mean" fill="#8884d8" name="B1 Mean (ms)" />
                <Bar dataKey="B2_Mean" fill="#82ca9d" name="B2 Mean (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">Median Latency (ms)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="B1_Median" fill="#8884d8" name="B1 Median (ms)" />
                <Bar dataKey="B2_Median" fill="#82ca9d" name="B2 Median (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">P95 Latency (ms)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="B1_P95" fill="#8884d8" name="B1 P95 (ms)" />
                <Bar dataKey="B2_P95" fill="#82ca9d" name="B2 P95 (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">Throughput (RPS)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="B1_Throughput" fill="#8884d8" name="B1 RPS" />
                <Bar dataKey="B2_Throughput" fill="#82ca9d" name="B2 RPS" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">Latency Overhead (%)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="Latency_Overhead_Pct" fill="#ff7300" name="Overhead (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded shadow h-80">
            <h3 className="text-lg font-semibold text-center mb-2">Throughput Change (%)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 10}}/>
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="Throughput_Change_Pct" fill="#d0ed57" name="Change (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mb-12 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Workload Comparison Table</h2>
        <table className="min-w-full bg-white rounded shadow text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left border-b">Workload</th>
              <th className="py-3 px-4 text-right border-b">B1 Mean</th>
              <th className="py-3 px-4 text-right border-b">B2 Mean</th>
              <th className="py-3 px-4 text-right border-b">Overhead %</th>
              <th className="py-3 px-4 text-right border-b">B1 RPS</th>
              <th className="py-3 px-4 text-right border-b">B2 RPS</th>
              <th className="py-3 px-4 text-right border-b">Change %</th>
              <th className="py-3 px-4 text-right border-b">B1 Median</th>
              <th className="py-3 px-4 text-right border-b">B2 Median</th>
              <th className="py-3 px-4 text-right border-b">B1 P95</th>
              <th className="py-3 px-4 text-right border-b">B2 P95</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="py-2 px-4 font-medium text-gray-800 border-b">{row.name}</td>
                <td className="py-2 px-4 text-right border-b">{row.B1_Mean} ms</td>
                <td className="py-2 px-4 text-right border-b">{row.B2_Mean} ms</td>
                <td className={`py-2 px-4 text-right border-b font-bold ${row.Latency_Overhead_Pct > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {row.Latency_Overhead_Pct > 0 ? '+' : ''}{row.Latency_Overhead_Pct}%
                </td>
                <td className="py-2 px-4 text-right border-b">{row.B1_Throughput}</td>
                <td className="py-2 px-4 text-right border-b">{row.B2_Throughput}</td>
                <td className={`py-2 px-4 text-right border-b font-bold ${row.Throughput_Change_Pct < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {row.Throughput_Change_Pct > 0 ? '+' : ''}{row.Throughput_Change_Pct}%
                </td>
                <td className="py-2 px-4 text-right border-b">{row.B1_Median} ms</td>
                <td className="py-2 px-4 text-right border-b">{row.B2_Median} ms</td>
                <td className="py-2 px-4 text-right border-b">{row.B1_P95} ms</td>
                <td className="py-2 px-4 text-right border-b">{row.B2_P95} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Research Interpretation</h2>
        <div className="bg-white p-6 rounded shadow text-gray-700 space-y-4">
          <p>
            The measurements indicate that the Privacy-Preserving Architecture (B2) introduces overhead proportional to the strictness of the applied security controls. 
            For instance, the <strong>{highestOverhead.name}</strong> workload demonstrated the largest measured latency overhead (+{highestOverhead.val}%). This correlates with the synchronous audit logging and strict IDOR checks enforced on this sensitive endpoint.
          </p>
          <p>
            Conversely, workloads with low absolute latencies (&lt; 10ms) such as <strong>Search Medicine Availability</strong> and <strong>Retrieve Patient Lab Bookings</strong> exhibited negative latency differences. These observations should be interpreted cautiously; at the sub-10ms scale, operating system scheduling, CPU context switching, and Node.js event-loop variability can obfuscate the minor overhead of stateless middleware (like Helmet or CORS checks).
          </p>
          <p>
            Overall, the results suggest that implementing privacy-preserving mechanisms (B2) presents a measurable performance trade-off in this experimental environment, primarily affecting write-heavy tracking mechanisms like audit logging, while introducing minimal friction to basic authorized reads.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Security Control Matrix</h2>
          <table className="w-full bg-white rounded shadow text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-3 text-left border-b">Security/Privacy Control</th>
                <th className="py-2 px-3 text-center border-b">B1</th>
                <th className="py-2 px-3 text-center border-b">B2</th>
                <th className="py-2 px-3 text-left border-b">Expected Security Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">JWT Authentication</td><td className="text-center border-b text-green-600">Yes</td><td className="text-center border-b text-green-600">Yes</td><td className="py-2 px-3 border-b">Session/authentication protection</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Password Hashing</td><td className="text-center border-b">Basic</td><td className="text-center border-b text-green-600">Hardened</td><td className="py-2 px-3 border-b">Credential protection</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">RBAC</td><td className="text-center border-b">Basic</td><td className="text-center border-b text-green-600">Strict</td><td className="py-2 px-3 border-b">Authorization</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">IDOR Ownership Checks</td><td className="text-center border-b">Limited</td><td className="text-center border-b text-green-600">Strict</td><td className="py-2 px-3 border-b">Prevent unauthorized object access</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Audit Logging</td><td className="text-center border-b text-red-500">No</td><td className="text-center border-b text-green-600">Yes</td><td className="py-2 px-3 border-b">Accountability</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Authentication Rate Limiting</td><td className="text-center border-b text-red-500">No</td><td className="text-center border-b text-green-600">Yes</td><td className="py-2 px-3 border-b">Brute-force protection</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Security Headers</td><td className="text-center border-b">Default</td><td className="text-center border-b text-green-600">Helmet</td><td className="py-2 px-3 border-b">Browser-side protection</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">CORS</td><td className="text-center border-b text-yellow-600">Basic</td><td className="text-center border-b text-green-600">Strict</td><td className="py-2 px-3 border-b">Cross-origin restriction</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Error Handling</td><td className="text-center border-b text-yellow-600">Basic</td><td className="text-center border-b text-green-600">Hardened</td><td className="py-2 px-3 border-b">Information disclosure reduction</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Data Minimization</td><td className="text-center border-b">Basic</td><td className="text-center border-b text-green-600">Enhanced</td><td className="py-2 px-3 border-b">Privacy exposure reduction</td></tr>
              <tr className="border-t hover:bg-gray-50"><td className="py-2 px-3 border-b">Pseudonymized Logging</td><td className="text-center border-b text-yellow-600">Limited</td><td className="text-center border-b text-green-600">Yes</td><td className="py-2 px-3 border-b">Reduce sensitive data exposure</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Limitations</h2>
          <div className="bg-yellow-50 p-6 rounded border border-yellow-200 text-yellow-800 space-y-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Single-node execution:</strong> Client and backend shared the same physical machine.</li>
              <li><strong>SQLite local database:</strong> Disk I/O bound rather than network latency bound.</li>
              <li><strong>Statistical bounds:</strong> Only 3 independent runs; insufficient for definitive statistical significance testing.</li>
              <li><strong>Timing variability:</strong> Low-latency endpoint timing is heavily affected by OS jitter.</li>
              <li><strong>Synchronous audit logging:</strong> Exaggerates overhead relative to asynchronous production brokers.</li>
              <li><strong>Rate limiting:</strong> Temporarily relaxed during benchmarking to permit load tests.</li>
              <li><strong>Dataset:</strong> No real patient/medical data used (synthetic dataset).</li>
            </ul>
            <p className="mt-4 font-semibold text-center text-yellow-900 border-t border-yellow-300 pt-3">
              The benchmark measures the implemented prototype under controlled local conditions and should not be interpreted as production-scale performance.
            </p>
          </div>
        </div>
      </section>

      <section className="text-center border-t pt-8 pb-12">
        <h2 className="text-xl font-bold mb-4">Reproducibility</h2>
        <p className="text-gray-600 mb-4">
          All raw experimental data is maintained in the <code>experiments/raw/</code> directories on the server.
          Aggregation is handled by <code>aggregate.js</code> and <code>analyzeResults.js</code>.
        </p>
        <button 
          onClick={() => alert('Raw Data is located in backend/experiments/raw/\nSummary generated at backend/experiments/processed/')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          View Raw Experiment Data Locations
        </button>
      </section>
    </div>
  );
};

export default ResearchAnalysis;
