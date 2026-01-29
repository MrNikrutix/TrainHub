import { ref } from 'vue';
import { api } from '../api';
import type { AnalysisSession, Annotation } from '../types';

// Global State
const sessions = ref<AnalysisSession[]>([]);
const isLoaded = ref(false);

const loadSessions = async () => {
    try {
        sessions.value = await api.getAnalysisSessions();
        isLoaded.value = true;
    } catch (e) {
        console.error("Failed to load analysis sessions", e);
    }
};

export function useAnalysis() {
    // Initial fetch
    if (!isLoaded.value) {
        // Don't mark true immediately to avoid race condition if logic changes, 
        // but currently safe as we await in separate flow or just trigger.
        loadSessions();
        // Note: We don't block component mounting on this.
    }

    const refreshSessions = async () => {
        await loadSessions();
    };

    const getAnnotations = async (sessionId: string): Promise<Annotation[]> => {
        return await api.getAnnotations(sessionId);
    };

    const deleteSession = async (id: string) => {
        await api.deleteAnalysisSession(id);
        sessions.value = sessions.value.filter(s => s.id !== id);
    };

    const createSession = async (name: string, videoPath: string | null) => {
        const newSession = await api.createAnalysisSession(name, videoPath);
        sessions.value.unshift(newSession);
        return newSession;
    }

    return {
        sessions,
        refreshSessions,
        getAnnotations,
        deleteSession,
        createSession
    };
}
