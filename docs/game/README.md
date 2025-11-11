---
title: 这里将会有一个游戏喵
---

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const live2dResolution = ref(1.5)
const live2dScale = ref(0.12)

const updateScale = () => {
  if (typeof window === 'undefined') return
  const width = window.innerWidth || 0

  if (width <= 480) {
    live2dScale.value = 0.07
  } else if (width <= 768) {
    live2dScale.value = 0.09
  } else {
    live2dScale.value = 0.12
  }
}

const handleResize = () => {
  updateScale()
}

onMounted(() => {
  live2dResolution.value = window.devicePixelRatio || 1
  updateScale()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<div align="center">
  <ClientOnly>
    <Live2DCanvas
      modelPath="/assets/live2d/mao_pro_en/runtime/mao_pro.model3.json"
      :scale="live2dScale"
      :resolution="live2dResolution"
    />
  </ClientOnly>

> 花了点时间，导入了一个 Live2D 模型到博客里。
> 
> 看看以后能不能做一个可以对接llm的游戏喵。

</div>
