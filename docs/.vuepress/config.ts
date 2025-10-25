import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { path } from 'vuepress/utils'
import { robotsPlugin } from './plugins/robots-plugin'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'IGCrystal Blog', 
  description: '路很长，梦仍在',
  head: [ 
    ['link', { rel: 'icon', href: '/logo.png' }], 
  ],

  theme: plumeTheme({
    // 其他主题配置
    logo: '/logo.png',
    hostname: 'https://blog.igcrystal.icu',

    autoFrontmatter: false,
    markdown: {
      artPlayer: true,
    },

    plugins: {
      comment: {
        provider: 'Giscus',
        comment: true,
        repo: 'igcrystal-neo/igcrystal-blog-or-docs',
        repoId: 'R_kgDOM13P7A',
        category: 'Ideas',
        categoryId: 'DIC_kwDOM13P7M4Cj96G',
        darkTheme: 'dark_protanopia',
        lightTheme: 'light_protanopia',
      },
    },
  }),

  plugins: [
    robotsPlugin({
      hostname: 'https://blog.igcrystal.icu',
      localSitemapFilename: 'sitemap.xml',
      includeLocal: true,
      externalSitemaps: [
        // 在此添加其他站点 sitemap
        'https://wenturc.com/sitemap.xml',
        'https://igcrustal.icu/sitemap.xml',
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
