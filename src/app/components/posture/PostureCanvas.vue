<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { PostureAnalysisResult, PosturePoints, Point } from '../../composables/usePostureAnalysis';
import { drawGrid, drawSkeleton, drawPoints, drawCalibration, drawMedicalLines, drawAngleVisuals, drawSagittalAnalysis } from '../../utils/postureDrawing';

const props = defineProps<{
    imageSrc: string | null;
    analysisResult: PostureAnalysisResult | null;
    viewType: string;
    interactionMode: string;
}>();

const emit = defineEmits(['update-points', 'update-calibration', 'point-click', 'update-plumb-line']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

// Help with interaction
const localPoints = ref<PosturePoints | null>(null);

watch(() => props.analysisResult?.points, (newVal) => {
    if (newVal) {
        // Filter nulls? Logic already nulls them out in usePostureAnalysis.
        // But we copy them.
        localPoints.value = JSON.parse(JSON.stringify(newVal));
    }
}, { deep: true, immediate: true });

// Zoom & Pan State
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const startPan = ref({ x: 0, y: 0 });

// Interaction State
const draggingPoint = ref<string | null>(null);
const mousePos = ref<Point>({ x: 0, y: 0 });
const showLoupe = ref(false);

// Cached Image to prevent flickering
const loadedImage = ref<HTMLImageElement | null>(null);

const loadSourceImage = () => {
    if (!props.imageSrc) {
        loadedImage.value = null;
        return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = props.imageSrc;
    img.onload = () => {
        loadedImage.value = img;
        draw();
    };
};

watch(() => props.imageSrc, loadSourceImage, { immediate: true });

const getBaseSize = () => {
    const canvas = canvasRef.value;
    if (!canvas) return 20;
    return Math.max(10, canvas.width * 0.015);
};

// Utils (Hoisted)
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const getCanvasCoords = (e: MouseEvent) => {
    if (!canvasRef.value) return { x: 0, y: 0 };
    const rect = canvasRef.value.getBoundingClientRect();
    
    // 1. Mouse in DOM CSS pixels
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // 2. Map to Internal Canvas Resolution (un-zoomed)
    const domScaleX = canvasRef.value.width / rect.width;
    const domScaleY = canvasRef.value.height / rect.height;
    
    const xRaw = clientX * domScaleX;
    const yRaw = clientY * domScaleY;
    
    // 3. Apply Inverse Transform (Zoom/Pan)
    const x = (xRaw - offset.value.x) / scale.value;
    const y = (yRaw - offset.value.y) / scale.value;
    
    return { x, y };
};

const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = Math.max(0.1, Math.min(scale.value + delta, 5));
    scale.value = newScale;
    draw();
};

const draw = () => {
    const canvas = canvasRef.value;
    if (!canvas || !loadedImage.value) return; 
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = loadedImage.value;
    
    // Optimize: Only resize if dimensions differ to prevent flicker/layout thrashing
    if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
    }
    
    // Clear handled by resize usually, but if not resizing:
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const unit = Math.max(10, canvas.width * 0.015);
    
    ctx.save();
    
    ctx.translate(offset.value.x, offset.value.y);
    ctx.scale(scale.value, scale.value);

    ctx.drawImage(img, 0, 0);
    drawGrid(ctx, canvas.width, canvas.height);

    // Determine Plumb X to draw (Local override during drag for smoothness, else Prop)
    const activePlumbX = (draggingPoint.value === 'plumbLine' && mousePos.value) 
        ? mousePos.value.x 
        : props.analysisResult?.manualPlumbLineX;

    if (localPoints.value) {
        drawSkeleton(ctx, localPoints.value, unit);
        drawPoints(ctx, localPoints.value, unit, scale.value);
        drawMedicalLines(ctx, localPoints.value, unit, scale.value, props.viewType);
        drawAngleVisuals(ctx, localPoints.value, unit, scale.value, props.viewType);
        // Pass activePlumbX
        drawSagittalAnalysis(ctx, localPoints.value, unit, scale.value, props.viewType, props.analysisResult?.calibration, activePlumbX);
    }
    
    drawCalibration(ctx, props.analysisResult?.calibration, unit, scale.value);
    
    ctx.restore();
};

// ... Utils ...

