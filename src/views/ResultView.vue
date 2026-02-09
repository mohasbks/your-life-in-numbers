<template>
  <div class="screen result">
    <!-- Moving gradient background -->
    <div class="result__bg"></div>

    <!-- Phase 1: Black pause -->
    <div class="result__phase result__pause" v-if="phase === 'pause'">
      <div class="result__breathing-dot"></div>
      <p class="result__pause-text">Calculating your life...</p>
    </div>

    <!-- Phase 2: Category reveal (one at a time) -->
    <div class="result__phase result__reveal" v-else-if="phase === 'reveal'" :key="currentCategory?.id">
      <div class="result__reveal-content" :class="{ 'is-visible': revealVisible }">
        <span class="result__category-icon">{{ currentCategory?.icon }}</span>

        <p class="result__pretext">You will spend</p>

        <div class="result__number-wrapper">
          <p class="result__number">
            <span class="result__number-value" :style="{ color: currentCategory?.color }">{{ animatedNumber }}</span>
          </p>
          <span class="result__number-unit">years</span>
        </div>

        <p class="result__category-label">
          of your life on <strong :style="{ color: currentCategory?.color }">{{ currentCategory?.label }}</strong>
        </p>

        <!-- Days/Months insight -->
        <div class="result__insight" v-if="showInsight">
          <p class="result__insight-text">
            That's <strong>{{ daysEquivalent }}</strong> days, or about <strong>{{ monthsEquivalent }}</strong> months.
          </p>
        </div>

        <!-- Emotional comparisons -->
        <div class="result__comparisons" v-if="showComparisons">
          <p class="result__comparisons-header">With that time, you could have:</p>
          <div class="result__comparisons-list">
            <p
              v-for="(comp, i) in comparisons"
              :key="i"
              class="result__comparison-item"
              :style="{ animationDelay: `${i * 300}ms` }"
            >
              {{ comp }}
            </p>
          </div>
        </div>

        <!-- Quote -->
        <div class="result__quote" v-if="showQuote && quote">
          <p class="result__quote-text">"{{ quote.text }}"</p>
          <p class="result__quote-author">— {{ quote.author }}</p>
        </div>

        <button
          v-if="showNextBtn"
          class="btn-ghost result__next-btn"
          @click="nextCategory"
        >
          {{ store.isLastResult ? 'See the full picture' : 'Next →' }}
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

type Phase = 'pause' | 'reveal'
const phase = ref<Phase>('pause')

const revealVisible = ref(false)
const showNextBtn = ref(false)
const showInsight = ref(false)
const showComparisons = ref(false)
const showQuote = ref(false)
const animatedNumber = ref('0.0')
const comparisons = ref<string[]>([])
const quote = ref(store.getRandomQuote())

const currentCategory = computed(() => store.currentResultCategory)

const targetNumber = computed(() => {
  if (!currentCategory.value) return 0
  return store.yearsPerCategory[currentCategory.value.id] || 0
})

const daysEquivalent = computed(() => {
  return Math.round(targetNumber.value * 365).toLocaleString()
})

const monthsEquivalent = computed(() => {
  return Math.round(targetNumber.value * 12)
})

onMounted(() => {
  if (store.selectedCategories.length === 0) {
    router.replace('/categories')
    return
  }

  store.resetResults()

  // Phase 1: Dramatic pause
  setTimeout(() => {
    phase.value = 'reveal'
    startReveal()
  }, 2500)
})

function startReveal() {
  revealVisible.value = false
  showNextBtn.value = false
  showInsight.value = false
  showComparisons.value = false
  showQuote.value = false
  animatedNumber.value = '0.0'

  // Generate new comparisons
  comparisons.value = store.getComparisons(targetNumber.value, 3)
  quote.value = store.getRandomQuote()

  setTimeout(() => { revealVisible.value = true }, 100)

  setTimeout(() => {
    animateNumber(targetNumber.value)
    if (store.audioEnabled) ambientAudio.playReveal()
  }, 700)

  setTimeout(() => { showInsight.value = true }, 2200)
  setTimeout(() => { showComparisons.value = true }, 3000)
  setTimeout(() => {
    showQuote.value = true
  }, 4200)
  setTimeout(() => { showNextBtn.value = true }, 5200)
}

