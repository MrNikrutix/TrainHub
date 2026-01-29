<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import ListBox from 'primevue/listbox';
import { api } from '../api';
import type { AnalysisSession, Annotation } from '../types';
import { convertFileSrc } from '@tauri-apps/api/core';
import PostureAnalysis from '../components/posture/PostureAnalysis.vue';
import { useAnalysis } from '../composables/useAnalysis';

// State
const analysisMode = ref<'video' | 'posture'>('video');
const { sessions: savedSessions, createSession, deleteSession: removeSession, getAnnotations } = useAnalysis();

const currentSessionName = ref('');
const saveSessionDialog = ref(false);
const activeSessionId = ref<string | null>(null);

const videoSrc = ref<string | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const currentTime = ref(0);
const duration = ref(0);

const inPoint = ref<number | null>(null);
const outPoint = ref<number | null>(null);

const annotationName = ref('');
const annotationDesc = ref('');
const editingAnnotationId = ref<string | null>(null);
const annotations = ref<Annotation[]>([]);

// Loading handled by composable

const pickVideo = async () => {
    try {
        const path = await api.pickVideoFile();
        if (path) {
            videoSrc.value = convertFileSrc(path);
            resetAnalysis();
            // Temporarily store path in a way we can access when saving session
            currentVideoPathCache.value = path;
        }
    } catch (e) {
        console.error("Error picking video", e);
    }
};
const currentVideoPathCache = ref<string | null>(null);


const resetAnalysis = () => {
    inPoint.value = null;
    outPoint.value = null;
    currentTime.value = 0;
    annotations.value = [];
    editingAnnotationId.value = null;
    currentSessionName.value = '';
    activeSessionId.value = null;
};

const onTimeUpdate = () => {
    if (videoRef.value) {
        currentTime.value = videoRef.value.currentTime;
    }
};

const onLoadedMetadata = () => {
    if (videoRef.value) {
        duration.value = videoRef.value.duration;
    }
};

const setInPoint = () => {
    inPoint.value = currentTime.value;
};

const setOutPoint = () => {
    outPoint.value = currentTime.value;
};

const clearPoints = () => {
    inPoint.value = null;
    outPoint.value = null;
    editingAnnotationId.value = null;
    annotationName.value = '';
    annotationDesc.value = '';
};

const playSelection = () => {
    if (videoRef.value && inPoint.value !== null && outPoint.value !== null) {
        videoRef.value.currentTime = inPoint.value;
        videoRef.value.play();
    }
};

const saveAnnotation = async () => {
    if (!activeSessionId.value) {
        alert("Musisz najpierw zapisać sesję, aby dodawać adnotacje.");
        return;
    }

    if (inPoint.value !== null && outPoint.value !== null && annotationName.value) {
        try {
            if (editingAnnotationId.value) {
                // Update
                const ann = annotations.value.find(a => a.id === editingAnnotationId.value);
                if (ann) {

                    const updated = { ...ann, name: annotationName.value, description: annotationDesc.value, startTime: inPoint.value, endTime: outPoint.value };
                    await api.updateAnnotation(updated);
                    const idx = annotations.value.findIndex(a => a.id === ann.id);
                    if (idx !== -1) annotations.value[idx] = updated;
                }
            } else {
                // Create
                const newAnn = await api.addAnnotation({
                    sessionId: activeSessionId.value,
                    startTime: inPoint.value,
                    endTime: outPoint.value,
                    name: annotationName.value,
                    description: annotationDesc.value,
                    color: getRandomColor()
                });
                annotations.value.push(newAnn);
            }
            clearPoints();
        } catch (e) {
            console.error("Error saving annotation", e);
        }
    }
};

const editAnnotation = (ann: Annotation) => {
    editingAnnotationId.value = ann.id;
    inPoint.value = ann.startTime;
    outPoint.value = ann.endTime;
    annotationName.value = ann.name;
    annotationDesc.value = ann.description;
    
    if (videoRef.value) {
        videoRef.value.currentTime = ann.startTime;
    }
};

const deleteAnnotation = async (id: string) => {
    try {
        await api.deleteAnnotation(id);
        annotations.value = annotations.value.filter(a => a.id !== id);
        if (editingAnnotationId.value === id) {
            clearPoints();
        }
    } catch (e) {
        console.error("Error deleting annotation", e);
    }
};

const openSaveSessionDialog = () => {
    saveSessionDialog.value = true;
};

const saveSession = async () => {
    if (currentSessionName.value.trim()) {
        try {
            const session = await createSession(currentSessionName.value, currentVideoPathCache.value);
            activeSessionId.value = session.id;
            saveSessionDialog.value = false;
            alert('Sesja zapisana! Możesz teraz dodawać adnotacje.');
        } catch (e) {
            console.error("Error saving session", e);
        }
    }
};