// Helper for Plumb Line Hit logic
const getPlumbLineX = () => {
    // If manaul is set, us it.
    if (props.analysisResult?.manualPlumbLineX !== null && props.analysisResult?.manualPlumbLineX !== undefined) {
         return props.analysisResult.manualPlumbLineX;
    }
    // Fallback order matches drawSagittalAnalysis: Head Center -> Ear -> Ankle
    if (!localPoints.value) return undefined;
    const pts = localPoints.value;
    const isLeft = props.viewType === 'side_left';
    return pts.head_center?.x ?? (isLeft ? pts.ear_l?.x : pts.ear_r?.x) ?? (isLeft ? pts.ankle_l?.x : pts.ankle_r?.x);
};

const onMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning.value = true;
        startPan.value = { x: e.clientX, y: e.clientY };
        return;
    }

    const { x, y } = getCanvasCoords(e);
    const unit = getBaseSize(); 
    const r_visual = (unit * 0.4) / scale.value + (unit * 0.1); 
    const threshold = r_visual * 1.5; 

    // Calibration
    const calib = props.analysisResult?.calibration;
    if (calib?.p1 && dist({x,y}, calib.p1) < threshold) { draggingPoint.value = 'calib_p1'; return; }
    if (calib?.p2 && dist({x,y}, calib.p2) < threshold) { draggingPoint.value = 'calib_p2'; return; }

    // Plumb Line (Sagittal Only)
    if (props.viewType.startsWith('side')) {
        const plumbX = getPlumbLineX();
        
        // Widen Hit Threshold (Line is thin, give it clickable area)
        const hitWidth = (unit * 1.0) / scale.value; 
        if (plumbX !== undefined && Math.abs(x - plumbX) < hitWidth) {
             draggingPoint.value = 'plumbLine';
             // Snap mousePos to x immediately?
             mousePos.value = { x, y };
             return;
        }
    }

    // Points
    if (localPoints.value) {
        for (const [key, pt] of Object.entries(localPoints.value)) {
            // @ts-ignore
            if (pt && dist({x,y}, pt) < threshold) {
                draggingPoint.value = key;
                return;
            }
        }
    }
    
    if (props.interactionMode !== 'none') {
        emit('point-click', { mode: props.interactionMode, x, y });
    }
};

const onMouseMove = (e: MouseEvent) => {
    if (!canvasRef.value) return;
    const { x, y } = getCanvasCoords(e);
    const unit = getBaseSize();

    // Hit Detection for Cursor
    let hoverType = 'default';
    
    // Check Plumb Line Hover
    if (props.viewType.startsWith('side')) {
        const plumbX = getPlumbLineX();
        const hitWidth = (unit * 1.0) / scale.value; 
        
        if (plumbX !== undefined && Math.abs(x - plumbX) < hitWidth) {
             hoverType = 'col-resize';
             if (!draggingPoint.value) containerRef.value!.style.cursor = 'col-resize';
        }
    }

    if (isPanning.value) {
        // ... (pan logic stays same) ...
        const dx = e.clientX - startPan.value.x;
        const dy = e.clientY - startPan.value.y;
        const rect = canvasRef.value!.getBoundingClientRect();
        const domScaleX = canvasRef.value!.width / rect.width;
        
        offset.value.x += dx * domScaleX;
        offset.value.y += dy * domScaleX;
        
        startPan.value = { x: e.clientX, y: e.clientY };
        draw();
        return;
    }

    const mouseP = { x, y };
    mousePos.value = mouseP;

    if (draggingPoint.value) {
        showLoupe.value = true;
        
        if (draggingPoint.value.includes('calib_')) {
             const isP1 = draggingPoint.value === 'calib_p1';
             const cal = props.analysisResult?.calibration;
             if (cal) emit('update-calibration', { p1: isP1 ? mouseP : cal.p1, p2: !isP1 ? mouseP : cal.p2 });
             draw(); // Immediate redraw
        } else if (draggingPoint.value === 'plumbLine') {
             containerRef.value!.style.cursor = 'col-resize';
             emit('update-plumb-line', x);
             draw(); // Immediate redraw with local override
        } else if (localPoints.value) {
             containerRef.value!.style.cursor = 'crosshair';
             const key = draggingPoint.value as keyof PosturePoints;
             if (localPoints.value[key]) {
                 localPoints.value[key] = mouseP;
                 emit('update-points', { ...localPoints.value });
                 draw(); // Immediate redraw
             }
        }
    } else {
        // ... cursor logic ...
        showLoupe.value = false;
        if (hoverType === 'default') {
             // ... existing point hover logic ...
             let overPoint = false;
             // ...
             // (Keep existing hover logic shorter or assume it follows) 
             // To match replacement block, I need to ensure I don't cut off logic.
             // Just copying the start of the else block
             const calib = props.analysisResult?.calibration;
             const thres = ((unit * 0.4) / scale.value + (unit * 0.1)) * 1.5;
             
             if (calib?.p1 && dist(mouseP, calib.p1) < thres) overPoint = true;
             else if (calib?.p2 && dist(mouseP, calib.p2) < thres) overPoint = true;
             else if (localPoints.value) {
                 for (const pt of Object.values(localPoints.value)) {
                     // @ts-ignore
                     if (pt && dist(mouseP, pt) < thres) { overPoint = true; break; }
                 }
             }
             containerRef.value!.style.cursor = overPoint ? 'pointer' : (props.interactionMode !== 'none' ? 'crosshair' : 'default');
        }
    }
};

