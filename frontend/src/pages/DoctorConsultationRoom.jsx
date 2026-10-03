import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';

function DoctorConsultationRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Medical record form state
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [currentMedicine, setCurrentMedicine] = useState({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
  const [labTests, setLabTests] = useState([]);
  const [currentLabTest, setCurrentLabTest] = useState('');

  const socketRef = useRef(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        // id is appointmentId from URL
        const { data } = await api.post(`/consultations/start/${id}`);
        setConsultation(data.consultation);
        setLoading(false);
        setupSocket(data.consultation.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load consultation');
        setLoading(false);
      }
    };
    fetchConsultation();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id]);

  const setupSocket = (consultationId) => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_consultation', consultationId);
    });

    socket.on('previous_messages', (msgs) => setMessages(msgs));
    socket.on('receive_message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('error', (errMsg) => setError(errMsg));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !consultation) return;
    socketRef.current.emit('send_message', { consultationId: consultation.id, message: newMessage });
    setNewMessage('');
  };

  const startConsultation = async () => {
    try {
      // id here is appointment_id
      await api.post(`/consultations/start/${id}`);
      setConsultation({ ...consultation, status: 'active', started_at: new Date().toISOString() });
    } catch (err) {
      alert('Failed to start consultation');
    }
  };

  const addPrescription = () => {
    if (currentMedicine.name) {
      setPrescriptions([...prescriptions, { medicine_name: currentMedicine.name, ...currentMedicine }]);
      setCurrentMedicine({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    }
  };

  const addLabTest = () => {
    if (currentLabTest.trim()) {
      setLabTests([...labTests, { test_name: currentLabTest }]);
      setCurrentLabTest('');
    }
  };

  const finishConsultation = async () => {
    try {
      // 1. Create medical record
      const recordRes = await api.post('/medical-records', {
        appointment_id: consultation.appointment_id,
        patient_id: consultation.patient_id,
        record_type: 'consultation',
        title: `Consultation on ${new Date().toLocaleDateString()}`,
        description: `Diagnosis: ${diagnosis}\nTreatment: ${treatment}`
      });
      const recordId = recordRes.data.id;

      // 2. Insert prescriptions if any
      for (const p of prescriptions) {
         await api.post('/medical-records/prescriptions', {
           medical_record_id: recordId,
           patient_id: consultation.patient_id,
           medicine_name: p.medicine_name,
           dosage: p.dosage,
           frequency: p.frequency,
           duration: p.duration,
           instructions: p.instructions
         });
      }

      // 3. Insert lab tests if any
      for (const test of labTests) {
         await api.post('/medical-records/lab-reports', {
           medical_record_id: recordId,
           patient_id: consultation.patient_id,
           test_name: test.test_name,
           result_summary: test.result_summary || 'Prescribed during consultation',
           report_date: new Date().toISOString().split('T')[0]
         });
      }

      // 4. End consultation
      await api.post(`/consultations/end/${consultation.id}`);
      alert('Consultation completed and record saved!');
      navigate('/doctor');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finish consultation');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading consultation...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 flex gap-4 h-[calc(100vh-100px)]">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col border-r pr-4">
        <h2 className="text-2xl font-bold mb-4">Chat Room</h2>
        <div className="bg-white p-4 rounded shadow mb-4">
          <p><strong>Status:</strong> {consultation?.status}</p>
          {consultation?.status === 'waiting' && (
            <button onClick={startConsultation} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
              Start Consultation
            </button>
          )}
        </div>

        <div className="flex-1 bg-gray-100 rounded p-4 overflow-y-auto mb-4 flex flex-col gap-2">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === consultation?.doctor_id;
            return (
              <div key={idx} className={`p-2 rounded max-w-[70%] ${isMe ? 'bg-green-500 text-white self-end' : 'bg-gray-300 text-black self-start'}`}>
                <p className="text-sm font-semibold">{msg.sender_name || (isMe ? 'You' : 'Patient')}</p>
                <p>{msg.message}</p>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border p-2 rounded"
            disabled={consultation?.status === 'completed'}
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={consultation?.status === 'completed'}
          >
            Send
          </button>
        </form>
      </div>

      {/* Medical Notes Section */}
      <div className="w-1/2 flex flex-col overflow-y-auto pl-4">
        <h2 className="text-2xl font-bold mb-4">Medical Record & Notes</h2>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Diagnosis Notes</label>
          <textarea 
            className="w-full border rounded p-2" 
            rows="3" 
            value={diagnosis} 
            onChange={e => setDiagnosis(e.target.value)}
            disabled={consultation?.status === 'completed'}
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Treatment Notes</label>
          <textarea 
            className="w-full border rounded p-2" 
            rows="3" 
            value={treatment} 
            onChange={e => setTreatment(e.target.value)}
            disabled={consultation?.status === 'completed'}
          ></textarea>
        </div>

        <div className="mb-4 bg-gray-50 p-4 border rounded">
          <h3 className="font-bold mb-2">Prescriptions</h3>
          <ul className="mb-2 list-disc list-inside">
            {prescriptions.map((p, i) => (
              <li key={i}>{p.medicine_name} - {p.dosage} ({p.frequency}) for {p.duration}</li>
            ))}
          </ul>
          
          {consultation?.status !== 'completed' && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input type="text" placeholder="Medicine Name" className="border p-1 rounded" value={currentMedicine.name} onChange={e => setCurrentMedicine({...currentMedicine, name: e.target.value})} />
              <input type="text" placeholder="Dosage (e.g. 500mg)" className="border p-1 rounded" value={currentMedicine.dosage} onChange={e => setCurrentMedicine({...currentMedicine, dosage: e.target.value})} />
              <input type="text" placeholder="Frequency (e.g. 1-0-1)" className="border p-1 rounded" value={currentMedicine.frequency} onChange={e => setCurrentMedicine({...currentMedicine, frequency: e.target.value})} />
              <input type="text" placeholder="Duration (e.g. 5 days)" className="border p-1 rounded" value={currentMedicine.duration} onChange={e => setCurrentMedicine({...currentMedicine, duration: e.target.value})} />
              <input type="text" placeholder="Instructions" className="border p-1 rounded col-span-2" value={currentMedicine.instructions} onChange={e => setCurrentMedicine({...currentMedicine, instructions: e.target.value})} />
              <button type="button" onClick={addPrescription} className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400 col-span-2">Add Medicine</button>
            </div>
          )}
        </div>

        <div className="mb-4 bg-gray-50 p-4 border rounded">
          <h3 className="font-bold mb-2">Lab Tests</h3>
          <ul className="mb-2 list-disc list-inside">
            {labTests.map((t, i) => (
              <li key={i}>{t.test_name}</li>
            ))}
          </ul>
          
          {consultation?.status !== 'completed' && (
            <div className="flex gap-2 text-sm">
              <input type="text" placeholder="Test Name (e.g. CBC, X-Ray)" className="border p-1 rounded flex-1" value={currentLabTest} onChange={e => setCurrentLabTest(e.target.value)} />
              <button type="button" onClick={addLabTest} className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400">Add Test</button>
            </div>
          )}
        </div>

        {consultation?.status !== 'completed' && (
          <button onClick={finishConsultation} className="bg-red-600 text-white px-4 py-3 rounded font-bold hover:bg-red-700 mt-auto">
            Finish Consultation & Save Record
          </button>
        )}
      </div>
    </div>
  );
}

export default DoctorConsultationRoom;
