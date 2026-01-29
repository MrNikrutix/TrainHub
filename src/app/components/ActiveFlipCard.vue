<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from 'primevue/button';

import type { Flashcard } from '../types';

const props = defineProps<{
    card: Flashcard;
}>();

const emit = defineEmits(['answer']);

const isFlipped = ref(false);

// Reset flip state when card changes
watch(() => props.card, () => {
    isFlipped.value = false;
});

const submitAnswer = (isCorrect: boolean) => {
    emit('answer', isCorrect);
};
</script>

<template>
    <div class="flex flex-column align-items-center gap-4">
        <!-- Card -->
        <div class="flashcard-container" @click="isFlipped = !isFlipped">
            <div class="flashcard-inner" :class="{ 'is-flipped': isFlipped }">
                <div class="flashcard-front">
                    <div class="content">{{ card.front }}</div>
                    <span class="text-sm text-500 absolute bottom-0 mb-3">Kliknij by odwrócić</span>
                </div>
                <div class="flashcard-back">
                    <div class="content">{{ card.back }}</div>
                </div>
            </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-4 h-3rem">
            <template v-if="isFlipped">
                <Button label="Nie wiem" severity="danger" icon="pi pi-times" @click.stop="submitAnswer(false)" />
                <Button label="Wiem" severity="success" icon="pi pi-check" @click.stop="submitAnswer(true)" />
            </template>
        </div>
    </div>
</template>

<style scoped>
.flashcard-container {
    perspective: 1000px;
    width: 20rem;
    height: 14rem;
    cursor: pointer;
}

.flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.flashcard-inner.is-flipped {
    transform: rotateY(180deg);
}

.flashcard-front, .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    padding: 2rem;
    background-color: var(--surface-card);
    border: 1px solid var(--surface-border);
}

.flashcard-back {
    background-color: var(--primary-color);
    color: #fff;
    transform: rotateY(180deg);
}

.content {
    font-size: 1.5rem;
    font-weight: 600;
}
</style>
