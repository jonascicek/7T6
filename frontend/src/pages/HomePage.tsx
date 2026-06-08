import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
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
  createdAt: string
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/posts')
      .then((res) => {
        setPosts(res.data.posts || [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
        setError('Fehler beim Laden der Posts: ' + message)
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black text-sm hover:bg-neutral-200 transition"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  const featured = posts[0]
  const recentPosts = posts

  return (
    <PageLayout withFooter containerClassName="bg-neutral-950 text-white">

      {featured && (
        <section className="relative h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            {featured.images[0] ? (
              <img
                src={featured.images[0].url}
                alt={featured.title}
                className="w-full h-full object-contain object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/65 to-black/95" />
          </div>

          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
            <p className="text-xs md:text-sm tracking-[0.28em] uppercase mb-6 text-neutral-300">
              Featured Collection
            </p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-wide mb-8 leading-[0.95]">
              {featured.title}
            </h1>
            <Link
              to={`/post/${featured.id}`}
              className="inline-block px-10 py-4 rounded-lg border border-white/80 bg-transparent text-white text-sm tracking-[0.2em] hover:bg-black/50 transition-all duration-300"
            >
              ENTDECKEN
            </Link>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-200 animate-bounce">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>
      )}

      {!featured && (
        <section className="pt-36 pb-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm tracking-[0.22em] uppercase text-neutral-500 mb-4">7T6 Journal</p>
            <h1 className="font-display text-5xl md:text-7xl text-white mb-6">Minimal. Bold. Editorial.</h1>
            <p className="max-w-2xl mx-auto text-neutral-300">
              Erstelle den ersten Post, um die Startseite mit deiner aktuellen Kollektion zu fuellen.
            </p>
          </div>
        </section>
      )}

      <section className="py-24 px-6 lg:px-8 bg-black/60 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm tracking-[0.24em] uppercase text-neutral-500 mb-4">Latest Drops</p>
            <h2 className="font-display text-5xl md:text-6xl tracking-wide text-white">
              Neue Kollektionen
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-700 border-t-white" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-500 mb-6">Noch keine Posts verfuegbar.</p>
              <Link
                to="/admin/login"
                className="inline-block px-8 py-3 bg-white text-black text-sm tracking-[0.18em] hover:bg-neutral-200 transition"
              >
                Ersten Post erstellen
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="group border border-neutral-900 hover:border-neutral-700 bg-neutral-950/70 p-4 md:p-5 transition"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 mb-6">
                    {post.images[0] ? (
                      <img
                        src={post.images[0].url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs tracking-[0.16em] text-neutral-500 mb-2 uppercase">
                      {new Date(post.createdAt).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <h3 className="text-2xl font-light tracking-tight text-white mb-3 group-hover:text-neutral-200 transition">
                      {post.title}
                    </h3>
                    <p className="text-neutral-300 text-sm leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-xs tracking-[0.16em] text-neutral-100 group-hover:gap-4 transition-all uppercase">
                      <span>Mehr erfahren</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="font-display text-5xl md:text-6xl tracking-wide mb-6">
            Verpasse keine neuen Drops
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Abonniere unseren Newsletter für exklusive Updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Deine E-Mail"
              className="flex-1 px-6 py-4 bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition"
            />
            <button className="px-10 py-4 bg-white text-black font-medium tracking-[0.16em] hover:bg-neutral-200 transition whitespace-nowrap">
              Abonnieren
            </button>
          </div>
        </div>
      </section>

    </PageLayout>
  )
}
