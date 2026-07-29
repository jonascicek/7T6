import React from 'react'
import { createRoot } from 'react-dom/client'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './admin/AdminPage'
import AdminLoginPage from './admin/AdminLoginPage'
import RequireAdminAuth from './admin/RequireAdminAuth'
import { useLocation } from './lib/router'
import './styles/tailwind.css'

function AppRouter() {
  const { pathname } = useLocation()

  if (pathname === '/') {
    return <HomePage />
  }

  if (pathname.startsWith('/post/')) {
    return <PostDetailPage />
  }

  if (pathname === '/admin/login') {
    return <AdminLoginPage />
  }

  if (pathname === '/admin') {
    return (
      <RequireAdminAuth>
        <AdminPage />
      </RequireAdminAuth>
    )
  }

  return <NotFoundPage />
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
