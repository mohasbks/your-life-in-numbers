<template>
  <div class="screen landing">
    <!-- Canvas: Aurora + Sand + Floating Words -->
    <canvas ref="bgCanvas" class="landing__canvas"></canvas>

    <!-- Breathing ring -->
    <div class="landing__ring" :class="{ 'is-visible': ringVisible }"></div>

    <!-- ENTRY OVERLAY — unlocks audio on click -->
    <div class="landing__overlay" v-if="!entered" @click="enter">
      <div class="landing__overlay-content" :class="{ 'is-visible': overlayReady }">
        <span class="landing__overlay-icon">⏳</span>
        <p class="landing__overlay-text">tap to begin</p>
      </div>
    </div>

    <!-- MAIN CONTENT — appears after entry -->
    <div class="landing__content" v-if="entered" :class="{ 'is-visible': contentVisible }">
      <!-- Typewriter text -->
      <div class="landing__story">
        <p class="landing__line landing__line--soft" v-if="showLine1">
          <span v-for="(char, i) in line1Chars" :key="'l1-'+i"
            class="landing__char"
            :class="{ 'is-visible': i < line1Visible }"
          >{{ char }}</span>
          <span class="landing__cursor" v-if="cursorLine === 1">|</span>
        </p>

        <p class="landing__line landing__line--main" v-if="showLine2">
          <span v-for="(char, i) in line2Chars" :key="'l2-'+i"
            class="landing__char"
            :class="{ 'is-visible': i < line2Visible }"
          >{{ char }}</span>
          <span class="landing__cursor" v-if="cursorLine === 2">|</span>
        </p>
      </div>

      <div class="landing__age" v-if="showAge">
        <label class="landing__age-label" for="age-input">I am</label>
        <div class="landing__age-row">
          <input
            id="age-input"
            type="number"
            class="landing__age-input"
            v-model.number="store.userAge"
            min="1"
            max="100"
            placeholder="25"
          />
          <span class="landing__age-suffix">years old</span>
        </div>
      </div>

      <button
        class="btn-primary landing__cta"
        :class="{ 'is-visible': showButton }"
        @click="start"
      >
        Start
      </button>

      <button
        class="landing__age-toggle"
        @click="showAge = !showAge"
        :class="{ 'is-visible': showButton }"
      >
        {{ showAge ? 'Hide age' : 'Enter your age (optional)' }}
      </button>
    </div>

    <!-- Footer -->
    <p class="landing__footer" :class="{ 'is-visible': showButton }">
      No data collected. No accounts. Just you.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore } from '../stores/lifeStore'
import { ambientAudio } from '../audio/ambientAudio'

const router = useRouter()
const store = useLifeStore()

// State
const entered = ref(false)
const overlayReady = ref(false)
const contentVisible = ref(false)
const ringVisible = ref(false)
const showLine1 = ref(false)
const showLine2 = ref(false)
const showButton = ref(false)
const showAge = ref(false)

const line1Text = 'Be honest...'
const line2Text = 'where is your life going?'
const line1Chars = line1Text.split('')
const line2Chars = line2Text.split('')
const line1Visible = ref(0)
const line2Visible = ref(0)
const cursorLine = ref(0)

const bgCanvas = ref<HTMLCanvasElement | null>(null)
let animFrameId: number | null = null

// Audio context for typing sound
let audioCtx: AudioContext | null = null

function initAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AC()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch { /* skip */ }
}

function playTypeClick() {
  if (!audioCtx || audioCtx.state !== 'running') return
  try {
    // White noise burst — sounds like a soft mechanical key press
    const bufferSize = audioCtx.sampleRate * 0.012 // 12ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }

    const source = audioCtx.createBufferSource()
    source.buffer = buffer

    const filter = audioCtx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3000 + Math.random() * 2000
    filter.Q.value = 0.8

    const gain = audioCtx.createGain()
    gain.gain.value = 0.08 + Math.random() * 0.04

    source.connect(filter)
    filter.connect(gain)
    gain.connect(audioCtx.destination)
    source.start()
  } catch { /* skip */ }
}

// ========== CANVAS BACKGROUND ==========
interface Star {
  x: number; y: number; size: number
  baseOpacity: number; twinkleSpeed: number; phase: number
}

interface Particle {
  x: number; y: number; size: number
  speedX: number; speedY: number
  opacity: number; opacityDir: number
}

