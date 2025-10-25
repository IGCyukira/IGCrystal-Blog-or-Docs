import type { App } from 'vuepress'
import fssync from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

export interface RobotsPluginOptions {
  hostname: string
  includeLocal?: boolean
  localSitemapFilename?: string
  externalSitemaps?: string[]
}

function ensureEndingSlash(s: string) {
  return s.endsWith('/') ? s : `${s}/`
}

function normalizeHostname(hostname: string) {
  // 统一 http(s) 前缀，去掉尾部 /
  if (!/^https?:\/\//i.test(hostname)) hostname = `https://${hostname}`
  return hostname.replace(/\/$/, '')
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function joinUrl(hostname: string, base: string, file: string) {
  const h = normalizeHostname(hostname)
  const b = base === '/' ? '' : ensureEndingSlash(base)
  return `${h}${b}${file}`
}

export function robotsPlugin(options: RobotsPluginOptions) {
  const {
    hostname,
    includeLocal = true,
    localSitemapFilename = 'sitemap.xml',
    externalSitemaps = [],
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
      const nonSitemapLines = lines
        .filter((l) => !/^\s*Sitemap:\s*/i.test(l))
        .map((l) => l.trimEnd())

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
