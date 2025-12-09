import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Cookies from 'js-cookie';
import Sidebar from '../components/Sidebar';
import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';

export default function Chat() {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [milestone, setMilestone] = useState(null);
  const [milestoneStatus, setMilestoneStatus] = useState(null);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [typing, setTyping] = useState(false);
  const typingRef = useRef(null);
  const socketRef = useRef(null);
  const token = Cookies.get('token');
  const [otherUser, setOtherUser] = useState(null);

  async function findActiveMilestone(chatId) {
    if (!chatId || !token) return null;
    try {
      const chatRes = await fetch('https://api.k4h.dev/chat/my', { headers: { Authorization: `Bearer ${token}` } });
      const chatsData = await chatRes.json();
      const chat = chatsData.find(c => c._id === chatId);
      if (!chat || !chat.activeMilestone) return null;

      const milestoneRes = await fetch(`https://api.k4h.dev/milestones/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
      const milestonesData = await milestoneRes.json();
      const active = milestonesData.find(m => m._id === chat.activeMilestone) || null;
      return active;
    } catch (err) {
      console.error('findActiveMilestone error:', err);
      return null;
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setUser(data);
      } catch {}
      setLoadingUser(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user || !chatId) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(`https://api.k4h.dev/chat/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setMessages(data.messages || []);
      } catch { setMessages([]); }
    };

    const loadMilestone = async () => {
      const active = await findActiveMilestone(chatId);
      if (active) {
        setMilestone(active);
        if (active.status === 'in_progress') {
          const now = new Date();
          const due = new Date(active.dueDate);
          const daysLeft = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
          setMilestoneStatus({ milestoneId: active._id, timeLeft: daysLeft, agreed: true });
        }
      }
    };

    loadMessages();
    loadMilestone();
  }, [chatId, user]);

  useEffect(() => {
    if (!user) return;

    const s = io('https://api.k4h.dev', { auth: { token } });
    socketRef.current = s;

    s.on('connect', () => console.log('Socket connected'));
    s.on('new_message', msg => { if (msg.chat === chatId) setMessages(prev => [...prev, msg]); });
    s.on('typing', data => { if (data.userId !== user._id && data.chatId === chatId) setTyping(data.isTyping); });
    s.on('milestone_created', ({ milestone }) => setMilestone(milestone));

    return () => s.disconnect();
  }, [user, chatId]);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/chat/my', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setChats(data || []);
        const chat = data.find(c => c._id === chatId);
        if (chat) {
          const partner = chat.participants?.find(p => p._id !== user._id);
          setOtherUser(partner);
        }
      } catch { setChats([]); }
    };
    loadChats();
  }, [user, chatId]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { chatId, content: input });
    setInput('');
  };

  const handleTyping = e => {
    setInput(e.target.value);
    if (!socketRef.current) return;
    clearTimeout(typingRef.current);
    socketRef.current.emit('typing', { chatId, isTyping: true });
    typingRef.current = setTimeout(() => { socketRef.current.emit('typing', { chatId, isTyping: false }); }, 800);
  };

  const handleAgree = async () => {
    if (!milestone) return;
    try {
      const res = await fetch(`https://api.k4h.dev/milestones/${milestone._id}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Failed to agree milestone');
      const data = await res.json();
      const now = new Date();
      const due = new Date(milestone.dueDate);
      const daysLeft = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
      setMilestoneStatus({ milestoneId: milestone._id, timeLeft: daysLeft, agreed: true });
      setMilestone(null);
    } catch (err) { console.error(err); }
  };

  const combinedItems = [
    ...messages.map(m => ({ ...m, type: 'text' })),
    ...(milestone ? [{ ...milestone, type: 'milestone' }] : [])
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} loading={loadingUser} chats={chats} />
      <div className="flex-1 bg-gray-100 flex flex-col">
        <ChatHeader messages={messages} user={user} otherUser={otherUser} />

        {milestoneStatus?.agreed && milestoneStatus?.timeLeft !== undefined && (
          <div className="w-full p-2 bg-green-100 text-green-800 text-sm text-center">
            Milestone agreed! Time left until refund: {milestoneStatus.timeLeft} days
          </div>
        )}

        {milestone && milestone.status === 'completed' && user._id !== milestone.createdBy && (
          <div className="w-full p-2 bg-blue-100 text-blue-800 text-sm text-center flex justify-between items-center">
            <span>Milestone ready for payment: {milestone.title} - ${milestone.price}</span>
            <button
              onClick={() => navigate(`/payment-card/${milestone._id}`)}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Pay Now
            </button>
          </div>
        )}

        <div className="flex-1 p-4 overflow-y-auto">
          {combinedItems.map(item =>
            item.type === 'milestone' ? (
              <div key={item._id} className="my-4 p-4 border rounded-lg bg-yellow-50 text-gray-800 text-sm flex flex-col gap-2">
                <div><strong>{item.title}</strong></div>
                <div>Description: {item.description}</div>
                <div>Price: {item.price}</div>
                <div>Due Date: {new Date(item.dueDate).toLocaleDateString()}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleAgree} className="px-2 py-1 bg-green-500 text-white rounded">Agree</button>
                  <button className="px-2 py-1 bg-red-500 text-white rounded">Disagree</button>
                </div>
              </div>
            ) : (
              <div key={item._id} className={`mb-3 flex ${item.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 max-w-sm rounded ${item.sender?._id === user?._id ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}>
                  {item.content}
                </div>
              </div>
            )
          )}
        </div>
       <ChatSidebar
  chatId={chatId}
  otherUser={otherUser}
  user={user}
  socketRef={socketRef}
/>

        <div className="p-4 border-t bg-white flex gap-2">
          <input className="flex-1 p-2 border rounded" value={input} onChange={handleTyping} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }} placeholder="Type a message..." />
          <button onClick={sendMessage} className="px-4 bg-blue-600 text-white rounded">Send</button>
        </div>
      </div>
    </div>
  );
}
