<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Timeline from 'primevue/timeline';
import { useTrainingPrograms } from '../composables/useTrainingPrograms';
import { useTrainingPlans } from '../composables/useTrainingPlans';
import { useAnalysis } from '../composables/useAnalysis';

const router = useRouter();

// Composables
const { activeProgram, programs } = useTrainingPrograms();
const { plans } = useTrainingPlans();
const { sessions } = useAnalysis();

// Computed Stats

// 1. Next Workout
const nextWorkout = computed(() => {
    if (!activeProgram.value) return null;
    // Find first uncompleted workout
    return activeProgram.value.workouts.find(w => !w.completed);
});

// 2. Stats Cards
const stats = computed(() => {
    // A. Workouts Completed (Total in active program)
    const completedCount = activeProgram.value 
        ? activeProgram.value.workouts.filter(w => w.completed).length 
        : 0;
    
    // B. Total Plans
    const totalPlans = plans.value.length;

    // C. Analysis Sessions
    const totalAnalysis = sessions.value.length;

    return [
        { 
            label: 'Ukończone Treningi', 
            value: completedCount.toString(), 
            icon: 'pi pi-check-circle', 
            color: 'text-green-500', 
            bg: 'bg-green-100' 
        },
        { 
            label: 'Dostępne Plany', 
            value: totalPlans.toString(), 
            icon: 'pi pi-list', 
            color: 'text-blue-500', 
            bg: 'bg-blue-100' 
        },
        { 
            label: 'Sesje Analizy', 
            value: totalAnalysis.toString(), 
            icon: 'pi pi-video', 
            color: 'text-orange-500', 
            bg: 'bg-orange-100' 
        },
    ];
});

interface ActivityItem {
    status: string;
    date: Date;
    icon: string;
    color: string;
    header: string;
    originalDate: string; // for sorting safety if distinct from Date obj
}

