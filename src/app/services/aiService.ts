import { Command } from '@tauri-apps/plugin-shell';
import { fetch } from '@tauri-apps/plugin-http';
import { checkModelsExist, getModelPath, getEmbeddingModelPath } from './modelManager';
import { CONFIG } from '../config';



interface ServerProcess {
    process: any;
    port: string;
}

let chatServer: ServerProcess | null = null;
let embeddingServer: ServerProcess | null = null;

// Helper: Wait for server to be ready
// Helper: Wait for server to be ready
const waitForServer = async (port: string, retries = 60, delay = 1000): Promise<void> => {
    for (let i = 0; i < retries; i++) {
        try {
            // Check health
            const response = await fetch(`http://${CONFIG.AI_SERVER.HOST}:${port}${CONFIG.AI_SERVER.HEALTH_ENDPOINT}`);
            if (response.ok) {
                console.log(`[AIService:${port}] Server is ready!`);
                return;
            } else {
                console.warn(`[AIService:${port}] Server returned status: ${response.status}`);
            }
        } catch (e) {
            // Server not listening yet, ignore and wait
            console.debug(`[AIService:${port}] Connection failed (attempt ${i + 1}):`, e);
        }
        console.log(`[AIService:${port}] Waiting for AI server... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`AI Server on port ${port} failed to start in time.`);
};

// Internal start helper
const startSidecar = async (type: 'chat' | 'embedding'): Promise<ServerProcess> => {
    const isChat = type === 'chat';
    const port = isChat ? CONFIG.AI_SERVER.PORT : CONFIG.AI_SERVER.EMBEDDING_PORT!;
    const existing = isChat ? chatServer : embeddingServer;

    if (existing) {
        console.log(`[AIService] ${type} server already running on port ${port}.`);
        return existing;
    }

    const modelsExist = await checkModelsExist();
    if (!modelsExist) {
        throw new Error("Models not found. Please download them first.");
    }

    const modelPath = isChat ? await getModelPath() : await getEmbeddingModelPath();
    const args = [
        '--host', CONFIG.AI_SERVER.HOST,
        '--port', port,
        '--n-gpu-layers', isChat ? CONFIG.MODELS.CHAT.GPU_LAYERS.toString() : CONFIG.MODELS.EMBEDDING.GPU_LAYERS.toString(),
        '-m', modelPath,
        '-c', isChat ? CONFIG.MODELS.CHAT.CONTEXT_SIZE.toString() : CONFIG.MODELS.EMBEDDING.CONTEXT_SIZE.toString()
    ];

    if (!isChat) {
        args.push('--embedding');
        // Increase batch size for embeddings to handle larger inputs
        args.push('-b', '2048');
        args.push('-ub', '2048');
        console.log("[AIService] Starting Embedding Mode (Nomic)");
    } else {
        console.log("[AIService] Starting Chat Mode (Llama 3.2)");
    }

    try {
        const command = Command.sidecar('llama-server', args);

        command.on('close', (data: { code: number | null, signal: number | null }) => {
            console.log(`[AIService:${port}] Sidecar closed with code ${data.code}`);
            if (isChat) chatServer = null;
            else embeddingServer = null;
        });

        command.on('error', (error: any) => {
            console.error(`[AIService:${port}] Sidecar error: "${error}"`);
            if (isChat) chatServer = null;
            else embeddingServer = null;
        });

        command.stdout.on('data', (line: string) => console.log(`[AI:${port}] ${line}`));
        command.stderr.on('data', (line: string) => console.log(`[AI LOG:${port}] ${line}`));

        console.log(`[AIService] Spawning sidecar (${type}) on port ${port}...`);
        const child = await command.spawn();

        const serverProc = { process: child, port };
        if (isChat) chatServer = serverProc;
        else embeddingServer = serverProc;

        console.log(`[AIService] Sidecar spawned, pid: ${child.pid}`);

        // Wait for server to actually start
        await waitForServer(port);

        return serverProc;

    } catch (e) {
        console.error(`[AIService] Failed to start ${type} server:`, e);
        if (isChat && chatServer) { await chatServer.process.kill(); chatServer = null; }
        if (!isChat && embeddingServer) { await embeddingServer.process.kill(); embeddingServer = null; }
        throw e;
    }
};

export const startServer = async (mode: 'chat' | 'embedding' = 'chat'): Promise<void> => {
    // This function is kept for backward compatibility but now starts the specific server
    // It can be called multiple times safely.
    await startSidecar(mode);
};

export const stopServer = async (): Promise<void> => {
    // Stops ALL servers
    if (chatServer) {
        console.log("[AIService] Stopping chat server...");
        await chatServer.process.kill();
        chatServer = null;
    }
    if (embeddingServer) {
        console.log("[AIService] Stopping embedding server...");
        await embeddingServer.process.kill();
        embeddingServer = null;
    }
};

