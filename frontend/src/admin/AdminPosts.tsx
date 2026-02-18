import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Image {
  id: number
  url: string
}

interface Post {
  id: number
  title: string
  description: string
  images: Image[]
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
    axios
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
      const res = await axios.put(`/api/posts/${id}`, {
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
      await axios.delete(`/api/posts/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setStatus('Post geloescht.')
    } catch (err: any) {
      setStatus('Fehler beim Loeschen: ' + (err?.message || 'unknown'))
    }
  }

  return (
    <div className="mt-12">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Posts verwalten</h2>
        <p className="text-sm text-gray-500">Bearbeiten oder loeschen</p>
      </div>

      {status && (
        <div className="mb-4 text-sm p-3 rounded bg-gray-900/50 border border-gray-800 text-gray-300">
          {status}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Laedt...</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-500">Keine Posts vorhanden.</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-800 bg-gray-900/30 p-6">
              {editingId === post.id ? (
                <div className="space-y-4">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black border border-gray-700 px-4 py-3 text-white"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-black border border-gray-700 px-4 py-3 text-white h-28"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(post.id)}
                      className="px-5 py-2 bg-white text-black font-bold"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-5 py-2 border border-gray-700 text-gray-300"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{post.description}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('de-DE')} • {post.images.length} Bilder
                      </div>
                    </div>
                    {post.images[0]?.url && (
                      <img src={post.images[0].url} alt="preview" className="w-24 h-24 object-cover" />
                    )}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => startEdit(post)}
                      className="px-4 py-2 border border-gray-600 text-gray-300"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="px-4 py-2 border border-red-600 text-red-400"
                    >
                      Loeschen
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
