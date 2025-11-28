import type { App } from 'vuepress'
import fssync from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

export interface RobotsPluginOptions {
  hostname: string
  includeLocal?: boolean
  localSitemapFilename?: string
  externalSitemaps?: string[]
  forceAllowAll?: boolean
  allow?: string[]
  disallow?: string[]
}

function ensureEndingSlash(s: string) {
  return s.endsWith('/') ? s : `${s}/`
}

function normalizeBase(base: string) {
  if (!base) return '/'
  const withLeading = base.startsWith('/') ? base : `/${base}`
  return withLeading === '/' ? '/' : ensureEndingSlash(withLeading)
}

function normalizeHostname(hostname: string) {
  if (!/^https?:\/\//i.test(hostname)) hostname = `https://${hostname}`
  return hostname.replace(/\/$/, '')
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function normalizeRule(rule: string) {
  return rule.trim()
}

function joinUrl(hostname: string, base: string, file: string) {
  const h = normalizeHostname(hostname)
  const b = normalizeBase(base)
  const f = file.replace(/^\/+/g, '')
  return `${h}${b}${f}`
}

export function robotsPlugin(options: RobotsPluginOptions) {
  const {
    hostname,
    includeLocal = true,
    localSitemapFilename = 'sitemap.xml',
    externalSitemaps = [],
    forceAllowAll = true,
    allow = [],
    disallow = [],
  } = options

  return (app: App) => ({
    name: 'local-robots-plugin',
    async onGenerated() {
      const robotsPath = app.dir.dest('robots.txt')

      let content = ''
      if (fssync.existsSync(robotsPath)) {
        content = await readFile(robotsPath, 'utf-8')
      } else {
        content = 'User-agent: *\nAllow: /\n'
      }

      const lines = content.split(/\r?\n/)
      let nonSitemapLines = lines
        .filter((l) => !/^\s*Sitemap:\s*/i.test(l))
        .map((l) => l.trimEnd())

      const normalizedAllow = unique((allow || []).map((item) => normalizeRule(item)).filter(Boolean))
      const normalizedDisallow = unique((disallow || []).map((item) => normalizeRule(item)).filter(Boolean))

      if (normalizedAllow.length) {
        nonSitemapLines = nonSitemapLines.filter((line) => !/^\s*Allow:/i.test(line))
      }

      if (normalizedDisallow.length) {
        nonSitemapLines = nonSitemapLines.filter((line) => !/^\s*Disallow:/i.test(line))
      }

      let hasUserAgent = false
      nonSitemapLines = nonSitemapLines.map((line) => {
        if (/^\s*User-agent:/i.test(line)) hasUserAgent = true
        if (/^\s*Disallow:\s*$/i.test(line) && normalizedDisallow.length === 0 && normalizedAllow.length === 0) {
          return 'Allow: /'
        }
        return line
      })

      if (!hasUserAgent) {
        nonSitemapLines = ['User-agent: *', ...nonSitemapLines]
      }

      const shouldForceAllow = forceAllowAll && normalizedAllow.length === 0 && normalizedDisallow.length === 0
      if (shouldForceAllow) {
        const firstAgentIndex = nonSitemapLines.findIndex((line) => /^\s*User-agent:/i.test(line))
        const insertionIndex = firstAgentIndex === -1 ? 0 : firstAgentIndex + 1
        const alreadyHasAllowRoot = nonSitemapLines.some((line) => /^\s*Allow:\s*\/$/i.test(line))
        if (!alreadyHasAllowRoot) {
          nonSitemapLines.splice(insertionIndex, 0, 'Allow: /')
        }
      }

      if (normalizedAllow.length || normalizedDisallow.length) {
        const firstAgentIndex = nonSitemapLines.findIndex((line) => /^\s*User-agent:/i.test(line))
        const insertionIndex = firstAgentIndex === -1 ? 0 : firstAgentIndex + 1
        const directiveLines = [
          ...normalizedDisallow.map((rule) => `Disallow: ${rule}`),
          ...normalizedAllow.map((rule) => `Allow: ${rule}`),
        ]
        nonSitemapLines.splice(insertionIndex, 0, ...directiveLines)
      }

      const sitemapUrls: string[] = []
      if (includeLocal) {
        sitemapUrls.push(joinUrl(hostname, app.options.base || '/', localSitemapFilename))
      }

      for (const url of externalSitemaps) {
        if (typeof url === 'string' && /^https?:\/\//i.test(url)) sitemapUrls.push(url)
      }

      const final = [
        ...nonSitemapLines.filter((l, i, arr) => !(l === '' && (i === 0 || arr[i - 1] === ''))),
        '',
        ...unique(sitemapUrls).map((u) => `Sitemap: ${u}`),
        '',
      ]
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd() + '\n'

      await writeFile(robotsPath, final, 'utf-8')
    },
  })
}
