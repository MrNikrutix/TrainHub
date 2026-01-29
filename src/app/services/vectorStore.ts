import { join } from '@tauri-apps/api/path';
import { readDir, readTextFile, writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { CONFIG } from '../config';

// Define the structure of our knowledge base
export interface DocumentVector {
    path: string;
    content: string;
    embedding: number[];
}

const KNOWLEDGE_FOLDER = 'knowledge';
const INDEX_FILE = 'knowledge_base.json';

// Helper to interact with Llama Server for embeddings
import { startServer } from './aiService';

async function fetchEmbedding(text: string): Promise<number[]> {
    try {
        // Ensure embedding server is running
        await startServer('embedding');

        const response = await fetch(`http://${CONFIG.AI_SERVER.HOST}:${CONFIG.AI_SERVER.EMBEDDING_PORT}/v1/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: text,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Embedding failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        // OpenAI compatible response: data.data[0].embedding
        return data.data[0].embedding;
    } catch (e) {
        console.error("[VectorStore] Embedding error:", e);
        throw e;
    }
}

// Recursive file scanner
async function scanFiles(dirPath: string, fileList: string[] = []): Promise<string[]> {
    console.log(`[VectorStore] Scanning directory: ${dirPath}`);
    try {
        const entries = await readDir(dirPath, { baseDir: BaseDirectory.AppLocalData });

        for (const entry of entries) {
            const relativePath = await join(dirPath, entry.name);
            console.log(`[VectorStore] Found entry: ${entry.name}, path: ${relativePath}, isDir: ${entry.isDirectory}`);

            if (entry.isDirectory) {
                await scanFiles(relativePath, fileList);
            } else {
                if (/\.(txt|md|json|csv)$/i.test(entry.name)) {
                    fileList.push(relativePath);
                }
            }
        }
    } catch (e) {
        console.warn(`[VectorStore] Failed to scan directory ${dirPath}:`, e);
    }

    return fileList;
}

export const VectorStore = {
    // 1. Check if knowledge folder exists, create if not
    async ensureKnowledgeFolder(): Promise<void> {
        const folderExists = await exists(KNOWLEDGE_FOLDER, { baseDir: BaseDirectory.AppLocalData });
        if (!folderExists) {
            await mkdir(KNOWLEDGE_FOLDER, { baseDir: BaseDirectory.AppLocalData });
            // Create a dummy file to explain usage
            await writeTextFile(
                `${KNOWLEDGE_FOLDER}/Readme.txt`,
                "Place your text files (.txt, .md) here. The app will scan them to answer your questions.",
                { baseDir: BaseDirectory.AppLocalData }
            );
        }
    },

    // 2. Build Index
    async buildIndex(onProgress: (msg: string) => void): Promise<number> {
        onProgress("Checking knowledge folder...");
        await this.ensureKnowledgeFolder();

        onProgress("Scanning files...");
        // Scan recursively starting from KNOWLEDGE_FOLDER
        const allFiles = await scanFiles(KNOWLEDGE_FOLDER);

        if (allFiles.length === 0) {
            onProgress("No files found in 'knowledge' folder.");
            return 0;
        }

        const documents: DocumentVector[] = [];
        let processed = 0;

        for (const relPath of allFiles) {
            onProgress(`Processing ${processed + 1}/${allFiles.length}: ${relPath}`);
            console.log(`[VectorStore] Reading file: ${relPath}`);

            try {
                const content = await readTextFile(relPath, { baseDir: BaseDirectory.AppLocalData });

                if (!content || content.trim().length === 0) {
                    console.warn(`[VectorStore] Skipping empty file: ${relPath}`);
                    processed++;
                    continue;
                }

                // --- CONTEXT AWARENESS LOGIC ---
                const contextualizedContent = `File: ${relPath}\nContent:\n${content}`;
                console.log(`[VectorStore] Generating embedding for ${relPath} (${content.length} chars)`);

                // Generate Embedding
                const embedding = await fetchEmbedding(contextualizedContent);

                documents.push({
                    path: relPath, // Storing relative path within AppLocalData
                    content: contextualizedContent,
                    embedding
                });

            } catch (e) {
                console.error(`[VectorStore] Failed to process ${relPath}`, e);
            }
            processed++;
        }

        onProgress("Saving index...");
        await writeTextFile(
            INDEX_FILE,
            JSON.stringify(documents, null, 2),
            { baseDir: BaseDirectory.AppLocalData }
        );

        onProgress(`Done! Buffered ${documents.length} documents.`);
        return documents.length;
    },

    // 3. Load Index (for chatting)
    async loadIndex(): Promise<DocumentVector[]> {
        if (!await exists(INDEX_FILE, { baseDir: BaseDirectory.AppLocalData })) {
            return [];
        }
        const text = await readTextFile(INDEX_FILE, { baseDir: BaseDirectory.AppLocalData });
        return JSON.parse(text) as DocumentVector[];
    },

    // 4. Search
    async search(query: string, limit: number = 3): Promise<{ document: DocumentVector, score: number }[]> {
        const index = await this.loadIndex();
        if (index.length === 0) return [];

        const queryEmbedding = await fetchEmbedding(query);

        // Calculate cosine similarity
        const results = index.map(doc => {
            const score = cosineSimilarity(queryEmbedding, doc.embedding);
            return { document: doc, score };
        });

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
