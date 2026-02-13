<template>
  <div class="screen lifestats">
    <div class="lifestats__bg"></div>

    <div class="lifestats__content" :class="{ 'is-visible': isVisible }">

      <!-- ====== SECTION 1: DEATH CLOCK ====== -->
      <div class="lifestats__section lifestats__clock-section" :class="{ 'is-visible': showClock }">
        <p class="lifestats__section-label">⏳ Time Remaining</p>
        <h2 class="lifestats__clock-title">Your life is ticking.</h2>

        <div class="lifestats__clock">
          <div class="lifestats__clock-unit">
            <span class="lifestats__clock-num">{{ countdown.years }}</span>
            <span class="lifestats__clock-label">years</span>
          </div>
          <span class="lifestats__clock-sep">:</span>
          <div class="lifestats__clock-unit">
            <span class="lifestats__clock-num">{{ countdown.days }}</span>
            <span class="lifestats__clock-label">days</span>
          </div>
          <span class="lifestats__clock-sep">:</span>
          <div class="lifestats__clock-unit">
            <span class="lifestats__clock-num">{{ countdown.hours }}</span>
            <span class="lifestats__clock-label">hours</span>
          </div>
          <span class="lifestats__clock-sep">:</span>
          <div class="lifestats__clock-unit">
            <span class="lifestats__clock-num lifestats__clock-num--sec">{{ countdown.minutes }}</span>
            <span class="lifestats__clock-label">minutes</span>
          </div>
          <span class="lifestats__clock-sep">:</span>
          <div class="lifestats__clock-unit">
            <span class="lifestats__clock-num lifestats__clock-num--sec">{{ countdown.seconds }}</span>
            <span class="lifestats__clock-label">seconds</span>
          </div>
        </div>

        <p class="lifestats__clock-sub">
          Based on an average lifespan of {{ store.lifespan }} years
        </p>
      </div>

      <!-- ====== SECTION 2: IN YOUR LIFETIME ====== -->
      <div class="lifestats__section lifestats__body-section" :class="{ 'is-visible': showBody }">
        <p class="lifestats__section-label">💓 In Your Lifetime So Far</p>

        <div class="lifestats__body-grid">
          <div class="lifestats__body-card" v-for="(stat, i) in bodyStats" :key="i"
            :style="{ animationDelay: `${i * 150}ms` }">
            <span class="lifestats__body-icon">{{ stat.icon }}</span>
            <p class="lifestats__body-value">{{ stat.value }}</p>
            <p class="lifestats__body-label">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <!-- ====== SECTION 3: WHAT YOU'LL MISS ====== -->
      <div class="lifestats__section lifestats__miss-section" :class="{ 'is-visible': showMiss }">
        <p class="lifestats__section-label">🌑 After You're Gone</p>
        <h3 class="lifestats__miss-title">Events you probably won't see</h3>

        <div class="lifestats__miss-timeline">
          <div class="lifestats__miss-item" v-for="(event, i) in missedEvents" :key="i"
            :style="{ animationDelay: `${i * 200}ms` }">
            <div class="lifestats__miss-year">{{ event.year }}</div>
            <div class="lifestats__miss-line"></div>
            <div class="lifestats__miss-info">
              <p class="lifestats__miss-name">{{ event.name }}</p>
              <p class="lifestats__miss-desc">{{ event.desc }}</p>
            </div>
          </div>
        </div>

        <p class="lifestats__miss-reflection">
          The world will keep turning. Make your time count.
        </p>
      </div>

      <!-- Actions -->
      <div class="lifestats__actions" :class="{ 'is-visible': showActions }">
        <button class="btn-ghost" @click="goBack">← Back to life grid</button>
        <button class="lifestats__restart" @click="startOver">Start over</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore } from '../stores/lifeStore'

const router = useRouter()
const store = useLifeStore()

const isVisible = ref(false)
const showClock = ref(false)
const showBody = ref(false)
const showMiss = ref(false)
const showActions = ref(false)

