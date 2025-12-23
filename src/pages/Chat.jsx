import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
      return milestonesData.find(m => m._id === chat.activeMilestone) || null;
    } catch (err) {
      console.error('findActiveMilestone error:', err);
      return null;
    }
  }

  useEffect(() => {
  if (!user || !milestone) return;

const isSeller = user._id === milestone.proposal.seller;
  const role = isSeller ? 'SELLER' : 'BUYER';

  console.log('[CHAT ROLE CHECK]');
  console.log('User ID:', user._id);
  console.log('Milestone createdBy:', milestone.proposal.seller);
  console.log('Identified role:', role);
}, [user, milestone]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setUser(data);
      } catch (err) { console.error("Auth error", err); }
      setLoadingUser(false);
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    if (!user || !chatId) return;

    const loadContent = async () => {
      try {
        const res = await fetch(`https://api.k4h.dev/chat/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setMessages(data.messages || []);

        const active = await findActiveMilestone(chatId);
        if (active) {
          setMilestone(active);
          if (active.status === 'in_progress' || active.status === 'paid') {
            const now = new Date();
            const due = new Date(active.dueDate);
            const daysLeft = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
            setMilestoneStatus({ milestoneId: active._id, timeLeft: daysLeft, agreed: true });
          }
        } else {
          setMilestone(null);
        }
      } catch (err) { console.error("Load error", err); }
    };

    loadContent();
  }, [chatId, user, token]);

  useEffect(() => {
  const query = new URLSearchParams(location.search);
  const orderId = query.get('token');
  const milestoneId = query.get('milestoneId');
  const paymentStatus = query.get('payment');

  if (orderId && milestoneId && paymentStatus === 'success') {
    handleCapture(milestoneId, orderId);
    navigate(location.pathname, { replace: true });
  }
}, [location, navigate]);


  useEffect(() => {
    if (!user) return;
    const s = io('https://api.k4h.dev', { auth: { token } });
    socketRef.current = s;

    s.on('new_message', msg => { if (msg.chat === chatId) setMessages(prev => [...prev, msg]); });
    s.on('typing', data => { if (data.userId !== user._id && data.chatId === chatId) setTyping(data.isTyping); });
    s.on('milestone_updated', updated => { if (updated.chat === chatId) setMilestone(updated); });

    return () => s.disconnect();
  }, [user, chatId, token]);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/chat/my', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setChats(data || []);
        const chat = data.find(c => c._id === chatId);
        if (chat) setOtherUser(chat.participants?.find(p => p._id !== user._id));
      } catch { setChats([]); }
    };
    loadChats();
  }, [user, chatId, token]);

  const handlePayment = async (milestoneId) => {
    try {
      const res = await fetch(`https://api.k4h.dev/payments/milestones/${milestoneId}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      });
      const res2=await fetch(`https://api.k4h.dev/payments/milestones/${milestoneId}/pay`, {
        method: 'POST',
        headers: {},
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Failed to initiate payment");
      }
    } catch (err) { console.error("Payment error", err); }
  };

  const handleCapture = async (milestoneId, paypalOrderId) => {
  if (!milestoneId || !paypalOrderId) return;

  try {
    const res = await fetch(`https://api.k4h.dev  /payments/milestones/${milestoneId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paypalOrderId })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Payment capture failed.');
      return;
    }

    setMilestone(data.milestone);
    socketRef.current.emit('milestone_updated', data.milestone);
    alert('Payment captured successfully!');
  } catch (err) {
    console.error('Payment capture error:', err);
    alert('Critical error during payment capture.');
  }
};


  const handleAgree = async () => {
    if (!milestone) return;
    try {
      const res = await fetch(`https://api.k4h.dev/milestones/${milestone._id}/agree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const updated = await res.json();
      if (res.ok) {
        setMilestone(updated);
        socketRef.current.emit('milestone_updated', updated);
        if (user?._id !== updated.createdBy) {
          handlePayment(updated._id);
        }
      }
    } catch (err) { console.error("Agree error", err); }
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { chatId, content: input });
    setInput('');
  };

  const handleTyping = e => {
    setInput(e.target.value);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { chatId, isTyping: true });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => { socketRef.current.emit('typing', { chatId, isTyping: false }); }, 800);
  };

  const combinedItems = [
    ...messages.map(m => ({ ...m, type: 'text' })),
    ...(milestone ? [{ ...milestone, type: 'milestone' }] : [])
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} loading={loadingUser} chats={chats} />

      <div className="flex-1 bg-gray-50 flex flex-col min-w-0">
        <ChatHeader messages={messages} user={user} otherUser={otherUser} />

        {milestone && milestone.status === 'in_progress' && !milestone.buyerPaid && user?._id !== milestone.createdBy && (
          <div className="w-full p-3 bg-indigo-600 text-white text-sm flex justify-between items-center px-6 shadow-md z-10">
            <span className="font-medium">Contract Active. Please fund the escrow to start the project.</span>
            <button
              onClick={() => handlePayment(milestone._id)}
              className="px-4 py-1.5 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm"
            >
              Pay ${milestone.price}
            </button>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {combinedItems.map(item =>
            item.type === 'milestone' ? (
              <div key={item._id} className="mx-auto my-8 p-6 border-2 border-yellow-200 rounded-3xl bg-yellow-50 max-w-md shadow-sm border-dashed">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-gray-900">{item.title}</h4>
                  <span className="text-yellow-800 font-bold bg-yellow-200 px-3 py-1 rounded-full text-xs">${item.price}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{item.description}</p>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                  DUE DATE: {new Date(item.dueDate).toLocaleDateString()}
                </div>

                {user?._id !== item.createdBy && item.status === 'pending' && (
                  <div className="flex gap-3 mt-5">
                    <button onClick={handleAgree} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                      Agree & Pay
                    </button>
                    <button className="flex-1 py-2.5 bg-white text-gray-400 border rounded-xl font-bold hover:bg-gray-50 transition">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div key={item._id} className={`flex ${item.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3.5 max-w-sm rounded-2xl text-sm shadow-sm ${
                  item.sender?._id === user?._id
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {item.content}
                </div>
              </div>
            )
          )}
          {typing && <div className="text-[10px] text-gray-400 italic ml-2">Typing...</div>}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 items-center">
          <input
            className="flex-1 p-3.5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
            value={input}
            onChange={handleTyping}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
            placeholder="Write a message..."
          />
          <button onClick={sendMessage} className="p-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition px-8">
            Send
          </button>
        </div>
      </div>

      <ChatSidebar chatId={chatId} otherUser={otherUser} user={user} socketRef={socketRef} />
    </div>
  );
}
