import { ref } from 'vue';
import { api } from '../api';
import type { TrainingPlan as ApiTrainingPlan } from '../types';

// --- Types ---
export interface TrainingExercise {
    instanceId: string;
    exerciseId: string;
    name: string;
    sets: number;
    value: number; // reps or time
    isTime: boolean;
    rest: number; // seconds
}

export interface TrainingSection {
    id: string;
    name: string;
    exercises: TrainingExercise[];
}

// Local wrapper for UI (parsed sections)
export interface TrainingPlan {
    id: string;
    name: string;
    sections: TrainingSection[];
}

// Global State
const plans = ref<TrainingPlan[]>([]);
const isLoaded = ref(false);

const mapToFrontend = (p: ApiTrainingPlan): TrainingPlan => ({
    id: p.id,
    name: p.name,
    sections: p.sections ? JSON.parse(p.sections) : []
});

const mapToBackend = (p: TrainingPlan): ApiTrainingPlan => ({
    id: p.id,
    name: p.name,
    sections: JSON.stringify(p.sections)
});

const loadPlans = async () => {
    // if (isLoaded.value) return; // Removed to fix race condition with caller
    try {
        const data = await api.getPlans();
        plans.value = data.map(mapToFrontend);
        isLoaded.value = true;
    } catch (e) {
        console.error("Failed to load plans", e);
    }
};

export function useTrainingPlans() {
    if (!isLoaded.value) {
        isLoaded.value = true;
        loadPlans();
    }

    const createPlan = async () => {
        const defaultName = 'Nowy Plan';
        const defaultSections: TrainingSection[] = [
            { id: Math.random().toString(36).substr(2, 9), name: 'Sekcja 1', exercises: [] }
        ];

        try {
            const apiPlan = await api.createPlan(defaultName, JSON.stringify(defaultSections));
            const newPlan = mapToFrontend(apiPlan);
            plans.value.push(newPlan);
            return newPlan;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const deletePlan = async (id: string) => {
        await api.deletePlan(id);
        plans.value = plans.value.filter(p => p.id !== id);
    };

    const updatePlan = async (updatedPlan: TrainingPlan) => {
        // Optimistic update
        const index = plans.value.findIndex(p => p.id === updatedPlan.id);
        if (index !== -1) {
            plans.value[index] = updatedPlan;
        }

        // Sync to backend
        const apiPlan = mapToBackend(updatedPlan);
        await api.updatePlan(apiPlan);
    };

    const getPlanById = (id: string) => {
        return plans.value.find(p => p.id === id);
    };

    return {
        plans,
        createPlan,
        deletePlan,
        updatePlan,
        getPlanById,
        refreshPlans: loadPlans
    };
}
