import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        if (!name.trim() || !bio.trim()) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }
        await signup(email, password, bio, name)
      } else {
        await login(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F3E9] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-[#E8DDC8]">
        <h1 className="text-3xl font-bold text-[#2C2416] mb-2 text-center">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h1>
        <p className="text-[#5A4A3A] mb-6 text-center">
          {isSignUp ? 'Create your account' : 'Welcome back!'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#2C2416] mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[#2C2416] mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2C2416] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2C2416] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-[#E8DDC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4A574] text-white rounded-lg hover:bg-[#C49564] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-[#D4A574] hover:text-[#C49564] font-medium"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

