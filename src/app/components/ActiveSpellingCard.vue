<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import Button from 'primevue/button';

import type { Flashcard } from '../types';

const props = defineProps<{
    card: Flashcard;
}>();

const emit = defineEmits(['answer']);

// State using 2D array: words -> chars
const charInputs = ref<string[][]>([]);
const charInputRefs = ref<HTMLInputElement[]>([]);
const isChecked = ref(false);
const isCorrect = ref(false);

// Split answer into words and chars
const expectedWords = computed(() => {
    return props.card.back.trim().split(/\s+/).filter(w => w.length > 0);
});

// Flattened expected string for easy comparison
const expectedString = computed(() => expectedWords.value.join('').toLowerCase());

const init = () => {
    // Initialize 2D array for inputs based on expected words length
    charInputs.value = expectedWords.value.map(word => new Array(word.length).fill(''));
    
    isChecked.value = false;
    isCorrect.value = false;
    charInputRefs.value = []; // Reset refs
    
    nextTick(() => {
        // Focus first input
        if (charInputRefs.value[0]) {
            charInputRefs.value[0].focus();
        }
    });
};

watch(() => props.card, init, { immediate: true });

// Handle character input
const handleInput = (wordIdx: number, charIdx: number, event: Event) => {
    const target = event.target as HTMLInputElement;
    const val = target.value;

    // Use only the last character entered (if multiple pasted, or overwrite)
    if (val.length > 1) {
        charInputs.value[wordIdx][charIdx] = val.slice(-1);
    }

    // Auto-advance
    if (val) {
        focusNext(wordIdx, charIdx);
    }
};

const handleKeydown = (wordIdx: number, charIdx: number, event: KeyboardEvent) => {
    if (event.key === 'Backspace') {
        if (!charInputs.value[wordIdx][charIdx]) {
            // Check if we need to prevent default (browser back)
             event.preventDefault();
             focusPrev(wordIdx, charIdx);
        }
    } else if (event.key === 'ArrowLeft') {
         event.preventDefault();
        focusPrev(wordIdx, charIdx);
    } else if (event.key === 'ArrowRight') {
         event.preventDefault();
        focusNext(wordIdx, charIdx); // Don't skip filled
    } else if (event.key === 'Enter') {
        checkAnswer();
    }
};

const focusNext = (wordIdx: number, charIdx: number) => {
    // Calculate flat index
    let flatIdx = 0;
    for (let i = 0; i < wordIdx; i++) flatIdx += expectedWords.value[i].length;
    flatIdx += charIdx;

    const nextIdx = flatIdx + 1;
    if (nextIdx < charInputRefs.value.length) {
        charInputRefs.value[nextIdx].focus();
    }
};

const focusPrev = (wordIdx: number, charIdx: number) => {
    // Calculate flat index
    let flatIdx = 0;
    for (let i = 0; i < wordIdx; i++) flatIdx += expectedWords.value[i].length;
    flatIdx += charIdx;

    const prevIdx = flatIdx - 1;
    if (prevIdx >= 0) {
        charInputRefs.value[prevIdx].focus();
    }
};

const checkAnswer = () => {
    if (isChecked.value) {
        nextCard();
        return;
    }

    // Construct user answer
    const userString = charInputs.value.flat().join('').toLowerCase();
    
    isCorrect.value = userString === expectedString.value;
    isChecked.value = true;
};

const nextCard = () => {
    emit('answer', isCorrect.value);
};

// Helper to get flat index for ref
const setRef = (el: any, index: number) => {
    if (el) {
        charInputRefs.value[index] = el as HTMLInputElement;
    }
}

// Flat index calculator for template
const getFlatIndex = (wordIdx: number, charIdx: number) => {
    let count = 0;
    for(let i=0; i<wordIdx; i++) count += expectedWords.value[i].length;
    return count + charIdx;
};

</script>

<template>
    <div class="flex flex-column align-items-center gap-5 w-full max-w-40rem p-2">
        <!-- Question Card -->
        <div class="surface-card border-1 surface-border border-round-xl p-5 w-full text-center shadow-1">
            <span class="text-sm text-500 uppercase font-bold tracking-wide">Przetłumacz</span>
            <div class="text-3xl font-bold mt-3 text-900">{{ card.front }}</div>
        </div>

        <!-- Word Containers -->
        <div class="flex flex-wrap gap-4 justify-content-center w-full">
            <div 
                v-for="(word, wordIdx) in expectedWords" 
                :key="wordIdx" 
                class="flex gap-2"
            >
                <!-- Character Inputs -->
                <div 
                    v-for="(char, charIdx) in word" 
                    :key="charIdx"
                    class="relative"
                >
                    <input
                        :ref="(el) => setRef(el, getFlatIndex(wordIdx, charIdx))"
                        v-model="charInputs[wordIdx][charIdx]"
                        type="text"
                        class="char-input"
                        :class="{
                            'is-correct': isChecked && charInputs[wordIdx][charIdx]?.toLowerCase() === char.toLowerCase(),
                            'is-error': isChecked && charInputs[wordIdx][charIdx]?.toLowerCase() !== char.toLowerCase()
                        }"
                        maxlength="1"
                        :disabled="isChecked"
                        @input="(e) => handleInput(wordIdx, charIdx, e)"
                        @keydown="(e) => handleKeydown(wordIdx, charIdx, e)"
                    />
                    <!-- Underscore Placeholder (visual only, if input empty) -->
                    <div v-if="!charInputs[wordIdx][charIdx]" class="placeholder-line"></div>
                </div>
            </div>
        </div>

        <!-- Feedback & Correct Answer -->
        <div v-if="isChecked && !isCorrect" class="w-full text-center animate-fadein surface-ground p-3 border-round">
            <div class="text-sm text-500 mb-1">Poprawna odpowiedź:</div>
            <div class="text-xl font-bold text-green-600 tracking-wide">{{ card.back }}</div>
        </div>

        <!-- Action Button -->
        <Button 
            v-if="!isChecked" 
            label="Sprawdź" 
            size="large"
            class="w-full mt-2" 
            @click="checkAnswer" 
        />
        <Button 
            v-else 
            :label="isCorrect ? 'Dalej' : 'Rozumiem, dalej'" 
            :severity="isCorrect ? 'success' : 'secondary'"
            class="w-full mt-2"
            size="large"
            icon="pi pi-arrow-right" 
            iconPos="right"
            @click="nextCard"
            ref="nextButton" 
            autofocus
        />
    </div>
</template>

<style scoped>
.char-input {
    width: 2.5rem;
    height: 3rem;
    font-size: 1.5rem;
    font-weight: 700;
    text-align: center;
    border: none;
    background: transparent;
    color: var(--text-color);
    outline: none;
    z-index: 1;
    position: relative;
    border-bottom: 2px solid var(--surface-400);
    transition: all 0.2s;
    border-radius: 4px 4px 0 0;
}

.char-input:focus {
    border-bottom-color: var(--primary-color);
    background-color: var(--primary-50);
}

.char-input.is-correct {
    border-bottom-color: var(--green-500);
    color: var(--green-600);
}

.char-input.is-error {
    border-bottom-color: var(--red-500);
    color: var(--red-600);
}

/* Fallback placeholder line if needed explicitly? 
   Currently strictly using border-bottom on input itself is cleaner 
   and matches 'underscore' look.
*/

.animate-fadein {
    animation: fadein 0.3s ease-out;
}
@keyframes fadein {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