// ====== DEATH CLOCK — live countdown ======
const countdown = ref({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
let clockInterval: number | null = null

function calcCountdown() {
  const now = new Date()
  const birthYear = now.getFullYear() - store.userAge

  // Estimated death date
  const deathDate = new Date(birthYear + store.lifespan, now.getMonth(), now.getDate())
  const diff = deathDate.getTime() - now.getTime()

  if (diff <= 0) {
    countdown.value = { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const totalSeconds = Math.floor(diff / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)
  const years = Math.floor(totalDays / 365.25)
  const remainDays = Math.floor(totalDays - years * 365.25)

  countdown.value = {
    years,
    days: remainDays,
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  }
}

// ====== IN YOUR LIFETIME STATS ======
const bodyStats = computed(() => {
  const age = store.userAge
  const daysLived = Math.round(age * 365.25)

  // Heartbeats: avg 72 bpm
  const heartbeats = age * 72 * 60 * 24 * 365.25
  const heartStr = heartbeats >= 1e9
    ? (heartbeats / 1e9).toFixed(1) + ' billion'
    : (heartbeats / 1e6).toFixed(0) + ' million'

  // Breaths: avg 15 per minute
  const breaths = age * 15 * 60 * 24 * 365.25
  const breathStr = breaths >= 1e6
    ? (breaths / 1e6).toFixed(0) + ' million'
    : breaths.toLocaleString()

  // Steps: avg 7,000/day
  const steps = daysLived * 7000
  const stepStr = steps >= 1e6
    ? (steps / 1e6).toFixed(0) + ' million'
    : steps.toLocaleString()

  // Sleep: ~8 hours/day = 1/3 of life
  const sleepYears = (age / 3).toFixed(1)

  // Blinks: avg 15-20 per minute (use 17)
  const blinks = age * 17 * 60 * 16 * 365.25 // 16 waking hours
  const blinkStr = blinks >= 1e6
    ? (blinks / 1e6).toFixed(0) + ' million'
    : blinks.toLocaleString()

  // Earth orbits
  const orbits = age

  // Words spoken: avg 16,000/day
  const words = daysLived * 16000
  const wordStr = words >= 1e6
    ? (words / 1e6).toFixed(0) + ' million'
    : words.toLocaleString()

  // Meals: avg 3/day
  const meals = (daysLived * 3).toLocaleString()

  return [
    { icon: '💓', value: heartStr, label: 'heartbeats' },
    { icon: '🫁', value: breathStr, label: 'breaths taken' },
    { icon: '🚶', value: stepStr, label: 'steps walked' },
    { icon: '😴', value: sleepYears + ' years', label: 'spent sleeping' },
    { icon: '👁️', value: blinkStr, label: 'blinks' },
    { icon: '🌍', value: orbits + ' orbits', label: 'around the sun' },
    { icon: '💬', value: wordStr, label: 'words spoken' },
    { icon: '🍽️', value: meals, label: 'meals eaten' },
  ]
})

// ====== WHAT YOU'LL MISS ======
const missedEvents = computed(() => {
  const now = new Date()
  const birthYear = now.getFullYear() - store.userAge
  const deathYear = birthYear + store.lifespan

  const allEvents = [
    { year: 2028, name: '🏟️ LA Olympics', desc: 'The 2028 Summer Olympic Games in Los Angeles' },
    { year: 2030, name: '🌍 UN Climate Deadline', desc: 'Target year to cut global emissions by 45%' },
    { year: 2030, name: '⚽ FIFA World Cup', desc: 'USA, Canada & Mexico host the 2026 World Cup expansion era' },
    { year: 2032, name: '🏟️ Brisbane Olympics', desc: 'The 2032 Summer Olympics in Brisbane, Australia' },
    { year: 2035, name: '🚗 End of Petrol Cars', desc: 'EU ban on new petrol/diesel car sales takes effect' },
    { year: 2039, name: '🌙 Moon Base Plans', desc: 'Planned permanent lunar base by NASA/ESA' },
    { year: 2040, name: '🤖 AI Singularity Estimates', desc: 'Some researchers predict human-level AI by 2040' },
    { year: 2045, name: '🚀 Mars Colony Target', desc: 'SpaceX target for sustainable Mars civilization' },
    { year: 2050, name: '🌊 Sea Level Rise', desc: 'Projected 30cm+ rise affecting 800M+ people' },
    { year: 2060, name: '🧬 Life Extension', desc: 'Predicted breakthroughs in aging reversal' },
    { year: 2061, name: '☄️ Halley\'s Comet', desc: 'Next visible pass of Halley\'s Comet' },
    { year: 2075, name: '🏙️ 10 Billion Humans', desc: 'World population projected to peak' },
    { year: 2100, name: '🌡️ Climate Tipping Point', desc: 'Critical century for Earth\'s climate future' },
    { year: 2150, name: '🌌 Interstellar Probes', desc: 'First probes may reach nearby star systems' },
    { year: 2200, name: '🪐 Solar System Expansion', desc: 'Humanity may inhabit multiple planets' },
  ]

  // Events after death year = what you'll miss
  const missed = allEvents.filter(e => e.year > deathYear)

  // Events you'll see (for context)
  const willSee = allEvents.filter(e => e.year <= deathYear).slice(-2)

  // Show last 2 you'll see + first 5 you'll miss
  const result: typeof allEvents = []

  for (const e of willSee) {
    result.push({ ...e, name: '✅ ' + e.name })
  }

  for (const e of missed.slice(0, 5)) {
    result.push({ ...e, name: '❌ ' + e.name })
  }

  return result
})

// ====== LIFECYCLE ======
onMounted(() => {
  if (store.userAge <= 0) {
    router.replace('/age')
    return
  }

  setTimeout(() => { isVisible.value = true }, 200)
  setTimeout(() => { showClock.value = true }, 600)
  setTimeout(() => { showBody.value = true }, 2000)
  setTimeout(() => { showMiss.value = true }, 4000)
  setTimeout(() => { showActions.value = true }, 6000)

  // Start live countdown
  calcCountdown()
  clockInterval = window.setInterval(calcCountdown, 1000)
})

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval)
})

function goBack() {
  router.push('/life-grid')
}

function startOver() {
  store.reset()
  router.push('/')
}
</script>

<style scoped>
.lifestats {
  background: var(--bg-primary);
  position: relative;
  padding: var(--space-2xl) var(--space-xl);
  overflow-y: auto;
}

.lifestats__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 20%,
    rgba(248, 113, 113, 0.03) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.lifestats__content {
  max-width: 700px;
  width: 100%;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.8s var(--ease-smooth);
}

.lifestats__content.is-visible {
  opacity: 1;
}

/* Section common */
.lifestats__section {
  margin-bottom: var(--space-4xl);
  opacity: 0;
  transform: translateY(20px);
  transition: all 1s var(--ease-smooth);
}

.lifestats__section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lifestats__section-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: var(--space-md);
}

