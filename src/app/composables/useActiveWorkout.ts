import { ref } from 'vue';

// Duplicate types for now (ideally share from TrainingsView or a types file)
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

export interface TrainingPlan {
    id: string;
    name: string;
    sections: TrainingSection[];
}

const activePlan = ref<TrainingPlan | null>(null);

export function useActiveWorkout() {
    const startWorkout = (plan: TrainingPlan) => {
        activePlan.value = JSON.parse(JSON.stringify(plan));
    };

    const clearWorkout = () => {
        activePlan.value = null;
    };

    return {
        activePlan,
        startWorkout,
        clearWorkout
    };
}
