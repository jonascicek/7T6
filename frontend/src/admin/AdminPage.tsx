import React from 'react'
import AdminForm from './AdminForm'
import AdminPosts from './AdminPosts'
import { Link } from 'react-router-dom'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold tracking-wider">7T6</Link>
          <Link to="/" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
            ← ZURÜCK
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Neues Release</h1>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 p-8 rounded">
            <AdminForm />
          </div>

          <AdminPosts />
        </div>
      </div>
    </div>
  )
}
