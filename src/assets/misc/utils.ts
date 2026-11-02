interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
}

export function detectPostureStatus(landmarks: Landmark[]): number {
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const isLeftVisible =
        (leftEar.visibility ?? 1) > (rightEar.visibility ?? 1);
    const ear = isLeftVisible ? leftEar : rightEar;
    const shoulder = isLeftVisible ? leftShoulder : rightShoulder;
    const hip = isLeftVisible ? leftHip : rightHip;

    const postureAngle = calculateAngle(ear, shoulder, hip);

    const verticalPoint: Landmark = { x: hip.x, y: hip.y - 1, z: hip.z };
    const torsoTiltAngle = calculateAngle(shoulder, hip, verticalPoint);

    // --- LOGIKA KLASIFIKASI POSTUR (VERSI LEBIH KETAT) ---

    // LEVEL 3: Mode Rebahan (155° - 180°)
    // Ditandai jika torso miring ke belakang >= 45° (sebelumnya 60°)
    // atau posisi tubuh melengkung terlentang
    if (
        torsoTiltAngle >= 45 ||
        (postureAngle >= 155 && shoulder.y > hip.y - 0.15)
    ) {
        return 3; // Index 3: Rebahan
    }

    // LEVEL 2: Postur Buruk (Bungkuk)
    // Diperketat: Punggung/leher yang tadinya terdeteksi bungkuk di bawah 135°,
    // sekarang mulai dari < 145° sudah masuk peringatan buruk.
    if (postureAngle < 145) {
        return 2; // Index 2: Bungkuk / Buruk
    }

    // LEVEL 1: Postur Cukup Baik
    // Rentang disesuaikan menjadi 145° hingga 162° (sebelumnya 135° - 154°)
    if (postureAngle >= 145 && postureAngle < 163) {
        return 1; // Index 1: Cukup Baik
    }

    // LEVEL 0: Postur Sempurna / Ideal
    // Diperketat: Harus tegak minimal >= 163° untuk mendapatkan nilai sempurna (sebelumnya >= 155°)
    return 0; // Index 0: Sempurna
}
