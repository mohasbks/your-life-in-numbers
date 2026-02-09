<template>
  <div class="screen summary">
    <div class="summary__bg"></div>

    <div class="summary__content" :class="{ 'is-visible': isVisible }">
      <h2 class="summary__title">Your life, at a glance.</h2>
      <p class="summary__subtitle">~{{ store.remainingYears }} years remaining</p>

      <!-- Category bars -->
      <div class="summary__bars">
        <div
          v-for="(cat, index) in store.selectedCategories"
          :key="cat.id"
          class="summary__bar-row"
          :class="{ 'is-mounted': mountedBars.includes(index) }"
        >
          <div class="summary__bar-header">
            <span class="summary__bar-icon">{{ cat.icon }}</span>
            <span class="summary__bar-label">{{ cat.label }}</span>
            <span class="summary__bar-years" :style="{ color: cat.color }">
              {{ store.yearsPerCategory[cat.id] }} yrs
            </span>
          </div>
          <div class="summary__bar-track">
            <div
              class="summary__bar-fill"
              :style="{
                width: mountedBars.includes(index) ? barWidth(cat.id) + '%' : '0%',
                background: cat.color,
                boxShadow: `0 0 15px ${cat.color}33`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div class="summary__total" :class="{ 'is-visible': showTotal }">
        <p class="summary__total-text">
          <span class="summary__total-number">{{ store.totalYearsAccounted.toFixed(1) }}</span>
          years accounted for out of
          <span class="summary__total-remaining">{{ store.remainingYears }}</span>
        </p>
        <p class="summary__total-percent">
          {{ Math.round((store.totalYearsAccounted / store.remainingYears) * 100) }}% of your remaining life
        </p>
      </div>

      <!-- What-If Calculator -->
      <div class="whatif" :class="{ 'is-visible': showWhatIf }">
        <div class="whatif__header">
          <h3 class="whatif__title">💡 What if you changed just 1 hour?</h3>
          <p class="whatif__desc">Reducing 1 hour/day from any category gives you back:</p>
        </div>

        <div class="whatif__cards">
          <div
            v-for="cat in whatIfCategories"
            :key="cat.id"
            class="whatif__card"
          >
            <div class="whatif__card-left">
              <span class="whatif__card-icon">{{ cat.icon }}</span>
              <span class="whatif__card-label">{{ cat.label }}</span>
            </div>
            <div class="whatif__card-right">
              <span class="whatif__card-saved" :style="{ color: '#4ade80' }">
                +{{ store.whatIfSavings[cat.id] }} years
              </span>
              <span class="whatif__card-detail">
                {{ Math.round((store.whatIfSavings[cat.id] || 0) * 365) }} extra days
              </span>
            </div>
          </div>
        </div>

        <!-- What-if comparisons -->
        <div class="whatif__comparison" v-if="whatIfCategories.length > 0">
          <p class="whatif__comparison-text">
            With those <strong>{{ topSavedYears }}</strong> extra years, you could:
          </p>
          <div class="whatif__comparison-items">
            <p v-for="(comp, i) in whatIfComparisons" :key="i" class="whatif__comparison-item">
              {{ comp }}
            </p>
          </div>
        </div>
      </div>

      <!-- Reflection -->
      <div class="summary__reflection" :class="{ 'is-visible': showReflection }">
        <p class="summary__reflection-line1">This isn't wrong.</p>
        <p class="summary__reflection-line2">But this is your life.</p>
      </div>

      <!-- Actions -->
      <div class="summary__actions" :class="{ 'is-visible': showActions }">
        <button class="btn-primary" @click="goToLifeGrid">
          See your life as weeks
        </button>

        <button class="btn-ghost" @click="changeNumber">
          Change one number
        </button>

        <button class="summary__share-btn" @click="shareResults" v-if="!copied">
          📋 Copy my numbers
        </button>
        <span class="summary__copied" v-else>✓ Copied!</span>

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
import { ambientAudio } from '../audio/ambientAudio'

const router = useRouter()
const store = useLifeStore()

const isVisible = ref(false)
const showTotal = ref(false)
const showWhatIf = ref(false)
const showReflection = ref(false)
const showActions = ref(false)
const mountedBars = ref<number[]>([])
const copied = ref(false)

const maxYears = 30

function barWidth(catId: string) {
  const years = store.yearsPerCategory[catId] || 0
  return Math.min((years / maxYears) * 100, 100)
}

// Categories that have what-if savings
const whatIfCategories = computed(() =>
  store.selectedCategories.filter(c => store.whatIfSavings[c.id] > 0)
)

// Top saved years for comparison
const topSavedYears = computed(() => {
  const values = Object.values(store.whatIfSavings)
  if (values.length === 0) return 0
  return Math.max(...values)
})

const whatIfComparisons = computed(() =>
  store.getComparisons(topSavedYears.value, 2)
)

