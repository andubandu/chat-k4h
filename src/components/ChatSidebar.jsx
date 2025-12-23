import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function ChatSidebar({ otherUser, chatId, user, socketRef }) {
  const [milestones, setMilestones] = useState([]);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', price: '', dueDate: '' });
  const token = Cookies.get('token');

  const fetchMilestones = async () => {
    if (!chatId || !token) return;
    try {
      const res = await fetch(`https://api.k4h.dev/milestones/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMilestones(data || []);
      const active = data.find(m => m.status === 'in_progress' && !m.paidToSeller);
      setActiveMilestone(active || null);
    } catch (err) {
      console.error('Failed to load milestones', err);
      setMilestones([]);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [chatId]);

  const handleCreateMilestone = async () => {
    if (!newMilestone.title || !newMilestone.price) return;
    try {
      const res = await fetch(`https://api.k4h.dev/milestones/${chatId}/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newMilestone.title,
          description: newMilestone.description,
          price: Number(newMilestone.price),
          dueDate: newMilestone.dueDate
        })
      });
      const created = await res.json();
      if (created._id) {
        setMilestones(prev => [...prev, created]);
        if (socketRef?.current) socketRef.current.emit('create_milestone', { chatId, milestoneData: created });
        setNewMilestone({ title: '', description: '', price: '', dueDate: '' });
      }
    } catch (err) {
      console.error('Failed to create milestone', err);
    }
  };

  const handleCompleteWork = async (mId) => {
    try {
      const res = await fetch(`https://api.k4h.dev/milestones/${mId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Work submitted! Waiting for buyer to release funds.");
        fetchMilestones();
      }
    } catch (err) {
      console.error('Completion error:', err);
    }
  };

  return (
    <div className="w-80 bg-white border-l p-4 overflow-y-auto h-full shadow-sm">
      {otherUser && (
        <div className="mb-6 border-b pb-4">
          <h2 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">Partner Info</h2>
          <div className="flex items-center gap-3">
            <img
              src={otherUser.profile_image || 'https://via.placeholder.com/150'}
              className="w-12 h-12 rounded-full object-cover border"
              alt=""
            />
            <div className="overflow-hidden">
              <div className="font-bold text-gray-800 truncate">{otherUser.real_name}</div>
              <div className="text-gray-500 text-xs truncate">{otherUser.email}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2">Active Task</h3>
        {activeMilestone ? (
          <div className="p-3 border rounded-xl bg-blue-50 border-blue-100 text-sm">
            <div className="font-bold text-blue-900">{activeMilestone.title}</div>
            <div className="text-blue-700 font-semibold mt-1">${activeMilestone.price}</div>
            <div className="text-xs text-blue-600 mt-1">Due: {new Date(activeMilestone.dueDate).toLocaleDateString()}</div>
          </div>
        ) : (
          <div className="text-gray-400 text-xs italic bg-gray-50 p-3 rounded-lg border border-dashed text-center">
            No active milestones currently are active (in progress)
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2">Milestone History</h3>
        <div className="space-y-3">
          {milestones.map(m => {
            const isSeller = user?._id === m.createdBy;

            return (
              <div
                key={m._id}
                className={`p-3 border rounded-xl text-sm transition-all ${
                  m._id === activeMilestone?._id ? 'border-blue-300 ring-2 ring-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-gray-800">{m.title}</strong>
                  <span className="font-bold text-green-600">${m.price}</span>
                </div>

                <div className="text-xs text-gray-500">Status: <span className="capitalize font-medium">{m.status}</span></div>

                {isSeller && m.buyerPaid && m.status !== 'completed' && (
                  <button
                    onClick={() => handleCompleteWork(m._id)}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Mark as Completed
                  </button>
                )}

                {isSeller && m.status === 'completed' && !m.paidToSeller && (
                  <div className="mt-2 text-[10px] text-center text-indigo-500 font-bold bg-indigo-50 py-1 rounded">
                    Awaiting Buyer Release
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>


      <div className="mt-8 pt-6 border-t border-gray-100">
        <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3 text-center">New Milestone</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Milestone Title"
            value={newMilestone.title}
            onChange={e => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <input
            type="number"
            placeholder="Price ($)"
            value={newMilestone.price}
            onChange={e => setNewMilestone(prev => ({ ...prev, price: e.target.value }))}
            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <input
            type="date"
            value={newMilestone.dueDate}
            onChange={e => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <button
            onClick={handleCreateMilestone}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-bold text-sm transition shadow-md"
          >
            Create Milestone
          </button>
        </div>
      </div>
    </div>
  );
}
