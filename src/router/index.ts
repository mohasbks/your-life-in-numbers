import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import CategorySelect from '../views/CategorySelect.vue'
import TimeSlider from '../views/TimeSlider.vue'
import ResultView from '../views/ResultView.vue'
import SummaryView from '../views/SummaryView.vue'
import LifeGridView from '../views/LifeGridView.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'landing',
            component: LandingView,
        },
        {
            path: '/categories',
            name: 'categories',
            component: CategorySelect,
        },
        {
            path: '/estimate',
            name: 'estimate',
            component: TimeSlider,
        },
        {
            path: '/result',
            name: 'result',
            component: ResultView,
        },
        {
            path: '/summary',
            name: 'summary',
            component: SummaryView,
        },
        {
            path: '/life-grid',
            name: 'life-grid',
            component: LifeGridView,
        },
    ],
})

export default router
