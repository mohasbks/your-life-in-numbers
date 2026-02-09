import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Category {
    id: string
    label: string
    icon: string
    color: string
    description: string
}

export const CATEGORIES: Category[] = [
    { id: 'social-media', label: 'Social Media', icon: '📱', color: '#6366f1', description: 'Scrolling, liking, watching' },
    { id: 'work-study', label: 'Work / Study', icon: '💼', color: '#f59e0b', description: 'Career, learning, hustle' },
    { id: 'sleep', label: 'Sleep', icon: '😴', color: '#8b5cf6', description: 'Rest and recovery' },
    { id: 'waiting', label: 'Waiting / Nothing', icon: '⏳', color: '#ef4444', description: 'Queues, traffic, boredom' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#ec4899', description: 'Games, shows, movies' },
    { id: 'commuting', label: 'Commuting', icon: '🚗', color: '#f97316', description: 'Travel, transport, roads' },
    { id: 'cooking-eating', label: 'Cooking & Eating', icon: '🍽️', color: '#14b8a6', description: 'Preparing meals, dining' },
    { id: 'exercise', label: 'Exercise', icon: '🏃', color: '#22c55e', description: 'Moving your body' },
    { id: 'meaningful', label: 'Meaningful Life', icon: '❤️', color: '#4ade80', description: 'Love, family, purpose' },
]

// Emotional comparisons — what you could do with X years
export interface EmotionalComparison {
    icon: string
    getText: (years: number) => string
}

export const EMOTIONAL_COMPARISONS: EmotionalComparison[] = [
    { icon: '📚', getText: (y) => `Enough to read ${Math.round(y * 365 * 0.5).toLocaleString()} books` },
    { icon: '🌍', getText: (y) => `Or travel to ${Math.round(y * 25)} countries` },
    { icon: '👨‍👩‍👧‍👦', getText: (y) => `Or spend ${Math.round(y * 8760).toLocaleString()} hours with loved ones` },
    { icon: '🎸', getText: (y) => `Or master ${Math.max(1, Math.round(y / 2.5))} musical instruments` },
    { icon: '🎓', getText: (y) => `Or complete ${Math.max(1, Math.round(y / 4))} university degrees` },
    { icon: '🏠', getText: (y) => `Or build ${Math.max(1, Math.round(y / 2))} homes with your own hands` },
    { icon: '🏔️', getText: (y) => `Or hike ${Math.round(y * 2000).toLocaleString()} km of trails` },
    { icon: '✍️', getText: (y) => `Or write ${Math.max(1, Math.round(y * 2))} novels` },
    { icon: '👶', getText: (y) => `Or watch a child grow to age ${Math.round(y)}` },
    { icon: '🧘', getText: (y) => `Or meditate for ${Math.round(y * 365 * 30).toLocaleString()} minutes` },
]

// Time-related quotes
export const QUOTES = [
    { text: 'Time is what we want most, but what we use worst.', author: 'William Penn' },
    { text: 'The bad news is time flies. The good news is you\'re the pilot.', author: 'Michael Altshuler' },
    { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
    { text: 'It\'s not that we have a short time to live, but that we waste a good deal of it.', author: 'Seneca' },
    { text: 'Your time is limited, so don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
    { text: 'The trouble is, you think you have time.', author: 'Jack Kornfield' },
]

export const useLifeStore = defineStore('life', () => {
    // State
    const selectedCategoryIds = ref<string[]>([])
    const timeEstimates = ref<Record<string, number>>({}) // category id → percentage (0-100)
    const userAge = ref(25)
    const lifespan = ref(75)
    const currentSliderIndex = ref(0)
    const currentResultIndex = ref(0)
    const audioEnabled = ref(false)

    // Getters
    const selectedCategories = computed(() =>
        CATEGORIES.filter(c => selectedCategoryIds.value.includes(c.id))
    )

    const remainingYears = computed(() =>
        Math.max(0, lifespan.value - userAge.value)
    )

    const yearsPerCategory = computed(() => {
        const result: Record<string, number> = {}
        for (const id of selectedCategoryIds.value) {
            const pct = timeEstimates.value[id] || 0
            const years = (pct / 100) * remainingYears.value
            result[id] = Math.round(years * 10) / 10
        }
        return result
    })

    // What-If: how many years saved if you reduce by 1 hour (≈4.17% of a day)
    const whatIfSavings = computed(() => {
        const result: Record<string, number> = {}
        const oneHourPercent = (1 / 24) * 100 // ~4.17%
        for (const id of selectedCategoryIds.value) {
            const pct = timeEstimates.value[id] || 0
            if (pct > oneHourPercent) {
                const savedYears = (oneHourPercent / 100) * remainingYears.value
                result[id] = Math.round(savedYears * 10) / 10
            }
        }
        return result
    })

    // Get random emotional comparisons for a given years value
    function getComparisons(years: number, count = 3): string[] {
        const shuffled = [...EMOTIONAL_COMPARISONS].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count).map(c => `${c.icon} ${c.getText(years)}`)
    }

    // Get a random quote
    function getRandomQuote() {
        return QUOTES[Math.floor(Math.random() * QUOTES.length)]
    }

    const totalYearsAccounted = computed(() => {
        return Object.values(yearsPerCategory.value).reduce((sum, y) => sum + y, 0)
    })

    const totalPercentAccounted = computed(() => {
        return Object.values(timeEstimates.value).reduce((sum, p) => sum + p, 0)
    })

    const currentSliderCategory = computed(() =>
        selectedCategories.value[currentSliderIndex.value] || null
    )

    const currentResultCategory = computed(() =>
        selectedCategories.value[currentResultIndex.value] || null
    )

    const isLastSlider = computed(() =>
        currentSliderIndex.value >= selectedCategories.value.length - 1
    )

    const isLastResult = computed(() =>
        currentResultIndex.value >= selectedCategories.value.length - 1
    )

    // Life grid: total weeks in a 75-year life, how many lived
    const totalWeeksInLife = computed(() => lifespan.value * 52)
    const weeksLived = computed(() => userAge.value * 52)
    const weeksRemaining = computed(() => totalWeeksInLife.value - weeksLived.value)

    // Generate shareable text
    const shareableText = computed(() => {
        let text = `⏳ My Life in Numbers\n\n`
        text += `Age: ${userAge.value} | Remaining: ~${remainingYears.value} years\n\n`
        for (const cat of selectedCategories.value) {
            const years = yearsPerCategory.value[cat.id] || 0
            text += `${cat.icon} ${cat.label}: ${years} years\n`
        }
        text += `\nThis isn't wrong. But this is your life.\n`
        text += `\n🔗 yourlifeinnumbers.com`
        return text
    })

    // Actions
    function toggleCategory(id: string) {
        const idx = selectedCategoryIds.value.indexOf(id)
        if (idx === -1) {
            selectedCategoryIds.value.push(id)
        } else {
            selectedCategoryIds.value.splice(idx, 1)
            delete timeEstimates.value[id]
        }
    }

    function setEstimate(id: string, value: number) {
        timeEstimates.value[id] = value
    }

    function nextSlider() {
        if (currentSliderIndex.value < selectedCategories.value.length - 1) {
            currentSliderIndex.value++
        }
    }

    function prevSlider() {
        if (currentSliderIndex.value > 0) {
            currentSliderIndex.value--
        }
    }

    function nextResult() {
        if (currentResultIndex.value < selectedCategories.value.length - 1) {
            currentResultIndex.value++
        }
    }

    function resetSliders() {
        currentSliderIndex.value = 0
    }

    function resetResults() {
        currentResultIndex.value = 0
    }

    function toggleAudio() {
        audioEnabled.value = !audioEnabled.value
    }

    function reset() {
        selectedCategoryIds.value = []
        timeEstimates.value = {}
        userAge.value = 25
        currentSliderIndex.value = 0
        currentResultIndex.value = 0
    }

    return {
        selectedCategoryIds,
        timeEstimates,
        userAge,
        lifespan,
        currentSliderIndex,
        currentResultIndex,
        audioEnabled,
        selectedCategories,
        remainingYears,
        yearsPerCategory,
        whatIfSavings,
        totalYearsAccounted,
        totalPercentAccounted,
        currentSliderCategory,
        currentResultCategory,
        isLastSlider,
        isLastResult,
        totalWeeksInLife,
        weeksLived,
        weeksRemaining,
        shareableText,
        toggleCategory,
        setEstimate,
        nextSlider,
        prevSlider,
        nextResult,
        resetSliders,
        resetResults,
        toggleAudio,
        reset,
        getComparisons,
        getRandomQuote,
    }
})
