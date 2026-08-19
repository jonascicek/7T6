import React, { useState } from 'react'
import api from '../lib/api'

type ArticleDraft = {
  localId: number
  title: string
  description: string
  ebayUrl: string
  files: File[]
}

type StatusState = {
  type: 'idle' | 'success' | 'error' | 'info'
  message: string
}

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

export default function AdminForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [articles, setArticles] = useState<ArticleDraft[]>([
    { localId: 1, title: '', description: '', ebayUrl: '', files: [] },
  ])
  const [status, setStatus] = useState<StatusState>({ type: 'idle', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextLocalId, setNextLocalId] = useState(2)

  const clearError = (key: string) => {
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

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

  const appendArticleFiles = (localId: number, files: File[]) => {
    if (files.length === 0) return

    setArticles((prev) =>
      prev.map((article) =>
        article.localId === localId
          ? {
              ...article,
              files: [...article.files, ...files],
            }
          : article
      )
    )
  }

  const moveArticleFile = (localId: number, fromIndex: number, toIndex: number) => {
    setArticles((prev) =>
      prev.map((article) => {
        if (article.localId !== localId) return article
        if (fromIndex < 0 || fromIndex >= article.files.length || toIndex < 0 || toIndex >= article.files.length) {
          return article
        }

        const nextFiles = [...article.files]
        const [file] = nextFiles.splice(fromIndex, 1)
        nextFiles.splice(toIndex, 0, file)
        return {
          ...article,
          files: nextFiles,
        }
      })
    )
  }

  const removeArticleFile = (localId: number, fileIndex: number) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.localId === localId
          ? {
              ...article,
              files: article.files.filter((_, index) => index !== fileIndex),
            }
          : article
      )
    )
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}

    if (!title.trim()) {
      nextErrors.collectionTitle = 'Bitte einen Kollektionstitel angeben.'
    }

    if (!description.trim()) {
      nextErrors.collectionDescription = 'Bitte eine kurze Beschreibung ergänzen.'
    }

    articles.forEach((article, index) => {
      if (!article.title.trim()) {
        nextErrors[`article-title-${index}`] = 'Bitte einen Artikeltitel ergänzen.'
      }

      if (!article.description.trim()) {
        nextErrors[`article-description-${index}`] = 'Bitte eine Artikelbeschreibung ergänzen.'
      }

      if (article.files.length === 0) {
        nextErrors[`article-files-${index}`] = 'Mindestens ein Bild pro Artikel ist erforderlich.'
      }

      if (article.ebayUrl.trim() && !/^https?:\/\//i.test(article.ebayUrl.trim())) {
        nextErrors[`article-ebay-${index}`] = 'Bitte eine gültige URL mit http:// oder https:// eingeben.'
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ type: 'info', message: 'Prüfe die Eingaben...' })

    if (!validateForm()) {
      setStatus({ type: 'error', message: 'Bitte die markierten Felder vervollständigen.' })
      return
    }

    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('description', description.trim())
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
      setIsSubmitting(true)
      setStatus({ type: 'info', message: 'Wird veröffentlicht...' })
      await api.post('/api/posts', fd)
      setStatus({ type: 'success', message: 'Kollektion erfolgreich veröffentlicht.' })
      setTitle('')
      setDescription('')
      setArticles([{ localId: 1, title: '', description: '', ebayUrl: '', files: [] }])
      setErrors({})
      setNextLocalId(2)
      window.setTimeout(() => window.location.reload(), 1200)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'unknown'
      setStatus({ type: 'error', message: `Speichern fehlgeschlagen: ${msg}` })
    } finally {
      setIsSubmitting(false)
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
          onChange={(e) => {
            setTitle(e.target.value)
            clearError('collectionTitle')
          }}
          placeholder="z.B. Neue Kollektion 2026"
          data-testid="admin-collection-title"
          className={`w-full bg-neutral-900 border px-5 py-4 text-white placeholder-neutral-500 focus:outline-none transition ${errors.collectionTitle ? 'border-red-600' : 'border-neutral-700 focus:border-neutral-300'}`}
          autoFocus
        />
        {errors.collectionTitle && <p className="mt-2 text-sm text-red-400">{errors.collectionTitle}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium tracking-[0.14em] text-neutral-300 mb-3 uppercase">
          Kollektionsbeschreibung
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            clearError('collectionDescription')
          }}
          placeholder="Kurzbeschreibung der Kollektion..."
          data-testid="admin-collection-description"
          className={`w-full bg-neutral-900 border px-5 py-4 text-white placeholder-neutral-500 focus:outline-none transition resize-none ${errors.collectionDescription ? 'border-red-600' : 'border-neutral-700 focus:border-neutral-300'}`}
          rows={4}
        />
        {errors.collectionDescription && <p className="mt-2 text-sm text-red-400">{errors.collectionDescription}</p>}
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

        <p className="mb-4 text-sm text-neutral-500">
          Jeder Artikel braucht Titel, Beschreibung und mindestens ein Bild. Optional kannst du direkt einen eBay-Link ergänzen.
        </p>

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
                <div>
                  <input
                    value={article.title}
                    onChange={(e) => {
                      updateArticle(article.localId, { title: e.target.value })
                      clearError(`article-title-${index}`)
                    }}
                    placeholder="Artikeltitel"
                    data-testid="admin-article-title"
                    className={`w-full bg-neutral-900 border px-4 py-3 text-white placeholder-neutral-500 focus:outline-none transition ${errors[`article-title-${index}`] ? 'border-red-600' : 'border-neutral-700 focus:border-neutral-300'}`}
                  />
                  {errors[`article-title-${index}`] && <p className="mt-2 text-sm text-red-400">{errors[`article-title-${index}`]}</p>}
                </div>

                <div>
                  <textarea
                    value={article.description}
                    onChange={(e) => {
                      updateArticle(article.localId, { description: e.target.value })
                      clearError(`article-description-${index}`)
                    }}
                    placeholder="Artikelbeschreibung"
                    data-testid="admin-article-description"
                    className={`w-full bg-neutral-900 border px-4 py-3 text-white placeholder-neutral-500 focus:outline-none transition resize-none ${errors[`article-description-${index}`] ? 'border-red-600' : 'border-neutral-700 focus:border-neutral-300'}`}
                    rows={3}
                  />
                  {errors[`article-description-${index}`] && <p className="mt-2 text-sm text-red-400">{errors[`article-description-${index}`]}</p>}
                </div>

                <div>
                  <input
                    type="url"
                    value={article.ebayUrl}
                    onChange={(e) => {
                      updateArticle(article.localId, { ebayUrl: e.target.value })
                      clearError(`article-ebay-${index}`)
                    }}
                    placeholder="eBay Link (optional)"
                    className={`w-full bg-neutral-900 border px-4 py-3 text-white placeholder-neutral-500 focus:outline-none transition ${errors[`article-ebay-${index}`] ? 'border-red-600' : 'border-neutral-700 focus:border-neutral-300'}`}
                  />
                  {errors[`article-ebay-${index}`] && <p className="mt-2 text-sm text-red-400">{errors[`article-ebay-${index}`]}</p>}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    data-testid="admin-article-file"
                    onChange={(e) => {
                      appendArticleFiles(article.localId, e.target.files ? Array.from(e.target.files) : [])
                      clearError(`article-files-${index}`)
                      e.currentTarget.value = ''
                    }}
                    className="w-full text-sm text-neutral-300 file:mr-4 file:py-3 file:px-6 file:border-0 file:bg-white file:text-black file:cursor-pointer hover:file:bg-neutral-200 file:transition"
                  />

                  {article.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {article.files.map((file, fileIndex) => (
                        <div
                          key={`${getFileKey(file)}-${fileIndex}`}
                          className="flex items-center justify-between gap-3 border border-neutral-800 bg-black px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-neutral-400">Bild {fileIndex + 1}</p>
                            <p className="truncate text-sm text-neutral-200">{file.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveArticleFile(article.localId, fileIndex, fileIndex - 1)}
                              disabled={fileIndex === 0}
                              className="px-2 py-1 border border-neutral-700 text-xs text-neutral-300 hover:border-white hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Hoch
                            </button>
                            <button
                              type="button"
                              onClick={() => moveArticleFile(article.localId, fileIndex, fileIndex + 1)}
                              disabled={fileIndex === article.files.length - 1}
                              className="px-2 py-1 border border-neutral-700 text-xs text-neutral-300 hover:border-white hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Runter
                            </button>
                            <button
                              type="button"
                              onClick={() => removeArticleFile(article.localId, fileIndex)}
                              className="px-2 py-1 border border-red-800 text-xs text-red-300 hover:bg-red-950/60"
                            >
                              Entfernen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors[`article-files-${index}`] ? (
                    <p className="mt-2 text-sm text-red-400">{errors[`article-files-${index}`]}</p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">
                      {article.files.length > 0
                        ? `${article.files.length} Bild${article.files.length === 1 ? '' : 'er'} ausgewählt. Reihenfolge wird wie oben gespeichert.`
                        : 'Mindestens ein Bild pro Artikel'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          data-testid="admin-submit"
          className="w-full px-8 py-4 bg-white text-black font-medium tracking-[0.2em] hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'WIRD VERÖFFENTLICHT...' : 'KOLLEKTION VERÖFFENTLICHEN'}
        </button>
      </div>

      {status.message && (
        <div className={`text-sm p-4 border ${
          status.type === 'error'
            ? 'bg-red-950/30 border-red-800 text-red-400'
            : status.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
              : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
        }`}>
          {status.message}
        </div>
      )}
    </form>
  )
}
