<script setup lang="ts">
import { useRoute } from 'vue-router';

// Define navigation items with icons
const items = [
    { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
    { label: 'Exercises', icon: 'pi pi-list', to: '/exercises' },
    { label: 'Calendar', icon: 'pi pi-calendar', to: '/calendar' },
    { label: 'Training Plans', icon: 'pi pi-book', to: '/trainings' },
    { label: 'Workout Timer', icon: 'pi pi-clock', to: '/timer' },
    { label: 'Analysis', icon: 'pi pi-chart-bar', to: '/analysis' },
    { label: 'AI Chat', icon: 'pi pi-comments', to: '/chat' },
];

const route = useRoute();
</script>

<template>
    <div class="sidebar h-screen flex flex-column flex-shrink-0 relative z-5">
        <!-- Glass Background via CSS class is safest, but we can also use direct style for complex layering -->
        <div class="glass-effect absolute inset-0 -z-1"></div>

        <!-- Logo / Brand -->
        <div class="flex align-items-center gap-3 px-4 py-4 mb-2">
             <div class="flex align-items-center justify-content-center border-circle surface-900 w-3rem h-3rem shadow-2">
                 <i class="pi pi-bolt text-primary text-xl"></i>
             </div>
             <span class="text-xl font-semibold text-color tracking-tight">TrainHub</span>
        </div>

        <!-- Navigation Menu -->
        <ul class="list-none p-3 m-0 flex-1 overflow-y-auto">
            <li v-for="item in items" :key="item.label" class="mb-1">
                <router-link :to="item.to" 
                    custom
                    v-slot="{ navigate, href, isActive, isExactActive }"
                >
                    <a :href="href" @click="navigate"
                       class="nav-link flex align-items-center cursor-pointer p-3 border-round-xl transition-all transition-duration-200 no-underline"
                       :class="{ 'active-nav': isActive || (item.to === '/' && isExactActive) }"
                    >
                        <i :class="[item.icon, 'mr-3 text-lg transition-transform transition-duration-200']"></i>
                        <span class="font-medium text-sm">{{ item.label }}</span>
                        
                        <!-- Active Indicator -->
                        <div v-if="isActive || (item.to === '/' && isExactActive)" 
                             class="ml-auto w-1 h-1 border-circle bg-primary shadow-1"></div>
                    </a>
                </router-link>
            </li>
        </ul>

        <!-- User Profile -->
        <div class="p-3 mt-auto">
             <div class="user-card flex align-items-center gap-3 p-3 border-round-xl cursor-pointer transition-colors transition-duration-200">
                <div class="w-2rem h-2rem border-circle surface-700 flex align-items-center justify-content-center">
                    <i class="pi pi-user text-xs text-white"></i>
                </div>
                <div class="flex flex-column">
                    <span class="text-sm font-medium text-color">User Account</span>
                    <span class="text-xs text-color-secondary">Pro Plan</span>
                </div>
                <i class="pi pi-cog ml-auto text-color-secondary hover:text-color transition-colors"></i>
             </div>
        </div>
    </div>
</template>

<style scoped>
.sidebar {
    width: 260px;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.glass-effect {
    background: rgba(9, 9, 11, 0.7); /* Deep dark tint */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.nav-link {
    color: var(--text-color-secondary);
    border: 1px solid transparent;
}

.nav-link:hover {
    color: var(--text-color);
    background: rgba(255, 255, 255, 0.03);
}

.nav-link:hover i {
    transform: translateX(2px);
}

.active-nav {
    background: rgba(255, 255, 255, 0.06);
    color: var(--primary-color);
    border: 1px solid rgba(255, 255, 255, 0.05);
    font-weight: 600;
}

.active-nav i {
    color: var(--primary-color);
}

.user-card:hover {
    background: rgba(255, 255, 255, 0.03);
}
</style>
