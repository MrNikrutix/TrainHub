import { ref, computed, watch } from 'vue';
import { api } from '../api';
import type { Workout as ApiWorkout } from '../types';

// Types
export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Workout {
    id: string;
    weekId: string;
    programId: string;
    day: WeekDay;
    type: 'exercise' | 'plan';
    refId?: string;
    name: string;
    description: string;
    completed: boolean;
    // UI Helpers
    exerciseId?: string;
    planId?: string;
}

export interface Week {
    id: string;
    position: number;
    notes: string;
}

export interface Program {
    id: string;
    name: string;
    weeks: Week[];
    workouts: Workout[];
    createdAt: Date;
}

// Global State (Singleton)
const programs = ref<Program[]>([]);
const activeProgramId = ref<string | null>(null);
const isLoaded = ref(false);

const loadPrograms = async () => {
    if (isLoaded.value) return;
    try {
        const apiPrograms = await api.getPrograms();
        programs.value = apiPrograms.map(p => ({
            id: p.id,
            name: p.name,
            createdAt: new Date(p.createdAt),
            weeks: [],
            workouts: []
        }));

        // Pick first as default if none selected
        if (!activeProgramId.value && programs.value.length > 0) {
            activeProgramId.value = programs.value[0].id;
        }

        isLoaded.value = true;
    } catch (e) {
        console.error("Failed to load programs", e);
    }
};

const loadProgramDetails = async (programId: string) => {
    const program = programs.value.find(p => p.id === programId);
    if (!program) return;

    try {
        const wk = await api.getWeeks(programId);
        const wo = await api.getWorkouts(programId);

        program.weeks = wk.map(w => ({
            id: w.id,
            position: w.position,
            notes: w.notes
        }));

        program.workouts = wo.map(w => ({
            id: w.id,
            weekId: w.weekId,
            programId: w.programId,
            day: w.day as WeekDay,
            type: w.type as 'exercise' | 'plan',
            refId: w.refId,
            name: w.name,
            description: w.description,
            completed: w.completed,
            exerciseId: w.type === 'exercise' ? w.refId : undefined,
            planId: w.type === 'plan' ? w.refId : undefined
        }));
    } catch (e) {
        console.error("Failed to details for program " + programId, e);
    }
};

export function useTrainingPrograms() {

    if (!isLoaded.value) {
        isLoaded.value = true;
        loadPrograms().then(() => {
            if (activeProgramId.value) loadProgramDetails(activeProgramId.value);
        });
    }

    watch(activeProgramId, (newId) => {
        if (newId) loadProgramDetails(newId);
    });

    const activeProgram = computed(() => programs.value.find(p => p.id === activeProgramId.value) || null);

    const createProgram = async (name: string) => {
        try {
            const apiProg = await api.createProgram(name);
            const newProgram: Program = {
                id: apiProg.id,
                name: apiProg.name,
                createdAt: new Date(apiProg.createdAt),
                weeks: [],
                workouts: []
            };
            programs.value.push(newProgram);
            activeProgramId.value = newProgram.id;
        } catch (e) {
            console.error(e);
        }
    };

    const deleteProgram = async (id: string) => {
        try {
            await api.deleteProgram(id);
            programs.value = programs.value.filter(p => p.id !== id);
            if (activeProgramId.value === id) {
                activeProgramId.value = programs.value[0]?.id || null;
            }
        } catch (e) {
            console.error(e);
        }
    };

    const duplicateProgram = async (id: string) => {
        try {
            const apiProg = await api.duplicateProgram(id);
            const newProgram: Program = {
                id: apiProg.id,
                name: apiProg.name,
                createdAt: new Date(apiProg.createdAt),
                weeks: [],
                workouts: []
            };
            programs.value.push(newProgram);
            activeProgramId.value = newProgram.id;
            await loadProgramDetails(newProgram.id);
        } catch (e) {
            console.error("Failed to duplicate program", e);
        }
    }

    const addWeek = async (programId: string) => {
        const prog = programs.value.find(p => p.id === programId);
        if (!prog) return;
        const position = prog.weeks.length + 1;

        const w = await api.addWeek(programId, position);
        prog.weeks.push({ id: w.id, position: w.position, notes: w.notes });
    };

    const deleteWeek = async (weekId: string) => {
        await api.deleteWeek(weekId);
        if (activeProgram.value) {
            activeProgram.value.weeks = activeProgram.value.weeks.filter(w => w.id !== weekId);
            activeProgram.value.workouts = activeProgram.value.workouts.filter(wo => wo.weekId !== weekId);
        }
    };

    const addWorkout = async (data: Omit<Workout, 'id' | 'completed'>) => {
        // Construct API object (camelCase, matched with `types`)
        // The API wrapper handles conversion if needed, but our `types` are aligned.
        const apiData: Omit<ApiWorkout, 'id' | 'completed'> = {
            weekId: data.weekId,
            programId: data.programId,
            day: data.day,
            type: data.type,
            refId: data.type === 'exercise' ? data.exerciseId : data.planId,
            name: data.name,
            description: data.description
        };

        const w = await api.addWorkout(apiData);

        const mapped: Workout = {
            id: w.id,
            weekId: w.weekId,
            programId: w.programId,
            day: w.day as WeekDay,
            type: w.type as 'exercise' | 'plan',
            refId: w.refId,
            name: w.name,
            description: w.description,
            completed: w.completed,
            exerciseId: w.type === 'exercise' ? w.refId : undefined,
            planId: w.type === 'plan' ? w.refId : undefined
        };
        if (activeProgram.value) {
            activeProgram.value.workouts.push(mapped);
        }
        return mapped;
    };

    const updateWorkout = async (workout: Workout) => {
        const apiData: ApiWorkout = {
            id: workout.id,
            weekId: workout.weekId,
            programId: workout.programId,
            day: workout.day,
            type: workout.type,
            refId: workout.type === 'exercise' ? workout.exerciseId : workout.planId,
            name: workout.name,
            description: workout.description,
            completed: workout.completed
        };

        await api.updateWorkout(apiData);

        if (activeProgram.value) {
            const index = activeProgram.value.workouts.findIndex(w => w.id === workout.id);
            if (index !== -1) {
                activeProgram.value.workouts[index] = workout;
            }
        }
    };

    const deleteWorkout = async (id: string) => {
        await api.deleteWorkout(id);
        if (activeProgram.value) {
            activeProgram.value.workouts = activeProgram.value.workouts.filter(w => w.id !== id);
        }
    };

    const updateWeekNote = async (weekId: string, notes: string) => {
        await api.updateWeekNote(weekId, notes);
        if (activeProgram.value) {
            const w = activeProgram.value.weeks.find(x => x.id === weekId);
            if (w) w.notes = notes;
        }
    }

    return {
        programs,
        activeProgramId,
        activeProgram,
        createProgram,
        deleteProgram,
        duplicateProgram,
        refreshPrograms: loadPrograms,
        addWeek,
        deleteWeek,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        updateWeekNote,
        reloadActiveProgram: () => activeProgramId.value && loadProgramDetails(activeProgramId.value)
    };
}
