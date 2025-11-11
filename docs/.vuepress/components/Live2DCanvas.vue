<template>
  <div class="live2d-container" :style="containerStyle">
    <div
      v-if="isLoading"
      class="live2d-loading"
      role="status"
      aria-live="polite"
    >
      <span class="live2d-loading__spinner" aria-hidden="true"></span>
      <span class="live2d-loading__text">喵喵还在穿衣服</span>
    </div>
    <canvas
      ref="canvasRef"
      class="live2d-canvas"
      :class="{ 'live2d-canvas--hidden': isLoading }"
      :style="canvasStyle"
    ></canvas>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ensureLive2DCore } from '../utils/ensureLive2DCore'

const props = defineProps({
  modelPath: {
    type: String,
    default: '/assets/live2d/mao_pro_en/runtime/mao_pro.model3.json',
  },
  scale: {
    type: Number,
    default: 0.2,
  },
  width: {
    type: [Number, String],
    default: '100%',
  },
  height: {
    type: [Number, String],
    default: '100%',
  },
  resolution: {
    type: Number,
    default: 1,
  },
  centered: {
    type: Boolean,
    default: true,
  },
  autoResizeToWindow: {
    type: Boolean,
    default: true,
  },
})

const canvasRef = ref(null)
let pixiApp = null
let live2DModel = null
let removeResizeListener = null
const isLoading = ref(true)

const toCssDimension = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return `${value}px`
  if (typeof value === 'string' && value.trim().length > 0) return value
  return '100%'
}

const containerStyle = computed(() => ({
  width: toCssDimension(props.width),
  height: toCssDimension(props.height),
}))

const canvasStyle = computed(() => ({
  width: toCssDimension(props.width),
  height: toCssDimension(props.height),
}))

const updateModelTransform = () => {
  if (!pixiApp || !live2DModel) return

  const rendererWidth = pixiApp.renderer.width / pixiApp.renderer.resolution
  const rendererHeight = pixiApp.renderer.height / pixiApp.renderer.resolution

  if (typeof live2DModel.anchor?.set === 'function') {
    if (props.centered) {
      live2DModel.anchor.set(0.5, 0.5)
    } else {
      live2DModel.anchor.set(0.5, 0.5)
    }
  }

  if (props.centered) {
    live2DModel.position.set(rendererWidth / 2, rendererHeight / 2)
  } else {
    live2DModel.position.set(0.5, 0.5)
  }

  live2DModel.scale.set(props.scale)
}

const resizeRendererIfNumeric = () => {
  if (!pixiApp) return

  const numericWidth = typeof props.width === 'number' ? props.width : null
  const numericHeight = typeof props.height === 'number' ? props.height : null

  if (numericWidth !== null && numericHeight !== null) {
    pixiApp.renderer.resize(numericWidth, numericHeight)
  }

  updateModelTransform()
}

onMounted(async () => {
  if (!canvasRef.value) return

  await ensureLive2DCore()

  const PIXI = await import('pixi.js')
  const { Live2DModel } = await import('pixi-live2d-display/cubism4')

  window.PIXI = PIXI

  const appOptions = {
    view: canvasRef.value,
    autoStart: true,
    backgroundAlpha: 0,
    resolution: props.resolution,
  }

  if (props.autoResizeToWindow && typeof window !== 'undefined') {
    appOptions.resizeTo = window
  }

  if (typeof props.width === 'number') {
    appOptions.width = props.width
  }

  if (typeof props.height === 'number') {
    appOptions.height = props.height
  }

  pixiApp = new PIXI.Application(appOptions)

  try {
    isLoading.value = true
    live2DModel = await Live2DModel.from(props.modelPath)
    pixiApp.stage.addChild(live2DModel)
    resizeRendererIfNumeric()
    updateModelTransform()
  } finally {
    isLoading.value = false
  }

  if (props.autoResizeToWindow && typeof window !== 'undefined') {
    const handleWindowResize = () => updateModelTransform()
    window.addEventListener('resize', handleWindowResize)
    removeResizeListener = () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }
})

onBeforeUnmount(() => {
  isLoading.value = true
  live2DModel?.destroy()
  pixiApp?.destroy(true)
  pixiApp = null
  live2DModel = null
  removeResizeListener?.()
  removeResizeListener = null
})

watch(
  () => props.scale,
  () => {
    if (!live2DModel) return
    updateModelTransform()
  },
)

watch(
  () => props.centered,
  () => {
    if (!live2DModel) return
    updateModelTransform()
  },
)

watch(
  () => props.resolution,
  (newResolution) => {
    if (!pixiApp) return
    pixiApp.renderer.resolution = newResolution
    pixiApp.renderer.resize(
      pixiApp.renderer.width / newResolution * newResolution,
      pixiApp.renderer.height / newResolution * newResolution,
    )
    updateModelTransform()
  },
)

watch(
  [() => props.width, () => props.height],
  () => {
    resizeRendererIfNumeric()
  },
)
</script>

<style scoped>
.live2d-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.live2d-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.live2d-canvas--hidden {
  opacity: 0;
}

.live2d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  color: #6b7ab3;
  text-align: center;
}

.live2d-loading__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #dfe4ff;
  border-top-color: #6b7ab3;
  border-radius: 50%;
  animation: live2d-spinner 1.1s linear infinite;
}

.live2d-loading__text {
  font-size: 1rem;
}

@keyframes live2d-spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
