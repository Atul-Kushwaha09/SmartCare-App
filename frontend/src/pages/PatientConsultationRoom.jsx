import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';

function PatientConsultationRoom() {
  const { id } = useParams(); // this is the consultation ID
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const { data } = await api.get(`/consultations/appointment/${id}`);
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
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const setupSocket = (consultationId) => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_consultation', consultationId);
    });

    socket.on('previous_messages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('error', (errMsg) => {
      setError(errMsg);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !consultation) return;

    socketRef.current.emit('send_message', {
      consultationId: consultation.id,
      message: newMessage
    });
    setNewMessage('');
  };

  if (loading) return <div className="text-center mt-10">Loading consultation...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold mb-4">Consultation Room</h2>
      <div className="bg-white p-4 rounded shadow mb-4">
        <p><strong>Status:</strong> {consultation?.status}</p>
        <p><strong>Started At:</strong> {consultation?.started_at ? new Date(consultation.started_at).toLocaleString() : 'Not started'}</p>
        {consultation?.status === 'completed' && (
           <p className="text-green-600 font-bold mt-2">Consultation is completed. You can view records in Medical Records.</p>
        )}
      </div>

      <div className="flex-1 bg-gray-100 rounded p-4 overflow-y-auto mb-4 flex flex-col gap-2">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === consultation?.patient_id;
          return (
            <div key={idx} className={`p-2 rounded max-w-[70%] ${isMe ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'}`}>
              <p className="text-sm font-semibold">{msg.sender_name || (isMe ? 'You' : 'Doctor')}</p>
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
  );
}

export default PatientConsultationRoom;
