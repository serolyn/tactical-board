import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = join(projectRoot, 'docs', 'portfolio-previews', 'phase3c')
const previewUrl = process.env.PORTFOLIO_PREVIEW_URL
  ?? 'http://127.0.0.1:4173/tactical-board/'
const debuggingPort = Number(process.env.PORTFOLIO_CDP_PORT ?? 9333)
const chromiumBinary = process.env.CHROMIUM_BIN ?? 'chromium'

class CdpClient {
  #nextId = 0
  #pending = new Map()
  #listeners = new Map()

  constructor(socket) {
    this.socket = socket
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && this.#pending.has(message.id)) {
        this.#pending.get(message.id)(message)
        this.#pending.delete(message.id)
        return
      }

      for (const listener of this.#listeners.get(message.method) ?? []) {
        listener(message.params)
      }
    })
  }

  static async connect(webSocketDebuggerUrl) {
    const socket = new WebSocket(webSocketDebuggerUrl)
    await new Promise((resolveConnection, rejectConnection) => {
      socket.addEventListener('open', resolveConnection, { once: true })
      socket.addEventListener('error', rejectConnection, { once: true })
    })
    return new CdpClient(socket)
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(method, listeners)
    return () => listeners.delete(listener)
  }

  send(method, params = {}) {
    return new Promise((resolveMessage, rejectMessage) => {
      const id = ++this.#nextId
      const timeout = setTimeout(() => {
        this.#pending.delete(id)
        rejectMessage(new Error(`CDP timeout: ${method}`))
      }, 15_000)

      this.#pending.set(id, (message) => {
        clearTimeout(timeout)
        if (message.error) rejectMessage(new Error(message.error.message))
        else resolveMessage(message.result ?? {})
      })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

async function waitForHttp(url, timeout = 15_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The managed preview or Chromium endpoint is still starting.
    }
    await delay(100)
  }
  throw new Error(`Délai dépassé pour ${url}`)
}

async function stopManagedProcess(child) {
  if (!child || child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([once(child, 'exit'), delay(1_500)])
  if (child.exitCode === null) {
    child.kill('SIGKILL')
    await Promise.race([once(child, 'exit'), delay(1_000)])
  }
}

async function waitForPageTarget() {
  const endpoint = `http://127.0.0.1:${debuggingPort}/json/list`
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      const targets = await (await fetch(endpoint)).json()
      const page = targets.find((target) => target.type === 'page')
      if (page?.webSocketDebuggerUrl) return page
    } catch {
      // Chromium is still exposing the debugging endpoint.
    }
    await delay(100)
  }
  throw new Error('Aucune page Chromium CDP disponible.')
}

async function evaluate(client, expression) {
  const response = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  })
  return response.result?.value
}

async function waitForExpression(client, expression, expected, timeout = 8_000) {
  const deadline = Date.now() + timeout
  let value
  while (Date.now() < deadline) {
    value = await evaluate(client, expression)
    if (value === expected) return value
    await delay(100)
  }
  throw new Error(`État attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(value)}.`)
}

async function prepareViewport(client, { width, height, reducedMotion }) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  })
  await client.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{
      name: 'prefers-reduced-motion',
      value: reducedMotion ? 'reduce' : 'no-preference',
    }],
  })
}

async function navigateAndWait(client, path, expectedWebGLState) {
  const targetUrl = path === '/'
    ? previewUrl
    : new URL(path.replace(/^\/+/, ''), previewUrl).href
  await client.send('Page.navigate', { url: targetUrl })
  await waitForExpression(client, 'document.readyState', 'complete')
  await waitForExpression(
    client,
    'document.querySelector("[data-webgl-state]")?.dataset.webglState ?? "absent"',
    expectedWebGLState,
  )
}

