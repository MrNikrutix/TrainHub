import { ref } from 'vue';
import { BaseDirectory, exists, mkdir, writeFile, readFile } from '@tauri-apps/plugin-fs';
import { join, appLocalDataDir } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';

export const MODEL_ID = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
const REPO_URL = "https://huggingface.co/mlc-ai/Llama-3.2-3B-Instruct-q4f32_1-MLC/resolve/main/";

export const useLocalModel = () => {
    const downloadProgress = ref<string>("");
    const isDownloading = ref(false);
    const downloadPercent = ref(0);

    const getModelPath = async () => {
        return await join("models", MODEL_ID, "resolve", "main");
    };

    const checkModelExists = async () => {
        try {
            const modelPath = await getModelPath();
            // Check for key config files
            const configExists = await exists(await join(modelPath, "mlc-chat-config.json"), { baseDir: BaseDirectory.AppLocalData });
            const paramsExists = await exists(await join(modelPath, "ndarray-cache.json"), { baseDir: BaseDirectory.AppLocalData });
            return configExists && paramsExists;
        } catch (e) {
            console.error("Error checking model existence:", e);
            return false;
        }
    };

    const downloadFile = async (filename: string, modelDir: string) => {
        const url = `${REPO_URL}${filename}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            await writeFile(await join(modelDir, filename), uint8Array, { baseDir: BaseDirectory.AppLocalData });
        } catch (e) {
            console.error(`Failed to download ${filename}`, e);
            throw e;
        }
    };

    const downloadModel = async () => {
        if (isDownloading.value) return;
        isDownloading.value = true;
        downloadProgress.value = "Starting download...";
        downloadPercent.value = 0;

        try {
            const modelDir = await getModelPath();
            // Create directory
            if (!(await exists(modelDir, { baseDir: BaseDirectory.AppLocalData }))) {
                await mkdir(modelDir, { baseDir: BaseDirectory.AppLocalData, recursive: true });
            }

            // 1. Download basic configs
            const configFiles = ["mlc-chat-config.json", "ndarray-cache.json", "tokenizer.json", "tokenizer_config.json"];

            for (let i = 0; i < configFiles.length; i++) {
                downloadProgress.value = `Downloading config: ${configFiles[i]}`;
                await downloadFile(configFiles[i], modelDir);
            }

            // 2. Read ndarray-cache.json to find shards
            const cacheContent = await readFile(await join(modelDir, "ndarray-cache.json"), { baseDir: BaseDirectory.AppLocalData });
            const textDecoder = new TextDecoder();
            const cacheJson = JSON.parse(textDecoder.decode(cacheContent));

            const records = cacheJson.records || [];
            // Filter for weight files (usually params_shard_*.bin)
            const shards = records.map((r: any) => r.dataPath);

            const totalFiles = shards.length;
            for (let i = 0; i < totalFiles; i++) {
                const shard = shards[i];
                downloadProgress.value = `Downloading shard ${i + 1}/${totalFiles}: ${shard}`;
                await downloadFile(shard, modelDir);
                downloadPercent.value = Math.round(((i + 1) / totalFiles) * 100);
            }

            downloadProgress.value = "Download complete!";
            isDownloading.value = false;
            return true;

        } catch (error) {
            console.error("Download failed:", error);
            downloadProgress.value = `Download failed: ${error}`;
            isDownloading.value = false;
            throw error;
        }
    };

    const getModelConfig = async () => {
        // AppLocalData path resolution
        // Note: convertFileSrc needs absolute path.
        const appDataPath = await appLocalDataDir();
        // Path matches model root
        const fullModelPath = await join(appDataPath, "models", MODEL_ID);

        // We need to convert this to an asset URL
        // On Windows it will be http://asset.localhost/C:/Users/...
        const modelUrl = convertFileSrc(fullModelPath);

        // Ensure trailing slash if needed? convertFileSrc usually doesn't add it.
        // WebLLM expects a directory URL usually.
        const modelUrlWithSlash = modelUrl.endsWith('/') ? modelUrl : `${modelUrl}/`;

        return {
            model: modelUrlWithSlash,
            model_id: MODEL_ID, // Use original ID as we are now compliant with folder structure
            model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0.2.46/Llama-3-8B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm",
            vram_required_MB: 6148,
            low_resource_required: false,
        };
    };

    return {
        checkModelExists,
        downloadModel,
        getModelConfig,
        downloadProgress,
        isDownloading,
        downloadPercent
    };
};
