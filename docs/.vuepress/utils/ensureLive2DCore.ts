const scriptId = 'live2d-cubism-core'
let corePromise: Promise<void> | null = null

const appendScript = () =>
  new Promise<void>((resolve, reject) => {
    let target: HTMLScriptElement | null = null

    const handleLoad = () => {
      target?.setAttribute('data-loaded', 'true')
      corePromise = null
      resolve()
    }
    const handleError = () => {
      corePromise = null
      reject(new Error('Failed to load Live2D Cubism core'))
    }

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      target = existing

      if (existing.getAttribute('data-loaded') === 'true') {
        corePromise = null
        resolve()
        return
      }
      existing.addEventListener('load', handleLoad, { once: true })
      existing.addEventListener('error', handleError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
  const url = new URL('./live2dcubismcore.min.js', import.meta.url)
  script.src = url.toString()
    script.defer = true
    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    target = script
    document.head.appendChild(script)
  })

export const ensureLive2DCore = () => {
  if (typeof window === 'undefined') return Promise.resolve()

  const w = window as typeof window & { Live2DCubismCore?: unknown }
  if (w.Live2DCubismCore) return Promise.resolve()
  if (corePromise) return corePromise

  corePromise = appendScript()
  return corePromise
}

