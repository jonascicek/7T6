import React, { useState, useEffect } from 'react'
import api from '../lib/api'

type ArticleDraft = {
  localId: number
  title: string
  description: string
  ebayUrl: string
  files: File[]
}

export default function AdminForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [articles, setArticles] = useState<ArticleDraft[]>([
    { localId: 1, title: '', description: '', ebayUrl: '', files: [] },
  ])
  const [status, setStatus] = useState('')
  const [nextLocalId, setNextLocalId] = useState(2)

  const addArticle = () => {
    setArticles((prev) => [
      ...prev,
      { localId: nextLocalId, title: '', description: '', ebayUrl: '', files: [] },
    ])
    setNextLocalId((prev) => prev + 1)
  }

  const removeArticle = (localId: number) => {
    setArticles((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((article) => article.localId !== localId)
    })
  }

  const updateArticle = (localId: number, data: Partial<ArticleDraft>) => {
    setArticles((prev) =>
      prev.map((article) => (article.localId === localId ? { ...article, ...data } : article))
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasInvalidArticle = articles.some(
      (article) => !article.title.trim() || !article.description.trim() || article.files.length === 0
    )

    if (hasInvalidArticle) {
      return alert('Bitte jeden Artikel mit Titel, Beschreibung und mindestens einem Bild ausfuellen')
    }

    const fd = new FormData()
    fd.append('title', title)
    fd.append('description', description)
    fd.append(
      'articles',
      JSON.stringify(
        articles.map((article) => ({
          title: article.title.trim(),
          description: article.description.trim(),
          ebayUrl: article.ebayUrl.trim(),
        }))
      )
    )
    articles.forEach((article, index) => {
      article.files.forEach((file) => fd.append(`articleImages-${index}`, file))
    })

    try {
      setStatus('Uploading...')
      await api.post('/api/posts', fd)
      setStatus('✓ Kollektion erfolgreich erstellt!')
      setTitle('')
      setDescription('')
      setArticles([{ localId: 1, title: '', description: '', ebayUrl: '', files: [] }])
      setNextLocalId(2)
      // Reload page after 1.5s
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'unknown'
      setStatus('✕ Fehler: ' + msg)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div>
        <label className="block text-sm font-medium tracking-[0.14em] text-neutral-300 mb-3 uppercase">
          Kollektionstitel
        </label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="z.B. Neue Kollektion 2026"
          className="w-full bg-neutral-900 border border-neutral-700 px-5 py-4 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none transition"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium tracking-[0.14em] text-neutral-300 mb-3 uppercase">
          Kollektionsbeschreibung
        </label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Kurzbeschreibung der Kollektion..."
          className="w-full bg-neutral-900 border border-neutral-700 px-5 py-4 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none transition resize-none"
          rows={4}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium tracking-[0.14em] text-neutral-300 uppercase">
            Artikel
          </label>
          <button
            type="button"
            onClick={addArticle}
            className="px-4 py-2 text-xs tracking-[0.16em] border border-neutral-700 text-neutral-300 hover:border-white hover:text-white transition"
          >
            + ARTIKEL HINZUFUEGEN
          </button>
        </div>

        <div className="space-y-6">
          {articles.map((article, index) => (
            <div key={article.localId} className="border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs tracking-[0.16em] text-neutral-400 uppercase">Artikel {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeArticle(article.localId)}
                  disabled={articles.length === 1}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Entfernen
                </button>
              </div>

              <div className="space-y-4">
                <input
                  value={article.title}
                  onChange={(e) => updateArticle(article.localId, { title: e.target.value })}
                  placeholder="Artikeltitel"
                  className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none transition"
                  required
                />

                <textarea
                  value={article.description}
                  onChange={(e) => updateArticle(article.localId, { description: e.target.value })}
                  placeholder="Artikelbeschreibung"
                  className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none transition resize-none"
                  rows={3}
                  required
                />

                <input
                  type="url"
                  value={article.ebayUrl}
                  onChange={(e) => updateArticle(article.localId, { ebayUrl: e.target.value })}
                  placeholder="eBay Link (optional)"
                  className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none transition"
                />

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => updateArticle(article.localId, { files: e.target.files ? Array.from(e.target.files) : [] })}
                  className="w-full text-sm text-neutral-300 file:mr-4 file:py-3 file:px-6 file:border-0 file:bg-white file:text-black file:cursor-pointer hover:file:bg-neutral-200 file:transition"
                  required={article.files.length === 0}
                />
                <p className="text-xs text-neutral-500">
                  {article.files.length > 0
                    ? `${article.files.length} Bild${article.files.length === 1 ? '' : 'er'} ausgewaehlt`
                    : 'Mindestens ein Bild pro Artikel'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          className="w-full px-8 py-4 bg-white text-black font-medium tracking-[0.2em] hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={status === 'Uploading...'}
        >
          {status === 'Uploading...' ? 'WIRD HOCHGELADEN...' : 'KOLLEKTION VEROEFFENTLICHEN'}
        </button>
      </div>

      {status && status !== 'Uploading...' && (
        <div className={`text-sm p-4 border ${
          status.includes('✕') 
            ? 'bg-red-950/30 border-red-800 text-red-400' 
            : 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
        }`}>
          {status}
        </div>
      )}
    </form>
  )
}
