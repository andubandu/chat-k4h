import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import io from 'socket.io-client'
import Sidebar from '../components/Sidebar'
import Cookies from 'js-cookie'
import ChatHeader from '../components/ChatHeader'
export default function Chat() {
  const { id: chatId } = useParams()
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [typing, setTyping] = useState(false)
  const typingRef = useRef(null)
  const socketRef = useRef(null)
  const token = Cookies.get('token')
const [otherUser, setOtherUser] = useState(null)

useEffect(() => {
  if (messages.length && user) {
    const partner = messages.find(m => m.sender._id !== user._id)?.sender
    setOtherUser(partner)
  }
}, [messages, user])


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setUser(data)
      } catch {}
      setLoadingUser(false)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    const s = io('https://api.k4h.dev', { auth: { token } })
    socketRef.current = s

    s.on('connect', () => console.log('Socket connected'))

    s.on('new_message', msg => {
      if (msg.chat === chatId) setMessages(prev => [...prev, msg])
    })

    s.on('typing', data => {
      if (data.userId !== user._id && data.chatId === chatId) setTyping(data.isTyping)
    })

    return () => s.disconnect()
  }, [user, chatId])

  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await fetch('https://api.k4h.dev/chat/my', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setChats(data || [])
      } catch {
        setChats([])
      }
    }
    loadChats()
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return
      try {
        const res = await fetch(`https://api.k4h.dev/chat/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setMessages(data.messages || [])
      } catch {
        setMessages([])
      }
    }
    loadMessages()
  }, [chatId])

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return
    socketRef.current.emit('send_message', { chatId, content: input })
    setInput('')
  }

  const handleTyping = e => {
    setInput(e.target.value)
    if (!socketRef.current) return
    clearTimeout(typingRef.current)
    socketRef.current.emit('typing', { chatId, isTyping: true })
    typingRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { chatId, isTyping: false })
    }, 800)
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        loading={loadingUser}
        chats={chats}
      />
      <div className="flex-1 bg-gray-100 flex flex-col">
        <ChatHeader messages={messages} user={user} />
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map(m => (
            <div
              key={m._id}
              className={`mb-3 flex ${m.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-2 max-w-sm rounded ${
                  m.sender._id === user?._id ? 'bg-blue-500 text-white' : 'bg-white text-black'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex gap-2">
          <input
            className="flex-1 p-2 border rounded"
            value={input}
            onChange={handleTyping}
            onKeyDown={e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  }
}}
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="px-4 bg-blue-600 text-white rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
