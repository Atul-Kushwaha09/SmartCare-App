import { useState, useEffect } from 'react';
import api from '../utils/api';

function DoctorMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data } = await api.get('/medical-records/doctor');
      setRecords(data.records);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch records');
      setLoading(false);
    }
  };

  const viewRecord = async (record) => {
    setSelectedRecord(record);
    try {
      const { data } = await api.get(`/medical-records/${record.id}/prescriptions`);
      setPrescriptions(data.prescriptions);
    } catch (err) {
      console.error(err);
      setPrescriptions([]);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading records...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Patient Medical Records</h2>
      
      {selectedRecord ? (
        <div className="bg-white p-6 rounded shadow">
          <button onClick={() => setSelectedRecord(null)} className="text-blue-500 mb-4 hover:underline">&larr; Back to list</button>
          <h3 className="text-xl font-bold mb-4">Record Details</h3>
          <p><strong>Date:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</p>
          <p><strong>Patient:</strong> {selectedRecord.patient_name}</p>
          <div className="mt-4">
            <h4 className="font-semibold">Diagnosis:</h4>
            <p className="bg-gray-50 p-2 rounded">{selectedRecord.diagnosis_notes}</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold">Treatment:</h4>
            <p className="bg-gray-50 p-2 rounded">{selectedRecord.treatment_notes}</p>
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
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          {records.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No medical records created yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{r.patient_name}</td>
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

export default DoctorMedicalRecords;
