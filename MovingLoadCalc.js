// =========================================================================
// MovingLoadCalc.js - VEHICULAR TRAIN LIVE LOAD ENVELOPE GENERATOR
// =========================================================================

const MovingLoadCalc = {
    solve: function(L, type, axles, EI, s1, s2, method, customSupportsStr, stepSize = 0.2) {
        const numPoints = 600;
        
        // Initialize envelope arrays with extreme opposite infinities
        let envelopeData = Array.from({ length: numPoints + 1 }, (_, i) => ({
            x: i * (L / numPoints),
            maxV: -Infinity, minV: Infinity,
            maxM: -Infinity, minM: Infinity,
            maxY: -Infinity, minY: Infinity
        }));

        let totalTrainLength = axles.reduce((sum, axle) => sum + axle.spacing, 0);

        // Step the train across the beam
        for (let x_lead = 0; x_lead <= L + totalTrainLength; x_lead += stepSize) {
            let activeLoads = [];
            let currentX = x_lead;

            for (let j = 0; j < axles.length; j++) {
                if (j > 0) currentX -= axles[j].spacing;
                if (currentX >= 0 && currentX <= L) {
                    activeLoads.push({ type: 'P', mag: axles[j].weight, a: currentX });
                }
            }

            if (activeLoads.length === 0) continue;

            // Delegate to existing core solvers (Without altering them)
            let snapFrame;
            if (type === 'continuous') {
                snapFrame = ComplexBeams.solve(L, 'continuous', activeLoads, EI, method, customSupportsStr);
                // Apply private integration fix ONLY for the moving load envelopes
                snapFrame = this.fixContinuousDeflection(snapFrame, L, EI);
            } else {
                snapFrame = CommonBeams.solve(L, type, activeLoads, EI, s1, s2);
            }

            // Trace and record the worst-case values
            for (let i = 0; i <= numPoints; i++) {
                let pt = snapFrame.mathData[i];
                let env = envelopeData[i];

                if (pt.V > env.maxV) env.maxV = pt.V;
                if (pt.V < env.minV) env.minV = pt.V;
                if (pt.M > env.maxM) env.maxM = pt.M;
                if (pt.M < env.minM) env.minM = pt.M;
                if (pt.y > env.maxY) env.maxY = pt.y;
                if (pt.y < env.minY) env.minY = pt.y;
            }
        }

        // Clean up unreached nodes
        envelopeData.forEach(env => {
            if (env.maxV === -Infinity) {
                env.maxV = 0; env.minV = 0; env.maxM = 0; env.minM = 0; env.maxY = 0; env.minY = 0;
            }
        });

        let maxV = Math.max(...envelopeData.map(e => Math.max(Math.abs(e.maxV), Math.abs(e.minV))));
        let maxM = Math.max(...envelopeData.map(e => Math.max(Math.abs(e.maxM), Math.abs(e.minM))));
        let maxY = Math.max(...envelopeData.map(e => Math.max(Math.abs(e.maxY), Math.abs(e.minY))));

        return { L, loads: [], supports: [], mathData: envelopeData, envelopeData, maxV, maxM, maxY, type };
    },

    // Private Deflection Fix (Does not alter ComplexBeams.js)
    fixContinuousDeflection: function(snapFrame, L, EI) {
        if (!snapFrame || !snapFrame.mathData || snapFrame.mathData.length === 0) return snapFrame;
        
        let numPoints = snapFrame.mathData.length - 1;
        let dx = L / numPoints;
        let slope = new Array(numPoints + 1).fill(0);
        let defl = new Array(numPoints + 1).fill(0);
        
        // Conjugate double integration
        for (let i = 1; i <= numPoints; i++) slope[i] = slope[i-1] + (snapFrame.mathData[i].M / EI) * dx;
        for (let i = 1; i <= numPoints; i++) defl[i] = defl[i-1] + slope[i] * dx;
        
        // Enforce boundary pinning on the first two supports
        if (snapFrame.supports && snapFrame.supports.length >= 2) {
            let s1 = snapFrame.supports[0].x;
            let s2 = snapFrame.supports[1].x;
            let i1 = Math.min(numPoints, Math.max(0, Math.round((s1 / L) * numPoints)));
            let i2 = Math.min(numPoints, Math.max(0, Math.round((s2 / L) * numPoints)));
            
            if (i1 !== i2) {
                let C1 = (defl[i1] - defl[i2]) / (s2 - s1);
                let C2 = -defl[i1] - C1 * s1;
                
                snapFrame.maxY = 0;
                for(let i = 0; i <= numPoints; i++) {
                    let x = i * dx;
                    snapFrame.mathData[i].y = (defl[i] + C1 * x + C2) * 1000;
                    snapFrame.maxY = Math.max(snapFrame.maxY, Math.abs(snapFrame.mathData[i].y));
                }
            }
        }
        return snapFrame;
    }
};