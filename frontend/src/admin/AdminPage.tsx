import React, { useState } from 'react'
import AdminForm from './AdminForm'
import AdminPosts from './AdminPosts'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import PageLayout from '../components/PageLayout'

export default function AdminPage() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [status, setStatus] = useState('')

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      await api.post('/api/admin/logout')
      navigate('/admin/login', { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Logout fehlgeschlagen'
      setStatus(message)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <PageLayout containerClassName="bg-neutral-950 text-neutral-100" mainClassName="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-sm tracking-[0.18em] text-neutral-500 mb-4 uppercase">Admin Panel</p>
            <h1 className="font-display text-5xl md:text-6xl tracking-wide text-white mb-4">Neuer Post</h1>
            <p className="text-neutral-300">Erstelle einen neuen Blog-Beitrag für die Kollektion.</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={logout}
                disabled={isLoggingOut}
                className="px-6 py-3 border border-neutral-700 text-neutral-300 text-xs tracking-[0.18em] hover:border-white hover:text-white transition disabled:opacity-50"
              >
                {isLoggingOut ? 'LOGOUT...' : 'LOGOUT'}
              </button>
            </div>
          </div>

          {status && <div className="mb-10 text-sm p-4 border bg-red-950/30 border-red-800 text-red-400">{status}</div>}

          <div className="bg-black border border-neutral-800 p-8 md:p-12 mb-16">
            <AdminForm />
          </div>

          <AdminPosts />
        </div>
    </PageLayout>
  )
}