function initCanvas() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let W = window.innerWidth
  let H = window.innerHeight
  canvas.width = W
  canvas.height = H

  let auroraPhase = 0
  let time = 0

  // Stars — more of them for a deep space feel
  const stars: Star[] = []
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.8 + 0.2,
      baseOpacity: 0.05 + Math.random() * 0.35,
      twinkleSpeed: 0.003 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // Connection particles (slow drifting space dust)
  const particles: Particle[] = []
  const pCount = Math.min(50, Math.floor((W * H) / 20000))
  for (let i = 0; i < pCount; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.18,
      opacityDir: Math.random() > 0.5 ? 0.001 : -0.001,
    })
  }

  function draw() {
    ctx!.clearRect(0, 0, W, H)
    time++
    auroraPhase += 0.0015

    // ---- Deep space nebula (3 layers) ----
    const ax = W * 0.5 + Math.sin(auroraPhase) * W * 0.25
    const ay = H * 0.4 + Math.cos(auroraPhase * 0.6) * H * 0.12
    const g1 = ctx!.createRadialGradient(ax, ay, 0, ax, ay, W * 0.6)
    g1.addColorStop(0, `rgba(74, 222, 128, ${0.03 + Math.sin(auroraPhase) * 0.012})`)
    g1.addColorStop(0.5, `rgba(59, 130, 246, ${0.012 + Math.cos(auroraPhase * 1.2) * 0.006})`)
    g1.addColorStop(1, 'rgba(8, 8, 8, 0)')
    ctx!.fillStyle = g1
    ctx!.fillRect(0, 0, W, H)

    const bx = W * 0.75 + Math.cos(auroraPhase * 0.4) * W * 0.12
    const by = H * 0.6 + Math.sin(auroraPhase * 0.7) * H * 0.1
    const g2 = ctx!.createRadialGradient(bx, by, 0, bx, by, W * 0.4)
    g2.addColorStop(0, `rgba(139, 92, 246, ${0.02 + Math.sin(auroraPhase * 0.8) * 0.008})`)
    g2.addColorStop(1, 'rgba(8, 8, 8, 0)')
    ctx!.fillStyle = g2
    ctx!.fillRect(0, 0, W, H)

    const cx2 = W * 0.2 + Math.sin(auroraPhase * 0.3) * W * 0.1
    const cy2 = H * 0.3 + Math.cos(auroraPhase * 0.5) * H * 0.08
    const g3 = ctx!.createRadialGradient(cx2, cy2, 0, cx2, cy2, W * 0.3)
    g3.addColorStop(0, `rgba(248, 113, 113, ${0.012 + Math.cos(auroraPhase * 1.1) * 0.004})`)
    g3.addColorStop(1, 'rgba(8, 8, 8, 0)')
    ctx!.fillStyle = g3
    ctx!.fillRect(0, 0, W, H)

    // ---- Twinkling stars ----
    for (const s of stars) {
      const twinkle = Math.sin(time * s.twinkleSpeed + s.phase)
      const op = s.baseOpacity + twinkle * s.baseOpacity * 0.5
      ctx!.beginPath()
      ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(255, 255, 255, ${Math.max(0, op)})`
      ctx!.fill()
    }

    // ---- Particles + connections ----
    for (const p of particles) {
      p.x += p.speedX
      p.y += p.speedY
      p.opacity += p.opacityDir
      if (p.opacity <= 0.02 || p.opacity >= 0.2) p.opacityDir *= -1
      if (p.x < 0) p.x = W
      if (p.x > W) p.x = 0
      if (p.y < 0) p.y = H
      if (p.y > H) p.y = 0

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(74, 222, 128, ${p.opacity})`
      ctx!.fill()
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i]!
        const b = particles[j]!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100) {
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.strokeStyle = `rgba(74, 222, 128, ${0.035 * (1 - dist / 100)})`
          ctx!.lineWidth = 0.4
          ctx!.stroke()
        }
      }
    }

    animFrameId = requestAnimationFrame(draw)
  }

  draw()

  window.addEventListener('resize', () => {
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W
    canvas.height = H
  })
}

// ========== TYPEWRITER ==========
function typewriter(
  visRef: { value: number },
  total: number,
  onDone: () => void,
  speed = 65
) {
  let i = 0
  const id = setInterval(() => {
    if (i < total) {
      visRef.value = i + 1
      playTypeClick()
      i++
    } else {
      clearInterval(id)
      onDone()
    }
  }, speed)
}

// ========== ENTRY ==========
function enter() {
  // Unlock audio on this user gesture
  initAudio()
  store.audioEnabled = true
  ambientAudio.start()

  entered.value = true

  setTimeout(() => {
    contentVisible.value = true
    ringVisible.value = true
  }, 200)

  // Start typewriter sequence
  setTimeout(() => {
    showLine1.value = true
    cursorLine.value = 1
    typewriter(line1Visible, line1Chars.length, () => {
      setTimeout(() => {
        showLine2.value = true
        cursorLine.value = 2
        typewriter(line2Visible, line2Chars.length, () => {
          cursorLine.value = 0
          setTimeout(() => { showButton.value = true }, 600)
        }, 50)
      }, 400)
    }, 65)
  }, 800)
}

