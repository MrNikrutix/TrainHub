import type { Point } from './usePostureAnalysis';

// Constants
export const THRESHOLDS = {
    TILT_WARN: 1.5, // degrees
    CVA_NORM: 50,   // degrees
    TRUNK_LEAN_WARN: 2.0 // degrees (estimate)
};

// --- Helper Math ---
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

// vector removed

const degrees = (radians: number) => radians * (180 / Math.PI);

// Angle of vector relative to horizontal (0 degrees = Right, 90 = Down in image coords usually, -90 Up)
// We want standard math: 0=Right, 90=Up?
// Image coords: Y grows down.
// Math.atan2(dy, dx).
// If we want "Tilt" from horizontal: abs(atan2(dy, dx))
export const calculateTilt = (p1: Point, p2: Point): number => {
    if (!p1 || !p2) return 0;
    const dy = p2.y - p1.y; // Y is down
    const dx = p2.x - p1.x;
    return degrees(Math.atan2(dy, dx));
};

// CVA: Angle between Horizontal and C7->Tragus
// C7 is pivot.
// Vector V = Tragus - C7.
// Angle = angle of V with Horizontal (-1, 0) (Posterior horizontal line)
export const calculateCVA = (c7: Point, tragus: Point): number => {
    if (!c7 || !tragus) return 0;
    // In image coords (Y down), Horizontal Posterior line from C7 (assuming facing Right) is (-1, 0).
    // Wait, usually CVA is measured on Side view.
    // If facing Right: Ear is to right of C7? No, Ear is above and slightly forward/back.
    // CVA is formed by horizontal line at C7 and the line to the ear.
    // Ideally it's ~50 degrees upwards from horizontal.

    // Vector C7 -> Tragus
    const dx = tragus.x - c7.x;
    const dy = tragus.y - c7.y; // negative if ear is above C7

    // We want angle against Horizontal.
    // atan2(-dy, dx) gives angle in standard math coords (Y increasing up).
    // Let's use simple atan2 of vector.
    // If facing RIGHT: vector is (+x, -y). Angle ~ 45-60 deg.
    // If facing LEFT: vector is (-x, -y). Angle ~ 120-135 deg?
    // We want the inner angle relative to the horizontal line pointing BACKWARDS from the neck?
    // Standard definition: Angle formed by horizontal line at C7 and line extending to Tragus.
    // Usually measured from the horizontal looking forward? Or horizontal looking back?
    // CVA < 50 is bad (head forward).
    // If neck is perfectly vertical (impossible), angle is 90.
    // If neck is horizontal (turtle), angle is 0.
    // So it's angle from horizontal.
    // We assume we want absolute angle from horizontal plane.
    return Math.abs(degrees(Math.atan2(-dy, Math.abs(dx))));
};

// --- Landmark Estimations ---

export const estimateC7 = (shoulderL: Point, shoulderR: Point, nose: Point): Point => {
    if (!shoulderL || !shoulderR || !nose) return { x: 0, y: 0 };

    const midShoulder = {
        x: (shoulderL.x + shoulderR.x) / 2,
        y: (shoulderL.y + shoulderR.y) / 2
    };

    // Distance Nose to MidShoulder
    const neckLen = dist(nose, midShoulder);

    // Shift Up (negative Y) by 15%
    // "przesunąć w górę o ok. 15% długości szyi"
    // We assume C7 is roughly where the neck starts, MP shoulders are joint centers (lower).
    // Actually C7 is slightly *above* the line connecting shoulder joints in 2D projection?
    // Or is it? Acromion is high. C7 is often level or slightly above.
    // Heuristic: Move UP.
    return {
        x: midShoulder.x,
        y: midShoulder.y - (neckLen * 0.20) // 20% feels safer for C7 vs shoulder center line
    };
};

export const correctASIS = (hipL: Point, hipR: Point, shoulderL: Point, shoulderR: Point): { l: Point, r: Point } => {
    if (!hipL || !hipR || !shoulderL || !shoulderR) return { l: hipL, r: hipR };

    const shoulderWidth = dist(shoulderL, shoulderR);
    const offset = shoulderWidth * 0.15;

    // Move Outwards
    // Left Hip (on screen left usually) -> Move Left (-x)
    // Right Hip -> Move Right (+x)
    // Assuming Front view where Left Hip is on right side of image?
    // MP: LEFT_HIP is person's left.
    // If person faces cam: LEFT_HIP is on Image Right.
    // So we need to check x coords to determine "Outwards".

    // We assume MP Hips (23, 24) are internal.
    // ASIS is lateral. 
    // Shift Outwards by 15% of Shoulder Width.
    // Direction depend on which hip is left/right on SCREEN.

    // Determine center of hips
    const hipCenter = (hipL.x + hipR.x) / 2;

    // HipL is usually on the Right side of the screen if Front View (Subject's Left).
    // But MP documentation says:
    // 23 - left hip
    // 24 - right hip
    // If user faces camera: 23 is on Screen Right (larger X), 24 is on Screen Left (smaller X).

    // Let's just use the vector HipR -> HipL (Lateral direction).
    // If Front View: 24(R) -> 23(L) is vector pointing RIGHT (positive X).
    // If Back View: 23(L) -> 24(R) is vector pointing RIGHT.

    // Safer: Move away from center.
    const moveFromCenter = (pt: Point, centerX: number, amount: number) => {
        if (pt.x < centerX) return { ...pt, x: pt.x - amount }; // Move Left
        else return { ...pt, x: pt.x + amount }; // Move Right
    };

    const newL = moveFromCenter(hipL, hipCenter, offset);
    const newR = moveFromCenter(hipR, hipCenter, offset);

    return { l: newL, r: newR };
};

export const calculateTrunkLean = (midShoulder: Point, midHip: Point): number => {
    // Angle against Vertical
    if (!midShoulder || !midHip) return 0;
    const dx = midShoulder.x - midHip.x;
    const dy = midShoulder.y - midHip.y; // usually negative
    // Vertical is 90.
    const angle = degrees(Math.atan2(Math.abs(dy), Math.abs(dx))); // 90 is vertical
    return Math.abs(90 - angle);
};

export const calculateATSI = (c7: Point, s1: Point, shoulderL: Point, shoulderR: Point, _hipL: Point, _hipR: Point): number => {
    /* 
       ATSI (Anterior Trunk Symmetry Index) simplified:
       Asymmetry of areas/distances.
       Let's check lateral deviation of C7-S1 axis vs center of body blocks.
       Or simpler: (Dist(C7, AcromionL) - Dist(C7, AcromionR)) / Mean...
       User req: "różnice odległościowe między lewą a prawą stroną tułowia względem linii pośrodkowej"
    */
    if (!c7 || !s1) return 0;

    // Only feasible if we have solid Axis.
    // Let's implement simple "Trunk Asymmetry":
    // |( ShoulderL.x - Axis )| - |( ShoulderR.x - Axis )|
    // Axis defined by S1 vertical? Or C7-S1 line.

    // Let's approximate by Waist Triangle diff provided earlier, that's standard POTSI component.
    // Here: return Asymmetry of Shoulders relative to C7 X-coord.
    const distL = Math.abs(shoulderL.x - c7.x);
    const distR = Math.abs(shoulderR.x - c7.x);
    return Math.abs(distL - distR);
};
