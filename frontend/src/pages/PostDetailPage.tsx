import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import PageLayout from '../components/PageLayout'

interface Image {
  id: number
  url: string
}

interface PostItem {
  id: number
  title: string
  description: string
  ebayUrl?: string | null
  images: Image[]
}

interface Post {
  id: number
  title: string
  description: string
  images: Image[]
  items?: PostItem[]
  createdAt: string
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-700 border-t-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-white text-black text-sm hover:bg-neutral-200 transition"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Post nicht gefunden.</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-white text-black text-sm hover:bg-neutral-200 transition"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  const postItems = post.items ?? []
  const hasItems = postItems.length > 0
  const heroImages = hasItems ? postItems[0].images : post.images

  return (
    <PageLayout withFooter containerClassName="bg-neutral-950 text-white">

      <section className="pt-20">
        {heroImages.length > 0 && (
          <div className="relative">
            <div className="w-full h-[85vh] bg-neutral-900 overflow-hidden">
              <img
                src={heroImages[currentImageIndex].url}
                alt={post.title}
                className="w-full h-full object-contain"
              />
            </div>

            {heroImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? heroImages.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/80 hover:bg-black text-white flex items-center justify-center transition"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === heroImages.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/80 hover:bg-black text-white flex items-center justify-center transition"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {heroImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                      aria-label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <article className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
        <div className="mb-8 pb-8 border-b border-neutral-800">
          <p className="text-sm tracking-[0.18em] text-neutral-500 mb-4 uppercase">
            {new Date(post.createdAt).toLocaleDateString('de-DE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide text-white leading-[0.95]">
            {post.title}
          </h1>
        </div>

        {hasItems ? (
          <div className="space-y-16">
            {postItems.map((item) => (
              <section key={item.id} className="border-t border-neutral-800 pt-10">
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-4">{item.title}</h2>
                <p className="text-neutral-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-8">
                  {item.description}
                </p>

                {item.ebayUrl ? (
                  <a
                    href={item.ebayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 mb-8 border border-neutral-600 text-neutral-100 text-xs tracking-[0.16em] uppercase hover:border-white hover:text-white transition"
                  >
                    Auf eBay ansehen
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5h5m0 0v5m0-5L10 14" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9v10h10" />
                    </svg>
                  </a>
                ) : null}

                {item.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {item.images.map((img, index) => (
                      <div key={img.id} className="aspect-[4/5] overflow-hidden bg-neutral-900 group">
                        <img
                          src={img.url}
                          alt={`${item.title} - ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-neutral-300 leading-relaxed whitespace-pre-wrap font-light">
                {post.description}
              </p>
            </div>

            {post.images.length > 1 && (
              <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
                {post.images.slice(1).map((img, index) => (
                  <div
                    key={img.id}
                    className="aspect-[4/5] overflow-hidden bg-neutral-900 cursor-pointer group"
                    onClick={() => setCurrentImageIndex(index + 1)}
                  >
                    <img
                      src={img.url}
                      alt={`${post.title} - ${index + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-20 pt-12 border-t border-neutral-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-sm tracking-[0.16em] text-neutral-500 mb-2 uppercase">Teilen</p>
              <div className="flex gap-4">
                <button className="text-neutral-400 hover:text-white transition" aria-label="Teilen auf Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
                <button className="text-neutral-400 hover:text-white transition" aria-label="Teilen auf Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </button>
              </div>
            </div>

            <Link
              to="/"
              className="px-8 py-3 bg-white text-black text-sm tracking-[0.16em] hover:bg-neutral-200 transition"
            >
              Mehr Kollektionen
            </Link>
          </div>
        </div>
      </article>

    </PageLayout>
  )
}
