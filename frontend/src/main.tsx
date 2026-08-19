import React from 'react'
import { createRoot } from 'react-dom/client'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import ImpressumPage from './pages/impressum-page'
import DatenschutzPage from './pages/datenschutz-page'
import AdminPage from './admin/AdminPage'
import AdminLoginPage from './admin/AdminLoginPage'
import RequireAdminAuth from './admin/RequireAdminAuth'
import { isAdminLoginPath, isAdminPanelPath, isLegacyAdminPath } from './admin/adminRoutes'
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

  if (isLegacyAdminPath(pathname)) {
    return <NotFoundPage />
  }

  if (isAdminLoginPath(pathname)) {
    return <AdminLoginPage />
  }

  if (isAdminPanelPath(pathname)) {
    return (
      <RequireAdminAuth>
        <AdminPage />
      </RequireAdminAuth>
    )
  }

  if (pathname === '/impressum') {
    return <ImpressumPage />
  }

  if (pathname === '/datenschutz') {
    return <DatenschutzPage />
  }

  return <NotFoundPage />
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
