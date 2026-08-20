import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('smoke flow: admin login, create post with image, retrieve post', async (t) => {
  process.env.NODE_ENV = 'test'
  process.env.PORT = '0'
  process.env.JWT_SECRET = 'test-secret'
  process.env.ADMIN_EMAIL = 'smoke@example.com'
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('smoke-pass-123', 12)
  process.env.CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'

  const { app, startServer, prisma } = await import('../src/index.ts')

  const server = await startServer(0)
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Server did not expose a TCP address')
  }

  const baseUrl = `http://127.0.0.1:${address.port}`

  t.after(async () => {
    await prisma.post.deleteMany({ where: { title: { contains: 'Smoke Test' } } })
    await prisma.$disconnect()
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQABAAUABQABnQAAAABJRU5ErkJggg==',
    'base64'
  )

  const tmpDir = fs.mkdtempSync(path.join(__dirname, 'tmp-'))
  const imagePath = path.join(tmpDir, 'smoke-image.png')
  fs.writeFileSync(imagePath, pngBuffer)

  try {
    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ email: 'smoke@example.com', password: 'smoke-pass-123' }),
    })

    assert.equal(loginResponse.status, 200)
    const loginBody = await loginResponse.json()
    assert.equal(loginBody.ok, true)

    const cookieHeader = loginResponse.headers.get('set-cookie')
    assert.ok(cookieHeader)

    const form = new FormData()
    form.append('title', 'Smoke Test Collection')
    form.append('description', 'Created by smoke test')
    form.append('files', new Blob([fs.readFileSync(imagePath)], { type: 'image/png' }), 'smoke-image.png')
    form.append('articles', JSON.stringify([{ title: 'Smoke Article', description: 'Smoke body', ebayUrl: '' }]))

    const createResponse = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: {
        origin: 'http://localhost:5173',
        cookie: cookieHeader,
      },
      body: form,
    })

    assert.equal(createResponse.status, 200)
    const createBody = await createResponse.json()
    assert.equal(createBody.ok, true)
    assert.ok(createBody.post?.id)

    const sameOriginForm = new FormData()
    sameOriginForm.append('title', 'Same Origin Upload Test')
    sameOriginForm.append('description', 'Created without Origin header on same-origin request')
    sameOriginForm.append(
      'files',
      new Blob([fs.readFileSync(imagePath)], { type: 'image/png' }),
      'same-origin-upload.png'
    )
    sameOriginForm.append('articles', JSON.stringify([{ title: 'Same Origin Item', description: 'Body', ebayUrl: '' }]))

    const sameOriginResponse = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: {
        cookie: cookieHeader,
        host: 'localhost:5173',
      },
      body: sameOriginForm,
    })

    assert.equal(sameOriginResponse.status, 200, `same-origin upload failed: ${await sameOriginResponse.text()}`)

    const getResponse = await fetch(`${baseUrl}/api/posts/${createBody.post.id}`)
    assert.equal(getResponse.status, 200)
    const getBody = await getResponse.json()
    assert.equal(getBody.post?.title, 'Smoke Test Collection')
    assert.ok(getBody.post?.items?.length)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
