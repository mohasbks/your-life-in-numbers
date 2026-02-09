<template>
  <div class="screen slider" :style="{ '--slider-color': currentCategory?.color || 'var(--accent)' }">
    <div class="slider__content" :key="currentCategory?.id" :class="{ 'is-visible': isVisible }">
      <div class="slider__progress">
        <div class="slider__progress-bar" :style="{ width: progressPercent + '%' }"></div>
        <span class="slider__progress-label">{{ store.currentSliderIndex + 1 }} / {{ store.selectedCategories.length }}</span>
      </div>

      <template v-if="currentCategory">
        <div class="slider__icon-wrapper">
          <span class="slider__icon">{{ currentCategory.icon }}</span>
          <div class="slider__icon-glow" :style="{ background: currentCategory.color }"></div>
        </div>

        <h2 class="slider__question">
          How much of your day goes to<br />
          <strong :style="{ color: currentCategory.color }">{{ currentCategory.label }}</strong>?
        </h2>

        <div class="slider__track-wrapper">
          <div class="slider__labels">
            <span>A little</span>
            <span>Half the day</span>
            <span>A lot</span>
          </div>

          <div class="slider__track-container">
            <input
              type="range"
              class="slider__input"
              min="0"
              max="70"
              step="1"
              :value="currentValue"
              @input="onSliderChange"
            />
            <div class="slider__fill" :style="{ width: fillPercent + '%' }"></div>
            <div class="slider__fill-glow" :style="{ width: fillPercent + '%' }"></div>
          </div>

          <!-- Visual time indicator -->
          <div class="slider__time-visual" v-if="currentValue > 0">
            <div class="slider__time-blocks">
              <div
                v-for="i in 24"
                :key="i"
                class="slider__time-block"
                :class="{ 'is-filled': i <= Math.ceil(hoursPerDay) }"
              ></div>
            </div>
            <p class="slider__time-text">
              {{ humanReadable }}
            </p>
          </div>
          <p class="slider__hint" v-else>
            Drag to estimate
          </p>
        </div>

        <div class="slider__actions">
          <button
            v-if="store.currentSliderIndex > 0"
            class="btn-ghost"
            @click="goPrev"
          >
            ← Back
          </button>

          <button class="btn-primary" @click="goNext">
            {{ store.isLastSlider ? 'See my life' : 'Next →' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore } from '../stores/lifeStore'

const router = useRouter()
const store = useLifeStore()

const isVisible = ref(false)

const currentCategory = computed(() => store.currentSliderCategory)

const currentValue = computed(() => {
  if (!currentCategory.value) return 0
  return store.timeEstimates[currentCategory.value.id] || 0
})

const fillPercent = computed(() => (currentValue.value / 70) * 100)

const hoursPerDay = computed(() => (currentValue.value / 100) * 24)

const progressPercent = computed(() => {
  const total = store.selectedCategories.length
  if (total === 0) return 0
  return ((store.currentSliderIndex + 1) / total) * 100
})

const humanReadable = computed(() => {
  const hours = hoursPerDay.value
  if (hours < 1) return `~${Math.round(hours * 60)} min/day`
  return `~${hours.toFixed(1)} hrs/day`
})

onMounted(() => {
  if (store.selectedCategories.length === 0) {
    router.replace('/categories')
    return
  }

  setTimeout(() => { isVisible.value = true }, 200)
})

watch(() => store.currentSliderIndex, () => {
  isVisible.value = false
  setTimeout(() => { isVisible.value = true }, 100)
})

function onSliderChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (currentCategory.value) {
    store.setEstimate(currentCategory.value.id, Number(target.value))
  }
}

function goNext() {
  if (store.isLastSlider) {
    store.resetResults()
    router.push('/result')
  } else {
    store.nextSlider()
  }
}

function goPrev() {
  store.prevSlider()
}
</script>

<style scoped>
.slider {
  background: var(--bg-primary);
  --slider-color: var(--accent);
}

.slider__content {
  text-align: center;
  max-width: 500px;
  width: 100%;
  opacity: 0;
  transform: translateY(16px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.slider__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Progress */
.slider__progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.04);
  z-index: 10;
  display: flex;
  align-items: flex-end;
}

.slider__progress-bar {
  height: 100%;
  background: var(--slider-color);
  transition: width var(--duration-normal) var(--ease-smooth);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px var(--slider-color);
}

.slider__progress-label {
  position: fixed;
  top: 12px;
  right: var(--space-xl);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* Icon */
.slider__icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: var(--space-xl);
}

.slider__icon {
  display: block;
  font-size: 3.5rem;
  position: relative;
  z-index: 1;
  animation: fadeIn var(--duration-slow) var(--ease-smooth);
}

.slider__icon-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.2;
}

/* Question */
.slider__question {
  font-size: var(--font-size-xl);
  font-weight: 300;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-3xl);
}

.slider__question strong {
  font-weight: 600;
}

/* Track */
.slider__track-wrapper {
  margin-bottom: var(--space-3xl);
}

.slider__labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: var(--space-md);
  text-transform: uppercase;
}

.slider__track-container {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
}

.slider__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--slider-color);
  border-radius: 3px;
  pointer-events: none;
  transition: width 50ms linear;
}

.slider__fill-glow {
  position: absolute;
  top: -4px;
  left: 0;
  height: calc(100% + 8px);
  background: var(--slider-color);
  border-radius: 6px;
  pointer-events: none;
  filter: blur(8px);
  opacity: 0.3;
  transition: width 50ms linear;
}

.slider__input {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 36px;
  -webkit-appearance: none;
  appearance: none;
  background: none;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}

.slider__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  border: 3px solid var(--slider-color);
  box-shadow: 0 0 15px color-mix(in srgb, var(--slider-color) 40%, transparent);
  cursor: pointer;
  transition: transform var(--duration-fast), box-shadow var(--duration-fast);
}

.slider__input::-webkit-slider-thumb:hover {
  transform: scale(1.25);
  box-shadow: 0 0 25px color-mix(in srgb, var(--slider-color) 50%, transparent);
}

.slider__input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  border: 3px solid var(--slider-color);
  box-shadow: 0 0 15px color-mix(in srgb, var(--slider-color) 40%, transparent);
  cursor: pointer;
}

/* Time visual blocks */
.slider__time-visual {
  margin-top: var(--space-xl);
  animation: fadeIn var(--duration-normal) var(--ease-smooth);
}

.slider__time-blocks {
  display: flex;
  gap: 3px;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.slider__time-block {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  transition: all var(--duration-fast) var(--ease-smooth);
}

.slider__time-block.is-filled {
  background: var(--slider-color);
  box-shadow: 0 0 6px color-mix(in srgb, var(--slider-color) 30%, transparent);
}

.slider__time-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* Hint */
.slider__hint {
  margin-top: var(--space-xl);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  min-height: 1.5em;
}

/* Actions */
.slider__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

/* Mobile */
@media (max-width: 480px) {
  .slider__icon {
    font-size: 2.5rem;
  }

  .slider__question {
    font-size: var(--font-size-lg);
  }

  .slider__time-block {
    width: 8px;
    height: 8px;
  }
}
</style>
