import { ref } from 'vue';
import { Pose, type Results } from '@mediapipe/pose';
import * as Medical from './medicalMetrics';

// Landmark indices
const LANDMARKS = {
    NOSE: 0,
    LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7, RIGHT_EAR: 8,
    MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
    LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
    LEFT_WRIST: 15, RIGHT_WRIST: 16,
    LEFT_HIP: 23, RIGHT_HIP: 24,
    LEFT_KNEE: 25, RIGHT_KNEE: 26,
    LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
    LEFT_HEEL: 29, RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
};

export interface Point { x: number; y: number; }

// Unified Posture Points (Manual + Auto combined)
// Unified Posture Points (15-Point Sagittal Model + Front/Back support)
export interface PosturePoints {
    // Standard Body (MediaPipe)
    nose: Point | null;
    eye_l: Point | null; eye_r: Point | null; // Added eyes for heuristics (Head Center etc)
    ear_l: Point | null; ear_r: Point | null;
    shoulder_l: Point | null; shoulder_r: Point | null;
    elbow_l: Point | null; elbow_r: Point | null;
    wrist_l: Point | null; wrist_r: Point | null;
    hip_l: Point | null; hip_r: Point | null;
    knee_l: Point | null; knee_r: Point | null;
    ankle_l: Point | null; ankle_r: Point | null;
    heel_l: Point | null; heel_r: Point | null;
    toe_l: Point | null; toe_r: Point | null;

    // Derived / Specific anatomical points
    c7: Point | null;
    head_center: Point | null; // Pkt 1
    tmj: Point | null;         // Pkt 3
    chin: Point | null;        // Pkt 4
    neck: Point | null;        // Pkt 5 (Cervical Lordosis Peak)
    kyphosis: Point | null;    // Pkt 7 (Thoracic)
    lordosis: Point | null;    // Pkt 8 (Lumbar)
    glute: Point | null;       // Pkt 11
    s1: Point | null;
}

export interface CalibrationData {
    p1: Point | null;
    p2: Point | null;
    realLengthMm: number;
    ratio: number | null; // mm per pixel
}

export interface PostureAnalysisResult {
    points: PosturePoints;
    angles: Record<string, { value: number | string, status: 'norm' | 'warning' | 'error' }>;
    viewType: 'front' | 'back' | 'side_left' | 'side_right';
    calibration: CalibrationData;
    manualPlumbLineX: number | null; // User-defined vertical reference line (X-coordinate)
}

const initialCalibration: CalibrationData = {
    p1: null, p2: null, realLengthMm: 1000, ratio: null
};

const degrees = (radians: number) => radians * (180 / Math.PI);