// 3. Recent Activity (Merged Stream)
const recentActivity = computed(() => {
    const activity: ActivityItem[] = [];

    // Add recent analysis sessions
    sessions.value.forEach(s => {
        activity.push({
            status: 'Analiza Wideo',
            date: new Date(s.date),
            icon: 'pi pi-video',
            color: '#f59e0b',
            header: s.name,
            originalDate: s.date
        });
    });

    // Add Programs creation (as a proxy for "Plan Added")
    programs.value.forEach(p => {
        activity.push({
            status: 'Nowy Program',
            date: p.createdAt,
            icon: 'pi pi-calendar',
            color: '#3b82f6',
            header: p.name,
            originalDate: p.createdAt.toISOString()
        });
    });

    // Sort by date desc
    activity.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Take top 5 and format date string
    return activity.slice(0, 5).map(a => ({
        ...a,
        date: a.date.toLocaleDateString() + ' ' + a.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
});

const quickActions = [
    { label: 'Nowy Trening', icon: 'pi pi-plus', command: () => router.push('/trainings'), severity: 'primary' },
    { label: 'Analiza Wideo', icon: 'pi pi-video', command: () => router.push('/analysis'), severity: 'help' },
    { label: 'Kalendarz', icon: 'pi pi-calendar', command: () => router.push('/calendar'), severity: 'info' },
];

const startNextWorkout = () => {
    // Navigate to workout timer? Or just trainings view?
    // Usually to Timer if we can set it active, but logic for "Start Workout" is in useActiveWorkout.
    // For now, go to Calendar to see context or Trainings. 
    // Let's go to Calendar as it shows the active program schedule.
    router.push('/calendar');
};
</script>

<template>
  <main class="flex flex-column gap-5 h-full overflow-y-auto">
    <!-- Header -->
    <div class="flex flex-column md:flex-row justify-content-between align-items-center gap-3 mb-4">
        <div>
            <h1 class="m-0 text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">Witaj, Kazi! 👋</h1>
            <p class="text-gray-400 text-lg" v-if="activeProgram">
                Aktywny program: <span class="font-semibold text-primary-400">{{ activeProgram.name }}</span>
            </p>
            <p class="text-gray-400 text-lg" v-else>
                Nie masz aktywnego programu. Utwórz nowy w Kalendarzu!
            </p>
        </div>
        <Button label="Mój Kalendarz" icon="pi pi-calendar" rounded size="large" class="px-5 py-3 font-semibold shadow-4 hover:shadow-6 transition-all" @click="router.push('/calendar')" />
    </div>

    <!-- Stats Cards -->
    <div class="grid">
        <div v-for="stat in stats" :key="stat.label" class="col-12 md:col-4">
            <div class="glass-card surface-card p-4 flex align-items-center gap-4 hover:surface-card transition-duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
                <!-- Background Glow -->
                <div class="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20" :class="stat.bg"></div>
                
                <div class="w-4rem h-4rem border-circle flex align-items-center justify-content-center text-xl relative z-1 shadow-2" :class="[stat.bg, stat.color]">
                    <i :class="['text-2xl', stat.icon]"></i>
                </div>
                <div class="relative z-1">
                    <div class="text-400 font-medium mb-1">{{ stat.label }}</div>
                    <div class="text-3xl font-bold text-white">{{ stat.value }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid mt-2">
        <!-- Next Workout & Quick Actions -->
        <div class="col-12 md:col-8 flex flex-column gap-5">
             
             <!-- Next Workout Card -->
             <div v-if="nextWorkout" class="relative overflow-hidden border-round-2xl p-5 shadow-6 cursor-pointer group transition-all duration-300 hover:shadow-8" 
                  style="background: linear-gradient(135deg, var(--primary-900) 0%, #1e1b4b 100%);"
                  @click="startNextWorkout">
                 
                 <div class="relative z-2">
                    <div class="flex justify-content-between align-items-start mb-4">
                        <div class="text-primary-300 font-semibold uppercase tracking-wider text-xs bg-primary-900 px-3 py-1 border-round-pill shadow-1">Następny Trening</div>
                        <Button icon="pi pi-arrow-right" rounded text class="text-white hover:bg-white-alpha-10 transition-colors" />
                    </div>
                     
                     <h2 class="text-4xl font-bold text-white mb-2">{{ nextWorkout.name }}</h2>
                     <p class="m-0 text-gray-300 text-lg line-height-3 max-w-30rem">{{ nextWorkout.description || 'Przygotuj się na solidny wycisk.' }}</p>
                     
                     <div class="mt-4 flex gap-3">
                         <span v-if="nextWorkout.day" class="glass-card px-3 py-1 text-sm bg-white-alpha-10 text-white flex align-items-center gap-2">
                            <i class="pi pi-calendar text-xs"></i>
                            {{ nextWorkout.day }}
                         </span>
                     </div>
                 </div>
                 
                 <!-- Decorative Elements -->
                 <div class="absolute w-20rem h-20rem bg-primary-500 border-circle blur-3xl opacity-20" style="top: -5rem; right: -5rem;"></div>
                 <i class="pi pi-bolt absolute text-white opacity-5 text-9xl transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" 
                    style="right: -2rem; bottom: -3rem; font-size: 16rem !important;"></i>
             </div>

             <div v-else class="glass-card p-5 border-dashed border-2 border-gray-700 text-center hover:border-primary-500 transition-colors duration-300">
                 <div class="text-2xl font-bold text-white mb-2">Brak zaplanowanych treningów</div>
                 <p class="text-gray-400 mb-4">Wszystkie treningi w tym programie zostały ukończone!</p>
                 <Button label="Zarządzaj Programem" outlined class="font-semibold" @click="router.push('/calendar')" />
             </div>

             <!-- Quick Actions -->
             <div class="glass-card p-5">
                 <h2 class="text-xl font-bold text-white mb-4 flex align-items-center gap-2">
                    <i class="pi pi-bolt text-yellow-500"></i>
                    Szybkie Akcje
                 </h2>
                 <div class="grid formgrid p-fluid">
                     <div v-for="action in quickActions" :key="action.label" class="col-12 md:col-4 mb-3 md:mb-0">
                        <Button :label="action.label" :icon="action.icon" :severity="action.severity" 
                             class="h-full py-4 text-left justify-content-start font-medium text-lg surface-card border-none hover:bg-white-alpha-10 transition-colors shadow-2"
                             outlined
                             @click="action.command" />
                     </div>
                 </div>
             </div>
        </div>

        <!-- Activity Feed -->
        <div class="col-12 md:col-4">
             <div class="glass-card h-full p-4 flex flex-column">
                 <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 border-white-alpha-10">
                     <h2 class="text-xl font-bold text-white m-0">Ostatnia Aktywność</h2>
                     <Button icon="pi pi-ellipsis-h" text rounded class="text-gray-400 hover:text-white" />
                 </div>
                 
                 <div v-if="recentActivity.length === 0" class="flex-1 flex align-items-center justify-content-center flex-column gap-3 text-center text-gray-500">
                    <i class="pi pi-calendar-times text-4xl opacity-50"></i>
                    <span>Brak ostatniej aktywności</span>
                 </div>
                 
                 <Timeline v-else :value="recentActivity" class="customized-timeline w-full">
                    <template #marker="slotProps">
                        <span class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-2" :style="{backgroundColor: slotProps.item.color}">
                            <i :class="[slotProps.item.icon, 'text-xs']"></i>
                        </span>
                    </template>
                    <template #content="slotProps">
                        <div class="mb-4 pl-3">
                            <span class="text-gray-500 text-xs font-medium block mb-1">{{ slotProps.item.date }}</span>
                            <div class="surface-card p-3 border-round-xl border-1 border-white-alpha-5 shadow-none hover:bg-white-alpha-5 transition-colors cursor-pointer">
                                <span class="text-white font-semibold block mb-1">{{ slotProps.item.header }}</span>
                                <span class="text-primary-400 text-xs font-uppercase font-bold tracking-wide">{{ slotProps.item.status }}</span>
                            </div>
                        </div>
                    </template>
                </Timeline>
             </div>
        </div>
    </div>

  </main>
</template>

<style scoped>
.glass-card {
    /* Extending global glass-card if needed, or specific component overrides */
}

/* Custom bg clip for gradient text support across browsers */
.bg-clip-text {
    -webkit-background-clip: text;
    background-clip: text;
}
</style>
