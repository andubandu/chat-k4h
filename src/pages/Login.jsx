import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')

    if (urlToken) {
      Cookies.set('token', urlToken, { expires: 1 / 12 })

      window.history.replaceState({}, '', '/login')
      window.location.href = '/dashboard'
      return
    }

    const existingToken = Cookies.get('token')
    if (existingToken) {
      window.location.href = '/dashboard'
    }
  }, [])

  async function handleLogin() {
    try {
      const res = await axios.post('https://api.k4h.dev/auth/login', {
        email,
        password,
      })

      Cookies.set('token', res.data.token, { expires: 1 / 12 })

      toast.success('Logged in')
      window.location.href = '/dashboard'
    } catch {
      toast.error('Login failed')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-[300px] h-[400px] border-2 border-black bg-gray-500">
        <h1 className="text-2xl text-center mt-4">Log in</h1>

        <div className="mt-6 flex flex-col items-center">
          <label className="mb-1">Email:</label>
          <input
            type="email"
            className="w-3/4 max-w-sm px-3 py-2 border border-gray-400 bg-gray-300 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="my-4" />

          <label className="mb-1">Password:</label>
          <input
            type="password"
            className="w-3/4 max-w-sm px-3 py-2 border border-gray-400 bg-gray-300 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="mt-4 w-[150px] text-white rounded-base px-4 py-2.5"
          >
            Login
          </button>
          <button>
<a
  href={`https://api.k4h.dev/auth/google?redirect=${encodeURIComponent(
    window.location.origin + '/login'
  )}`}
  className="mt-4 w-[150px] text-white rounded-base px-4 py-2.5"
>
  Login with Google
</a>

          </button>
          <button>
<a
  href={`https://api.k4h.dev/auth/github?redirect=${encodeURIComponent(
    window.location.origin + '/login'
  )}`}
  className="mt-4 w-[150px] text-white rounded-base px-4 py-2.5"
>
  Login with GitHub
</a>

          </button>
        </div>
      </div>
    </div>
  )
}