async function capturePage(client, specification) {
  await prepareViewport(client, specification)
  await navigateAndWait(client, '/', specification.expectedWebGLState)

  if (specification.expectedWebGLState === 'ready') {
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: specification.width * 0.78,
      y: specification.height * 0.38,
    })
  }
  await delay(specification.expectedWebGLState === 'ready' ? 420 : 700)

  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  await writeFile(
    join(outputDirectory, specification.filename),
    Buffer.from(screenshot.data, 'base64'),
  )

  return evaluate(client, `JSON.stringify({
    title: document.title,
    webglState: document.querySelector('[data-webgl-state]')?.dataset.webglState ?? 'absent',
    webglActive: document.querySelector('[data-webgl-active]')?.dataset.webglActive ?? 'absent',
    canvas: (() => {
      const canvas = document.querySelector('.ghost-signal-canvas canvas')
      return canvas ? { width: canvas.width, height: canvas.height } : null
    })(),
    resources: performance.getEntriesByType('resource').map((entry) => entry.name)
  })`)
}

async function verifyActivityPause(client) {
  await evaluate(client, `(() => {
    const shell = document.querySelector('[data-portfolio-scroll]')
    shell.style.scrollBehavior = 'auto'
    shell.scrollTop = 900
  })()`)
  await waitForExpression(
    client,
    'document.querySelector("[data-webgl-active]")?.dataset.webglActive',
    'false',
  )
  return true
}

async function verifyContextRecovery(client) {
  const lossStarted = await evaluate(client, `(() => {
    const canvas = document.querySelector('.ghost-signal-canvas canvas')
    const extension = canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')
    if (!extension) return false
    window.__ghostSignalContextExtension = extension
    extension.loseContext()
    return true
  })()`)
  if (!lossStarted) return 'extension-unavailable'

  await waitForExpression(
    client,
    'document.querySelector("[data-webgl-state]")?.dataset.webglState',
    'loading',
  )
  await delay(320)
  await evaluate(client, 'window.__ghostSignalContextExtension.restoreContext()')
  await waitForExpression(
    client,
    'document.querySelector("[data-webgl-state]")?.dataset.webglState',
    'ready',
  )
  return 'restored'
}

async function encodeWebm(frameDirectory, outputName, frameRate) {
  await new Promise((resolveEncoding, rejectEncoding) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-loglevel', 'error',
      '-framerate', String(frameRate),
      '-i', join(frameDirectory, 'frame-%04d.jpg'),
      '-c:v', 'libvpx-vp9',
      '-crf', '35',
      '-b:v', '0',
      '-pix_fmt', 'yuv420p',
      '-an',
      join(outputDirectory, outputName),
    ], { cwd: projectRoot, stdio: 'inherit' })
    ffmpeg.once('error', rejectEncoding)
    ffmpeg.once('exit', (code) => {
      if (code === 0) resolveEncoding()
      else rejectEncoding(new Error(`ffmpeg a quitté avec le code ${code}.`))
    })
  })
}

async function recordScreencast(client, temporaryRoot, options) {
  const frameDirectory = await mkdtemp(join(temporaryRoot, `${options.name}-`))
  const frameWrites = []
  let frameCount = 0

  const removeListener = client.on('Page.screencastFrame', (frame) => {
    void client.send('Page.screencastFrameAck', { sessionId: frame.sessionId })
    if (frameCount >= options.maximumFrames) return
    frameCount += 1
    const frameName = `frame-${String(frameCount).padStart(4, '0')}.jpg`
    frameWrites.push(writeFile(join(frameDirectory, frameName), Buffer.from(frame.data, 'base64')))
  })

  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 82,
    maxWidth: options.width,
    maxHeight: options.height,
    everyNthFrame: 1,
  })
  await options.action()
  await delay(options.duration)
  await client.send('Page.stopScreencast')
  removeListener()
  await Promise.all(frameWrites)

  if (frameCount < 2) throw new Error(`Seulement ${frameCount} frame(s) reçue(s) pour ${options.name}.`)
  await encodeWebm(frameDirectory, options.outputName, options.frameRate)
  return frameCount
}

