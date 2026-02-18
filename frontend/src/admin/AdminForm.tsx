import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [previews, setPreviews] = useState<string[]>([])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  useEffect(() => {
    // generate previews
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      // revoke on cleanup
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0) return alert('Bitte mindestens eine Datei auswählen')
    const fd = new FormData()
    fd.append('title', title)
    fd.append('description', description)
    files.forEach((f) => fd.append('images', f))
    try {
      setStatus('Uploading...')
      const res = await axios.post('/api/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setStatus('Erfolgreich: ' + JSON.stringify(res.data.post))
      setTitle('')
      setDescription('')
      setFiles([])
    } catch (err: any) {
      setStatus('Fehler: ' + (err?.message || 'unknown'))
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block font-semibold mb-2 text-sm tracking-wide">TITEL</label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="z.B. Neue Kollektion 2026"
          className="w-full bg-black border border-gray-700 px-4 py-3 text-white placeholder-gray-600 focus:border-white focus:outline-none transition"
        />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-sm tracking-wide">BESCHREIBUNG</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Details über die neue Collection..."
          className="w-full bg-black border border-gray-700 px-4 py-3 text-white placeholder-gray-600 focus:border-white focus:outline-none transition h-32"
        />
      </div>
      <div>
        <label className="block font-semibold mb-2 text-sm tracking-wide">BILDER</label>
        <div className="border border-dashed border-gray-700 p-6 hover:border-white transition cursor-pointer bg-gray-900/30">
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFiles} 
            className="w-full"
          />
          <p className="text-gray-500 text-sm mt-2">Mehrere Bilder möglich</p>
        </div>
        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative">
                <img src={src} alt={`preview-${i}`} className="w-full h-24 object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeFile(i)} 
                  className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <button 
          type="submit" 
          className="w-full px-6 py-3 bg-white text-black font-bold tracking-wide hover:bg-gray-200 transition"
        >
          VERÖFFENTLICHEN
        </button>
      </div>
      {status && (
        <div className={`text-sm p-3 rounded ${status.includes('Fehler') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
          {status}
        </div>
      )}
    </form>
  )
}
