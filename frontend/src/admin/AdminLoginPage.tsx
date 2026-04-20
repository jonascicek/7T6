import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import PageLayout from '../components/PageLayout'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('')

    if (!email.trim() || !password) {
      setStatus('Bitte E-Mail und Passwort eingeben.')
      return
    }

    try {
      setIsLoading(true)
      await api.post('/api/admin/login', {
        email,
        password,
      })
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Login fehlgeschlagen'
      setStatus(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout containerClassName="bg-neutral-950 text-neutral-100" mainClassName="pb-20">
      <div className="px-6">
        <div className="max-w-md mx-auto border border-neutral-800 bg-black p-8 md:p-10">
          <p className="text-sm tracking-[0.18em] text-neutral-500 mb-4 uppercase">Admin Login</p>
          <h1 className="font-display text-5xl tracking-wide text-white mb-8">Anmelden</h1>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-xs tracking-[0.14em] text-neutral-400 uppercase mb-2">E-Mail</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs tracking-[0.14em] text-neutral-400 uppercase mb-2">Passwort</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-8 py-4 bg-white text-black font-medium tracking-[0.2em] hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'PRUEFE...' : 'LOGIN'}
            </button>

            {status && (
              <div className="text-sm p-4 border bg-red-950/30 border-red-800 text-red-400">
                {status}
              </div>
            )}
          </form>
        </div>
      </div>
    </PageLayout>
  )
}
