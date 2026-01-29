import type { PosturePoints, Point, CalibrationData } from '../composables/usePostureAnalysis';

// Helper Type for drawing context
export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    scale: number;
    unit: number;
    viewType: string;
}

export const pointLabels: Record<string, string> = {
    nose: 'Nos',
    eye_l: 'Oko L', eye_r: 'Oko P',
    ear_l: 'Ucho (wejście)', ear_r: 'Ucho (wejście)',
    shoulder_l: 'Bark', shoulder_r: 'Bark',
    elbow_l: 'Łokieć', elbow_r: 'Łokieć',
    wrist_l: 'Nadgarstek (wyr. rylcowaty)', wrist_r: 'Nadgarstek (wyr. rylcowaty)',
    hip_l: 'Krętarz', hip_r: 'Krętarz',
    knee_l: 'Środek kolana', knee_r: 'Środek kolana',
    ankle_l: 'Kostka', ankle_r: 'Kostka',
    heel_l: 'Pięta', heel_r: 'Pięta',
    toe_l: 'Paluch', toe_r: 'Paluch',

    c7: 'C7', kyphosis: 'Szczyt kifozy piersiowej', lordosis: 'Szczyt lordozy lędźwiowej', s1: 'S1', neck: 'Szczyt lordozy szyjnej',
    head_center: 'Centrum głowy', tmj: 'Staw skroniowo-żuchwowy', chin: 'Podbródek', glute: 'Wyniosłość pośladków'
};

export const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = Math.max(1, w * 0.001);

    const step = w / 20;
    for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
};

export const drawSkeleton = (ctx: CanvasRenderingContext2D, pts: PosturePoints, unit: number) => {
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = unit * 0.15;

    const line = (p1: Point | null, p2: Point | null) => {
        if (p1 && p2) { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); }
    };

    line(pts.shoulder_l, pts.shoulder_r);
    line(pts.shoulder_l, pts.elbow_l); line(pts.elbow_l, pts.wrist_l);
    line(pts.shoulder_r, pts.elbow_r); line(pts.elbow_r, pts.wrist_r);
    line(pts.shoulder_l, pts.hip_l); line(pts.shoulder_r, pts.hip_r);
    line(pts.hip_l, pts.hip_r);
    line(pts.hip_l, pts.knee_l); line(pts.knee_l, pts.ankle_l);
    line(pts.hip_r, pts.knee_r); line(pts.knee_r, pts.ankle_r);

    // Foot
    line(pts.ankle_l, pts.heel_l); line(pts.heel_l, pts.toe_l); line(pts.ankle_l, pts.toe_l);
    line(pts.ankle_r, pts.heel_r); line(pts.heel_r, pts.toe_r); line(pts.ankle_r, pts.toe_r);

    // Spine Chain (Visual) mainly for side
    line(pts.head_center, pts.neck);
    line(pts.neck, pts.kyphosis);
    line(pts.kyphosis, pts.lordosis);
    line(pts.lordosis, pts.s1); // or Glute?
};

export const drawPoints = (ctx: CanvasRenderingContext2D, pts: PosturePoints, unit: number, scale: number) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (const [key, pt] of Object.entries(pts)) {
        if (!pt) continue;
        if (key === 'c7') continue; // Hide C7 as requested

        ctx.beginPath();
        const r = (unit * 0.4) / scale + (unit * 0.1);
        ctx.arc(pt.x, pt.y, Math.max(5, r), 0, 2 * Math.PI);

        if (key.includes('_l')) ctx.fillStyle = '#3B82F6';
        else if (key.includes('_r')) ctx.fillStyle = '#EF4444';
        else if (['c7', 'kyphosis', 'lordosis', 's1', 'neck', 'head_center', 'tmj', 'chin', 'glute'].includes(key)) ctx.fillStyle = '#F59E0B';
        else ctx.fillStyle = '#10B981';

        ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = (unit * 0.1) / scale; ctx.stroke();

        const label = pointLabels[key] || key;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = unit * 0.2;
        ctx.shadowOffsetX = unit * 0.05;
        ctx.shadowOffsetY = unit * 0.05;

        // Font relative to Unit
        const fontSize = Math.max(12, (unit * 1.0) / scale);
        ctx.font = `bold ${fontSize}px Arial`;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = (unit * 0.15) / scale;
        const yOff = -(r + (unit * 0.2) / scale);
        ctx.strokeText(label, pt.x, pt.y + yOff);
        ctx.fillText(label, pt.x, pt.y + yOff);

        ctx.shadowColor = 'transparent';
    }
};