function animateNumber(target: number) {
  const duration = 1800
  const startTime = performance.now()

  function tick(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 4)
    const current = eased * target

    animatedNumber.value = current.toFixed(1)

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

function nextCategory() {
  if (store.audioEnabled) ambientAudio.playTick()
  if (store.isLastResult) {
    router.push('/summary')
  } else {
    store.nextResult()
    startReveal()
  }
}
</script>

<style scoped>
.result {
  background: var(--bg-primary);
  position: relative;
}

.result__bg {
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    135deg,
    rgba(74, 222, 128, 0.03) 0%,
    rgba(8, 8, 8, 1) 25%,
    rgba(8, 8, 8, 1) 50%,
    rgba(99, 102, 241, 0.03) 75%,
    rgba(8, 8, 8, 1) 100%
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  pointer-events: none;
}

.result__phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* Pause */
.result__pause {
  animation: fadeIn var(--duration-slow) var(--ease-smooth);
  gap: var(--space-xl);
}

.result__breathing-dot {
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  animation: breathe 2s var(--ease-smooth) infinite;
  box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
}

.result__pause-text {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  letter-spacing: 0.1em;
  animation: pulse 2s var(--ease-smooth) infinite;
}

/* Reveal */
.result__reveal-content {
  text-align: center;
  max-width: 520px;
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--duration-slow) var(--ease-smooth);
  padding: var(--space-xl) 0;
}

.result__reveal-content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.result__category-icon {
  display: block;
  font-size: 3.5rem;
  margin-bottom: var(--space-lg);
  opacity: 0.8;
}

.result__pretext {
  font-size: var(--font-size-lg);
  font-weight: 300;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  letter-spacing: 0.05em;
}

.result__number-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.result__number-value {
  font-size: var(--font-size-hero);
  font-weight: 200;
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.result__number-unit {
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--text-muted);
}

.result__category-label {
  font-size: var(--font-size-lg);
  font-weight: 300;
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.result__category-label strong {
  font-weight: 600;
}

/* Insight */
.result__insight {
  margin-bottom: var(--space-lg);
  padding: var(--space-md) var(--space-xl);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-subtle);
  animation: fadeIn var(--duration-slow) var(--ease-smooth);
}

.result__insight-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.result__insight-text strong {
  color: var(--text-primary);
  font-weight: 500;
}

/* Emotional Comparisons */
.result__comparisons {
  margin-bottom: var(--space-lg);
  animation: fadeIn var(--duration-slow) var(--ease-smooth);
}

.result__comparisons-header {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.result__comparisons-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.result__comparison-item {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-sm);
  border-left: 2px solid rgba(74, 222, 128, 0.2);
  text-align: left;
  animation: slideUp var(--duration-normal) var(--ease-smooth) both;
}

/* Quote */
.result__quote {
  margin-bottom: var(--space-xl);
  padding: var(--space-lg);
  animation: fadeInSlow 1.5s var(--ease-smooth);
}

.result__quote-text {
  font-size: var(--font-size-sm);
  font-style: italic;
  color: var(--text-secondary);
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: var(--space-xs);
}

.result__quote-author {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.result__next-btn {
  animation: fadeIn var(--duration-slow) var(--ease-smooth) forwards;
}

/* Mobile */
@media (max-width: 480px) {
  .result__number-value {
    font-size: var(--font-size-5xl);
  }

  .result__number-unit {
    font-size: var(--font-size-xl);
  }

  .result__reveal-content {
    padding: var(--space-md) 0;
  }
}
</style>
