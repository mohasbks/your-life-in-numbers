<template>
  <div class="screen lifegrid">
    <div class="lifegrid__bg"></div>

    <div class="lifegrid__content" :class="{ 'is-visible': isVisible }">
      <div class="lifegrid__header">
        <h2 class="lifegrid__title">Your life in weeks.</h2>
        <p class="lifegrid__subtitle">
          Each square is one week. You have <strong>{{ totalWeeks.toLocaleString() }}</strong> in total.
        </p>
      </div>

      <!-- Stats row -->
      <div class="lifegrid__stats">
        <div class="lifegrid__stat-box">
          <p class="lifegrid__stat-num lifegrid__stat-num--lived">{{ weeksLived.toLocaleString() }}</p>
          <p class="lifegrid__stat-desc">weeks lived</p>
        </div>
        <div class="lifegrid__stat-box">
          <p class="lifegrid__stat-num lifegrid__stat-num--remaining">{{ weeksRemaining.toLocaleString() }}</p>
          <p class="lifegrid__stat-desc">weeks remaining</p>
        </div>
        <div class="lifegrid__stat-box">
          <p class="lifegrid__stat-num lifegrid__stat-num--pct">{{ livedPercent }}%</p>
          <p class="lifegrid__stat-desc">of life passed</p>
        </div>
      </div>

      <!-- Legend -->
      <div class="lifegrid__legend">
        <div class="lifegrid__legend-item">
          <span class="lifegrid__legend-sq lifegrid__legend-sq--lived"></span>
          <span>Weeks lived</span>
        </div>
        <div class="lifegrid__legend-item">
          <span class="lifegrid__legend-sq lifegrid__legend-sq--remaining"></span>
          <span>Weeks remaining</span>
        </div>
      </div>

      <!-- Grid — 52 columns (weeks per year), lifespan rows (years) -->
      <div class="lifegrid__grid-wrapper">
        <div class="lifegrid__year-labels">
          <span v-for="y in yearLabels" :key="y" class="lifegrid__year-label">{{ y }}</span>
        </div>
        <div class="lifegrid__grid" :style="{ gridTemplateColumns: 'repeat(52, 1fr)' }">
          <div
            v-for="i in totalWeeks"
            :key="i"
            class="lifegrid__sq"
            :class="{
              'is-lived': i <= weeksLived,
              'is-revealed': revealedCount >= i,
            }"
          ></div>
        </div>
      </div>

      <!-- Year markers -->
      <div class="lifegrid__markers">
        <span>Birth</span>
        <span>{{ store.userAge }} now</span>
        <span>{{ store.lifespan }}</span>
      </div>

      <!-- Emotional stat -->
      <div class="lifegrid__emotional" :class="{ 'is-visible': showEmotional }">
        <p class="lifegrid__emotional-big">{{ livedPercent }}%</p>
        <p class="lifegrid__emotional-text">of your life has already passed</p>
        <p class="lifegrid__emotional-sub">
          That's {{ daysLived.toLocaleString() }} days, {{ hoursLived.toLocaleString() }} hours,
          and roughly {{ heartbeats }} heartbeats.
        </p>
      </div>

      <!-- Actions -->
      <div class="lifegrid__actions" :class="{ 'is-visible': showActions }">
        <button class="btn-primary" @click="goToStats" style="padding: var(--space-md) var(--space-2xl);">
          See your life stats →
        </button>
        <button class="btn-ghost" @click="goBack">← Back to summary</button>
        <button class="lifegrid__restart" @click="startOver">Start over</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore } from '../stores/lifeStore'

const router = useRouter()
const store = useLifeStore()

const isVisible = ref(false)
const showEmotional = ref(false)
const showActions = ref(false)
const revealedCount = ref(0)

// ====== CORRECT MATH ======
// Lifespan = 80 years (default from store) or store.lifespan
// Total weeks in life = lifespan * 52 (approximate)
const totalWeeks = computed(() => store.lifespan * 52)
const weeksLived = computed(() => store.userAge * 52)
const weeksRemaining = computed(() => Math.max(0, totalWeeks.value - weeksLived.value))

const livedPercent = computed(() =>
  Math.round((store.userAge / store.lifespan) * 100)
)

// Additional stats — correct math
const daysLived = computed(() => Math.round(store.userAge * 365.25))
const hoursLived = computed(() => Math.round(daysLived.value * 24))
const heartbeats = computed(() => {
  // Average ~72 bpm = 72 * 60 * 24 * 365.25 = ~37,843,200 per year
  const total = store.userAge * 72 * 60 * 24 * 365.25
  if (total >= 1e9) return (total / 1e9).toFixed(1) + ' billion'
  if (total >= 1e6) return (total / 1e6).toFixed(0) + ' million'
  return total.toLocaleString()
})

