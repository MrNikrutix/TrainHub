<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PostureCanvas from './PostureCanvas.vue';
import { usePostureAnalysis, type PostureAnalysisResult, type PosturePoints } from '../../composables/usePostureAnalysis';
import { drawGrid, drawSkeleton, drawPoints, drawMedicalLines, drawAngleVisuals, drawCalibration, drawSagittalAnalysis } from '../../utils/postureDrawing';

const { analyzeImage, recalculateMetrics } = usePostureAnalysis();

const views = [
    { id: 'front', label: 'Przód' },
    { id: 'back', label: 'Tył' },
    { id: 'side_left', label: 'Bok L' },
    { id: 'side_right', label: 'Bok P' }
];

const selectedView = ref('front');
const images = ref<Record<string, string | null>>({
    front: null, back: null, side_left: null, side_right: null
});
const results = ref<Record<string, PostureAnalysisResult | null>>({
    front: null, back: null, side_left: null, side_right: null
});

const isAnalyzing = ref(false);
// canvasRef removed as unused
const fileInput = ref<HTMLInputElement | null>(null);

// Interaction
const interactionMode = ref<string>('none');

// Session Persistence
const showSaveDialog = ref(false);
const showLoadDialog = ref(false);
const saveSessionName = ref('');
const savedSessions = ref<{id: string, name: string, date: string, data: any}[]>([]);

// PDF Helpers
const pdfTableRef = ref<HTMLDivElement | null>(null);
const pdfTableData = ref<Record<string, { value: string | number, status: string }> | null>(null);

onMounted(() => {
    loadSessionsList();
});

const loadSessionsList = () => {
    try {
        const raw = localStorage.getItem('posture_sessions');
        if (raw) savedSessions.value = JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load sessions', e);
    }
};

const pickImage = (viewId: string) => {
    selectedView.value = viewId;
    if (fileInput.value) fileInput.value.click();
};

const onFileSelected = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        const src = URL.createObjectURL(file);
        const viewId = selectedView.value;
        images.value[viewId] = src;
        setTimeout(() => runAnalysis(viewId), 500);
    }
    if (target) target.value = '';
};

const runAnalysis = async (viewId: string) => {
    const src = images.value[viewId];
    if (!src) return;
    isAnalyzing.value = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = async () => {
        const res = await analyzeImage(img, viewId);
        results.value[viewId] = res;
        isAnalyzing.value = false;
    };
};

// Handle Updates
const currentResult = computed(() => results.value[selectedView.value]);

const updateAnalysis = () => {
    const res = currentResult.value;
    if (!res) return;
    const metrics = recalculateMetrics(selectedView.value, res.points, res.calibration, res.manualPlumbLineX);
    res.angles = metrics;
};

const onPointsUpdate = (newPoints: PosturePoints) => {
    if (currentResult.value) {
        currentResult.value.points = newPoints;
        updateAnalysis();
    }
};

const onCalibrationUpdate = (newCalib: {p1: any, p2: any}) => {
    if (currentResult.value) {
        const cal = currentResult.value.calibration;
        cal.p1 = newCalib.p1;
        cal.p2 = newCalib.p2;
        if (cal.p1 && cal.p2) {
             const pxDist = Math.hypot(cal.p2.x - cal.p1.x, cal.p2.y - cal.p1.y);
             if (pxDist > 0) cal.ratio = cal.realLengthMm / pxDist;
        }
        updateAnalysis();
    }
};

const onPointClick = (e: {mode: string, x: number, y: number}) => {
    if (!currentResult.value) return;
    
    if (e.mode === 'calibration') {
       const cal = currentResult.value.calibration;
       if (!cal.p1) cal.p1 = {x: e.x, y: e.y};
       else if (!cal.p2) {
           cal.p2 = {x: e.x, y: e.y};
            const pxDist = Math.hypot(cal.p2.x - cal.p1.x, cal.p2.y - cal.p1.y);
            if (pxDist > 0) cal.ratio = cal.realLengthMm / pxDist;
            interactionMode.value = 'none';
            updateAnalysis();
       }
    } else {
        const field = e.mode as keyof PosturePoints;
        // @ts-ignore
        currentResult.value.points[field] = { x: e.x, y: e.y };
        interactionMode.value = 'none';
        updateAnalysis();
    }
};

const handlePlumbLineUpdate = (x: number) => {
    if (currentResult.value) {
        currentResult.value.manualPlumbLineX = x;
        updateAnalysis();
    }
};

const startCalibration = () => {
    interactionMode.value = 'calibration';
};