onMounted(() => {
  if (store.selectedCategories.length === 0) {
    router.replace('/categories')
    return
  }

  setTimeout(() => { isVisible.value = true }, 200)

  // Stagger bars
  store.selectedCategories.forEach((_, i) => {
    setTimeout(() => {
      mountedBars.value.push(i)
      if (store.audioEnabled) ambientAudio.playTick()
    }, 600 + i * 200)
  })

  const barsDelay = 600 + store.selectedCategories.length * 200 + 500
  setTimeout(() => { showTotal.value = true }, barsDelay)
  setTimeout(() => { showWhatIf.value = true }, barsDelay + 800)
  setTimeout(() => { showReflection.value = true }, barsDelay + 2000)
  setTimeout(() => { showActions.value = true }, barsDelay + 3000)
})

function goToLifeGrid() {
  if (store.audioEnabled) ambientAudio.playTick()
  router.push('/life-grid')
}

function changeNumber() {
  if (store.audioEnabled) ambientAudio.playTick()
  router.push('/estimate')
}

function startOver() {
  store.reset()
  router.push('/')
}

async function shareResults() {
  try {
    await navigator.clipboard.writeText(store.shareableText)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = store.shareableText
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.summary {
  background: var(--bg-primary);
  position: relative;
  padding-top: var(--space-3xl);
  padding-bottom: var(--space-3xl);
  align-items: center;
}

.summary__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(74, 222, 128, 0.02) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.summary__content {
  max-width: 540px;
  width: 100%;
  z-index: 1;
  opacity: 0;
  transform: translateY(16px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.summary__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.summary__title {
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.summary__subtitle {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-2xl);
  letter-spacing: 0.05em;
}

/* Bars */
.summary__bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.summary__bar-row {
  opacity: 0;
  transform: translateX(-20px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.summary__bar-row.is-mounted {
  opacity: 1;
  transform: translateX(0);
}

.summary__bar-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: 5px;
}

.summary__bar-icon {
  font-size: 1.1rem;
}

.summary__bar-label {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 400;
}

.summary__bar-years {
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.summary__bar-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 3px;
  overflow: hidden;
}

.summary__bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1.2s var(--ease-smooth);
}

/* Total */
.summary__total {
  text-align: center;
  padding: var(--space-lg) 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-xl);
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.summary__total.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.summary__total-text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.summary__total-number {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--accent);
}

.summary__total-remaining {
  font-weight: 600;
  color: var(--text-primary);
}

.summary__total-percent {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* What-If Calculator */
.whatif {
  margin-bottom: var(--space-2xl);
  opacity: 0;
  transform: translateY(15px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.whatif.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.whatif__header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.whatif__title {
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.whatif__desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.whatif__cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.whatif__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: rgba(74, 222, 128, 0.03);
  border: 1px solid rgba(74, 222, 128, 0.08);
  border-radius: var(--border-radius-sm);
  transition: all var(--duration-normal) var(--ease-smooth);
}

.whatif__card:hover {
  background: rgba(74, 222, 128, 0.06);
  border-color: rgba(74, 222, 128, 0.15);
}

.whatif__card-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.whatif__card-icon {
  font-size: 1.2rem;
}

.whatif__card-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.whatif__card-right {
  text-align: right;
}

.whatif__card-saved {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 600;
}

.whatif__card-detail {
  font-size: 10px;
  color: var(--text-muted);
}

.whatif__comparison {
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-subtle);
}

.whatif__comparison-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.whatif__comparison-text strong {
  color: var(--accent);
  font-weight: 600;
}

.whatif__comparison-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.whatif__comparison-item {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  padding-left: var(--space-sm);
  border-left: 2px solid rgba(74, 222, 128, 0.15);
}

/* Reflection */
.summary__reflection {
  text-align: center;
  margin-bottom: var(--space-2xl);
  opacity: 0;
  transition: all 1.5s var(--ease-smooth);
}

.summary__reflection.is-visible {
  opacity: 1;
}

.summary__reflection-line1 {
  font-size: var(--font-size-xl);
  font-weight: 300;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.summary__reflection-line2 {
  font-size: var(--font-size-2xl);
  font-weight: 400;
  color: var(--text-primary);
}

/* Actions */
.summary__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.summary__actions.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.summary__share-btn {
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--duration-fast);
  padding: var(--space-sm);
}

.summary__share-btn:hover {
  color: var(--text-secondary);
}

.summary__copied {
  font-size: var(--font-size-sm);
  color: var(--accent);
  animation: fadeIn var(--duration-fast) var(--ease-smooth);
  padding: var(--space-sm);
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
  margin-top: var(--space-sm);
}

.summary__restart:hover {
  color: var(--text-secondary);
}

/* Mobile */
@media (max-width: 480px) {
  .summary__title {
    font-size: var(--font-size-xl);
  }

  .whatif__card {
    padding: var(--space-sm) var(--space-md);
  }
}
</style>