const loadSession = async (session: AnalysisSession) => {
    activeSessionId.value = session.id;
    currentSessionName.value = session.name;
    
    // Load annotations
    try {
        annotations.value = await getAnnotations(session.id);
    } catch (e) {
        console.error("Error loading annotations", e);
    }

    if (session.videoPath) {
        videoSrc.value = convertFileSrc(session.videoPath);
    } else {
        if (!videoSrc.value) {
             alert('Ta sesja nie ma zapisanego wideo. Załaduj wideo ręcznie.');
        }
    }
    clearPoints();
};

const deleteSessionHelper = async (id: string) => {
      try {
          await removeSession(id);
          if (activeSessionId.value === id) {
              resetAnalysis();
          }
      } catch (e) {
          console.error("Error deleting session", e);
      }
};

const getRandomColor = () => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    return colors[Math.floor(Math.random() * colors.length)];
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Timeline helpers
const getLeftPosition = (time: number) => {
    if (!duration.value) return '0%';
    return `${(time / duration.value) * 100}%`;
};

const getWidth = (start: number, end: number) => {
    if (!duration.value) return '0%';
    return `${((end - start) / duration.value) * 100}%`;
};

const seek = (event: MouseEvent) => {
    if (!duration.value || !videoRef.value) return;
    const timeline = event.currentTarget as HTMLElement;
    const rect = timeline.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration.value;
    videoRef.value.currentTime = time;
};

onUnmounted(() => {
    if (videoSrc.value && videoSrc.value.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc.value);
    }
});
</script>

