import { ref } from 'vue';
import { api } from '../api';
import type { Exercise as ApiExercise } from '../types';

export interface Exercise {
    id: string;
    name: string;
    instructions: string;
    enrichment: string;
    tags: string[];
    videoUrl: string;
}

// Global state
const exercises = ref<Exercise[]>([]);
const isLoaded = ref(false);

const mapToFrontend = (e: ApiExercise): Exercise => ({
    id: e.id,
    name: e.name,
    instructions: e.instructions,
    enrichment: e.enrichment,
    tags: e.tags ? JSON.parse(e.tags) : [],
    videoUrl: e.videoUrl
});

const mapToBackend = (e: Omit<Exercise, 'id'>) => ({
    name: e.name,
    instructions: e.instructions,
    enrichment: e.enrichment,
    tags: JSON.stringify(e.tags),
    videoUrl: e.videoUrl || ''
});

const loadExercises = async () => {
    // if (isLoaded.value) return; // Removed to fix race condition
    try {
        const data = await api.getExercises();
        exercises.value = data.map(mapToFrontend);
        isLoaded.value = true;
    } catch (e) {
        console.error("Failed to load exercises", e);
    }
};

export function useExercises() {
    if (!isLoaded.value) {
        isLoaded.value = true; // Prevent double load
        loadExercises();
    }

    const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
        const apiExercise = mapToBackend(exercise);
        const newEx = await api.addExercise(apiExercise);
        const newUiEx = mapToFrontend(newEx);
        exercises.value.push(newUiEx);
        return newUiEx;
    };

    const updateExercise = async (exercise: Exercise) => {
        // We need to construct the full API object including ID
        const backendPayload = { ...mapToBackend(exercise), id: exercise.id };
        await api.updateExercise(backendPayload);
        const index = exercises.value.findIndex(e => e.id === exercise.id);
        if (index !== -1) {
            exercises.value[index] = exercise;
        }
    };

    const deleteExercise = async (id: string) => {
        await api.deleteExercise(id);
        exercises.value = exercises.value.filter(e => e.id !== id);
    };

    return {
        exercises, // Expose compatible exercises
        addExercise,
        updateExercise,
        deleteExercise,
        refreshExercises: loadExercises
    };
}