const setCalibrationLength = () => {
    const val = prompt("Podaj długość odcinka w mm:", "1000");
    if (val && currentResult.value) {
        currentResult.value.calibration.realLengthMm = parseFloat(val);
        onCalibrationUpdate(currentResult.value.calibration as any);
    }
};

// --- PERSISTENCE ---

const openSaveDialog = () => {
    saveSessionName.value = `Sesja ${new Date().toLocaleDateString()}`;
    showSaveDialog.value = true;
};

const blobToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const saveSession = async () => {
    const data: any = { activeView: selectedView.value, views: {} };
    let hasData = false;

    // Iterate all views to save state
    for(const view of views) {
        const res = results.value[view.id];
        const src = images.value[view.id];
        if(res && src) {
            hasData = true;
            let b64 = src;
            if (src.startsWith('blob:')) {
                try {
                    b64 = await blobToBase64(src);
                } catch (e) {
                    console.error("Blob convert error", e);
                }
            }
            data.views[view.id] = {
                points: res.points,
                calibration: res.calibration,
                imageSrc: b64,
                viewType: view.id
            };
        }
    }

    if (!hasData) {
        alert("Brak danych do zapisania w żadnym widoku.");
        return;
    }

    const sessionObj = {
        id: crypto.randomUUID(),
        name: saveSessionName.value,
        date: new Date().toLocaleString(),
        data: data
    };
    
    storeSession(sessionObj);
};

const storeSession = (session: any) => {
    try {
        const existing = JSON.parse(localStorage.getItem('posture_sessions') || '[]');
        existing.push(session);
        localStorage.setItem('posture_sessions', JSON.stringify(existing));
        savedSessions.value = existing;
        showSaveDialog.value = false;
        alert("Sesja (wszystkie widoki) została zapisana!");
    } catch (e) {
        alert("Błąd zapisu (limit pamięci przeglądarki?): " + e);
    }
};

const loadSession = (sessionData: any) => {
    try {
        // Handle Legacy (Single View) vs New (Multi View)
        if (sessionData.views) {
            // New Format
            // Clear current
            for(const k of Object.keys(images.value)) images.value[k] = null;
            for(const k of Object.keys(results.value)) results.value[k] = null;

            // Load
            for (const [key, viewData] of Object.entries(sessionData.views) as any) {
                images.value[key] = viewData.imageSrc;
                
                // Recalculate metrics for robustness
                const metrics = recalculateMetrics(key, viewData.points, viewData.calibration);
                results.value[key] = {
                    points: viewData.points,
                    angles: metrics,
                    viewType: key,
                    calibration: viewData.calibration,
                    manualPlumbLineX: viewData.manualPlumbLineX || null
                };
            }
            selectedView.value = sessionData.activeView || 'front';

        } else {
            // Legacy Format
            images.value[sessionData.view] = sessionData.imageSrc;
            selectedView.value = sessionData.view;
            const metrics = recalculateMetrics(sessionData.view, sessionData.points, sessionData.calibration);
            results.value[sessionData.view] = {
                points: sessionData.points,
                angles: metrics,
                viewType: sessionData.view,
                calibration: sessionData.calibration,
                manualPlumbLineX: sessionData.manualPlumbLineX || null
            };
        }
        
        showLoadDialog.value = false;
        
    } catch (e) {
        console.error(e);
        alert("Błąd wczytywania: " + e);
    }
};

const deleteSession = (id: string) => {
    const existing = savedSessions.value.filter(s => s.id !== id);
    localStorage.setItem('posture_sessions', JSON.stringify(existing));
    savedSessions.value = existing;
};

