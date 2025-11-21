import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import Cookies from 'js-cookie'

const SocketContext = createContext()

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const token = Cookies.get('token')

  useEffect(() => {
    if (!token) return
    const s = io('https://api.k4h.dev', { auth: { token } })
    socketRef.current = s

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    return () => s.disconnect()
  }, [token])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