function start() {
  if (store.audioEnabled) ambientAudio.playTick()
  router.push('/categories')
}

onMounted(() => {
  store.reset()
  initCanvas()
  setTimeout(() => { overlayReady.value = true }, 500)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.landing {
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.landing__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* Breathing ring */
.landing__ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
  border-radius: 50%;
  border: 1px solid rgba(74, 222, 128, 0.05);
  opacity: 0;
  transition: opacity 3s;
  animation: ringBreathe 6s var(--ease-smooth) infinite;
  pointer-events: none;
  z-index: 0;
}

.landing__ring.is-visible {
  opacity: 1;
}

@keyframes ringBreathe {
  0%, 100% { transform: scale(0.8); border-color: rgba(74, 222, 128, 0.04); }
  50% { transform: scale(1.2); border-color: rgba(99, 102, 241, 0.06); }
}

/* ========== ENTRY OVERLAY ========== */
.landing__overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.landing__overlay-content {
  text-align: center;
  opacity: 0;
  transform: scale(0.9);
  transition: all 1.5s var(--ease-smooth);
}

.landing__overlay-content.is-visible {
  opacity: 1;
  transform: scale(1);
}

.landing__overlay-icon {
  display: block;
  font-size: 4rem;
  margin-bottom: var(--space-xl);
  animation: breathe 4s var(--ease-smooth) infinite;
}

.landing__overlay-text {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-sm);
  font-weight: 300;
  font-style: italic;
  color: var(--text-muted);
  letter-spacing: 0.2em;
  text-transform: lowercase;
  animation: pulse 3s var(--ease-smooth) infinite;
}

/* ========== MAIN CONTENT ========== */
.landing__content {
  text-align: center;
  max-width: 700px;
  z-index: 2;
  opacity: 0;
  transform: translateY(10px);
  transition: all 1.2s var(--ease-smooth);
}

.landing__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Typewriter */
.landing__story {
  margin-bottom: var(--space-3xl);
  min-height: 130px;
}

.landing__line {
  display: block;
  margin: 0;
  line-height: 1.5;
}

.landing__line--soft {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.3rem, 3.5vw, 1.8rem);
  font-weight: 300;
  font-style: italic;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  letter-spacing: 0.02em;
  opacity: 0.8;
}

.landing__line--main {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2rem, 5.5vw, 3.2rem);
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.landing__char {
  opacity: 0;
  transition: opacity 0.06s;
}

.landing__char.is-visible {
  opacity: 1;
}

.landing__cursor {
  font-weight: 100;
  color: var(--accent);
  animation: cursorBlink 0.53s step-end infinite;
  margin-left: 1px;
  font-style: normal;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Age */
.landing__age {
  margin-bottom: var(--space-2xl);
  animation: fadeIn var(--duration-slow) var(--ease-smooth) forwards;
}

.landing__age-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  letter-spacing: 0.05em;
}

.landing__age-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.landing__age-input {
  width: 80px;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-sm);
  text-align: center;
  outline: none;
  transition: border-color var(--duration-fast);
}

.landing__age-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.1);
}

.landing__age-input::-webkit-inner-spin-button,
.landing__age-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.landing__age-suffix {
  font-size: var(--font-size-lg);
  color: var(--text-muted);
  font-weight: 300;
}

/* CTA */
.landing__cta {
  opacity: 0;
  transform: translateY(15px);
  transition: all var(--duration-slow) var(--ease-smooth);
  font-size: var(--font-size-lg);
  padding: var(--space-lg) var(--space-4xl);
}

.landing__cta.is-visible {
  opacity: 1;
  transform: translateY(0);
  animation: glowPulse 3s var(--ease-smooth) infinite 0.5s;
}

.landing__age-toggle {
  display: block;
  margin: var(--space-xl) auto 0;
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  letter-spacing: 0.05em;
  opacity: 0;
  transform: translateY(5px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.landing__age-toggle.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.landing__age-toggle:hover {
  color: var(--text-secondary);
}

/* Footer */
.landing__footer {
  position: absolute;
  bottom: var(--space-xl);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 1s var(--ease-smooth);
  z-index: 2;
}

.landing__footer.is-visible {
  opacity: 0.5;
}

/* Mobile */
@media (max-width: 480px) {
  .landing__line--soft { font-size: 1.2rem; }
  .landing__line--main { font-size: 1.7rem; }
  .landing__cta {
    font-size: var(--font-size-base);
    padding: var(--space-md) var(--space-3xl);
  }
  .landing__story { min-height: 90px; }
  .landing__ring { width: 200px; height: 200px; margin: -100px 0 0 -100px; }
  .landing__overlay-icon { font-size: 3rem; }
}
</style>
