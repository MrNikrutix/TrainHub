<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useChatAI } from "../composables/useChatAI";
import { checkModelsExist, downloadModels } from "../services/modelManager";
import { startServer, stopServer } from "../services/aiService";
import { VectorStore } from "../services/vectorStore";

// Components
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import ScrollPanel from 'primevue/scrollpanel';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from "primevue/useconfirm";

import ChatMessageList from "../components/chat/ChatMessageList.vue";
import ChatInput from "../components/chat/ChatInput.vue";

const { 
    messages, 
    sessions,
    currentSessionId,
    isLoading,
    initEngine, 
    sendMessage,
    loadSessions,
    loadSession,
    createNewChat,
    deleteSession,
} = useChatAI();

// Local State
const isModelReady = ref(false);
const modelNeedsDownload = ref(false);
const isDownloadingLocal = ref(false);
const downloadPercent = ref(0);
const localDownloadProgress = ref("");
const serverLoading = ref(false);

// Local State (Indexing)
const isIndexing = ref(false);
const indexingProgress = ref("");

const confirm = useConfirm();

const startIndexing = async () => {
    try {
        isIndexing.value = true;
        const count = await VectorStore.buildIndex((status) => {
            indexingProgress.value = status;
        });
        indexingProgress.value = `Zakończono! Zindeksowano ${count} dokumentów.`;
        setTimeout(() => { isIndexing.value = false; }, 2000);
    } catch (e) {
        console.error("Indexing failed", e);
        indexingProgress.value = "Błąd indeksowania: " + e;
        setTimeout(() => { isIndexing.value = false; }, 3000);
    }
};

const checkAndStart = async () => {
    try {
        serverLoading.value = true;
        const exists = await checkModelsExist();
        if (exists) {
            modelNeedsDownload.value = false;
            localDownloadProgress.value = "Uruchamianie serwera AI...";
            await startServer();
            isModelReady.value = true;
            await initEngine(); 
        } else {
            modelNeedsDownload.value = true;
        }
    } catch (e) {
        console.error("Failed to start:", e);
        localDownloadProgress.value = "Błąd: " + e;
    } finally {
        serverLoading.value = false;
    }
};

const startDownload = async () => {
    try {
        isDownloadingLocal.value = true;
        await downloadModels((pct, status) => {
            downloadPercent.value = pct;
            localDownloadProgress.value = status;
        });
        isDownloadingLocal.value = false;
        await checkAndStart();
    } catch (e) {
        console.error("Download failed", e);
        isDownloadingLocal.value = false;
        localDownloadProgress.value = "Błąd pobierania: " + e;
    }
};

const handleSend = (text: string) => {
    sendMessage(text);
};

// Auto-refresh sessions
watch(currentSessionId, (newVal, oldVal) => {
    if (newVal && !oldVal) loadSessions();
});

onMounted(async () => {
    await loadSessions();
    if (sessions.value.length === 0) {
        createNewChat();
    } else {
        await loadSession(sessions.value[0].id);
    }
    await checkAndStart();
});

onUnmounted(async () => {
    await stopServer();
});

const confirmDelete = (event: Event, id: string) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Czy na pewno chcesz usunąć tę rozmowę?',
        icon: 'pi pi-exclamation-triangle',
        accept: () => { deleteSession(id); }
    });
};
</script>