export function usePostureAnalysis() {
    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    const isReady = ref(false);
    pose.onResults(() => { isReady.value = true; });

    // --- Helper to convert raw MP landmark to Pixel Point ---
    const toPoint = (lm: any, w: number, h: number): Point | null => {
        if (!lm || lm.visibility < 0.5) return null;
        return { x: lm.x * w, y: lm.y * h };
    };

    const detectPoints = (landmarks: any[], w: number, h: number): PosturePoints => {
        const p = (idx: number) => toPoint(landmarks[idx], w, h);

        const rawPoints: PosturePoints = {
            nose: p(LANDMARKS.NOSE),
            eye_l: p(LANDMARKS.LEFT_EYE), eye_r: p(LANDMARKS.RIGHT_EYE),
            ear_l: p(LANDMARKS.LEFT_EAR), ear_r: p(LANDMARKS.RIGHT_EAR),
            shoulder_l: p(LANDMARKS.LEFT_SHOULDER), shoulder_r: p(LANDMARKS.RIGHT_SHOULDER),
            elbow_l: p(LANDMARKS.LEFT_ELBOW), elbow_r: p(LANDMARKS.RIGHT_ELBOW),
            wrist_l: p(LANDMARKS.LEFT_WRIST), wrist_r: p(LANDMARKS.RIGHT_WRIST),
            hip_l: p(LANDMARKS.LEFT_HIP), hip_r: p(LANDMARKS.RIGHT_HIP),
            knee_l: p(LANDMARKS.LEFT_KNEE), knee_r: p(LANDMARKS.RIGHT_KNEE),
            ankle_l: p(LANDMARKS.LEFT_ANKLE), ankle_r: p(LANDMARKS.RIGHT_ANKLE),
            heel_l: p(LANDMARKS.LEFT_HEEL), heel_r: p(LANDMARKS.RIGHT_HEEL),
            toe_l: p(LANDMARKS.LEFT_FOOT_INDEX), toe_r: p(LANDMARKS.RIGHT_FOOT_INDEX),

            c7: null, kyphosis: null, lordosis: null, s1: null, neck: null,
            head_center: null, tmj: null, chin: null, glute: null
        };

        // --- derived points initialization happens in analyzeImage for view-specific logic ---
        return rawPoints;
    };

    // Helper: Initialize derived points based on view
    const initializeDerivedPoints = (pts: PosturePoints, view: string) => {
        if (view.startsWith('side')) {
            const isLeft = view === 'side_left';
            const ear = isLeft ? pts.ear_l : pts.ear_r;
            const shoulder = isLeft ? pts.shoulder_l : pts.shoulder_r;
            const hip = isLeft ? pts.hip_l : pts.hip_r;
            const nose = pts.nose;

            // Direction multiplier (Facing Right = 1, Left = -1)
            // If nose X > ear X => Facing Right.
            const facingRight = (nose && ear) ? (nose.x > ear.x) : true;
            const dir = facingRight ? 1 : -1;

            if (ear) {
                // 1. Head Center (referencyjny w linii ucha, wyżej)
                if (!pts.head_center) pts.head_center = { x: ear.x, y: ear.y - 40 };

                // 3. TMJ (Staw skroniowo-żuchwowy) - Forward & Down from ear
                if (!pts.tmj) pts.tmj = { x: ear.x + (15 * dir), y: ear.y + 10 };
            }

            // 4. Chin (Podbródek)
            if (nose && ear) {
                if (!pts.chin) pts.chin = { x: nose.x, y: ear.y + 40 };
            } else if (ear) {
                if (!pts.chin) pts.chin = { x: ear.x + (40 * dir), y: ear.y + 40 };
            }

            // 5. Neck (Szczyt lordozy szyjnej)
            if (ear && shoulder) {
                const midX = (ear.x + shoulder.x) / 2;
                const midY = (ear.y + shoulder.y) / 2;
                if (!pts.neck) pts.neck = { x: midX - (15 * dir), y: midY };
            }

            // 6. C7 (Shoulder level approx)
            if (shoulder) {
                if (!pts.c7) pts.c7 = { x: shoulder.x - (10 * dir), y: shoulder.y - 15 };
            }

            // 7. Kyphosis (Thoracic) & 8. Lordosis (Lumbar)
            // Heuristic between Shoulder and Hip
            if (shoulder && hip) {
                const dy = hip.y - shoulder.y;
                const tY = shoulder.y + dy * 0.35; // Thoracic height
                const lY = shoulder.y + dy * 0.70; // Lumbar height

                // Kyphosis (Backwards), Lordosis (Forwards)
                if (!pts.kyphosis) pts.kyphosis = { x: shoulder.x - (25 * dir), y: tY };
                if (!pts.lordosis) pts.lordosis = { x: shoulder.x + (10 * dir), y: lY };
            }

            // 11. Glute (Wyniosłość pośladków)
            if (hip) {
                if (!pts.glute) pts.glute = { x: hip.x - (40 * dir), y: hip.y + 20 };
            }
        }
    };

    const recalculateMetrics = (
        viewType: string,
        points: PosturePoints,
        calib: CalibrationData,
        manualPlumbX?: number | null
    ) => {
        const angles: Record<string, { value: number | string, status: 'norm' | 'warning' | 'error' }> = {};

        const toVal = (val: number, isMm: boolean = false): string => {
            if (isMm && calib.ratio) return (val * calib.ratio).toFixed(0) + ' mm';
            return val.toFixed(1) + (isMm ? ' px' : '°');
        };

        const check = (name: string, val: number, normMin: number, normMax: number, isMm: boolean = false) => {
            let status: 'norm' | 'warning' | 'error' = 'norm';
            // ... existing check logic ...
            if (val < normMin || val > normMax) status = 'error';
            angles[name] = { value: toVal(val, isMm), status };
        };

        // ... 

        // --- Analysis ---
        if (viewType === 'front' || viewType === 'back') {
            // ... existing front logic ...
            // 1. Shoulder Tilt
            if (points.shoulder_l && points.shoulder_r) {
                const tilt = Medical.calculateTilt(points.shoulder_l, points.shoulder_r);
                check("Nachylenie Barków", Math.abs(tilt), 0, Medical.THRESHOLDS.TILT_WARN);
            }

            // 2. Pelvic Tilt
            if (points.hip_l && points.hip_r) {
                const tilt = Medical.calculateTilt(points.hip_l, points.hip_r);
                check("Nachylenie Miednicy", Math.abs(tilt), 0, Medical.THRESHOLDS.TILT_WARN);
            }

            // 3. Trunk Lean
            if (points.shoulder_l && points.shoulder_r && points.hip_l && points.hip_r) {
                const midS = { x: (points.shoulder_l.x + points.shoulder_r.x) / 2, y: (points.shoulder_l.y + points.shoulder_r.y) / 2 };
                const midH = { x: (points.hip_l.x + points.hip_r.x) / 2, y: (points.hip_l.y + points.hip_r.y) / 2 };
                const lean = Medical.calculateTrunkLean(midS, midH);
                check("Przechylenie Tułowia", lean, 0, Medical.THRESHOLDS.TRUNK_LEAN_WARN);
            }

            // 4. ATSI
            if (points.c7 && points.s1 && points.shoulder_l && points.shoulder_r && points.hip_l && points.hip_r) {
                const asym = Medical.calculateATSI(points.c7, points.s1, points.shoulder_l, points.shoulder_r, points.hip_l, points.hip_r);
                const valMm = calib.ratio ? asym * calib.ratio : asym;
                const limit = calib.ratio ? 15 : 30;
                if (valMm > limit) angles["Asymetria Tułowia"] = { value: toVal(asym, true), status: 'error' };
                else angles["Asymetria Tułowia"] = { value: toVal(asym, true), status: 'norm' };
            }

        } else if (viewType.startsWith('side')) {
            const isLeft = viewType === 'side_left';
            const ear = isLeft ? points.ear_l : points.ear_r;
            const shoulder = isLeft ? points.shoulder_l : points.shoulder_r;
            const hip = isLeft ? points.hip_l : points.hip_r;
            const knee = isLeft ? points.knee_l : points.knee_r;
            const ankle = isLeft ? points.ankle_l : points.ankle_r;

            // 1. CVA
            if (points.c7 && ear) {
                const cva = Medical.calculateCVA(points.c7, ear);
                if (cva < Medical.THRESHOLDS.CVA_NORM) angles["Kąt CVA"] = { value: cva.toFixed(1) + '°', status: 'error' };
                else angles["Kąt CVA"] = { value: cva.toFixed(1) + '°', status: 'norm' };
            }

            // 2. FHP (Forward Head Posture)
            if (ear && shoulder) {
                const dist = Math.abs(ear.x - shoulder.x);
                const isForward = isLeft ? (ear.x < shoulder.x) : (ear.x > shoulder.x);
                if (isForward) {
                    const valMm = calib.ratio ? dist * calib.ratio : dist;
                    const limit = calib.ratio ? 25 : 40;
                    if (valMm > limit) angles["FHP (Wysunięcie)"] = { value: toVal(dist, true), status: 'error' };
                    else angles["FHP"] = { value: toVal(dist, true), status: 'norm' };
                } else {
                    angles["FHP"] = { value: "Norma", status: 'norm' };
                }
            }

            // 3. Knee Extension
            if (hip && knee && ankle) {
                const ang = Math.abs(degrees(Math.atan2(ankle.y - knee.y, ankle.x - knee.x) - Math.atan2(hip.y - knee.y, hip.x - knee.x)));
                // const kneeAngle = ang > 180 ? 360 - ang : ang; (Old deviation logic)
                const kneeAngle = ang; // Raw angle ~180

                // Warn if significant deviation (e.g. <170 or >190)
                if (kneeAngle < 170 || kneeAngle > 190) {
                    check("Kąt Kolanowy", kneeAngle, 170, 190);
                } else {
                    angles["Kąt Kolanowy"] = { value: kneeAngle.toFixed(0) + '°', status: 'norm' };
                }
            }

            // --- 4. Plumb Line Analysis (Linear Deviations) ---
            // Use manual if available, else Head Center (Red Line)
            const refRedX = points.head_center ? points.head_center.x : (isLeft ? points.ear_l?.x : points.ear_r?.x);
            const refX = (manualPlumbX !== undefined && manualPlumbX !== null) ? manualPlumbX : refRedX;

            if (refX !== undefined && refX !== null) {

                // Determine Facing Direction (Nose vs Ear)
                // If Nose X < Ear X => Facing Left. Forward is Negative X direction (smaller X).
                // If Nose X > Ear X => Facing Right. Forward is Positive X direction.
                const nose = points.nose;
                let facingRight = true;
                if (nose && ear) facingRight = nose.x > ear.x;

                const getDeviation = (pt: Point, name: string) => {
                    const rawDiff = pt.x - refX;
                    // Normalize: Positive = Forward, Negative = Backward
                    const val = facingRight ? rawDiff : -rawDiff;

                    // Value in mm (if calibrated) or px
                    const valStr = toVal(val, true);

                    // Thresholds (Medical Norms roughly: alignment +/- 2cm)
                    const limit = calib.ratio ? 20 : 30; // 20mm
                    const status = Math.abs(val * (calib.ratio || 1)) > limit ? 'warning' : 'norm';

                    angles[`Odstęp ${name}`] = { value: (val > 0 ? '+' : '') + valStr, status };
                };

                // Add requested points
                // Add requested points ONLY
                if (points.neck) getDeviation(points.neck, "Szczyt lordozy szyjnej");
                if (points.kyphosis) getDeviation(points.kyphosis, "Szczyt kifozy piersiowej");
                if (points.lordosis) getDeviation(points.lordosis, "Szczyt lordozy lędźwiowej");
                if (points.glute) getDeviation(points.glute, "Wyniosłość pośladków");
            }
        }

        return angles;
    };

    const filterPointsByView = (pts: PosturePoints, view: string): PosturePoints => {
        const filtered = { ...pts };
        if (view === 'side_left') {
            // Keep Left, Remove Right
            filtered.ear_r = null; filtered.shoulder_r = null; filtered.elbow_r = null; filtered.wrist_r = null;
            filtered.hip_r = null; filtered.knee_r = null; filtered.ankle_r = null;
            // Strict: Remove Opposite Foot, Nose, Eyes
            filtered.heel_r = null; filtered.toe_r = null;
            filtered.nose = null; filtered.eye_l = null; filtered.eye_r = null;
        } else if (view === 'side_right') {
            // Keep Right, Remove Left
            filtered.ear_l = null; filtered.shoulder_l = null; filtered.elbow_l = null; filtered.wrist_l = null;
            filtered.hip_l = null; filtered.knee_l = null; filtered.ankle_l = null;
            // Strict: Remove Opposite Foot, Nose, Eyes
            filtered.heel_l = null; filtered.toe_l = null;
            filtered.nose = null; filtered.eye_l = null; filtered.eye_r = null;
        } else if (view === 'back') {
            filtered.nose = null; // No nose in back view
        }
        return filtered;
    };

    const analyzeImage = async (imageElement: HTMLImageElement, viewType: any): Promise<PostureAnalysisResult> => {
        return new Promise((resolve) => {
            pose.onResults((results: Results) => {
                // Initialize clean structure
                let generatedPoints: PosturePoints = {
                    nose: null, eye_l: null, eye_r: null, ear_l: null, ear_r: null,
                    shoulder_l: null, shoulder_r: null, elbow_l: null, elbow_r: null,
                    wrist_l: null, wrist_r: null, hip_l: null, hip_r: null,
                    knee_l: null, knee_r: null, ankle_l: null, ankle_r: null,
                    heel_l: null, heel_r: null, toe_l: null, toe_r: null,
                    c7: null, kyphosis: null, lordosis: null, s1: null, neck: null,
                    head_center: null, tmj: null, chin: null, glute: null
                };

                if (results.poseLandmarks) {
                    const raw = detectPoints(results.poseLandmarks, imageElement.width, imageElement.height);
                    generatedPoints = filterPointsByView(raw, viewType);

                    // Apply Heuristics for 15-point model
                    initializeDerivedPoints(generatedPoints, viewType);

                    // Legacy C7/ASIS corrections for front view
                    if (viewType === 'front') {
                        if (raw.shoulder_l && raw.shoulder_r && raw.nose) {
                            generatedPoints.c7 = Medical.estimateC7(raw.shoulder_l, raw.shoulder_r, raw.nose);
                        }
                        // ASIS
                        if (raw.hip_l && raw.hip_r && raw.shoulder_l && raw.shoulder_r) {
                            const corrected = Medical.correctASIS(raw.hip_l, raw.hip_r, raw.shoulder_l, raw.shoulder_r);
                            generatedPoints.hip_l = corrected.l;
                            generatedPoints.hip_r = corrected.r;
                        }
                    }
                }

                // Initial Calc
                const calib = { ...initialCalibration };
                const angles = recalculateMetrics(viewType, generatedPoints, calib);

                resolve({
                    points: generatedPoints,
                    angles,
                    viewType,
                    calibration: calib,
                    manualPlumbLineX: null // Blue line starts hidden or at default
                });
            });
            pose.send({ image: imageElement });
        });
    };

    return {
        analyzeImage,
        recalculateMetrics,
        toPoint
    };
}