/* ====== DEATH CLOCK ====== */
.lifestats__clock-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-2xl);
  font-weight: 400;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.lifestats__clock {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.lifestats__clock-unit {
  text-align: center;
  min-width: 60px;
}

.lifestats__clock-num {
  display: block;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 200;
  color: #f87171;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px;
}

.lifestats__clock-num--sec {
  color: #fb923c;
}

.lifestats__clock-label {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lifestats__clock-sep {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.1);
  line-height: 1;
  padding-top: 6px;
}

.lifestats__clock-sub {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-style: italic;
}

/* ====== BODY STATS ====== */
.lifestats__body-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.lifestats__body-card {
  text-align: center;
  padding: var(--space-lg) var(--space-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius);
  animation: fadeInUp 0.6s var(--ease-smooth) both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.lifestats__body-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: var(--space-sm);
}

.lifestats__body-value {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--accent);
  margin-bottom: 2px;
}

.lifestats__body-label {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

/* ====== WHAT YOU'LL MISS ====== */
.lifestats__miss-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.lifestats__miss-timeline {
  position: relative;
  padding-left: var(--space-xl);
}

.lifestats__miss-timeline::before {
  content: '';
  position: absolute;
  left: 50px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    var(--accent) 0%,
    var(--accent) 30%,
    #f87171 50%,
    rgba(248, 113, 113, 0.2) 100%
  );
}

.lifestats__miss-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-smooth) both;
}

.lifestats__miss-year {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.lifestats__miss-line {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  margin-top: 4px;
}

.lifestats__miss-item:nth-child(n+3) .lifestats__miss-line {
  background: #f87171;
}

.lifestats__miss-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.lifestats__miss-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

.lifestats__miss-reflection {
  text-align: center;
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-top: var(--space-2xl);
  padding: var(--space-xl);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

/* Actions */
.lifestats__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  opacity: 0;
  transition: all var(--duration-slow) var(--ease-smooth);
}

.lifestats__actions.is-visible {
  opacity: 1;
}

.lifestats__restart {
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: color var(--duration-fast);
}

.lifestats__restart:hover {
  color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 600px) {
  .lifestats__body-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .lifestats__clock {
    gap: 4px;
  }

  .lifestats__clock-unit {
    min-width: 45px;
  }

  .lifestats__clock-num {
    font-size: 1.8rem;
  }

  .lifestats__clock-sep {
    font-size: 1.4rem;
  }

  .lifestats__miss-timeline {
    padding-left: var(--space-sm);
  }

  .lifestats__miss-timeline::before {
    left: 44px;
  }
}
</style>
