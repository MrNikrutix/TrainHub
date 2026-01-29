import { createWebHistory, createRouter } from 'vue-router';

// Lazy loading views
// Lazy loading views
const HomeView = () => import('@/app/pages/HomeView.vue');
const ExercisesView = () => import('@/app/pages/ExercisesView.vue');
const CalendarView = () => import('@/app/pages/CalendarView.vue');
const TrainingsView = () => import('@/app/pages/TrainingsView.vue');
const WorkoutTimerView = () => import('@/app/pages/WorkoutTimerView.vue');
const AnalysisView = () => import('@/app/pages/AnalysisView.vue');
const ChatAIView = () => import('@/app/pages/ChatAIView.vue');

const routes = [
    { path: '/', component: HomeView },
    { path: '/exercises', component: ExercisesView },
    { path: '/calendar', component: CalendarView },
    { path: '/trainings', component: TrainingsView },
    { path: '/timer', component: WorkoutTimerView },
    { path: '/analysis', component: AnalysisView },
    { path: '/chat', component: ChatAIView },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;