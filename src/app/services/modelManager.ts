import { BaseDirectory, exists, mkdir, create } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { CONFIG } from '../config';

// Re-export constants for backward compatibility if needed, 
// but prefer using CONFIG directly in new code.

export const checkModelsExist = async (): Promise<boolean> => {
    try {
        const chatExists = await exists(
            `${CONFIG.MODELS.DIR}/${CONFIG.MODELS.CHAT.FILENAME}`,
            { baseDir: BaseDirectory.AppLocalData }
        );
        const embedExists = await exists(
            `${CONFIG.MODELS.DIR}/${CONFIG.MODELS.EMBEDDING.FILENAME}`,
            { baseDir: BaseDirectory.AppLocalData }
        );
        return chatExists && embedExists;
    } catch (e) {
        console.error("[ModelManager] Error checking models:", e);
        return false;
    }
};

export const downloadModels = async (onProgress: (pct: number, status: string) => void): Promise<void> => {
    try {
        // Ensure directory exists
        const dirExists = await exists(CONFIG.MODELS.DIR, { baseDir: BaseDirectory.AppLocalData });
        if (!dirExists) {
            await mkdir(CONFIG.MODELS.DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
        }

        // Helper to download a single file
        const downloadFile = async (url: string, filename: string, weight: number, currentProgress: number) => {
            onProgress(currentProgress, `Downloading ${filename}...`);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            if (!response.body) throw new Error("Response body is null");

            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
            let downloaded = 0;

            const reader = response.body.getReader();
            const file = await create(`${CONFIG.MODELS.DIR}/${filename}`, { baseDir: BaseDirectory.AppLocalData });

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                await file.write(value);
                downloaded += value.length;

                if (contentLength > 0) {
                    const filePct = (downloaded / contentLength);
                    // Map file progress to overall weight
                    onProgress(currentProgress + (filePct * weight), `Downloading ${filename}...`);
                }
            }

            await file.close();
        };

        // Download Chat Model (80% weight)
        await downloadFile(
            CONFIG.MODELS.CHAT.URL,
            CONFIG.MODELS.CHAT.FILENAME,
            80,
            0
        );

        // Download Embedding Model (20% weight)
        await downloadFile(
            CONFIG.MODELS.EMBEDDING.URL,
            CONFIG.MODELS.EMBEDDING.FILENAME,
            20,
            80
        );

        onProgress(100, "Download Complete!");

    } catch (e) {
        console.error("[ModelManager] Download failed:", e);
        throw e;
    }
};

export const getModelPath = async (): Promise<string> => {
    const appData = await appLocalDataDir();
    // Use join to ensure correct path separators
    return await join(appData, CONFIG.MODELS.DIR, CONFIG.MODELS.CHAT.FILENAME);
};

export const getEmbeddingModelPath = async (): Promise<string> => {
    const appData = await appLocalDataDir();
    return await join(appData, CONFIG.MODELS.DIR, CONFIG.MODELS.EMBEDDING.FILENAME);
};