<template>
<div>
    <div class="flex flex-column h-full gap-2">
        <!-- Mode Switcher -->
        <div class="flex justify-content-center gap-2 pb-2">
            <Button label="Analiza Wideo" :severity="analysisMode === 'video' ? 'primary' : 'secondary'" @click="analysisMode = 'video'" />
            <Button label="Analiza Postawy" :severity="analysisMode === 'posture' ? 'primary' : 'secondary'" @click="analysisMode = 'posture'" />
        </div>

        <div v-if="analysisMode === 'posture'" class="flex-grow-1 overflow-hidden relative" style="min-height: 0;">
            <PostureAnalysis class="absolute inset-0" />
        </div>

        <div v-else class="grid flex-grow-1 h-full">
            <!-- Main Area: Video & Timeline -->
            <div class="col-12 md:col-8 flex flex-column gap-3">
            <Card class="flex-grow-1 flex flex-column">
                <template #title>
                    <div class="flex justify-content-between align-items-center">
                        <span>Podgląd Wideo</span>
                        <div class="flex gap-2">
                             <Button label="Zapisz sesję" icon="pi pi-save" size="small" @click="openSaveSessionDialog" :disabled="!videoSrc" />
                        </div>
                    </div>
                </template>
                <template #content>
                    <div v-if="!videoSrc" class="flex align-items-center justify-content-center h-20rem border-2 border-dashed surface-border border-round bg-surface-ground">
                         <span class="text-color-secondary">Wybierz wideo z panelu po prawej</span>
                    </div>
                    <div v-else class="relative w-full bg-black flex align-items-center justify-content-center" style="min-height: 400px;">
                        <video ref="videoRef" :src="videoSrc" class="w-full h-full" controls @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"></video>
                    </div>

                    <!-- Timeline -->
                    <div class="mt-4 relative h-3rem bg-surface-200 border-round cursor-pointer select-none" @click="seek">
                        <!-- Progress Bar -->
                        <div class="absolute top-0 left-0 h-full bg-primary-200 opacity-50 pointer-events-none" :style="{ width: getLeftPosition(currentTime) }"></div>
                        
                        <!-- Current Time Marker -->
                        <div class="absolute top-0 w-2px h-full bg-red-500 z-5 pointer-events-none" :style="{ left: getLeftPosition(currentTime) }"></div>

                        <!-- Saved Annotations -->
                        <div v-for="ann in annotations" :key="ann.id" 
                             class="absolute top-0 h-full opacity-70 border-left-1 border-right-1 border-white"
                             :style="{ left: getLeftPosition(ann.startTime), width: getWidth(ann.startTime, ann.endTime), backgroundColor: ann.color }"
                             :title="ann.name">
                        </div>

                        <!-- Current Selection (Pending) -->
                        <div v-if="inPoint !== null" class="absolute top-0 h-full border-left-2 border-primary z-4" 
                             :style="{ left: getLeftPosition(inPoint) }">
                             <div class="absolute -top-100 left-50" style="transform: translateX(-50%)"><i class="pi pi-arrow-down text-primary"></i></div>
                        </div>
                        <div v-if="outPoint !== null" class="absolute top-0 h-full border-left-2 border-primary z-4" 
                             :style="{ left: getLeftPosition(outPoint) }">
                             <div class="absolute -top-100 left-50" style="transform: translateX(-50%)"><i class="pi pi-arrow-down text-primary"></i></div>
                        </div>
                        <div v-if="inPoint !== null && outPoint !== null" 
                             class="absolute top-0 h-full bg-primary opacity-30 pointer-events-none z-3"
                             :style="{ left: getLeftPosition(inPoint), width: getWidth(inPoint, outPoint) }">
                        </div>
                    </div>
                    <div class="flex justify-content-between mt-1 text-sm text-color-secondary">
                        <span>{{ formatTime(currentTime) }}</span>
                        <span>{{ formatTime(duration) }}</span>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Sidebar: Controls & Annotations -->
        <div class="col-12 md:col-4 flex flex-column gap-3 h-full overflow-y-auto">
            <Card>
                <template #title>Narzędzia</template>
                <template #content>
                    <Button label="Wybierz wideo" icon="pi pi-video" @click="pickVideo" class="w-full mb-3" />
                    
                    <div class="flex gap-2 mb-3">
                        <Button label="IN" icon="pi pi-step-backward" @click="setInPoint" class="flex-1" :disabled="!videoSrc" />
                        <Button label="OUT" icon="pi pi-step-forward" @click="setOutPoint" class="flex-1" :disabled="!videoSrc" />
                        <Button icon="pi pi-times" severity="secondary" @click="clearPoints" :disabled="!inPoint && !outPoint" />
                    </div>

                    <div v-if="inPoint !== null && outPoint !== null" class="surface-ground p-3 border-round mb-3">
                        <div class="text-sm text-color-secondary mb-2">Zaznaczenie: {{ formatTime(inPoint) }} - {{ formatTime(outPoint) }}</div>
                        <div class="flex gap-2 mb-3">
                             <Button icon="pi pi-play" size="small" rounded outlined @click="playSelection" />
                        </div>
                        
                        <div class="field mb-2">
                            <InputText v-model="annotationName" placeholder="Nazwa ćwiczenia/błędu" class="w-full p-inputtext-sm" />
                        </div>
                        <div class="field mb-2">
                            <Textarea v-model="annotationDesc" placeholder="Opis..." rows="2" class="w-full text-sm" />
                        </div>
                        <Button :label="editingAnnotationId ? 'Zaktualizuj' : 'Zapisz adnotację'" icon="pi pi-check" class="w-full text-sm" @click="saveAnnotation" :disabled="!annotationName" />
                    </div>
                </template>
            </Card>

            <Card class="flex-grow-1">
                <template #title>Sesje i Adnotacje</template>
                <template #content>
                    <!-- Saved Sessions List -->
                     <div class="mb-4">
                        <div class="text-sm font-bold mb-2">Zapisane Sesje</div>
                        <ListBox :options="savedSessions" optionLabel="name" class="w-full" listStyle="max-height: 150px">
                             <template #option="slotProps">
                                <div class="flex align-items-center justify-content-between w-full" @click="loadSession(slotProps.option)">
                                    <div class="flex flex-column">
                                        <span>{{ slotProps.option.name }}</span>
                                        <span class="text-xs text-color-secondary">{{ new Date(slotProps.option.date).toLocaleDateString() }}</span>
                                    </div>
                                    <Button icon="pi pi-trash" text rounded severity="danger" class="w-2rem h-2rem" @click.stop="deleteSessionHelper(slotProps.option.id)" />
                                </div>
                            </template>
                        </ListBox>
                     </div>

                    <div class="text-sm font-bold mb-2">Adnotacje w tej sesji</div>
                    <div v-if="annotations.length === 0" class="text-center text-color-secondary py-2 text-sm">Brak adnotacji</div>
                    <div class="flex flex-column gap-2">
                        <div v-for="ann in annotations" :key="ann.id" 
                             class="flex flex-column p-2 border-1 surface-border border-round cursor-pointer hover:surface-hover transition-colors" 
                             :class="{'surface-hover': editingAnnotationId === ann.id}"
                             :style="{ borderLeft: `4px solid ${ann.color}` }"
                             @click="editAnnotation(ann)">
                            <div class="font-bold flex justify-content-between">
                                <span>{{ ann.name }}</span>
                                <span class="text-xs text-color-secondary">{{ formatTime(ann.startTime) }} - {{ formatTime(ann.endTime) }}</span>
                            </div>
                            <div class="text-sm mt-1 text-overflow-ellipsis overflow-hidden white-space-nowrap">{{ ann.description }}</div>
                            <div class="flex gap-2 mt-2" @click.stop>
                                <Button icon="pi pi-play" size="small" text rounded @click="() => { if(videoRef) { videoRef.currentTime = ann.startTime; videoRef.play(); } }" />
                                <Button icon="pi pi-trash" size="small" text rounded severity="danger" @click="deleteAnnotation(ann.id)" />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>

    
    </div>
    
    <Dialog v-model:visible="saveSessionDialog" header="Zapisz Sesję" :style="{ width: '300px' }" modal>
        <div class="field">
            <label for="sessionName" class="block mb-2">Nazwa sesji</label>
            <InputText id="sessionName" v-model="currentSessionName" class="w-full" autofocus />
        </div>
        <template #footer>
            <Button label="Anuluj" text @click="saveSessionDialog = false" />
            <Button label="Zapisz" @click="saveSession" />
        </template>
    </Dialog>
</div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
