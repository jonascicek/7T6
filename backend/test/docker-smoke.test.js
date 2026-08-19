const test = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..', '..')

test('docker compose stack responds on health and frontend routes', async () => {
  const composeCmd = process.platform === 'win32' ? 'docker.exe' : 'docker'

  const maybeDown = () => {
    try {
      execFileSync(composeCmd, ['compose', 'down', '--remove-orphans'], {
        cwd: projectRoot,
        stdio: 'ignore',
      })
    } catch {
      // ignore if no stack is running or docker is unavailable
    }
  }

  maybeDown()

  try {
    execFileSync(composeCmd, ['compose', 'up', '--build', '-d'], {
      cwd: projectRoot,
      stdio: 'inherit',
    })

    const waitForHealthy = async (url, timeoutMs = 180000) => {
      const started = Date.now()
      let lastError = null
      while (Date.now() - started < timeoutMs) {
        try {
          const response = await fetch(url)
          if (response.ok) {
            return response
          }
          lastError = new Error(`Unexpected status ${response.status}`)
        } catch (error) {
          lastError = error
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      throw new Error(`Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ''}`)
    }

    const healthResponse = await waitForHealthy('http://127.0.0.1/health')
    assert.equal(healthResponse.status, 200)

    const frontendResponse = await fetch('http://127.0.0.1/')
    assert.equal(frontendResponse.status, 200)
  } finally {
    maybeDown()
  }
})
