import { invoke } from '@tauri-apps/api/core';
import type {
    Exercise,
    TrainingPlan,
    Program,
    Week,
    Workout,
    AnalysisSession,
    Annotation,
    FlashcardSet,
    Flashcard,
    ChatSession,
    ChatMessage
} from '../types';

export const api = {
    // Exercises
    getExercises: async (): Promise<Exercise[]> => {
        return await invoke('get_exercises');
    },
    addExercise: async (exercise: Omit<Exercise, 'id'>): Promise<Exercise> => {
        return await invoke('add_exercise', {
            name: exercise.name,
            instructions: exercise.instructions,
            enrichment: exercise.enrichment,
            tags: exercise.tags,
            videoUrl: exercise.videoUrl
        });
    },
    updateExercise: async (exercise: Exercise): Promise<void> => {
        await invoke('update_exercise', { exercise });
    },
    deleteExercise: async (id: string): Promise<void> => {
        await invoke('delete_exercise', { id });
    },

    // Plans
    getPlans: async (): Promise<TrainingPlan[]> => {
        return await invoke('get_plans');
    },
    createPlan: async (name: string, sections: string): Promise<TrainingPlan> => {
        return await invoke('create_plan', { name, sections });
    },
    updatePlan: async (plan: TrainingPlan): Promise<void> => {
        await invoke('update_plan', { plan });
    },
    deletePlan: async (id: string): Promise<void> => {
        await invoke('delete_plan', { id });
    },

    // Programs
    getPrograms: async (): Promise<Program[]> => {
        return await invoke('get_programs');
    },
    createProgram: async (name: string): Promise<Program> => {
        return await invoke('create_program', { name });
    },
    deleteProgram: async (id: string): Promise<void> => {
        await invoke('delete_program', { id });
    },
    duplicateProgram: async (id: string): Promise<Program> => {
        return await invoke('duplicate_program', { id });
    },

    // Weeks
    getWeeks: async (programId: string): Promise<Week[]> => {
        return await invoke('get_weeks', { programId });
    },
    addWeek: async (programId: string, position: number): Promise<Week> => {
        return await invoke('add_week', { programId, position });
    },
    updateWeekNote: async (id: string, notes: string): Promise<void> => {
        await invoke('update_week_note', { id, notes });
    },
    deleteWeek: async (id: string): Promise<void> => {
        await invoke('delete_week', { id });
    },

    // Workouts
    getWorkouts: async (programId: string): Promise<Workout[]> => {
        return await invoke('get_workouts', { programId });
    },
    addWorkout: async (workout: Omit<Workout, 'id' | 'completed'>): Promise<Workout> => {
        return await invoke('add_workout', {
            weekId: workout.weekId,
            programId: workout.programId,
            day: workout.day,
            type_: workout.type, // Map 'type' to 'type_' arg for rust function
            refId: workout.refId,
            name: workout.name,
            description: workout.description
        });
    },
    updateWorkout: async (workout: Workout): Promise<void> => {
        // Rust struct maps "type" -> "type_" automatically via serde, so passing json with "type" is fine.
        // But wait, the update expects a Workout struct. Our TS Workout has 'type'.
        // Backend Workout struct has field `type_` with `#[serde(rename="type")]`.
        // So sending JSON `{ type: "..." }` will work.
        await invoke('update_workout', { workout });
    },
    deleteWorkout: async (id: string): Promise<void> => {
        await invoke('delete_workout', { id });
    },

    // Analysis
    getAnalysisSessions: async (): Promise<AnalysisSession[]> => {
        return await invoke('get_analysis_sessions');
    },
    createAnalysisSession: async (name: string, videoPath: string | null): Promise<AnalysisSession> => {
        return await invoke('create_analysis_session', { name, videoPath });
    },
    deleteAnalysisSession: async (id: string): Promise<void> => {
        await invoke('delete_analysis_session', { id });
    },
    getAnnotations: async (sessionId: string): Promise<Annotation[]> => {
        return await invoke('get_annotations', { sessionId });
    },
    addAnnotation: async (annotation: Omit<Annotation, 'id'>): Promise<Annotation> => {
        return await invoke('add_annotation', {
            sessionId: annotation.sessionId,
            startTime: annotation.startTime,
            endTime: annotation.endTime,
            name: annotation.name,
            description: annotation.description,
            color: annotation.color
        });
    },
    updateAnnotation: async (annotation: Annotation): Promise<void> => {
        await invoke('update_annotation', { annotation });
    },
    deleteAnnotation: async (id: string): Promise<void> => {
        await invoke('delete_annotation', { id });
    },
    pickVideoFile: async (): Promise<string | null> => {
        return await invoke('pick_video_file');
    },

    // Flashcards
    getFlashcardSets: async (): Promise<FlashcardSet[]> => {
        return await invoke('get_flashcard_sets');
    },
    createFlashcardSet: async (name: string): Promise<FlashcardSet> => {
        return await invoke('create_flashcard_set', { name });
    },
    updateFlashcardSet: async (id: string, name: string): Promise<void> => {
        return await invoke('update_flashcard_set', { id, name });
    },
    deleteFlashcardSet: async (id: string): Promise<void> => {
        return await invoke('delete_flashcard_set', { id });
    },
    getFlashcards: async (setId: string): Promise<Flashcard[]> => {
        return await invoke('get_flashcards', { setId });
    },
    createFlashcard: async (setId: string, front: string, back: string): Promise<Flashcard> => {
        return await invoke('create_flashcard', { setId, front, back });
    },
    updateFlashcard: async (id: string, front: string, back: string): Promise<void> => {
        return await invoke('update_flashcard', { id, front, back });
    },
    deleteFlashcard: async (id: string): Promise<void> => {
        return await invoke('delete_flashcard', { id });
    },

    // Chat
    createChatSession: async (title?: string): Promise<ChatSession> => {
        return await invoke('create_chat_session', { title });
    },
    getChatSessions: async (): Promise<ChatSession[]> => {
        return await invoke('get_chat_sessions');
    },
    updateChatTitle: async (id: string, title: string): Promise<void> => {
        return await invoke('update_chat_title', { id, title });
    },
    deleteChatSession: async (id: string): Promise<void> => {
        return await invoke('delete_chat_session', { id });
    },
    saveChatMessage: async (sessionId: string, role: string, content: string): Promise<ChatMessage> => {
        return await invoke('save_chat_message', { sessionId, role, content });
    },
    getChatHistory: async (sessionId: string): Promise<ChatMessage[]> => {
        return await invoke('get_chat_history', { sessionId });
    }
};
