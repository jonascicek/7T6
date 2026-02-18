import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axios
      .get('/api/posts')
      .then((res) => {
        setPosts(res.data.posts || [])
        setLoading(false)
      })
      .catch((err) => {
        setError('Fehler beim Laden der Posts: ' + err.message)
        setLoading(false)
      })
  }, [])

  if (error) return <div className="p-8 text-center text-red-400">{error}</div>

  const featured = posts[0]
  const heroImage = featured?.images?.[0]?.url

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold tracking-wider">7T6</Link>
          <Link to="/admin" className="px-6 py-2 text-sm border border-white/20 hover:border-white/60 transition">
            ADMIN
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="mt-20 bg-black px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">Fashion Journal</p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Neueste <span className="text-gray-400">Kollektion</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Exklusive Drops, starke Silhouetten und kuratierte Pieces.
            </p>
            {featured && (
              <Link
                to={`/post/${featured.id}`}
                className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white"
              >
                Featured ansehen <span className="text-lg">→</span>
              </Link>
            )}
          </div>
          <div className="relative">
            <div className="aspect-[4/5] w-full bg-gray-900 overflow-hidden">
              {heroImage ? (
                <img src={heroImage} alt="Featured" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black" />
              )}
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-gray-800"></div>
          </div>
        </div>
      </header>

      {/* Posts Grid */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        {loading ? (
          <div className="text-center text-gray-400">Wird geladen...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500">Keine Posts vorhanden.</div>
        ) : (
          <div className="grid grid-cols-1 gap-16">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden bg-gray-900 mb-6 h-[520px]">
                    {post.images.length > 0 && (
                      <img 
                        src={post.images[0].url} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"></div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-wide mb-3 group-hover:text-gray-300 transition">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-base mb-4 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('de-DE')}
                    </span>
                    <span className="text-gray-300 text-sm group-hover:text-white transition">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-500 text-sm">
          <p>© 2026 7T6 Modeblog. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
