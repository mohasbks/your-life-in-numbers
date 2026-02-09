<template>
  <div class="screen lifegrid">
    <div class="lifegrid__bg"></div>

    <div class="lifegrid__content" :class="{ 'is-visible': isVisible }">
      <div class="lifegrid__header">
        <h2 class="lifegrid__title">Your life in weeks.</h2>
        <p class="lifegrid__subtitle">
          Each dot is one week. You have {{ store.totalWeeksInLife.toLocaleString() }} of them.
        </p>
      </div>

      <!-- Legend -->
      <div class="lifegrid__legend">
        <div class="lifegrid__legend-item">
          <span class="lifegrid__legend-dot lifegrid__legend-dot--lived"></span>
          <span>Weeks lived ({{ store.weeksLived.toLocaleString() }})</span>
        </div>
        <div class="lifegrid__legend-item">
          <span class="lifegrid__legend-dot lifegrid__legend-dot--remaining"></span>
          <span>Weeks remaining ({{ store.weeksRemaining.toLocaleString() }})</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="lifegrid__grid-wrapper">
        <div class="lifegrid__grid">
          <div
            v-for="i in displayWeeks"
            :key="i"
            class="lifegrid__dot"
            :class="{
              'is-lived': i <= store.weeksLived,
              'is-revealed': revealedDots >= i,
            }"
            :style="{
              transitionDelay: `${Math.min(i * 0.2, 800)}ms`,
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
      <div class="lifegrid__stat" :class="{ 'is-visible': showStat }">
        <p class="lifegrid__stat-value">{{ livedPercent }}%</p>
        <p class="lifegrid__stat-label">of your life has already passed</p>
      </div>

      <!-- Actions -->
      <div class="lifegrid__actions" :class="{ 'is-visible': showActions }">
        <button class="btn-ghost" @click="goBack">
          ← Back to summary
        </button>
        <button class="summary__restart" @click="startOver">
          Start over
        </button>
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
const showStat = ref(false)
const showActions = ref(false)
const revealedDots = ref(0)

// Show a subset for performance (each dot = ~4 weeks = 1 month)
const monthsInLife = computed(() => store.lifespan * 12)
const displayWeeks = computed(() => monthsInLife.value)

const livedPercent = computed(() =>
  Math.round((store.userAge / store.lifespan) * 100)
)

onMounted(() => {
  if (store.selectedCategories.length === 0) {
    router.replace('/categories')
    return
  }

  setTimeout(() => { isVisible.value = true }, 200)

  // Animate dots revealing
  const totalDots = monthsInLife.value
  const step = Math.ceil(totalDots / 60)
  let current = 0

  const interval = setInterval(() => {
    current += step
    if (current >= totalDots) {
      revealedDots.value = totalDots
      clearInterval(interval)
    } else {
      revealedDots.value = current
    }
  }, 30)

  setTimeout(() => { showStat.value = true }, 2000)
  setTimeout(() => { showActions.value = true }, 3000)
})

function goBack() {
  router.push('/summary')
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
}

.lifegrid__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(74, 222, 128, 0.02) 0%,
    transparent 50%
  );
  pointer-events: none;
}

.lifegrid__content {
  max-width: 700px;
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
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.lifegrid__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

/* Legend */
.lifegrid__legend {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.lifegrid__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.lifegrid__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.lifegrid__legend-dot--lived {
  background: var(--accent);
  opacity: 0.7;
}

.lifegrid__legend-dot--remaining {
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
}

.lifegrid__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
}

.lifegrid__dot {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.06);
  opacity: 0;
  transition: opacity 0.1s, background 0.3s;
}

.lifegrid__dot.is-revealed {
  opacity: 1;
}

.lifegrid__dot.is-lived {
  background: var(--accent);
  opacity: 0;
}

.lifegrid__dot.is-lived.is-revealed {
  opacity: 0.6;
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

/* Stat */
.lifegrid__stat {
  text-align: center;
  margin-bottom: var(--space-2xl);
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.lifegrid__stat.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lifegrid__stat-value {
  font-size: var(--font-size-4xl);
  font-weight: 200;
  color: var(--accent);
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.lifegrid__stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
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

.summary__restart {
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: color var(--duration-fast);
}

.summary__restart:hover {
  color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 480px) {
  .lifegrid__dot {
    width: 4px;
    height: 4px;
  }

  .lifegrid__grid-wrapper {
    padding: var(--space-sm);
  }

  .lifegrid__stat-value {
    font-size: var(--font-size-3xl);
  }
}
</style>