const onMouseUp = () => { draggingPoint.value = null; isPanning.value = false; showLoupe.value = false; };

const resetZoom = () => {
    scale.value = 1;
    offset.value = { x: 0, y: 0 };
    draw();
};

// Loupe Logic
const loupeCanvas = ref<HTMLCanvasElement | null>(null);
watch(mousePos, () => {
    if (!showLoupe.value || !loupeCanvas.value || !loadedImage.value) return;
    const ctx = loupeCanvas.value.getContext('2d');
    if (!ctx) return;
    
    // Draw from Original Image (Cached)
    const img = loadedImage.value;
    
    // Updated settings: Size 150px, Zoom 1.5x
    const settings = { zoom: 1.5, size: 150 };
    // We want to show 150px of content zoomed 1.5x.
    // So we show 100px of source content.
    const srcW = settings.size / settings.zoom;
    
    ctx.clearRect(0,0,settings.size,settings.size);
    // Draw source patch
    ctx.drawImage(img, mousePos.value.x - srcW/2, mousePos.value.y - srcW/2, srcW, srcW, 0, 0, settings.size, settings.size);
    
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(settings.size/2, 0); ctx.lineTo(settings.size/2, settings.size);
    ctx.moveTo(0, settings.size/2); ctx.lineTo(settings.size, settings.size/2);
    ctx.stroke();
});

watch(() => props.analysisResult, draw, { deep: true });
onMounted(draw);

defineExpose({ draw });

</script>

<template>
    <div ref="containerRef" class="w-full h-full relative overflow-hidden bg-black-alpha-90 select-none flex align-items-center justify-content-center"
         @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
         @wheel="onWheel">
         
        <!-- Ensure Aspect Ratio is preserved to prevent stretching -->
        <canvas ref="canvasRef" style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; object-fit: contain;"></canvas>
        
        <div v-if="!imageSrc" class="absolute inset-0 flex align-items-center justify-content-center text-white pointer-events-none">
            Brak obrazu
        </div>

        <!-- Controls -->
        <div class="absolute top-0 left-0 m-2 flex gap-1 z-3">
            <button class="bg-black-alpha-60 text-white border-none border-round px-2 py-1 cursor-pointer hover:bg-black-alpha-80" @click="scale = Math.min(scale + 0.5, 5); draw()">+</button>
            <button class="bg-black-alpha-60 text-white border-none border-round px-2 py-1 cursor-pointer hover:bg-black-alpha-80" @click="scale = Math.max(scale - 0.5, 0.1); draw()">-</button>
            <button class="bg-black-alpha-60 text-white border-none border-round px-2 py-1 cursor-pointer text-xs hover:bg-black-alpha-80" @click="resetZoom">1:1</button>
            <div class="bg-black-alpha-60 text-white border-round px-2 py-1 text-xs select-none">Shift+Drag to Pan</div>
        </div>

        <!-- Guidelines Overlay -->
        <div class="absolute top-0 right-0 p-3 m-3 bg-black-alpha-60 text-white text-xs border-round pointer-events-none" style="max-width: 200px;">
            <div class="font-bold mb-1">Wytyczne:</div>
            <div>• Kamera na wys. bioder (90-100cm)</div>
            <div>• Odległość 2-3 metry</div>
            <div>• Ustaw pionowo</div>
        </div>

        <!-- Loupe: Reduced size and zoom -->
        <div class="absolute border-2 border-primary border-round overflow-hidden shadow-4 bg-black" 
             style="width: 150px; height: 150px; pointer-events: none; z-index: 100;"
             :style="{ left: '20px', bottom: '20px', display: showLoupe ? 'block' : 'none' }">
             <canvas ref="loupeCanvas" width="150" height="150"></canvas>
             <div class="absolute top-0 left-0 bg-primary text-xs px-1">1.5x</div>
        </div>
    </div>
</template>
