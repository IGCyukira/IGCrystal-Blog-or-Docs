import { defineNavbarConfig } from 'vuepress-theme-plume'

export default defineNavbarConfig([
    { text: '学习', 
      icon: 'material-symbols:article-outline',
      link: '/learn/' 
    },
    { 
      text: '博客', 
      icon: 'material-symbols:edit-square-outline',
      link: '/blog/' 
    },
    { 
      text: '关于', 
      icon: 'map:wind-surfing',
      link: 'https://IGCrystal.icu' 
    },
])