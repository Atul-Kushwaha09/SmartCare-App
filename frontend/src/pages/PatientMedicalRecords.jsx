import { useState, useEffect } from 'react';
import api from '../utils/api';

function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [allLabReports, setAllLabReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, presRes, labRes] = await Promise.all([
        api.get('/medical-records/my'),
        api.get('/medical-records/prescriptions/my'),
        api.get('/medical-records/lab-reports/my')
      ]);
      setRecords(recRes.data.records);
      setAllPrescriptions(presRes.data.prescriptions);
      setAllLabReports(labRes.data.lab_reports);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch records');
      setLoading(false);
    }
  };

  const viewRecord = (record) => {
    setSelectedRecord(record);
    setPrescriptions(allPrescriptions.filter(p => p.medical_record_id === record.id));
    setLabReports(allLabReports.filter(l => l.medical_record_id === record.id));
  };

  if (loading) return <div className="text-center mt-10">Loading records...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Medical Records</h2>
      
      {selectedRecord ? (
        <div className="bg-white p-6 rounded shadow">
          <button onClick={() => setSelectedRecord(null)} className="text-blue-500 mb-4 hover:underline">&larr; Back to list</button>
          <h3 className="text-xl font-bold mb-4">{selectedRecord.title}</h3>
          <p><strong>Date:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</p>
          <p><strong>Doctor:</strong> Dr. {selectedRecord.doctor_name}</p>
          <div className="mt-4">
            <h4 className="font-semibold">Record Details:</h4>
            <pre className="bg-gray-50 p-2 rounded whitespace-pre-wrap font-sans">{selectedRecord.description}</pre>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Prescriptions:</h4>
            {prescriptions.length === 0 ? <p className="text-gray-500 italic">No prescriptions.</p> : (
              <ul className="list-disc list-inside bg-gray-50 p-2 rounded">
                {prescriptions.map(p => (
                  <li key={p.id}>{p.medicine_name} - {p.dosage} ({p.frequency}) for {p.duration}. <span className="text-gray-600 text-sm">Instructions: {p.instructions}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Lab Tests:</h4>
            {labReports.length === 0 ? <p className="text-gray-500 italic">No lab tests prescribed.</p> : (
              <ul className="list-disc list-inside bg-gray-50 p-2 rounded">
                {labReports.map(l => (
                  <li key={l.id}>{l.test_name} - {l.result_summary}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          {records.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">You have no medical records yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">Dr. {r.doctor_name}</td>
                    <td className="p-3">
                      <button onClick={() => viewRecord(r)} className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientMedicalRecords;
