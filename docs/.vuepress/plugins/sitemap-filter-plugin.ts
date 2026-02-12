import type { Plugin } from 'vuepress'

export interface SitemapFilterPluginOptions {
  /**
   * Page paths to keep in sitemap (e.g. ['/yukira.html']).
   * Any other page will be forced to `frontmatter.sitemap = false`.
   */
  allowPaths: string[]
}

/**
 * Force sitemap to only include allow-listed pages by setting
 * `page.frontmatter.sitemap = false` for all other pages.
 */
export function sitemapFilterPlugin(options: SitemapFilterPluginOptions): Plugin {
  const allow = new Set(options.allowPaths)

  return {
    name: 'sitemap-filter-plugin',
    extendsPage(page) {
      if (allow.has(page.path)) return

      const fm = (page.frontmatter ?? {}) as Record<string, unknown>
      // plugin-sitemap respects `frontmatter.sitemap === false`
      ;(page.frontmatter as any) = {
        ...fm,
        sitemap: false,
      }
    },
  }
}
