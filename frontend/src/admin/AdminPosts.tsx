import React, { useEffect, useState } from 'react'
import api from '../lib/api'

interface Image {
  id: number
  url: string
}

interface PostItem {
  id: number
  title: string
  description: string
  ebayUrl?: string | null
  images?: Image[]
}

interface Post {
  id: number
  title: string
  description: string
  images: Image[]
  items?: PostItem[]
  createdAt: string
}

type EditItemDraft = {
  id: number
  title: string
  description: string
  ebayUrl: string
  images: Image[]
}

type UpdateItemPayload = {
  id: number
  title: string
  description: string
  ebayUrl: string
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editItems, setEditItems] = useState<EditItemDraft[]>([])
  const [status, setStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [busyItemId, setBusyItemId] = useState<number | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [pendingDeleteImageIds, setPendingDeleteImageIds] = useState<Record<number, number[]>>({})

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
    setEditItems(
      (post.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        ebayUrl: item.ebayUrl || '',
        images: item.images || [],
      }))
    )
    setPendingDeleteImageIds({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditItems([])
    setPendingDeleteImageIds({})
  }

  const isImageQueuedForDelete = (itemId: number, imageId: number) =>
    (pendingDeleteImageIds[itemId] || []).includes(imageId)

  const queueImageDelete = (itemId: number, imageId: number) => {
    setPendingDeleteImageIds((prev) => {
      const current = prev[itemId] || []
      if (current.includes(imageId)) return prev
      return {
        ...prev,
        [itemId]: [...current, imageId],
      }
    })
    setStatus('Bild zum Loeschen markiert. Speichern zum Anwenden.')
  }

  const undoQueuedImageDelete = (itemId: number, imageId: number) => {
    setPendingDeleteImageIds((prev) => {
      const current = prev[itemId] || []
      const next = current.filter((id) => id !== imageId)
      if (next.length === 0) {
        const copy = { ...prev }
        delete copy[itemId]
        return copy
      }
      return {
        ...prev,
        [itemId]: next,
      }
    })
    setStatus('Loesch-Markierung entfernt.')
  }

  const applyQueuedImageDeletes = async () => {
    const queueEntries = Object.entries(pendingDeleteImageIds)
    if (queueEntries.length === 0) return

    for (const [itemIdRaw, imageIds] of queueEntries) {
      const itemId = Number(itemIdRaw)
      if (!Number.isInteger(itemId) || imageIds.length === 0) continue

      setBusyItemId(itemId)
      for (const imageId of imageIds) {
        setDeletingImageId(imageId)
        await api.delete(`/api/post-items/${itemId}/images/${imageId}`)
        setEditItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  images: item.images.filter((image) => image.id !== imageId),
                }
              : item
          )
        )
      }
    }

    setBusyItemId(null)
    setDeletingImageId(null)
    setPendingDeleteImageIds({})
  }

  const saveEdit = async (id: number) => {
    setIsSaving(true)
    try {
      await applyQueuedImageDeletes()

      const payload: {
        title: string
        description: string
        items?: UpdateItemPayload[]
      } = {
        title: editTitle,
        description: editDescription,
      }

      if (editItems.length > 0) {
        payload.items = editItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          ebayUrl: item.ebayUrl,
        }))
      }

      const res = await api.put(`/api/posts/${id}`, payload)
      setPosts((prev) => prev.map((p) => (p.id === id ? res.data.post : p)))
      setStatus('Post aktualisiert.')
      cancelEdit()
    } catch (err: any) {
      setStatus('Fehler beim Speichern: ' + (err?.message || 'unknown'))
      setBusyItemId(null)
      setDeletingImageId(null)
    } finally {
      setIsSaving(false)
    }
  }

  const uploadItemImages = async (itemId: number, files: File[]) => {
    if (files.length === 0 || busyItemId !== null) return

    const fd = new FormData()
    files.forEach((file) => fd.append('files', file))

    setBusyItemId(itemId)
    try {
      const res = await api.post(`/api/post-items/${itemId}/images`, fd)
      const updatedItem = res.data?.item as PostItem | undefined
      if (!updatedItem) return

      setEditItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                images: updatedItem.images || [],
              }
            : item
        )
      )
      setStatus('Bild(er) hinzugefuegt.')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'unknown'
      setStatus('Fehler beim Bild-Upload: ' + msg)
    } finally {
      setBusyItemId(null)
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

                  {editItems.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs tracking-[0.16em] text-neutral-400 uppercase">
                          Artikel
                        </p>
                        <p className="text-xs text-neutral-500">
                          Titel, Beschreibung und eBay-Link editierbar
                        </p>
                      </div>

                      <div className="space-y-4">
                        {editItems.map((item, index) => (
                          <div key={item.id} className="border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                            <p className="text-xs tracking-[0.16em] text-neutral-500 uppercase">
                              Artikel {index + 1}
                            </p>
                            <input
                              value={item.title}
                              onChange={(e) =>
                                setEditItems((prev) =>
                                  prev.map((current) =>
                                    current.id === item.id ? { ...current, title: e.target.value } : current
                                  )
                                )
                              }
                              className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none"
                              placeholder="Artikeltitel"
                            />
                            <textarea
                              value={item.description}
                              onChange={(e) =>
                                setEditItems((prev) =>
                                  prev.map((current) =>
                                    current.id === item.id
                                      ? { ...current, description: e.target.value }
                                      : current
                                  )
                                )
                              }
                              className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none resize-none"
                              rows={3}
                              placeholder="Artikelbeschreibung"
                            />
                            <input
                              type="url"
                              value={item.ebayUrl}
                              onChange={(e) =>
                                setEditItems((prev) =>
                                  prev.map((current) =>
                                    current.id === item.id ? { ...current, ebayUrl: e.target.value } : current
                                  )
                                )
                              }
                              className="w-full bg-neutral-900 border border-neutral-700 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-300 focus:outline-none"
                              placeholder="eBay Link (optional)"
                            />

                            <div className="space-y-3">
                              <p className="text-xs tracking-[0.14em] text-neutral-500 uppercase">Bilder</p>

                              {item.images.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {item.images.map((image) => (
                                    <div key={image.id} className="relative group border border-neutral-800 bg-neutral-900">
                                      <img src={image.url} alt="Artikelbild" className="w-full aspect-square object-cover" />
                                      {isImageQueuedForDelete(item.id, image.id) ? (
                                        <button
                                          type="button"
                                          onClick={() => undoQueuedImageDelete(item.id, image.id)}
                                          disabled={isSaving || busyItemId === item.id}
                                          className="absolute top-2 right-2 px-2 py-1 text-[10px] tracking-[0.12em] border border-neutral-600 bg-black/80 text-neutral-200 hover:bg-neutral-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Rueckgaengig
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => queueImageDelete(item.id, image.id)}
                                          disabled={isSaving || busyItemId === item.id}
                                          className="absolute top-2 right-2 px-2 py-1 text-[10px] tracking-[0.12em] border border-red-700 bg-black/80 text-red-300 hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Entfernen
                                        </button>
                                      )}

                                      {isImageQueuedForDelete(item.id, image.id) && (
                                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-[10px] tracking-[0.14em] text-red-300 uppercase">
                                          Wird geloescht
                                        </div>
                                      )}

                                      {deletingImageId === image.id && busyItemId === item.id && (
                                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-[10px] tracking-[0.14em] text-neutral-200 uppercase">
                                          Loescht...
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-500">Keine Bilder vorhanden.</p>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={busyItemId === item.id || isSaving}
                                onChange={(e) => {
                                  const files = e.target.files ? Array.from(e.target.files) : []
                                  void uploadItemImages(item.id, files)
                                  e.currentTarget.value = ''
                                }}
                                className="w-full text-sm text-neutral-300 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-white file:text-black file:cursor-pointer hover:file:bg-neutral-200 file:transition disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex items-center justify-between">
                                {busyItemId === item.id ? (
                                  <p className="text-xs text-neutral-500">Bilder werden verarbeitet...</p>
                                ) : (
                                  <span />
                                )}
                                {(pendingDeleteImageIds[item.id] || []).length > 0 && (
                                  <p className="text-xs text-neutral-500">
                                    {(pendingDeleteImageIds[item.id] || []).length} Bild(er) zum Loeschen markiert
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(post.id)}
                      disabled={isSaving || busyItemId !== null}
                      className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Speichert...' : 'Speichern'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving || busyItemId !== null}
                      className="px-6 py-3 border border-neutral-700 text-neutral-300 hover:border-white hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
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
