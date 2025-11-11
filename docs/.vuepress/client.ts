import { defineClientConfig } from 'vuepress/client'
import { h } from 'vue'
import './styles/custom.css'
import Layout from './components/Layout.vue'
import AsideNav from './components/AsideNav.vue'
import Live2DCanvas from './components/Live2DCanvas.vue'
import { ensureLive2DCore } from './utils/ensureLive2DCore'

export default defineClientConfig({
  layouts: {
    Layout: h(Layout, null, {
      'aside-outline-after': () => h(AsideNav),
    }),
  },
  enhance({ app }) {
    if (typeof window !== 'undefined') {
      // 预加载 Cubism core，避免组件首次挂载时阻塞
      void ensureLive2DCore()
    }

    app.component('Live2DCanvas', Live2DCanvas)
  },
})
