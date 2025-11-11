<template>
  <div
    ref="containerRef"
    class="live2d-container"
    :style="containerStyle"
  >
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  fitHeightToModel: {
    type: Boolean,
    default: true,
  },
})

const canvasRef = ref(null)
const containerRef = ref(null)
let pixiApp = null
let live2DModel = null
let removeResizeListener = null
const isLoading = ref(true)
const modelBounds = ref(null)
let resizeObserver = null
let pendingSync = false

const toCssDimension = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return `${value}px`
  if (typeof value === 'string' && value.trim().length > 0) return value
  return '100%'
}

const containerStyle = computed(() => {
  const style = {
    width: toCssDimension(props.width),
  }

  if (props.fitHeightToModel && modelBounds.value) {
    const { width, height } = modelBounds.value
    if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
      style.height = 'auto'
      style.minHeight = `${Math.ceil(height)}px`
      style.aspectRatio = `${width} / ${height}`
    } else {
      style.height = toCssDimension(props.height)
    }
  } else {
    style.height = toCssDimension(props.height)
  }

  return style
})

const canvasStyle = computed(() => ({
  width: '100%',
  height: '100%',
}))

const positionModel = () => {
  if (!pixiApp || !live2DModel) return

  const rendererWidth = pixiApp.renderer.width / pixiApp.renderer.resolution
  const rendererHeight = pixiApp.renderer.height / pixiApp.renderer.resolution

  if (props.centered) {
    live2DModel.position.set(rendererWidth / 2, rendererHeight / 2)
  } else {
    live2DModel.position.set(0.5, 0.5)
  }
}

const updateModelMetrics = () => {
  if (!live2DModel || typeof live2DModel.getLocalBounds !== 'function') return

  const bounds = live2DModel.getLocalBounds()
  const scaleX = Math.abs(live2DModel.scale?.x ?? props.scale ?? 1)
  const scaleY = Math.abs(live2DModel.scale?.y ?? props.scale ?? 1)
  const width = bounds.width * scaleX
  const height = bounds.height * scaleY

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    modelBounds.value = { width, height }
  }
}

const syncRendererToContainer = () => {
  if (!props.fitHeightToModel || !pixiApp || !containerRef.value) return

  const { clientWidth, clientHeight } = containerRef.value

  if (!clientWidth || !clientHeight) return

  pixiApp.renderer.resize(clientWidth, clientHeight)
}

const scheduleRendererSync = () => {
  if (!props.fitHeightToModel || pendingSync) return

  pendingSync = true
  nextTick(() => {
    pendingSync = false
    syncRendererToContainer()
    positionModel()
  })
}

const updateModelTransform = () => {
  if (!pixiApp || !live2DModel) return

  if (typeof live2DModel.anchor?.set === 'function') {
    live2DModel.anchor.set(0.5, 0.5)
  }

  live2DModel.scale.set(props.scale)
  positionModel()
  updateModelMetrics()
  scheduleRendererSync()
}

const resizeRendererIfNumeric = () => {
  if (!pixiApp) return

  const numericWidth = typeof props.width === 'number' ? props.width : null
  const numericHeight = typeof props.height === 'number' ? props.height : null

  if (numericWidth !== null || numericHeight !== null) {
    const rendererWidth = numericWidth ?? pixiApp.renderer.width / pixiApp.renderer.resolution
    const rendererHeight = numericHeight ?? pixiApp.renderer.height / pixiApp.renderer.resolution
    pixiApp.renderer.resize(rendererWidth, rendererHeight)
  }

  positionModel()
  updateModelMetrics()
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

  if (props.autoResizeToWindow && !props.fitHeightToModel && typeof window !== 'undefined') {
    appOptions.resizeTo = window
  }

  if (typeof props.width === 'number') {
    appOptions.width = props.width
  }

  if (typeof props.height === 'number') {
    appOptions.height = props.height
  }

  pixiApp = new PIXI.Application(appOptions)

  if (typeof window !== 'undefined' && props.fitHeightToModel && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      syncRendererToContainer()
      positionModel()
    })

    nextTick(() => {
      if (containerRef.value) {
        resizeObserver?.observe(containerRef.value)
      }
    })
  }

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
  resizeObserver?.disconnect()
  resizeObserver = null
  pendingSync = false
  modelBounds.value = null
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
    scheduleRendererSync()
    updateModelTransform()
  },
)

watch(
  [() => props.width, () => props.height],
  () => {
    if (props.fitHeightToModel) {
      scheduleRendererSync()
    } else {
      resizeRendererIfNumeric()
      updateModelTransform()
    }
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
