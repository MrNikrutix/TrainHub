<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Card from 'primevue/card';
import Drawer from 'primevue/drawer'; // Replaced Sidebar component
import { useActiveWorkout, type TrainingPlan } from '../composables/useActiveWorkout';

const router = useRouter();
const { activePlan } = useActiveWorkout();

// Flattened Activity Structure
interface Activity {
    id: string;
    name: string;
    type: 'work' | 'rest';
    duration: number; // seconds (0 if reps based, manual advance)
    originalExercise?: any;
    sectionName?: string;
    setIndex?: number;
    totalSets?: number;
}

const activities = ref<Activity[]>([]);
const currentActivityIndex = ref(0);
const timeRemaining = ref(0);
const totalTimeElapsed = ref(0);
const isRunning = ref(false);
const isFinished = ref(false);
const timerInterval = ref<number | null>(null);
const showActivityList = ref(false); // Sidebar state

// Audio
const beepShort = new Audio('https://raw.githubusercontent.com/sound-effects/beep-sounds/main/mp3/beep-07.mp3');
const beepLong = new Audio('https://raw.githubusercontent.com/sound-effects/beep-sounds/main/mp3/beep-09.mp3'); 

const BuildWorkoutSequence = (plan: TrainingPlan) => {
    let seq: Activity[] = [];
    
    plan.sections.forEach(section => {
        section.exercises.forEach(ex => {
            for (let s = 1; s <= ex.sets; s++) {
                // WORK
                seq.push({
                    id: `${ex.instanceId}-s${s}-work`,
                    name: ex.name,
                    type: 'work',
                    duration: ex.isTime ? ex.value : 0, // 0 means manual completion
                    originalExercise: ex,
                    sectionName: section.name,
                    setIndex: s,
                    totalSets: ex.sets
                });

                // REST
                if (ex.rest > 0) {
                     seq.push({
                        id: `${ex.instanceId}-s${s}-rest`,
                        name: 'Przerwa',
                        type: 'rest',
                        duration: ex.rest,
                        sectionName: section.name
                    });
                }
            }
        });
    });
    return seq;
};

// Computed Properties
const currentActivity = computed(() => activities.value[currentActivityIndex.value]);
const nextActivity = computed(() => activities.value[currentActivityIndex.value + 1]);

const currentActivityProgress = computed(() => {
    if (!currentActivity.value || currentActivity.value.duration === 0) return 0;
    return ((currentActivity.value.duration - timeRemaining.value) / currentActivity.value.duration) * 100;
});

// progressColor removed

// Timer Logic
const tick = () => {
    if (currentActivity.value?.duration > 0) {
        if (timeRemaining.value > 0) {
            timeRemaining.value--;
            totalTimeElapsed.value++;
            
            // Beeps
            if (timeRemaining.value <= 3 && timeRemaining.value > 0) beepShort.play().catch(() => {});
            if (timeRemaining.value === 0) beepLong.play().catch(() => {});

        } else {
            next();
        }
    } else {
        totalTimeElapsed.value++;
    }
};

const startTimer = () => {
    if (timerInterval.value) return;
    isRunning.value = true;
    timerInterval.value = window.setInterval(tick, 1000);
};

const pauseTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
    isRunning.value = false;
};

// resetTimer removed

const next = () => {
    if (currentActivityIndex.value < activities.value.length - 1) {
        currentActivityIndex.value++;
        loadActivity();
    } else {
        finish();
    }
};

const prev = () => {
    if (currentActivityIndex.value > 0) {
        currentActivityIndex.value--;
        loadActivity();
    }
};

const loadActivity = () => {
    const act = activities.value[currentActivityIndex.value];
    if (act.duration > 0) {
        timeRemaining.value = act.duration;
        // Auto-start only if it's Rest or previous was auto-completed? 
        // For safe UX, let's auto-start REST, but require user start for WORK (unless running).
        // Actually simplest is: if was running, keep running.
        if (isRunning.value) {
             // ensure interval is active
        } else {
             // pauseTimer();
             // Maybe auto-start rest periods?
             if (act.type === 'rest') startTimer();
        }
    } else {
        timeRemaining.value = 0; // Manual
        pauseTimer(); // Stop timer for manual rep counting
    }
};

const jumpToActivity = (index: number) => {
    currentActivityIndex.value = index;
    loadActivity();
    showActivityList.value = false;
};

