export interface Exercise {
    id: string;
    name: string;
    instructions: string;
    enrichment: string;
    tags: string; // JSON string
    videoUrl: string; // camelCase
}

export interface TrainingPlan {
    id: string;
    name: string;
    sections: string; // JSON string
}

export interface Program {
    id: string;
    name: string;
    createdAt: string; // camelCase
}

export interface Week {
    id: string;
    programId: string; // camelCase
    position: number;
    notes: string;
}

export interface Workout {
    id: string;
    weekId: string; // camelCase
    programId: string; // camelCase
    day: string;
    type: 'exercise' | 'plan';
    refId?: string; // camelCase
    name: string;
    description: string;
    completed: boolean;
    // Helper accessors not in DB:
    exerciseId?: string;
    planId?: string;
}

export interface AnalysisSession {
    id: string;
    name: string;
    date: string;
    videoPath: string | null; // camelCase
}

export interface Annotation {
    id: string;
    sessionId: string; // camelCase
    startTime: number; // camelCase
    endTime: number; // camelCase
    name: string;
    description: string;
    color: string;
}

export interface FlashcardSet {
    id: string;
    name: string;
    createdAt: string; // camelCase
}

export interface Flashcard {
    id: string;
    setId: string; // camelCase
    front: string;
    back: string;
    createdAt: string; // camelCase
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string; // camelCase
    updatedAt: string; // camelCase
}

export interface ChatMessage {
    id: string;
    sessionId: string; // camelCase
    role: 'user' | 'assistant';
    content: string;
    createdAt: string; // camelCase
}