// Year labels for left side (every 10 years)
const yearLabels = computed(() => {
  const labels: number[] = []
  for (let y = 0; y <= store.lifespan; y += 10) {
    labels.push(y)
  }
  return labels
})

onMounted(() => {
  if (store.selectedCategories.length === 0) {
    router.replace('/categories')
    return
  }

  setTimeout(() => { isVisible.value = true }, 200)

  // Animate squares revealing
  const total = totalWeeks.value
  const step = Math.ceil(total / 80) // reveal in ~80 animation frames
  let current = 0

  const interval = setInterval(() => {
    current += step
    if (current >= total) {
      revealedCount.value = total
      clearInterval(interval)
    } else {
      revealedCount.value = current
    }
  }, 25)

  setTimeout(() => { showEmotional.value = true }, 2500)
  setTimeout(() => { showActions.value = true }, 3500)
})

function goBack() {
  router.push('/summary')
}

function goToStats() {
  router.push('/life-stats')
}

function startOver() {
  store.reset()
  router.push('/')
}
</script>

<style scoped>
.lifegrid {
  background: var(--bg-primary);
  position: relative;
  padding: var(--space-2xl) var(--space-xl);
  overflow-y: auto;
}

.lifegrid__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(74, 222, 128, 0.02) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.lifegrid__content {
  max-width: 750px;
  width: 100%;
  z-index: 1;
  opacity: 0;
  transform: translateY(16px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.lifegrid__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Header */
.lifegrid__header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.lifegrid__title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: var(--font-size-2xl);
  font-weight: 400;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.lifegrid__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.lifegrid__subtitle strong {
  color: var(--text-secondary);
}

/* Stats row */
.lifegrid__stats {
  display: flex;
  justify-content: center;
  gap: var(--space-2xl);
  margin-bottom: var(--space-xl);
}

.lifegrid__stat-box {
  text-align: center;
}

.lifegrid__stat-num {
  font-size: var(--font-size-2xl);
  font-weight: 300;
  line-height: 1;
  margin-bottom: 4px;
}

.lifegrid__stat-num--lived { color: var(--accent); }
.lifegrid__stat-num--remaining { color: rgba(255, 255, 255, 0.3); }
.lifegrid__stat-num--pct { color: #f87171; }

.lifegrid__stat-desc {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* Legend */
.lifegrid__legend {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  margin-bottom: var(--space-lg);
}

.lifegrid__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.lifegrid__legend-sq {
  width: 10px;
  height: 10px;
  border-radius: 1px;
}

.lifegrid__legend-sq--lived {
  background: var(--accent);
  opacity: 0.7;
}

.lifegrid__legend-sq--remaining {
  background: rgba(255, 255, 255, 0.08);
}

/* Grid */
.lifegrid__grid-wrapper {
  margin-bottom: var(--space-md);
  overflow: hidden;
  border-radius: var(--border-radius);
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--border-subtle);
  position: relative;
  display: flex;
  gap: 6px;
}

.lifegrid__year-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  flex-shrink: 0;
  width: 24px;
}

.lifegrid__year-label {
  font-size: 8px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  line-height: 1;
}

.lifegrid__grid {
  display: grid;
  gap: 1px;
  flex: 1;
}

.lifegrid__sq {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.5px;
  opacity: 0;
  transition: opacity 0.08s;
}

.lifegrid__sq.is-revealed {
  opacity: 1;
}

.lifegrid__sq.is-lived {
  background: var(--accent);
  opacity: 0;
}

.lifegrid__sq.is-lived.is-revealed {
  opacity: 0.65;
}

/* Markers */
.lifegrid__markers {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2xl);
  padding: 0 var(--space-md);
}

/* Emotional stat */
.lifegrid__emotional {
  text-align: center;
  margin-bottom: var(--space-2xl);
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.lifegrid__emotional.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lifegrid__emotional-big {
  font-size: var(--font-size-4xl);
  font-weight: 200;
  color: #f87171;
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.lifegrid__emotional-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.lifegrid__emotional-sub {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  line-height: 1.6;
}

/* Actions */
.lifegrid__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  opacity: 0;
  transition: all var(--duration-slow) var(--ease-smooth);
}

.lifegrid__actions.is-visible {
  opacity: 1;
}

.lifegrid__restart {
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: color var(--duration-fast);
}

.lifegrid__restart:hover {
  color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 480px) {
  .lifegrid__stats {
    gap: var(--space-lg);
  }

  .lifegrid__stat-num {
    font-size: var(--font-size-xl);
  }

  .lifegrid__grid-wrapper {
    padding: var(--space-sm);
  }

  .lifegrid__year-labels {
    width: 18px;
  }

  .lifegrid__year-label {
    font-size: 6px;
  }

  .lifegrid__emotional-big {
    font-size: var(--font-size-3xl);
  }
}
</style>