const finish = () => {
    pauseTimer();
    isFinished.value = true;
    beepLong.play().catch(() => {});
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Lifecycle
onMounted(() => {
    if (!activePlan.value) {
        // Don't redirect, let the template handle the empty state
        // router.push('/trainings'); 
        return;
    }
    
    // Build Sequence
    activities.value = BuildWorkoutSequence(activePlan.value);
    loadActivity();
});

onUnmounted(() => {
    pauseTimer();
});
</script>

<template>
    <div class="h-full flex flex-column align-items-center justify-content-center text-center p-4 relative overflow-hidden" :class="currentActivity?.type === 'rest' ? 'bg-green-50' : ''">
        
        <!-- Sidebar Navigation -->
        <Drawer v-model:visible="showActivityList" header="Lista Ćwiczeń" position="right" class="w-full md:w-20rem">
            <div class="flex flex-column gap-2 mb-4">
                <div v-for="(act, index) in activities" :key="act.id" 
                     class="p-2 border-round cursor-pointer hover:surface-hover transition-colors flex align-items-center gap-2 text-left"
                     :class="{'bg-primary-50 border-left-3 border-primary': index === currentActivityIndex, 'opacity-50': index < currentActivityIndex}"
                     @click="jumpToActivity(index)">
                     
                     <div class="w-2rem text-center font-bold text-xs">{{ index + 1 }}</div>
                     <div class="flex-grow-1">
                         <div class="font-bold text-sm">{{ act.name }}</div>
                         <div class="text-xs text-color-secondary">{{ act.type === 'work' ? (act.duration > 0 ? `${act.duration}s` : 'Powt.') : 'Przerwa' }}</div>
                     </div>
                     <i v-if="index < currentActivityIndex" class="pi pi-check text-green-500"></i>
                </div>
            </div>
        </Drawer>

        <!-- Top Bar -->
        <div class="absolute top-0 left-0 w-full p-3 flex justify-content-between align-items-center z-3">
             <Button icon="pi pi-arrow-left" text rounded @click="router.push('/trainings')" />
             <Button icon="pi pi-list" text rounded @click="showActivityList = true" />
        </div>

        <div v-if="activePlan && !isFinished" class="w-full max-w-30rem flex flex-column gap-5 z-2">
            <!-- Header -->
            <div>
                 <div class="text-sm uppercase font-bold text-color-secondary mb-2">
                    {{ currentActivity?.sectionName }} 
                    <span v-if="currentActivity?.totalSets">• Seria {{ currentActivity.setIndex }} / {{ currentActivity.totalSets }}</span>
                 </div>
                 <h1 class="text-6xl font-bold m-0" :class="currentActivity?.type === 'work' ? 'text-orange-500' : 'text-green-500'">
                    {{ currentActivity?.name }}
                 </h1>
                 <div class="text-xl mt-2 text-color-secondary" v-if="nextActivity">
                    Następnie: {{ nextActivity.name }}
                 </div>
                 <div class="text-xl mt-2 text-green-600 font-bold" v-else>
                    Ostatnie ćwiczenie!
                 </div>
            </div>

            <!-- Timer / Reps Display -->
            <div class="py-6">
                <!-- TIME BASED -->
                <div v-if="currentActivity?.duration > 0" class="text-8xl font-mono font-bold">
                    {{ formatTime(timeRemaining) }}
                </div>
                <!-- REPS BASED -->
                <div v-else class="text-6xl font-bold flex flex-column align-items-center">
                    <span>{{ currentActivity?.originalExercise?.value }}</span>
                    <span class="text-3xl text-color-secondary uppercase">Powtórzeń</span>
                </div>
            </div>

            <!-- Progress Bar (for timed activities) -->
            <ProgressBar v-if="currentActivity?.duration > 0" :value="currentActivityProgress" :showValue="false" style="height: 1.5rem" 
                         :pt="{ value: { style: { backgroundColor: currentActivity?.type === 'work' ? 'var(--orange-500)' : 'var(--green-500)' } } }" />
            <div v-else class="h-1-5rem"></div>

            <!-- Controls -->
            <div class="flex justify-content-center gap-4 align-items-center relative">
                <Button icon="pi pi-step-backward" text rounded size="large" @click="prev" :disabled="currentActivityIndex === 0" />
                
                <!-- Play/Pause for Time -->
                <template v-if="currentActivity?.duration > 0">
                    <Button v-if="!isRunning" icon="pi pi-play" rounded raised size="large" class="w-5rem h-5rem p-0 text-3xl" @click="startTimer" />
                    <Button v-else icon="pi pi-pause" rounded raised severity="secondary" size="large" class="w-5rem h-5rem p-0 text-3xl" @click="pauseTimer" />
                </template>

                <!-- Check for Reps -->
                <template v-else>
                    <Button icon="pi pi-check" rounded raised severity="success" size="large" class="w-6rem h-6rem p-0 text-4xl shadow-4" @click="next" />
                </template>
                
                <Button icon="pi pi-step-forward" text rounded size="large" @click="next" />
            </div>

            <div class="flex justify-content-center gap-3">
                 <Button label="-10s" size="small" outlined severity="secondary" @click="timeRemaining = Math.max(0, timeRemaining - 10)" v-if="currentActivity?.duration > 0" />
                 <Button label="+10s" size="small" outlined severity="secondary" @click="timeRemaining += 10" v-if="currentActivity?.duration > 0" />
            </div>
        </div>

        <!-- Finished State -->
        <div v-if="isFinished" class="text-center">
             <i class="pi pi-trophy text-yellow-500" style="font-size: 5rem"></i>
             <h1 class="text-5xl font-bold mt-4">Trening Zakończony!</h1>
             <p class="text-xl">Całkowity czas: {{ formatTime(totalTimeElapsed) }}</p>
             <Button label="Wróć do planów" icon="pi pi-arrow-left" class="mt-4" @click="router.push('/trainings')" />
        </div>

        <!-- No Plan State (Safety) -->
        <Card v-if="!activePlan" class="text-center">
            <template #content>
                Nie wybrano planu.
                <Button label="Wróć" link @click="router.push('/trainings')" />
            </template>
        </Card>
    </div>
</template>
