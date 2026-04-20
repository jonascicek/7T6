import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PostDetailPage from './pages/PostDetailPage'
import AdminPage from './admin/AdminPage'
import AdminLoginPage from './admin/AdminLoginPage'
import RequireAdminAuth from './admin/RequireAdminAuth'
import './styles/tailwind.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminPage />
            </RequireAdminAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
