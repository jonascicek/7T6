import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get(`/api/posts/${id}`)
      .then((res) => {
        setPost(res.data.post)
        setLoading(false)
      })
      .catch((err) => {
        setError('Fehler beim Laden des Posts: ' + err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Wird geladen...</div>
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-400">{error}</div>
  if (!post) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Post nicht gefunden.</div>

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

      {/* Main Content */}
      <main className="pt-24 pb-20">
        {/* Hero Image */}
        {post.images.length > 0 && (
          <div className="w-full h-[70vh] overflow-hidden">
            <img 
              src={post.images[0].url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-4">
              {new Date(post.createdAt).toLocaleDateString('de-DE')}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>
          </div>

          {/* Description */}
          <div className="mb-16">
            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          </div>

          {/* Additional Images - Full Width */}
          {post.images.length > 1 && (
            <div className="mb-12 space-y-6">
              {post.images.slice(1).map((img) => (
                <div key={img.id} className="overflow-hidden bg-gray-900">
                  <img
                    src={img.url}
                    alt={post.title}
                    className="w-full h-[600px] object-cover hover:scale-105 transition duration-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">Exklusiver Drop — Jetzt verfuegbar</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-500 text-sm">
          <p>© 2026 7T6 Modeblog. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
