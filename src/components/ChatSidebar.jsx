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
      const active = data.find(m => m._id === (data.activeMilestone || null));
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

  return (
    <div className="w-72 bg-white border-l p-4 overflow-y-auto">
      {otherUser && (
        <>
          <h2 className="font-semibold text-lg mb-4">User Info</h2>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={otherUser.profile_image}
              className="w-12 h-12 rounded-full object-cover"
              alt=""
            />
            <div>
              <div className="font-bold">{otherUser.real_name}</div>
              <div className="text-gray-500 text-sm">{otherUser.email}</div>
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Active Milestone</h3>
        {activeMilestone ? (
          <div className="p-2 border rounded bg-yellow-50 text-gray-800 text-sm mb-2">
            <div><strong>{activeMilestone.title}</strong></div>
            <div>Price: ${activeMilestone.price}</div>
            <div>Due: {new Date(activeMilestone.dueDate).toLocaleDateString()}</div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No active milestone</div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">All Milestones</h3>
        {milestones.map(m => (
          <div
            key={m._id}
            className={`p-2 border rounded text-sm mb-2 ${
              m._id === activeMilestone?._id ? 'bg-yellow-50' : 'bg-white'
            }`}
          >
            <div><strong>{m.title}</strong></div>
            <div>Price: ${m.price}</div>
            <div>Due: {new Date(m.dueDate).toLocaleDateString()}</div>
            <div>Status: {m.status}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Create New Milestone</h3>
        <input
          type="text"
          placeholder="Title"
          value={newMilestone.title}
          onChange={e => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
          className="w-full p-1 mb-1 border rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={newMilestone.description}
          onChange={e => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-1 mb-1 border rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={newMilestone.price}
          onChange={e => setNewMilestone(prev => ({ ...prev, price: e.target.value }))}
          className="w-full p-1 mb-1 border rounded"
        />
        <input
          type="date"
          placeholder="Due Date"
          value={newMilestone.dueDate}
          onChange={e => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
          className="w-full p-1 mb-2 border rounded"
        />
        <button
          onClick={handleCreateMilestone}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Create Milestone
        </button>
      </div>
    </div>
  );
}
