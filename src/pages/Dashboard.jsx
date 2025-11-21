import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import Sidebar from '../components/Sidebar.jsx'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) return setLoading(false)
    const fetchUser = axios.get('https://api.k4h.dev/auth/me', { headers: { Authorization: `Bearer ${token}` }})
    const fetchChats = axios.get('https://api.k4h.dev/chat/my', { headers: { Authorization: `Bearer ${token}` }})
    Promise.all([fetchUser, fetchChats]).then(([u, c]) => {
      setUser(u.data)
      setChats(c.data || [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} loading={loading} chats={chats} />
      <div className="flex-1 bg-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      </div>
    </div>
  )
}
