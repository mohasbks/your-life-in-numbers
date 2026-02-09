<template>
  <div class="screen landing">
    <!-- Floating particles -->
    <canvas ref="particleCanvas" class="landing__particles"></canvas>

    <!-- Ambient background -->
    <div class="landing__ambient"></div>
    <div class="landing__ambient-orb landing__ambient-orb--1"></div>
    <div class="landing__ambient-orb landing__ambient-orb--2"></div>
    <div class="landing__ambient-orb landing__ambient-orb--3"></div>

    <div class="landing__content" :class="{ 'is-visible': isVisible }">
      <div class="landing__hourglass" :class="{ 'is-visible': showHourglass }">⏳</div>

      <h1 class="landing__title">
        <span class="landing__title-line" :class="{ 'is-visible': showLine1 }">Be honest…</span>
        <span class="landing__title-line landing__title-line--emphasis" :class="{ 'is-visible': showLine2 }">
          where is your life going?
        </span>
      </h1>

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

    <!-- Subtle footer -->
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

const isVisible = ref(false)
const showHourglass = ref(false)
const showLine1 = ref(false)
const showLine2 = ref(false)
const showButton = ref(false)
const showAge = ref(false)

const particleCanvas = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null

// Particle system
interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  opacityDir: number
}

function initParticles() {
  const canvas = particleCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles: Particle[] = []
  const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 15000))

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3,
      opacityDir: Math.random() > 0.5 ? 0.002 : -0.002,
    })
  }

  function animate() {
    ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

    for (const p of particles) {
      p.x += p.speedX
      p.y += p.speedY
      p.opacity += p.opacityDir

      if (p.opacity <= 0.05 || p.opacity >= 0.4) p.opacityDir *= -1
      if (p.x < 0) p.x = canvas!.width
      if (p.x > canvas!.width) p.x = 0
      if (p.y < 0) p.y = canvas!.height
      if (p.y > canvas!.height) p.y = 0

      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(74, 222, 128, ${p.opacity})`
      ctx!.fill()
    }

    // Draw connections between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 120) {
          ctx!.beginPath()
          ctx!.moveTo(particles[i].x, particles[i].y)
          ctx!.lineTo(particles[j].x, particles[j].y)
          ctx!.strokeStyle = `rgba(74, 222, 128, ${0.05 * (1 - dist / 120)})`
          ctx!.lineWidth = 0.5
          ctx!.stroke()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animate()

  // Handle resize
  const handleResize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)
}

onMounted(() => {
  store.reset()
  initParticles()

  // Cinematic staggered reveal
  setTimeout(() => { isVisible.value = true }, 200)
  setTimeout(() => { showHourglass.value = true }, 600)
  setTimeout(() => { showLine1.value = true }, 1200)
  setTimeout(() => { showLine2.value = true }, 2000)
  setTimeout(() => { showButton.value = true }, 3000)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})

function start() {
  if (store.audioEnabled) ambientAudio.playTick()
  router.push('/categories')
}
</script>

<style scoped>
.landing {
  background: var(--bg-primary);
  position: relative;
}

/* Particles */
.landing__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* Ambient background effects */
.landing__ambient {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    rgba(74, 222, 128, 0.04) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.landing__ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  opacity: 0.35;
  animation: pulse 8s var(--ease-smooth) infinite;
}

.landing__ambient-orb--1 {
  width: 500px;
  height: 500px;
  background: rgba(74, 222, 128, 0.06);
  top: 15%;
  left: 25%;
}

.landing__ambient-orb--2 {
  width: 350px;
  height: 350px;
  background: rgba(99, 102, 241, 0.05);
  bottom: 15%;
  right: 20%;
  animation-delay: 3s;
}

.landing__ambient-orb--3 {
  width: 200px;
  height: 200px;
  background: rgba(248, 113, 113, 0.04);
  top: 60%;
  left: 10%;
  animation-delay: 5s;
}

/* Content */
.landing__content {
  text-align: center;
  max-width: 640px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.8s var(--ease-smooth);
}

.landing__content.is-visible {
  opacity: 1;
}

/* Hourglass */
.landing__hourglass {
  font-size: 3rem;
  margin-bottom: var(--space-2xl);
  opacity: 0;
  transform: translateY(-20px) scale(0.5);
  transition: all 1s var(--ease-spring);
}

.landing__hourglass.is-visible {
  opacity: 0.6;
  transform: translateY(0) scale(1);
  animation: breathe 4s var(--ease-smooth) infinite 1s;
}

/* Title */
.landing__title {
  font-weight: 300;
  line-height: 1.35;
  margin-bottom: var(--space-3xl);
}

.landing__title-line {
  display: block;
  opacity: 0;
  transform: translateY(15px);
  transition: all 1s var(--ease-smooth);
}

.landing__title-line.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.landing__title-line:first-child {
  font-size: var(--font-size-2xl);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  letter-spacing: 0.02em;
}

.landing__title-line--emphasis {
  font-size: var(--font-size-4xl);
  font-weight: 400;
  color: var(--text-primary);
}

.landing__title-line--emphasis.is-visible {
  animation: breathe 6s var(--ease-smooth) infinite 0.5s;
}

/* Age input */
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
  z-index: 1;
}

.landing__footer.is-visible {
  opacity: 0.5;
}

/* Mobile */
@media (max-width: 480px) {
  .landing__title-line:first-child {
    font-size: var(--font-size-lg);
  }

  .landing__title-line--emphasis {
    font-size: var(--font-size-2xl);
  }

  .landing__ambient-orb--1 {
    width: 280px;
    height: 280px;
  }

  .landing__ambient-orb--2 {
    width: 200px;
    height: 200px;
  }

  .landing__cta {
    font-size: var(--font-size-base);
    padding: var(--space-md) var(--space-3xl);
  }
}
</style>
