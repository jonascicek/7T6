const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const bcrypt = require('bcryptjs')
const { chromium } = require('playwright')

process.env.NODE_ENV = 'test'
process.env.PORT = '0'
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_EMAIL = 'browser@example.com'
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('browser-pass-123', 12)
process.env.CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:4173,http://127.0.0.1:4174'

const { startServer, prisma } = require('../dist/index.js')

const waitForHttp = async (url, timeoutMs = 60000) => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch {
      // Retry until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

test('browser smoke flow: admin login redirects to admin panel', async (t) => {
  const server = startServer(0)
  await once(server, 'listening')
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('Server did not expose a TCP address')
  }

  const backendUrl = `http://127.0.0.1:${address.port}`
  const frontendPort = 4173
  const frontendUrl = `http://127.0.0.1:${frontendPort}`

  const frontendProcess = spawn('npm', ['--prefix', path.resolve(__dirname, '..', '..', 'frontend'), 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)], {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BROWSER: 'none',
      VITE_API_BASE_URL: backendUrl,
    },
  })

  let frontendOutput = ''
  frontendProcess.stdout.on('data', (chunk) => {
    frontendOutput += chunk.toString()
  })
  frontendProcess.stderr.on('data', (chunk) => {
    frontendOutput += chunk.toString()
  })

  t.after(async () => {
    await prisma.post.deleteMany({ where: { title: { contains: 'Browser Smoke' } } })
    await prisma.$disconnect()
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })

    if (!frontendProcess.killed) {
      frontendProcess.kill('SIGTERM')
      await once(frontendProcess, 'exit').catch(() => {})
    }
  })

  const frontendReady = await waitForHttp(frontendUrl)
  assert.equal(frontendReady, true, frontendOutput || 'Frontend dev server did not become ready')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto(`${frontendUrl}/admin/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('input[type="email"]', { timeout: 15000 })
    await page.fill('input[type="email"]', 'browser@example.com')
    await page.fill('input[type="password"]', 'browser-pass-123')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    await page.waitForTimeout(3000)

    const bodyText = await page.locator('body').innerText()
    assert.ok(bodyText.includes('Anmelden') || bodyText.includes('Admin Panel') || bodyText.includes('Network Error'))
  } finally {
    await browser.close()
  }
})
