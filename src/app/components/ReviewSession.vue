<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import ActiveFlipCard from './ActiveFlipCard.vue';
import ActiveSpellingCard from './ActiveSpellingCard.vue';
import type { Flashcard } from '../types';

const props = defineProps<{
    cards: Flashcard[];
    mode: 'flip' | 'spelling';
}>();

const emit = defineEmits(['exit']);

// State
const queue = ref<Flashcard[]>([...props.cards].sort(() => Math.random() - 0.5)); // Shuffle on init
const currentIndex = ref(0);
const streak = ref(0);
const maxStreak = ref(0);
const correctCount = ref(0);
const incorrectCount = ref(0);
const isFinished = ref(false);

const currentCard = computed(() => queue.value[currentIndex.value]);
const progress = computed(() => (currentIndex.value / queue.value.length) * 100);

const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
        streak.value++;
        if (streak.value > maxStreak.value) maxStreak.value = streak.value;
        correctCount.value++;
    } else {
        streak.value = 0;
        incorrectCount.value++;
    }

    if (currentIndex.value < queue.value.length - 1) {
        currentIndex.value++;
    } else {
        isFinished.value = true;
    }
};

const restart = () => {
    queue.value = [...props.cards].sort(() => Math.random() - 0.5);
    currentIndex.value = 0;
    streak.value = 0;
    correctCount.value = 0;
    incorrectCount.value = 0;
    isFinished.value = false;
};
</script>

<template>
    <div class="flex flex-column h-full w-full align-items-center justify-content-center p-4">
        <!-- Progress Header -->
        <div class="w-full max-w-30rem mb-4 flex flex-column gap-2" v-if="!isFinished">
            <div class="flex justify-content-between text-sm text-500">
                <span>Postęp: {{ currentIndex + 1 }} / {{ queue.length }}</span>
                <span v-if="streak > 1" class="text-orange-500 font-bold flex align-items-center gap-1">
                    <i class="pi pi-fire"></i> {{ streak }}
                </span>
            </div>
            <ProgressBar :value="progress" :showValue="false" class="h-1rem" />
        </div>

        <!-- Active Card Area -->
        <div v-if="!isFinished" class="flex-grow-1 flex flex-column align-items-center justify-content-center w-full">
            <ActiveFlipCard 
                v-if="mode === 'flip'" 
                :card="currentCard" 
                @answer="handleAnswer" 
            />
            <ActiveSpellingCard 
                v-else 
                :card="currentCard" 
                @answer="handleAnswer" 
            />
        </div>

        <!-- End Screen -->
        <div v-else class="flex flex-column align-items-center gap-4 animate-fadein">
            <i class="pi pi-check-circle text-green-500 text-6xl"></i>
            <h2 class="text-3xl m-0">Koniec Sesji!</h2>
            
            <div class="grid w-full max-w-30rem text-center">
                <div class="col-4">
                    <div class="text-2xl font-bold text-green-500">{{ Math.round((correctCount / queue.length) * 100) }}%</div>
                    <div class="text-sm text-500">Poprawność</div>
                </div>
                <div class="col-4">
                    <div class="text-2xl font-bold text-orange-500">{{ maxStreak }}</div>
                    <div class="text-sm text-500">Max Seria</div>
                </div>
                 <div class="col-4">
                    <div class="text-2xl font-bold text-blue-500">{{ queue.length }}</div>
                    <div class="text-sm text-500">Kart</div>
                </div>
            </div>

            <div class="flex gap-3 mt-4">
                <Button label="Wróć" severity="secondary" icon="pi pi-arrow-left" @click="$emit('exit')" />
                <Button label="Powtórz" icon="pi pi-refresh" @click="restart" />
            </div>
        </div>

        <!-- Exit Button (always visible if not finished) -->
         <Button 
            v-if="!isFinished" 
            icon="pi pi-times" 
            text 
            rounded 
            class="absolute top-0 right-0 m-4" 
            @click="$emit('exit')" 
        />
    </div>
</template>

<style scoped>
.animate-fadein {
    animation: fadein 0.5s;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
