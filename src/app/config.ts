
// Centralized configuration for TrainHubApp
// Follows the pattern from OpenWork to keep magic strings out of logic

export const CONFIG = {
    MODELS: {
        DIR: 'models',
        CHAT: {
            URL: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
            FILENAME: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
            CONTEXT_SIZE: 4096,
            GPU_LAYERS: 100
        },
        EMBEDDING: {
            URL: 'https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf',
            FILENAME: 'nomic-embed-text-v1.5.Q4_K_M.gguf',
            CONTEXT_SIZE: 2048,
            GPU_LAYERS: 100
        }
    },
    AI_SERVER: {
        HOST: '127.0.0.1',
        PORT: '8080',
        EMBEDDING_PORT: '8081',
        HEALTH_ENDPOINT: '/health'
    }
} as const;