export const drawCalibration = (ctx: CanvasRenderingContext2D, calib: CalibrationData | undefined, unit: number, scale: number) => {
    if (calib && calib.p1 && calib.p2) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = unit * 0.2 / scale;
        ctx.beginPath(); ctx.moveTo(calib.p1.x, calib.p1.y); ctx.lineTo(calib.p2.x, calib.p2.y); ctx.stroke();

        const r = unit * 0.4 / scale;
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath(); ctx.arc(calib.p1.x, calib.p1.y, r, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(calib.p2.x, calib.p2.y, r, 0, 2 * Math.PI); ctx.fill();

        const midX = (calib.p1.x + calib.p2.x) / 2;
        const midY = (calib.p1.y + calib.p2.y) / 2;
        const fontSize = Math.max(12, unit * 1.0 / scale);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black'; ctx.lineWidth = unit * 0.15 / scale;
        ctx.strokeText(`${calib.realLengthMm}mm`, midX + 10, midY);
        ctx.fillText(`${calib.realLengthMm}mm`, midX + 10, midY);
    }
};

export const drawMedicalLines = (ctx: CanvasRenderingContext2D, pts: PosturePoints, unit: number, scale: number, viewType: string) => {
    // Prevent unused vars lint error since C7 is commented out
    if (!ctx || !pts || !unit || !scale || !viewType) return;
    // C7 Lines Removed as per user request
    /*
    if (pts.c7) {
        // ...
    }
    */
};

