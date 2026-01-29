import { ref } from 'vue';
import { api } from '../api';
import { VectorStore } from '../services/vectorStore';
import type { ChatSession } from '../types';

// Constants
const SERVER_URL = 'http://127.0.0.1:8080/v1/chat/completions';
const BASE_SYSTEM_PROMPT = `Jesteś profesjonalnym trenerem personalnym i dietetykiem.
Twoim celem jest pomaganie użytkownikowi w osiągnięciu celów sylwetkowych i zdrowotnych.
Analizuj dostarczony kontekst (np. pliki z bazy wiedzy) i odpowiadaj precyzyjnie.
Formatuj odpowiedzi używając Markdown. Bądź konkretny i pomocny.`;

// Types
export interface ThinkingStep {
    id: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    details?: string;
}

export interface UiChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at?: string;
    steps?: ThinkingStep[];
}

// Global State
const messages = ref<UiChatMessage[]>([]);
const sessions = ref<ChatSession[]>([]);
const currentSessionId = ref<string | null>(null);
const isLoading = ref(false);

export function useChatAI() {

    const initEngine = async () => {
        return Promise.resolve();
    };

    const loadSessions = async () => {
        try {
            const data = await api.getChatSessions();
            sessions.value = data;
        } catch (e) {
            console.error("Failed to load sessions", e);
        }
    };

    const loadSession = async (sessionId: string) => {
        try {
            const history = await api.getChatHistory(sessionId);
            currentSessionId.value = sessionId;

            const uiHistory: UiChatMessage[] = history.map(h => ({
                id: h.id,
                role: h.role,
                content: h.content,
                created_at: h.createdAt
            }));

            if (uiHistory.length === 0) {
                messages.value = [{ role: 'system', content: BASE_SYSTEM_PROMPT }];
            } else {
                messages.value = uiHistory;
                if (messages.value.length > 0 && messages.value[0].role !== 'system') {
                    messages.value.unshift({ role: 'system', content: BASE_SYSTEM_PROMPT });
                }
            }
        } catch (e) {
            console.error("Failed to load session history", e);
        }
    };

    const createNewChat = () => {
        currentSessionId.value = null;
        messages.value = [{ role: 'system', content: BASE_SYSTEM_PROMPT }];
    };

    const deleteSession = async (id: string) => {
        try {
            await api.deleteChatSession(id);
            if (currentSessionId.value === id) {
                createNewChat();
            }
            await loadSessions();
        } catch (e) {
            console.error("Failed to delete session", e);
        }
    };

    const updateSessionTitle = async (id: string, title: string) => {
        try {
            await api.updateChatTitle(id, title);
            await loadSessions();
        } catch (e) {
            console.error("Failed to update title", e);
        }
    };

    // Helper to manage Thinking Steps (On Reactive Objects)
    const addStep = (msg: UiChatMessage, title: string): ThinkingStep => {
        const step: ThinkingStep = {
            id: Math.random().toString(36).substring(7),
            title,
            status: 'running'
        };
        if (!msg.steps) msg.steps = [];
        msg.steps.push(step);
        // Return the reactive proxy from within the array
        return msg.steps[msg.steps.length - 1];
    };

    const updateStep = (msg: UiChatMessage, stepId: string, updates: Partial<ThinkingStep>) => {
        // msg must be the reactive object
        const step = msg.steps?.find(s => s.id === stepId);
        if (step) Object.assign(step, updates);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        // 1. Create session if needed
        if (!currentSessionId.value) {
            try {
                const title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
                const newSession = await api.createChatSession(title);
                currentSessionId.value = newSession.id;
                sessions.value.unshift(newSession);
            } catch (e) {
                console.error("Failed to create session", e);
                return;
            }
        }

        const sessionId = currentSessionId.value!;

        // 2. Add User Message (Push then retrieve reactive proxy to ensure reactivity)
        messages.value.push({ role: 'user', content: text });
        const userMsg = messages.value[messages.value.length - 1];

        // Save to DB
        api.saveChatMessage(sessionId, 'user', text).then(saved => {
            userMsg.id = saved.id;
            userMsg.created_at = saved.createdAt;
        }).catch(console.error);

        isLoading.value = true;

        // 3. Create Assistant Message Placeholder (Reactive)
        messages.value.push({ role: 'assistant', content: '', steps: [] });
        const replyMessage = messages.value[messages.value.length - 1]; // Important: Get the reactive proxy

        try {
            // --- RAG PROCESS ---
            let contextText = "";

            const searchStep = addStep(replyMessage, "Przeszukiwanie bazy wiedzy...");

            try {
                // Ensure text is passed correctly
                const results = await VectorStore.search(text, 3);

                if (results.length > 0) {
                    updateStep(replyMessage, searchStep.id, {
                        status: 'completed',
                        title: `Znaleziono ${results.length} dokumentów`,
                        details: results.map(r => `${r.document.path} (${(r.score * 100).toFixed(0)}%)`).join('\n')
                    });

                    contextText = results.map(r => r.document.content).join("\n\n---\n\n");
                } else {
                    updateStep(replyMessage, searchStep.id, {
                        status: 'completed',
                        title: "Brak pasujących dokumentów w bazie wiedzy",
                        details: "Odpowiadam na podstawie wiedzy ogólnej."
                    });
                }
            } catch (e) {
                console.warn("Vector search failed", e);
                updateStep(replyMessage, searchStep.id, {
                    status: 'error',
                    title: "Błąd przeszukiwania bazy",
                    details: String(e)
                });
            }

            // --- LLM GENERATION ---
            const genStep = addStep(replyMessage, "Generowanie odpowiedzi...");

            // Prepare messages payload (Clone to avoid mutating UI state with context)
            const messagesPayload = messages.value
                .filter(m => m !== replyMessage) // Exclude current empty
                .map(m => ({ role: m.role, content: m.content }));

            // Inject Context
            if (contextText) {
                // Find system prompt
                const systemMsgIndex = messagesPayload.findIndex(m => m.role === 'system');
                if (systemMsgIndex !== -1) {
                    messagesPayload[systemMsgIndex] = {
                        ...messagesPayload[systemMsgIndex],
                        content: messagesPayload[systemMsgIndex].content + `\n\n### KONTEKST BAZY WIEDZY:\n${contextText}`
                    };
                } else {
                    messagesPayload.unshift({
                        role: 'system',
                        content: `${BASE_SYSTEM_PROMPT}\n\n### KONTEKST BAZY WIEDZY:\n${contextText}`
                    });
                }
            }

            const response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesPayload,
                    stream: true,
                    temperature: 0.7,
                })
            });

            if (!response.ok) throw new Error("Server error: " + response.statusText);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder("utf-8");

            updateStep(replyMessage, genStep.id, { status: 'running', title: "Pisanie..." });

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices[0]?.delta?.content || "";
                            replyMessage.content += delta; // Reactive update
                        } catch (e) {
                            // ignore
                        }
                    }
                }
            }

            updateStep(replyMessage, genStep.id, { status: 'completed', title: "Wygenerowano odpowiedź" });

            // Save to DB
            api.saveChatMessage(sessionId, 'assistant', replyMessage.content).then(saved => {
                replyMessage.id = saved.id;
                replyMessage.created_at = saved.createdAt;
            });

        } catch (error) {
            console.error("Chat error:", error);
            replyMessage.content += "\n\n[Błąd komunikacji z modelem AI]";
            if (replyMessage.steps) {
                const lastStep = replyMessage.steps[replyMessage.steps.length - 1];
                if (lastStep) lastStep.status = 'error';
            }
        } finally {
            isLoading.value = false;
        }
    };

    return {
        messages,
        sessions,
        currentSessionId,
        isLoading,
        initEngine,
        loadSessions,
        loadSession,
        createNewChat,
        deleteSession,
        updateSessionTitle,
        sendMessage,
    };
}
