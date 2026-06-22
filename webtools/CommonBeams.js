// =========================================================================
// CommonBeams.js - DETERMINISTIC CLASSICAL PIECEWISE EQUILIBRIUM ENGINE
// =========================================================================

const CommonBeams = {
    solve: function(L, type, loads, EI, s1, s2) {
        let supports = [];
        let Ma = 0, Mb = 0;
        let sumF = 0, sumM_0 = 0;

        // 1. Compute Global Resultant Force vectors & Primary Moments
        loads.forEach(ld => {
            if (ld.type === 'P') {
                sumF += ld.mag; 
                sumM_0 += ld.mag * ld.a;
            } else if (ld.type === 'U') {
                let force = ld.mag * (ld.b - ld.a);
                sumF += force; 
                sumM_0 += force * (ld.a + (ld.b - ld.a) / 2);
            } else if (ld.type === 'Tri') {
                let force = 0.5 * ld.mag * (ld.b - ld.a);
                sumF += force; 
                sumM_0 += force * (ld.a + 2 * (ld.b - ld.a) / 3);
            }
        });

        // 2. Classically solve for system boundary reactions via standard equilibrium equations
        if (type === 'simply') {
            let R2 = sumM_0 / L;
            let R1 = sumF - R2;
            supports.push({ x: 0, R: R1, type: 'pin' });
            supports.push({ x: L, R: R2, type: 'pin' });
        } else if (type === 'cantilever') {
            supports.push({ x: 0, R: sumF, type: 'fixed' });
            Ma = -sumM_0; 
        } else if (type === 'overhanging') {
            let sumM_s1 = 0;
            loads.forEach(ld => {
                if (ld.type === 'P') sumM_s1 += ld.mag * (ld.a - s1);
                if (ld.type === 'U') sumM_s1 += (ld.mag * (ld.b - ld.a)) * ((ld.a + (ld.b - ld.a)/2) - s1);
                if (ld.type === 'Tri') sumM_s1 += (0.5 * ld.mag * (ld.b - ld.a)) * ((ld.a + 2*(ld.b - ld.a)/3) - s1);
            });
            let R2 = sumM_s1 / (s2 - s1);
            let R1 = sumF - R2;
            supports.push({ x: s1, R: R1, type: 'pin' });
            supports.push({ x: s2, R: R2, type: 'pin' });
        } else if (type === 'propped') {
            // Classical determinate evaluation fallback pairing for propped configurations
            let R2 = (3 * sumM_0) / (2 * L); 
            let R1 = sumF - R2;
            Ma = -(sumM_0 - R2 * L);
            supports.push({ x: 0, R: R1, type: 'fixed' });
            supports.push({ x: L, R: R2, type: 'pin' });
        }

        // 3. 600-Point Classical Piecewise Slicing Routine
        let mathData = [];
        const numPoints = 600;
        let maxV = 0.001, maxM = 0.001, maxY = 0.001;

        // Arrays to accumulate double integration values for deflection curves
        let V_arr = new Array(numPoints + 1).fill(0);
        let M_arr = new Array(numPoints + 1).fill(0);
        let slope = new Array(numPoints + 1).fill(0);
        let defl = new Array(numPoints + 1).fill(0);

        for (let i = 0; i <= numPoints; i++) {
            let x = i * (L / numPoints);
            let V = 0, M = 0;

            // Piecewise boundary summation for internal reactions
            supports.forEach(sup => {
                if (x >= sup.x) {
                    V += sup.R;
                    M += sup.R * (x - sup.x);
                }
            });
            if (x >= 0) M += Ma;

            // Piecewise checking of external structural loading entries
            loads.forEach(ld => {
                if (ld.type === 'P' && x >= ld.a) {
                    V -= ld.mag;
                    M -= ld.mag * (x - ld.a);
                } else if (ld.type === 'U' && x > ld.a) {
                    let activeLength = Math.min(x, ld.b) - ld.a;
                    let f = ld.mag * activeLength;
                    V -= f;
                    M -= f * (x - (ld.a + activeLength / 2));
                } else if (ld.type === 'Tri' && x > ld.a) {
                    if (x >= ld.b) {
                        let f = 0.5 * ld.mag * (ld.b - ld.a);
                        V -= f;
                        M -= f * (x - (ld.a + 2 * (ld.b - ld.a) / 3));
                    } else {
                        let currentW = ld.mag * ((x - ld.a) / (ld.b - ld.a));
                        let f = 0.5 * currentW * (x - ld.a);
                        V -= f;
                        M -= f * ((x - ld.a) / 3);
                    }
                }
            });

            V_arr[i] = V;
            M_arr[i] = M;
            maxV = Math.max(maxV, Math.abs(V));
            maxM = Math.max(maxM, Math.abs(M));
        }

        // Numerical Integration Routine for Piecewise Deflection Analysis
        let dx = L / numPoints;
        for (let i = 1; i <= numPoints; i++) {
            slope[i] = slope[i-1] + (M_arr[i] / EI) * dx;
        }
        for (let i = 1; i <= numPoints; i++) {
            defl[i] = defl[i-1] + slope[i] * dx;
        }

        // Perform boundary configuration adjustments to correct numerical drift vectors
        let correctionSlope = 0;
        let baseDeflection = 0; // FIX: New baseline constant C_2
        let anchorX = 0;        // FIX: New anchor position

        if (type === 'simply' || type === 'propped') {
            correctionSlope = defl[numPoints] / L;
        } else if (type === 'overhanging') {
            let idx1 = Math.round((s1 / L) * numPoints);
            let idx2 = Math.round((s2 / L) * numPoints);
            correctionSlope = (defl[idx2] - defl[idx1]) / (s2 - s1);
            baseDeflection = defl[idx1]; 
            anchorX = s1;
        }

        for (let i = 0; i <= numPoints; i++) {
            let x = i * (L / numPoints);
            // FIX: Subtract baseDeflection and anchor rotation mathematically around s1
            let trueDeflection = (defl[i] - baseDeflection - correctionSlope * (x - anchorX)) * 1000; 
            mathData.push({ x: x, V: V_arr[i], M: M_arr[i], y: trueDeflection });
            maxY = Math.max(maxY, Math.abs(trueDeflection));
        }

        return { L, loads, supports, mathData, maxV, maxM, maxY, type, Ma, Mb };
    }
};