const drawAngleArc = (ctx: CanvasRenderingContext2D, center: Point, startAngle: number, endAngle: number, radius: number, color: string, valueStr: string, unit: number, scale: number, fill: boolean = false) => {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
    if (fill) {
        ctx.lineTo(center.x, center.y);
        ctx.lineTo(center.x, center.y);
        ctx.fillStyle = color; // Use color for fill
        ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = unit * 0.15 / scale;
    ctx.stroke();

    // Correct Mid-Angle calculation handling wrap-around
    let span = endAngle - startAngle;
    while (span < 0) span += 2 * Math.PI;

    const midAngle = startAngle + span / 2;
    const textR = radius * 1.4;
    const tx = center.x + Math.cos(midAngle) * textR;
    const ty = center.y + Math.sin(midAngle) * textR;

    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, (unit * 0.8) / scale)}px Arial`;
    ctx.shadowColor = 'black'; ctx.shadowBlur = 3;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(valueStr, tx, ty);
    ctx.shadowColor = 'transparent';
};

export const drawAngleVisuals = (ctx: CanvasRenderingContext2D, pts: PosturePoints, unit: number, scale: number, viewType: string) => {
    // 1. CVA (Side) - Removed visual as per user request
    /*
    if (viewType.startsWith('side') && pts.c7) {
        const ear = viewType === 'side_left' ? pts.ear_l : pts.ear_r;
        if (ear) {
            const dx = ear.x - pts.c7.x;
            const dy = ear.y - pts.c7.y;
            const angle = Math.atan2(dy, dx);
            // ...
        }
    }
    */

    // 2. Knee Extension (Side)
    if (viewType.startsWith('side')) {
        const isLeft = viewType === 'side_left';
        const hip = isLeft ? pts.hip_l : pts.hip_r;
        const knee = isLeft ? pts.knee_l : pts.knee_r;
        const ankle = isLeft ? pts.ankle_l : pts.ankle_r;

        if (hip && knee && ankle) {
            const angle1 = Math.atan2(hip.y - knee.y, hip.x - knee.x);
            const angle2 = Math.atan2(ankle.y - knee.y, ankle.x - knee.x);

            // Calculate raw angle deg
            let angleRad = angle2 - angle1;
            if (angleRad < 0) angleRad += 2 * Math.PI;
            const deg = Math.abs(angleRad * 180 / Math.PI);

            // Swap order to draw the "External" angle (Opposite sector)
            // Previously angle1 -> angle2. Now angle2 -> angle1.
            // const color = '#FBBF24'; // Yellow
            // Use angle2 as start, angle1 as end to invert the arc
            drawAngleArc(ctx, knee, angle2, angle1, unit * 1.5 / scale, 'rgba(251, 191, 36, 0.4)', `${deg.toFixed(0)}°`, unit, scale, true);
        }
    }
};

export const drawSagittalAnalysis = (ctx: CanvasRenderingContext2D, pts: PosturePoints, unit: number, scale: number, viewType: string, calib?: CalibrationData, manualPlumbX?: number | null) => {
    if (!viewType.startsWith('side')) return;

    const isLeft = viewType === 'side_left';

    // --- 1. Red Dashed Line (Static Reference: Head Center) ---
    // User requested Reference Line to pass through Head Center.
    const refRedX = pts.head_center ? pts.head_center.x : (isLeft ? pts.ear_l?.x : pts.ear_r?.x);

    if (refRedX) {
        ctx.strokeStyle = '#EF4444'; // Red
        ctx.lineWidth = unit * 0.15 / scale;
        ctx.setLineDash([unit * 0.2, unit * 0.2]);
        ctx.beginPath();
        ctx.moveTo(refRedX, 0);
        ctx.lineTo(refRedX, ctx.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // --- 2. Blue Solid Line (Manual: Draggable) ---
    // Defaults to Head Center (Red Line) if not set manually
    const blueX = (manualPlumbX !== undefined && manualPlumbX !== null) ? manualPlumbX : refRedX;

    if (blueX !== undefined && blueX !== null) {
        ctx.strokeStyle = '#3B82F6'; // Blue
        ctx.lineWidth = unit * 0.25 / scale;
        ctx.beginPath();
        ctx.moveTo(blueX, 0);
        ctx.lineTo(blueX, ctx.canvas.height);
        ctx.stroke();

        // Draw Handle
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath(); ctx.moveTo(blueX - 10, 0); ctx.lineTo(blueX + 10, 0); ctx.lineTo(blueX, 20); ctx.fill();

        // --- 3. Measurements (Blue Line to Kyphosis, Lordosis, Glute) ---
        // Measurement Targets: Neck, Kyphosis, Lordosis, Glute
        const targets = [
            { pt: pts.neck, label: 'Szczyt lordozy szyjnej' },
            { pt: pts.kyphosis, label: 'Szczyt kifozy piersiowej' },
            { pt: pts.lordosis, label: 'Szczyt lordozy lędźwiowej' },
            { pt: pts.glute, label: 'Wyniosłość pośladków' }
        ];

        const nose = pts.nose;
        const ear = isLeft ? pts.ear_l : pts.ear_r;
        const facingRight = (nose && ear) ? nose.x > ear.x : true;

        ctx.font = `bold ${Math.max(10, (unit * 0.8) / scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        targets.forEach(({ pt, label: _label }) => {
            if (!pt) return;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = unit * 0.1 / scale;
            ctx.setLineDash([unit * 0.1, unit * 0.1]);

            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(blueX, pt.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label logic
            const rawDist = Math.abs(pt.x - blueX);
            const dx = pt.x - blueX;
            // Direction (+/-) relative to facing direction
            const isForward = facingRight ? (dx > 0) : (dx < 0);
            const sign = isForward ? '+' : '-';

            let text = "";
            if (calib && calib.ratio) {
                const mm = (rawDist * calib.ratio).toFixed(0);
                text = `${sign}${mm} mm`;
            } else {
                text = `${sign}${rawDist.toFixed(0)} px`;
            }

            // Draw Label bg and text
            const midX = (pt.x + blueX) / 2;
            const midY = pt.y - (unit * 0.1 / scale);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const width = ctx.measureText(text).width + 10;
            const height = (unit * 1.2 / scale);
            ctx.fillRect(midX - width / 2, midY - height + 2, width, height);

            if (Math.abs(dx) > (calib && calib.ratio ? (25 / calib.ratio) : 35)) ctx.fillStyle = '#ff6b6b';
            else ctx.fillStyle = '#4ade80';

            const fontSize = Math.max(10, (unit * 0.8) / scale);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'white'; // Text Color
            ctx.fillText(text, midX, midY + (height / 2));
        });
    }
};
