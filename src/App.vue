<template>
  <div class="app-shell">
    <!-- Global audio toggle -->
    <button
      class="audio-toggle"
      :class="{ 'is-playing': store.audioEnabled }"
      @click="toggleAudio"
      :title="store.audioEnabled ? 'Mute ambient sound' : 'Play ambient sound'"
    >
      <span v-if="store.audioEnabled" class="audio-toggle__icon">🔊</span>
      <span v-else class="audio-toggle__icon">🔇</span>
    </button>

    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in" @after-enter="onPageEnter">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { useLifeStore } from './stores/lifeStore'
import { ambientAudio } from './audio/ambientAudio'

const store = useLifeStore()

function toggleAudio() {
  store.toggleAudio()
  if (store.audioEnabled) {
    ambientAudio.start()
  } else {
    ambientAudio.stop()
  }
}

function onPageEnter() {
  if (store.audioEnabled) {
    ambientAudio.playTransition()
  }
}
</script>

<style>
.app-shell {
  position: relative;
  min-height: 100vh;
}

.audio-toggle {
  position: fixed;
  top: var(--space-lg);
  left: var(--space-lg);
  z-index: 100;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  font-size: 16px;
}

.audio-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.audio-toggle.is-playing {
  border-color: rgba(74, 222, 128, 0.3);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.1);
  animation: glowPulse 3s var(--ease-smooth) infinite;
}

.audio-toggle__icon {
  line-height: 1;
}
</style>
