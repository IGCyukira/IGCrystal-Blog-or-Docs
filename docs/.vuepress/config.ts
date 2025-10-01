import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'
import { getDirname, path } from 'vuepress/utils'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'IGCrystal Blog', // 网站标题
  description: '路很长，梦仍在', // 网站描述
  head: [ // 注入到当前HTMl页面 <head> 中的标签
    ['link', { rel: 'icon', href: '/logo.png' }], // 增加一个自定义的 favicon(网页标签的图标)
  ],

  theme: plumeTheme({
    // 其他主题配置
    logo: '/logo.png',
    hostname: 'https://blog.igcrystal.icu',

    notes: false,
    blog: false,
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
      }
    },
  }),

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
