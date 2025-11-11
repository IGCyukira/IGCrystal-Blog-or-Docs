---
title: 这里将会有一个游戏喵
---

<script setup>
import { onMounted, ref } from 'vue'

const live2dResolution = ref(1.5)

onMounted(() => {
  live2dResolution.value = window.devicePixelRatio || 1
})
</script>

<div align="center">
  <ClientOnly>
    <Live2DCanvas
      modelPath="/assets/live2d/mao_pro_en/runtime/mao_pro.model3.json"
      :scale="0.12"
      :resolution="live2dResolution"
    />
  </ClientOnly>

> 花了点时间，导入了一个 Live2D 模型到博客里。
> 
> 看看以后能不能做一个可以对接llm的游戏喵。

</div>
