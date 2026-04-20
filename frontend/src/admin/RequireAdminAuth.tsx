import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../lib/api'

type AuthState = 'checking' | 'ok' | 'unauthorized'

interface RequireAdminAuthProps {
  children: React.ReactNode
}

export default function RequireAdminAuth({ children }: RequireAdminAuthProps) {
  const [authState, setAuthState] = useState<AuthState>('checking')

  useEffect(() => {
    api
      .get('/api/admin/me')
      .then(() => setAuthState('ok'))
      .catch(() => setAuthState('unauthorized'))
  }, [])

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-700 border-t-white" />
      </div>
    )
  }

  if (authState === 'unauthorized') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