const generatePDF = async () => {

    const btn = document.activeElement as HTMLElement;
    if(btn) btn.classList.add('p-disabled');
    
    try {
        // 1. Validation & Setup
        const validViews = views.filter(v => results.value[v.id] && images.value[v.id]);
        
        if (validViews.length === 0) {
            alert("Brak danych do wygenerowania raportu. Wykonaj analizę przynajmniej jednego widoku.");
            if(btn) btn.classList.remove('p-disabled');
            return;
        }

        const filename = `Raport_${saveSessionName.value || 'Pacjent'}_${new Date().toISOString().slice(0,10)}.pdf`;
        let fileHandle: any = null;

        // 2. Request File Handle IMMEDIATELY (User Gesture Token)
        // @ts-ignore
        if (window.showSaveFilePicker) {
            try {
                // @ts-ignore
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{ description: 'PDF Document', accept: {'application/pdf': ['.pdf']} }],
                });
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    if(btn) btn.classList.remove('p-disabled');
                    return; // User cancelled
                }
                // If other error, show it
                alert("Błąd zapisu pliku: " + err.message);
                if(btn) btn.classList.remove('p-disabled');
                return; 
            }
        }

        // 3. Generate Content (Async/Heavy)
        const pdf = new jsPDF('l', 'mm', 'a4'); 
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        let pageCount = 0;

        for (const view of views) {
            const res = results.value[view.id];
            const imgSrc = images.value[view.id];
            
            if (!res || !imgSrc) continue; 

            if (pageCount > 0) pdf.addPage();
            pageCount++;

            // Header
            pdf.setFontSize(24);
            pdf.setTextColor(34, 197, 94);
            pdf.text("TrainHub", 10, 15);
            
            pdf.setFontSize(12);
            pdf.setTextColor(100);
            pdf.text("Raport Diagnostyki Postawy", 10, 22);
            
            // Meta Top Right
            pdf.setFontSize(10);
            pdf.setTextColor(0);
            const dateStr = new Date().toLocaleDateString('pl-PL');
            pdf.text(`Data: ${dateStr}`, w - 10, 15, { align: 'right' });
            pdf.text(`Pacjent: ${saveSessionName.value || 'Bez nazwy'}`, w - 10, 20, { align: 'right' });
            pdf.text(`Widok: ${view.label}`, w - 10, 25, { align: 'right' });

            pdf.setDrawColor(200);
            pdf.line(10, 30, w-10, 30); // Separator

            // Main Image (Canvas Refresh)
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Load Image
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgSrc;
            await new Promise((resolve, _) => {
                img.onload = resolve;
                img.onerror = resolve; 
            });

            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            
            if (tempCtx) {
                tempCtx.drawImage(img, 0, 0);

                const unit = Math.max(10, img.width * 0.015);
                // Draw Analysis Layers
                drawGrid(tempCtx, img.width, img.height);
                
                if (res.points) {
                    drawSkeleton(tempCtx, res.points, unit);
                    drawPoints(tempCtx, res.points, unit, 1);
                    drawMedicalLines(tempCtx, res.points, unit, 1, view.id);
                    drawAngleVisuals(tempCtx, res.points, unit, 1, view.id);
                    drawAngleVisuals(tempCtx, res.points, unit, 1, view.id);
                    drawSagittalAnalysis(tempCtx, res.points, unit, 1, view.id, res.calibration, res.manualPlumbLineX);
                }
                drawCalibration(tempCtx, res.calibration, unit, 1);
            }

            const imgData = tempCanvas.toDataURL('image/png');
            
            // Layout (same as before)
            const areaX = 10; 
            const areaY = 35;
            const areaW = (w - 20) * 0.65;
            const areaH = h - 45;
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.width / imgProps.height;
            const areaRatio = areaW / areaH;
            
            let finalW, finalH;
            if (imgRatio > areaRatio) {
                finalW = areaW;
                finalH = areaW / imgRatio;
            } else {
                finalW = areaH * imgRatio;
                finalH = areaH;
            }
            
            const offX = areaX + (areaW - finalW) / 2;
            const offY = areaY + (areaH - finalH) / 2;
            
            pdf.addImage(imgData, 'PNG', offX, offY, finalW, finalH);

            // Analysis Table using html2canvas (Fixes Font & Layout)
            let tableX = (w - 20) * 0.65 + 15; // Default position
            
            if (res.angles && pdfTableRef.value) {
                // Populate template
                pdfTableData.value = res.angles;
                await nextTick(); 
                // Wait specifically for DOM paint/style appplication
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Capture
                const tableCanvas = await html2canvas(pdfTableRef.value, { 
                    scale: 2, 
                    backgroundColor: '#ffffff',
                    ignoreElements: (_) => false 
                });
                const tableImg = tableCanvas.toDataURL('image/png');
                
                // Calculate dimensions to fit PDF column
                const columnW = (w - 20) * 0.35 - 5; 
                // tableX set above
                const tableY = 40;
                
                const tableRatio = tableCanvas.width / tableCanvas.height;
                const finalTableH = columnW / tableRatio;
                
                pdf.addImage(tableImg, 'PNG', tableX, tableY, columnW, finalTableH);
            } else {
                tableX = (w - 20) * 0.65 + 20; // Slight adjust
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "italic");
                pdf.setTextColor(150);
                pdf.text("Brak danych pomiarowych", tableX, 40);
            }

            // Footer
            const footerY = h - 20;
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text("Raport generowany automatycznie przez TrainHub AI.", tableX, footerY, { maxWidth: (w - 10 - tableX) });

        } // end Loop

        // 4. Save Logic
        if (fileHandle) {
             const writable = await fileHandle.createWritable();
             await writable.write(pdf.output('blob'));
             await writable.close();

        } else {
            // Fallback for browsers without proper FS API support
            pdf.save(filename);
            alert("Raport PDF został zapisany w folderze Pobrane (fallback).");
        }
        
    } catch (e) {
        console.error(e);
        alert("Błąd: " + e);
    } finally {
        if(btn) btn.classList.remove('p-disabled');
    }
};

