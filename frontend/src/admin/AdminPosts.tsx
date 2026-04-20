import React, { useEffect, useState } from 'react'
import api from '../lib/api'

interface Image {
  id: number
  url: string
}

interface Post {
  id: number
  title: string
  description: string
  images: Image[]
  items?: { id: number }[]
  createdAt: string
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    api
      .get('/api/posts')
      .then((res) => {
        setPosts(res.data.posts || [])
        setLoading(false)
      })
      .catch((err) => {
        setStatus('Fehler beim Laden: ' + err.message)
        setLoading(false)
      })
  }, [])

  const startEdit = (post: Post) => {
    setEditingId(post.id)
    setEditTitle(post.title)
    setEditDescription(post.description)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const saveEdit = async (id: number) => {
    try {
      const res = await api.put(`/api/posts/${id}`, {
        title: editTitle,
        description: editDescription,
      })
      setPosts((prev) => prev.map((p) => (p.id === id ? res.data.post : p)))
      setStatus('Post aktualisiert.')
      cancelEdit()
    } catch (err: any) {
      setStatus('Fehler beim Speichern: ' + (err?.message || 'unknown'))
    }
  }

  const deletePost = async (id: number) => {
    const ok = window.confirm('Diesen Post wirklich loeschen?')
    if (!ok) return
    try {
      await api.delete(`/api/posts/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setStatus('Post geloescht.')
    } catch (err: any) {
      setStatus('Fehler beim Loeschen: ' + (err?.message || 'unknown'))
    }
  }

  return (
    <div className="mt-16">
      <div className="mb-8">
        <h2 className="font-display text-4xl tracking-wide text-white mb-2">
          Bestehende Posts
        </h2>
        <p className="text-sm text-neutral-400">Bearbeiten oder loeschen</p>
      </div>

      {status && (
        <div className={`mb-6 text-sm p-4 border ${
          status.includes('Fehler') 
            ? 'bg-red-950/30 border-red-800 text-red-400' 
            : 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
        }`}>
          {status}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-700 border-t-white" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-black border border-neutral-800">
          <p className="text-neutral-500">Keine Posts vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border border-neutral-800 bg-black p-6 hover:border-neutral-600 transition">
              {editingId === post.id ? (
                <div className="space-y-4">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-5 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none"
                    placeholder="Titel"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 px-5 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none resize-none"
                    rows={4}
                    placeholder="Beschreibung"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(post.id)}
                      className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-6 py-3 border border-neutral-700 text-neutral-300 hover:border-white hover:text-white transition"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-medium mb-3 text-white">{post.title}</h3>
                      <p className="text-neutral-300 text-sm leading-relaxed mb-4">{post.description}</p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{new Date(post.createdAt).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}</span>
                        <span>•</span>
                        <span>{post.images.length} {post.images.length === 1 ? 'Bild' : 'Bilder'}</span>
                        {Array.isArray(post.items) && post.items.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{post.items.length} {post.items.length === 1 ? 'Artikel' : 'Artikel'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {post.images[0]?.url && (
                      <div className="w-32 h-32 flex-shrink-0">
                        <img 
                          src={post.images[0].url} 
                          alt="preview" 
                          className="w-full h-full object-cover border border-neutral-800" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => startEdit(post)}
                      className="px-5 py-2 border border-neutral-700 text-neutral-300 text-sm hover:border-white hover:text-white transition"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="px-5 py-2 border border-red-700 text-red-400 text-sm hover:border-red-600 hover:bg-red-900/30 transition"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
