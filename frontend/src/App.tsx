import React from 'react'
import AdminForm from './admin/AdminForm'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Admin — Neues Release erstellen</h1>
        <AdminForm />
      </div>
    </div>
  )
}
