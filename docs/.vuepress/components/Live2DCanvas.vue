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

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { Application } from 'pixi.js'
import type { Live2DModel as Live2DModelInstance } from 'pixi-live2d-display/cubism4'
import { ensureLive2DCore } from '../utils/ensureLive2DCore'

type CssDimension = number | string

type ModelBounds = {
  width: number
  height: number
}

type PointerFocus = {
  x: number
  y: number
}

interface Props {
  modelPath: string
  scale: number
  width: CssDimension
  height: CssDimension
  resolution: number
  centered: boolean
  autoResizeToWindow: boolean
  fitHeightToModel: boolean
  pointerTracking: boolean
  pointerOffsetX: number
  pointerOffsetY: number
}

const props = withDefaults(defineProps<Props>(), {
  modelPath: '/assets/live2d/mao_pro_en/runtime/mao_pro.model3.json',
  scale: 0.2,
  width: '100%',
  height: '100%',
  resolution: 1,
  centered: true,
  autoResizeToWindow: true,
  fitHeightToModel: true,
  pointerTracking: false,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let pixiApp: Application | null = null
let live2DModel: Live2DModelInstance | null = null
let removeResizeListener: (() => void) | null = null
const isLoading = ref<boolean>(true)
const modelBounds = ref<ModelBounds | null>(null)
let resizeObserver: ResizeObserver | null = null
let pendingSync = false
let removePointerListeners: (() => void) | null = null

const toCssDimension = (value: unknown): string => {
  if (typeof value === 'number' && !Number.isNaN(value)) return `${value}px`
  if (typeof value === 'string' && value.trim().length > 0) return value
  return '100%'
}

const containerStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
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

const canvasStyle = computed<CSSProperties>(() => ({
  width: '100%',
  height: '100%',
}))

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const focusModel = (x: number, y: number, instant = false) => {
  const controller = (live2DModel as any)?.internalModel?.focusController
  if (!controller) return
  controller.focus(clamp(x, -1, 1), clamp(y, -1, 1), instant)
}

const getPointerFocus = (event: PointerEvent): PointerFocus | null => {
  if (!canvasRef.value || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') return null
  const rect = canvasRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const ratioX = (event.clientX - rect.left) / rect.width
  const ratioY = (event.clientY - rect.top) / rect.height

  return {
    x: ratioX * 2 - 1,
    y: (1 - ratioY) * 2 - 1,
  }
}

const handlePointerMove = (event: PointerEvent) => {
  if (!props.pointerTracking || !live2DModel) return
  const focus = getPointerFocus(event)
  if (!focus) return

  focusModel(focus.x + (props.pointerOffsetX ?? 0), focus.y + (props.pointerOffsetY ?? 0))
}

const handlePointerLeave = () => {
  focusModel(props.pointerOffsetX ?? 0, props.pointerOffsetY ?? 0)
}

const updatePointerTracking = (instant = true) => {
  removePointerListeners?.()
  removePointerListeners = null

  if (!props.pointerTracking || !canvasRef.value || !live2DModel || typeof window === 'undefined') {
    focusModel(props.pointerOffsetX ?? 0, props.pointerOffsetY ?? 0, instant)
    return
  }

  const canvasEl = canvasRef.value

  const pointerMoveListener = (event: PointerEvent) => handlePointerMove(event)
  const pointerEnterListener = (event: PointerEvent) => handlePointerMove(event)
  const pointerLeaveListener = () => handlePointerLeave()

  canvasEl.addEventListener('pointermove', pointerMoveListener)
  canvasEl.addEventListener('pointerdown', pointerMoveListener)
  canvasEl.addEventListener('pointerenter', pointerEnterListener)
  canvasEl.addEventListener('pointerleave', pointerLeaveListener)

  removePointerListeners = () => {
    canvasEl.removeEventListener('pointermove', pointerMoveListener)
    canvasEl.removeEventListener('pointerdown', pointerMoveListener)
    canvasEl.removeEventListener('pointerenter', pointerEnterListener)
    canvasEl.removeEventListener('pointerleave', pointerLeaveListener)
  }

  focusModel(props.pointerOffsetX ?? 0, props.pointerOffsetY ?? 0, instant)
}

const positionModel = () => {
  if (!pixiApp || !live2DModel) return

  const rendererWidth = pixiApp.renderer.width / pixiApp.renderer.resolution
  const rendererHeight = pixiApp.renderer.height / pixiApp.renderer.resolution

  if (props.centered) {
    ;(live2DModel as any).position.set(rendererWidth / 2, rendererHeight / 2)
  } else {
    ;(live2DModel as any).position.set(0.5, 0.5)
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

  if (typeof (live2DModel as any).anchor?.set === 'function') {
    ;(live2DModel as any).anchor.set(0.5, 0.5)
  }

  ;(live2DModel as any).scale.set(props.scale)
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

  ;(window as any).PIXI = PIXI

  const appOptions: any = {
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

  const app = new (PIXI as any).Application(appOptions) as Application
  pixiApp = app

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
    ;(app.stage as any).addChild(live2DModel)
    resizeRendererIfNumeric()
    updateModelTransform()
    updatePointerTracking(true)
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
  removePointerListeners?.()
  removePointerListeners = null
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

watch(
  () => props.pointerTracking,
  () => {
    if (!live2DModel) return
    updatePointerTracking(true)
  },
)

watch(
  [() => props.pointerOffsetX, () => props.pointerOffsetY],
  () => {
    if (!live2DModel) return
    focusModel(props.pointerOffsetX ?? 0, props.pointerOffsetY ?? 0)
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
