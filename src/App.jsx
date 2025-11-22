import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Chat from './pages/Chat.jsx'

function ProtectedRoute({ children }) {
  const token = Cookies.get('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function UnProtectedRoute({ children }) {
  const token = Cookies.get('token')
  if (token) return <Navigate to="/dashboard" replace />
  return children
}

function HashRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash 
    if (hash.startsWith('#/')) {
      const path = hash.slice(1) 
      navigate(path, { replace: true })
    }
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <HashRedirect />
      <Routes>
        <Route
          path="/"
          element={
            Cookies.get('token')
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<UnProtectedRoute><Login /></UnProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