<template>
  <div class="flex h-full w-full overflow-hidden bg-surface-ground">
    
    <!-- Sidebar -->
     <aside class="hidden md:flex flex-column w-20rem bg-surface-card border-right-1 surface-border h-full transition-all">
        <div class="p-3 border-bottom-1 surface-border">
             <Button label="Nowy czat" icon="pi pi-plus" class="w-full" @click="createNewChat" outlined />
        </div>
        <ScrollPanel class="flex-grow-1 w-full">
            <div class="flex flex-column p-2 gap-1">
                <div v-for="session in sessions" :key="session.id" 
                     :class="['flex align-items-center justify-content-between p-3 border-round cursor-pointer transition-colors', 
                              currentSessionId === session.id ? 'bg-primary-50 text-primary' : 'hover:surface-hover text-color']"
                     @click="loadSession(session.id)">
                    
                    <div class="flex align-items-center gap-2 overflow-hidden">
                        <i class="pi pi-comments"></i>
                        <span class="white-space-nowrap overflow-hidden text-overflow-ellipsis font-medium text-sm text-color-black">{{ session.title }}</span>
                    </div>

                    <Button icon="pi pi-trash" text rounded severity="danger" class="w-2rem h-2rem flex-shrink-0" @click.stop="confirmDelete($event, session.id)" />
                </div>
                
                <div v-if="sessions.length === 0" class="text-center p-4 text-500 text-sm">
                    Brak historii rozmów
                </div>
            </div>
        </ScrollPanel>
     </aside>

    <!-- Main Chat Area -->
    <div class="flex flex-column flex-grow-1 h-full relative min-w-0">
        
        <!-- Header -->
        <div class="flex align-items-center justify-content-between p-3 surface-card border-bottom-1 surface-border z-1 shadow-1">
            <div class="flex align-items-center gap-2">
                <i class="pi pi-bolt text-2xl text-primary"></i>
                <div class="flex flex-column">
                    <span class="font-bold text-color">Trener AI</span>
                    <span class="text-xs text-green-500 flex align-items-center gap-1">
                         <i class="pi pi-circle-fill text-[8px]"></i> Online
                    </span>
                </div>
            </div>
            <Button label="Indeksuj wiedzę" icon="pi pi-database" size="small" outlined @click="startIndexing" :disabled="isIndexing || !isModelReady" />
        </div>

        <!-- Chat Content -->
        <div class="flex-grow-1 relative flex flex-column overflow-hidden">
             
             <!-- Loading / Status Overlays -->
            <div v-if="serverLoading || modelNeedsDownload || isIndexing" class="absolute inset-0 z-5 flex align-items-center justify-content-center bg-surface-ground-alpha backdrop-blur-sm">
                 <!-- Re-using existing loading UI logic -->
                <div v-if="isIndexing" class="surface-card p-5 border-round-xl shadow-4 text-center">
                    <i class="pi pi-database pi-spin text-4xl text-primary mb-3"></i>
                    <div class="font-bold mb-2">Indeksowanie Wiedzy</div>
                    <ProgressBar mode="indeterminate" style="height: 6px; width: 200px" class="mb-2"></ProgressBar>
                    <small class="text-color-secondary">{{ indexingProgress }}</small>
                </div>
                <!-- ... other states ... -->
                 <div v-else-if="modelNeedsDownload" class="surface-card p-5 border-round-xl shadow-4 text-center max-w-30rem">
                     <h3>Wymagane pobranie modelu</h3>
                      <p class="mb-4">Model zostanie zapisany lokalnie.</p>
                      <div v-if="isDownloadingLocal">
                           <ProgressBar :value="downloadPercent"></ProgressBar>
                           <small>{{ localDownloadProgress }}</small>
                      </div>
                      <Button v-else label="Pobierz" @click="startDownload" />
                 </div>
                 <div v-else class="surface-card p-5 border-round-xl shadow-4 text-center">
                      <i class="pi pi-cog pi-spin text-4xl text-primary mb-3"></i>
                      <div class="font-bold">Uruchamianie serwera AI...</div>
                 </div>
            </div>

            <!-- Messages List -->
            <ChatMessageList :messages="messages" />

        </div>

        <!-- Input Area -->
        <ChatInput :is-loading="isLoading" @send="handleSend" />

    </div>

    <ConfirmPopup />
  </div>
</template>

<style scoped>
.bg-surface-ground-alpha {
    background-color: rgba(var(--surface-ground-rgb), 0.8);
}
</style>
