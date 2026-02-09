<template>
  <div class="screen categories">
    <div class="categories__content" :class="{ 'is-visible': isVisible }">
      <div class="categories__header">
        <p class="categories__subtitle">Think about your average day.</p>
        <h2 class="categories__title">Where does your time go?</h2>
        <p class="categories__counter" v-if="store.selectedCategoryIds.length > 0">
          {{ store.selectedCategoryIds.length }} selected
        </p>
      </div>

      <div class="categories__grid">
        <button
          v-for="(category, index) in allCategories"
          :key="category.id"
          class="category-card"
          :class="{
            'is-selected': isSelected(category.id),
            'is-mounted': mountedCards.includes(index),
          }"
          :style="isSelected(category.id) ? `--card-accent: ${category.color}` : ''"
          @click="toggle(category.id)"
        >
          <span class="category-card__icon">{{ category.icon }}</span>
          <span class="category-card__label">{{ category.label }}</span>
          <span class="category-card__desc">{{ category.description }}</span>
          <span class="category-card__check" v-if="isSelected(category.id)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>

      <transition name="slide">
        <div class="categories__bottom" v-if="store.selectedCategoryIds.length > 0">
          <button class="btn-primary categories__cta" @click="proceed">
            Continue
          </button>
        </div>
      </transition>

      <p class="categories__hint" :class="{ 'is-hidden': store.selectedCategoryIds.length > 0 }">
        Select at least one
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLifeStore, CATEGORIES } from '../stores/lifeStore'
import { ambientAudio } from '../audio/ambientAudio'

const router = useRouter()
const store = useLifeStore()

const allCategories = CATEGORIES
const isVisible = ref(false)
const mountedCards = ref<number[]>([])

onMounted(() => {
  setTimeout(() => { isVisible.value = true }, 200)

  // Stagger card entrance
  allCategories.forEach((_, i) => {
    setTimeout(() => {
      mountedCards.value.push(i)
    }, 350 + i * 80)
  })
})

function isSelected(id: string) {
  return store.selectedCategoryIds.includes(id)
}

function toggle(id: string) {
  store.toggleCategory(id)
  if (store.audioEnabled) ambientAudio.playTick()
}

function proceed() {
  store.resetSliders()
  if (store.audioEnabled) ambientAudio.playTransition()
  router.push('/estimate')
}
</script>

<style scoped>
.categories {
  background: var(--bg-primary);
  padding-top: var(--space-3xl);
  padding-bottom: var(--space-3xl);
}

.categories__content {
  text-align: center;
  max-width: 640px;
  width: 100%;
  opacity: 0;
  transform: translateY(16px);
  transition: all var(--duration-slow) var(--ease-smooth);
}

.categories__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.categories__header {
  margin-bottom: var(--space-2xl);
}

.categories__subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: var(--space-sm);
}

.categories__title {
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.categories__counter {
  font-size: var(--font-size-xs);
  color: var(--accent);
  letter-spacing: 0.05em;
  animation: fadeIn var(--duration-fast) var(--ease-smooth);
}

/* Card Grid */
.categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.category-card {
  --card-accent: var(--accent);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: var(--space-lg) var(--space-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  transition: all var(--duration-normal) var(--ease-smooth);
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.category-card.is-mounted {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.category-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-3px) scale(1.03);
}

.category-card.is-selected {
  background: color-mix(in srgb, var(--card-accent) 8%, var(--bg-card));
  border-color: var(--card-accent);
  box-shadow: 0 0 25px color-mix(in srgb, var(--card-accent) 15%, transparent),
              inset 0 0 25px color-mix(in srgb, var(--card-accent) 5%, transparent);
}

.category-card.is-selected:hover {
  transform: translateY(-3px) scale(1.03);
}

.category-card__icon {
  font-size: 2.2rem;
  line-height: 1;
  transition: transform var(--duration-normal) var(--ease-spring);
}

.category-card:hover .category-card__icon {
  transform: scale(1.2) rotate(-5deg);
}

.category-card__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  transition: color var(--duration-fast);
}

.category-card.is-selected .category-card__label {
  color: var(--text-primary);
}

.category-card__desc {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.category-card__check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent);
  color: var(--bg-primary);
  border-radius: 50%;
  animation: countUp var(--duration-fast) var(--ease-spring);
}

/* Bottom */
.categories__bottom {
  display: flex;
  justify-content: center;
}

.categories__hint {
  margin-top: var(--space-lg);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  letter-spacing: 0.05em;
  transition: opacity var(--duration-normal);
}

.categories__hint.is-hidden {
  opacity: 0;
}

/* Slide transition */
.slide-enter-active {
  animation: slideUp var(--duration-normal) var(--ease-smooth) forwards;
}

.slide-leave-active {
  transition: all var(--duration-fast);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Mobile */
@media (max-width: 600px) {
  .categories__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .category-card {
    padding: var(--space-md) var(--space-sm);
  }

  .category-card__icon {
    font-size: 1.8rem;
  }

  .category-card__desc {
    display: none;
  }
}

@media (max-width: 380px) {
  .categories__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
