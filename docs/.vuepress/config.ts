import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { path } from 'vuepress/utils'
import { robotsPlugin } from './plugins/robots-plugin'
import { sitemapFilterPlugin } from './plugins/sitemap-filter-plugin'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'IGCrystal Blog', 
  description: '路很长，梦仍在',
  head: [ 
    ['link', { rel: 'icon', href: '/favicon.jpg' }], 
  ],

  theme: plumeTheme({
    // 其他主题配置
    logo: '/favicon.jpg',
    hostname: 'https://blog.igcrystal.icu',

    autoFrontmatter: false,
    markdown: {
      artPlayer: true,
    },

    plugins: {
      comment: {
        provider: 'Giscus',
        comment: true,
        repo: 'IGCyukira/IGCrystal-Blog-or-Docs',
        repoId: 'R_kgDOM13P7A',
        category: 'Ideas',
        categoryId: 'DIC_kwDOM13P7M4Cj96G',
        darkTheme: 'dark_protanopia',
        lightTheme: 'light_protanopia',
      },
      // 站点地图由主题在生产构建时启用（hostname 存在时）；
      // 具体收录哪些页面由下面的 sitemapFilterPlugin 控制。
      sitemap: {},
    },
  }),

  plugins: [
    sitemapFilterPlugin({
      // 只保留需要的页面（避免手动维护 excludePaths 列表）
      allowPaths: [
        '/',
        '/yukira.html', 
      ],
    }),
    robotsPlugin({
      hostname: 'https://blog.igcrystal.icu',
      localSitemapFilename: 'sitemap.xml',
      includeLocal: true,
      forceAllowAll: true,
      externalSitemaps: [
        // 在此添加其他站点 sitemap
        'https://revaea.com/sitemap.xml',
      ],
    }),
  ],

    alias: {
    '@theme/Home/VPHomeBanner.vue': path.resolve(
      __dirname,
      './components/VPHomeBanner.vue',
    ),
    '@theme/Blog/VPPostItem.vue': path.resolve(
      __dirname,
      './components/VPPostItem.vue',  
    ),
  },

  bundler: viteBundler(),
})
