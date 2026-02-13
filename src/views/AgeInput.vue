<template>
  <div class="screen ageinput">
    <canvas ref="bgCanvas" class="ageinput__canvas"></canvas>

    <div class="ageinput__content" :class="{ 'is-visible': isVisible }">
      <div class="ageinput__icon">🎂</div>

      <h2 class="ageinput__title">How old are you?</h2>
      <p class="ageinput__subtitle">We need this to calculate your remaining time.</p>

      <div class="ageinput__input-wrapper">
        <input
          ref="ageInput"
          type="number"
          class="ageinput__input"
          v-model.number="age"
          min="1"
          max="120"
          placeholder="25"
          @keyup.enter="proceed"
        />
        <span class="ageinput__unit">years old</span>
      </div>

      <p class="ageinput__error" v-if="showError">Please enter your age (1–120)</p>

      <div class="ageinput__life-preview" v-if="age && age > 0 && age <= 120">
        <p class="ageinput__preview-text">
          You've lived approximately <strong>{{ (age * 365.25).toFixed(0) }}</strong> days
        </p>
        <p class="ageinput__preview-text">
          That's about <strong>{{ (age * 52).toLocaleString() }}</strong> weeks
        </p>
      </div>

      <button
        class="btn-primary ageinput__cta"
        :class="{ 'is-visible': isVisible }"
        @click="proceed"
      >
        Continue →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore } from '../stores/lifeStore'
import { ambientAudio } from '../audio/ambientAudio'

const router = useRouter()
const store = useLifeStore()

const isVisible = ref(false)
const showError = ref(false)
const age = ref<number | null>(store.userAge > 0 ? store.userAge : null)
const ageInput = ref<HTMLInputElement | null>(null)
const bgCanvas = ref<HTMLCanvasElement | null>(null)
let animFrameId: number | null = null

function proceed() {
  if (!age.value || age.value < 1 || age.value > 120) {
    showError.value = true
    return
  }
  showError.value = false
  store.userAge = age.value
  if (store.audioEnabled) ambientAudio.playTick()
  router.push('/categories')
}

// Simple star background (reuse space theme)
function initCanvas() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let W = window.innerWidth
  let H = window.innerHeight
  canvas.width = W
  canvas.height = H

  const stars: { x: number; y: number; s: number; o: number; sp: number; ph: number }[] = []
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      s: Math.random() * 1.5 + 0.3,
      o: 0.05 + Math.random() * 0.3,
      sp: 0.003 + Math.random() * 0.01,
      ph: Math.random() * Math.PI * 2,
    })
  }

  let t = 0
  function draw() {
    ctx!.clearRect(0, 0, W, H)
    t++
    for (const s of stars) {
      const tw = Math.sin(t * s.sp + s.ph)
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, s.s, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(255,255,255,${Math.max(0, s.o + tw * s.o * 0.4)})`
      ctx!.fill()
    }
    animFrameId = requestAnimationFrame(draw)
  }
  draw()

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight
    canvas.width = W; canvas.height = H
  })
}

onMounted(() => {
  initCanvas()
  setTimeout(() => { isVisible.value = true }, 200)
  nextTick(() => { ageInput.value?.focus() })
})
</script>

<style scoped>
.ageinput {
  background: var(--bg-primary);
  position: relative;
}

.ageinput__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ageinput__content {
  text-align: center;
  max-width: 500px;
  z-index: 1;
  opacity: 0;
  transform: translateY(15px);
  transition: all 0.8s var(--ease-smooth);
}

.ageinput__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.ageinput__icon {
  font-size: 3rem;
  margin-bottom: var(--space-xl);
}

.ageinput__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-3xl);
  font-weight: 400;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.ageinput__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-2xl);
  letter-spacing: 0.03em;
}

.ageinput__input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.ageinput__input {
  width: 120px;
  padding: var(--space-md) var(--space-lg);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-4xl);
  font-weight: 300;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius);
  text-align: center;
  outline: none;
  transition: all var(--duration-fast);
  -moz-appearance: textfield;
}

.ageinput__input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 25px rgba(74, 222, 128, 0.12);
}

.ageinput__input::-webkit-inner-spin-button,
.ageinput__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.ageinput__unit {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  font-weight: 300;
}

.ageinput__error {
  color: #f87171;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-lg);
  animation: fadeIn 0.3s;
}

.ageinput__life-preview {
  margin-bottom: var(--space-2xl);
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius);
  animation: fadeIn 0.5s var(--ease-smooth);
}

.ageinput__preview-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.8;
}

.ageinput__preview-text strong {
  color: var(--accent);
  font-weight: 500;
}

.ageinput__cta {
  font-size: var(--font-size-lg);
  padding: var(--space-lg) var(--space-3xl);
}

@media (max-width: 480px) {
  .ageinput__input {
    width: 100px;
    font-size: var(--font-size-3xl);
  }
  .ageinput__title {
    font-size: var(--font-size-2xl);
  }
}
</style>