</script>

<template>
    <div class="flex h-full w-full overflow-hidden relative surface-ground" id="report-area">
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="onFileSelected" />
        
        <!-- SIDEBAR: Views (Fixed Width) -->
        <div class="w-16rem flex flex-column gap-2 overflow-y-auto border-right-1 surface-border p-2 bg-surface-0 flex-shrink-0">
            <div v-for="view in views" :key="view.id" 
                 class="p-2 cursor-pointer transition-colors border-left-4"
                 :class="selectedView === view.id ? 'surface-hover border-primary' : 'border-transparent hover:surface-ground'"
                 @click="selectedView = view.id">
                 
                 <div class="font-bold mb-1">{{ view.label }}</div>
                 <div class="w-full aspect-ratio-16-9 bg-surface-200 border-round overflow-hidden relative flex align-items-center justify-content-center bg-black-alpha-90">
                     <img v-if="images[view.id]" :src="images[view.id]!" class="max-w-full max-h-full w-auto h-auto" />
                     <div v-else class="text-white-alpha-50"><i class="pi pi-image"></i></div>
                 </div>
                 <Button label="Wybierz" icon="pi pi-upload" class="w-full mt-2 p-button-sm p-button-outlined" @click.stop="pickImage(view.id)" />
            </div>
             
             <div class="mt-auto flex flex-column gap-2">
                 <Button label="Zapisz Sesję" icon="pi pi-save" class="p-button-secondary p-button-outlined" @click="openSaveDialog" />
                 <Button label="Wczytaj Sesję" icon="pi pi-folder-open" class="p-button-secondary p-button-outlined" @click="showLoadDialog = true" />
                 <Button label="Raport PDF" icon="pi pi-file-pdf" class="p-button-success" @click="generatePDF" />
             </div>
        </div>

        <!-- MAIN CANVAS (Flex Grow) -->
        <div class="flex-1 flex flex-column p-0 bg-black-alpha-90 relative overflow-hidden" style="min-width: 0;">
             <!-- Toolbar -->
             <div class="flex gap-2 p-2 surface-overlay border-bottom-1 surface-border align-items-center overflow-x-auto flex-shrink-0">
                 <Button label="Kalibracja" icon="pi pi-arrows-h" size="small" 
                    :severity="interactionMode === 'calibration' ? 'warning' : 'secondary'" 
                    @click="startCalibration" />
                 
                 <template v-if="selectedView.startsWith('side')">
                     <!-- Buttons removed as per user request (auto-initialization) -->
                 </template>
                 
                 <div class="border-left-1 surface-border mx-2 h-2rem"></div>
                 
                 <Button v-if="currentResult?.calibration.p1" label="Zmień dł." icon="pi pi-pencil" size="small" outlined @click="setCalibrationLength" />
                 <span v-if="currentResult?.calibration" class="text-xs ml-2">
                    {{ currentResult.calibration.realLengthMm }}mm 
                    ({{ currentResult.calibration.ratio ? currentResult.calibration.ratio.toFixed(2) : '-' }} mm/px)
                 </span>
             </div>

             <!-- Canvas Container -->
             <div class="flex-1 relative overflow-hidden flex align-items-center justify-content-center bg-black-alpha-90" style="min-height: 0;">
                 <PostureCanvas 

                    :imageSrc="images[selectedView]" 
                    :analysisResult="results[selectedView]" 
                    :viewType="selectedView"
                    :interactionMode="interactionMode"
                    @update-points="onPointsUpdate"
                    @update-calibration="onCalibrationUpdate"
                    @point-click="onPointClick"
                    @update-plumb-line="handlePlumbLineUpdate"
                    class="w-full h-full"
                 />
                 
                 <!-- Interaction Hint -->
                 <div v-if="interactionMode !== 'none'" class="absolute bottom-0 left-0 w-full p-2 bg-primary text-center text-sm opacity-90 z-2">
                     Tryb: {{ interactionMode.toUpperCase() }} - Kliknij na zdjęciu aby dodać punkt
                 </div>
             </div>
        </div>

        <!-- RESULTS (Fixed Width) -->
        <div class="w-20rem flex flex-column overflow-hidden border-left-1 surface-border p-0 h-full flex-shrink-0 bg-surface-0">
             <div class="font-bold text-xl p-3 surface-ground border-bottom-1 surface-border flex-shrink-0">Wyniki Analizy</div>
             <div class="overflow-y-auto flex-grow-1 p-3">
                <div v-if="currentResult">
                    <Card class="mb-3 surface-ground border-transparent shadow-none">
                        <template #content>
                            <div class="flex flex-column gap-2">
                                 <div v-for="(metric, key) in currentResult.angles" :key="key" 
                                    class="flex justify-content-between align-items-center border-bottom-1 surface-border pb-1">
                                     <span class="text-sm font-medium">{{ key }}</span>
                                     <span class="font-bold param-value white-space-nowrap" :class="{
                                         'text-green-500': metric.status === 'norm',
                                         'text-red-500': metric.status === 'error',
                                         'text-orange-500': metric.status === 'warning'
                                     }">{{ metric.value }}</span>
                                 </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <div v-else class="text-center text-color-secondary mt-5">
                    Brak analizy dla tego widoku.
                </div>
            </div>
        </div>

        <!-- DIALOGS -->
        <Dialog v-model:visible="showSaveDialog" header="Zapisz Sesję" :modal="true" class="w-30rem">
            <div class="field">
                <label class="block mb-2">Nazwa Sesji</label>
                <InputText v-model="saveSessionName" class="w-full" autofocus />
            </div>
            <template #footer>
                <Button label="Anuluj" icon="pi pi-times" class="p-button-text" @click="showSaveDialog = false" />
                <Button label="Zapisz" icon="pi pi-check" @click="saveSession" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showLoadDialog" header="Zapisane Sesje" :modal="true" class="w-30rem">
            <div v-if="savedSessions.length === 0" class="text-center p-4">Brak zapisanych sesji.</div>
            <div v-else class="flex flex-column gap-2 max-h-20rem overflow-y-auto">
                <div v-for="s in savedSessions" :key="s.id" class="flex justify-content-between align-items-center p-2 surface-card border-round">
                    <div>
                        <div class="font-bold">{{ s.name }}</div>
                        <div class="text-xs text-color-secondary">
                            {{ s.date }} • {{ (s.data && s.data.view && views.find(v => v.id === s.data.view)?.label) || 'Nieznany widok' }}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Button icon="pi pi-folder-open" class="p-button-rounded p-button-text" @click="loadSession(s.data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="deleteSession(s.id)" />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>

    <!-- Hidden PDF Table Generator -->
    <!-- Use absolute off-screen positioning instead of opacity to ensure html2canvas sees it as 'visible' -->
    <div ref="pdfTableRef" class="fixed bg-white p-4 text-gray-900" style="left: -9999px; top: 0; width: 600px; z-index: -1000;">
        <div v-if="pdfTableData" class="flex flex-column gap-2 text-gray-900">
            <div class="font-bold text-xl mb-2 text-gray-900">Wyniki Pomiarów</div>
            <div class="grid grid-nogutter border-bottom-2 surface-border pb-1 font-bold text-sm bg-gray-100 p-1 text-gray-900">
                <div class="col-6">Parametr</div>
                <div class="col-3 text-right">Wartość</div>
                <div class="col-3 text-center">Status</div>
            </div>
            <div v-for="(metric, key) in pdfTableData" :key="key" 
                 class="grid grid-nogutter border-bottom-1 surface-border py-1 align-items-center text-sm text-gray-900">
                <div class="col-6 font-medium">{{ key }}</div>
                <div class="col-3 text-right font-bold">{{ metric.value }}</div>
                <div class="col-3 flex justify-content-center">
                    <span v-if="metric.status === 'norm'" class="bg-green-500 text-white border-round px-2 py-0 text-xs font-bold">OK</span>
                    <span v-else class="bg-red-500 text-white border-round px-2 py-0 text-xs font-bold">!</span>
                </div>
            </div>
            <div v-if="Object.keys(pdfTableData).length === 0" class="text-center text-gray-500 italic py-2">
                Brak danych pomiarowych
            </div>
        </div>
    </div>
</template>

<style scoped>
.aspect-ratio-16-9 { aspect-ratio: 16/9; }
</style>