async function main() {
  await mkdir(outputDirectory, { recursive: true })
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'portfolio-phase3c-'))
  let previewProcess
  let chromiumProcess
  let client

  try {
    try {
      await waitForHttp(previewUrl, 500)
    } catch {
      previewProcess = spawn('npm', [
        'run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173',
      ], { cwd: projectRoot, stdio: 'ignore' })
      await waitForHttp(previewUrl)
    }

    const profileDirectory = await mkdtemp(join(temporaryRoot, 'chromium-'))
    chromiumProcess = spawn(chromiumBinary, [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--enable-unsafe-swiftshader',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--hide-scrollbars',
      `--remote-debugging-port=${debuggingPort}`,
      `--user-data-dir=${profileDirectory}`,
      'about:blank',
    ], { cwd: projectRoot, stdio: 'ignore' })

    const page = await waitForPageTarget()
    client = await CdpClient.connect(page.webSocketDebuggerUrl)
    await Promise.all([
      client.send('Page.enable'),
      client.send('Runtime.enable'),
      client.send('Log.enable'),
    ])

    const consoleErrors = []
    const consoleWarnings = []
    client.on('Runtime.exceptionThrown', (event) => consoleErrors.push(event.exceptionDetails?.text))
    client.on('Runtime.consoleAPICalled', (event) => {
      const text = event.args?.map((argument) => argument.value ?? argument.description).join(' ')
      if (event.type === 'error') consoleErrors.push(text)
      if (event.type === 'warning') consoleWarnings.push(text)
    })
    client.on('Log.entryAdded', ({ entry }) => {
      if (entry.level === 'error') consoleErrors.push(entry.text)
    })

    const desktop = await capturePage(client, {
      filename: 'ghost-signal-desktop.png',
      width: 1440,
      height: 900,
      reducedMotion: false,
      expectedWebGLState: 'ready',
    })
    const activityPause = await verifyActivityPause(client)
    await navigateAndWait(client, '/', 'ready')
    const contextRecovery = await verifyContextRecovery(client)
    const mobile = await capturePage(client, {
      filename: 'ghost-signal-mobile-low.png',
      width: 390,
      height: 844,
      reducedMotion: false,
      expectedWebGLState: 'ready',
    })
    const reduced = await capturePage(client, {
      filename: 'ghost-signal-reduced-motion.png',
      width: 1440,
      height: 900,
      reducedMotion: true,
      expectedWebGLState: 'fallback',
    })

    await prepareViewport(client, { width: 1440, height: 900, reducedMotion: false })
    await navigateAndWait(client, '/', 'ready')
    const heroFrames = await recordScreencast(client, temporaryRoot, {
      name: 'hero',
      outputName: 'ghost-signal-hero.webm',
      width: 1440,
      height: 900,
      maximumFrames: 90,
      frameRate: 15,
      duration: 2_800,
      action: async () => {
        await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 820, y: 560 })
        await delay(650)
        await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1210, y: 260 })
      },
    })

    await navigateAndWait(client, '/', 'ready')
    const transitionFrames = await recordScreencast(client, temporaryRoot, {
      name: 'routes',
      outputName: 'portfolio-route-transition.webm',
      width: 1440,
      height: 900,
      maximumFrames: 72,
      frameRate: 15,
      duration: 1_450,
      action: async () => {
        await delay(220)
        await evaluate(client, `document.querySelector('a[href$="/lab"]')?.click()`)
      },
    })

    const audit = {
      generatedAt: new Date().toISOString(),
      chromium: chromiumBinary,
      previewUrl,
      captures: {
        desktop: JSON.parse(desktop),
        mobile: JSON.parse(mobile),
        reducedMotion: JSON.parse(reduced),
      },
      videos: { heroFrames, transitionFrames },
      lifecycle: { activityPause, contextRecovery },
      consoleErrors: consoleErrors.filter(Boolean),
      consoleWarnings: [...new Set(consoleWarnings.filter(Boolean))],
    }
    await writeFile(
      join(outputDirectory, 'browser-audit.json'),
      `${JSON.stringify(audit, null, 2)}\n`,
    )

    if (audit.consoleErrors.length) {
      throw new Error(`Erreurs navigateur détectées : ${audit.consoleErrors.join(' | ')}`)
    }
    process.stdout.write(`Captures et vidéos produites dans ${outputDirectory}\n`)
  } finally {
    client?.close()
    await stopManagedProcess(chromiumProcess)
    await stopManagedProcess(previewProcess)
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
      maxRetries: 4,
      retryDelay: 150,
    })
  }
}

await main()
