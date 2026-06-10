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

            // Delegate to existing core solvers
            let snapFrame;
            if (type === 'continuous') {
                snapFrame = ComplexBeams.solve(L, 'continuous', activeLoads, EI, method, customSupportsStr);
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

    fixContinuousDeflection: function(snapFrame, L, EI) {
        if (!snapFrame || !snapFrame.mathData || snapFrame.mathData.length === 0) return snapFrame;
        
        let numPoints = snapFrame.mathData.length - 1;
        let dx = L / numPoints;
        let slope = new Array(numPoints + 1).fill(0);
        let defl = new Array(numPoints + 1).fill(0);
        
        for (let i = 1; i <= numPoints; i++) slope[i] = slope[i-1] + (snapFrame.mathData[i].M / EI) * dx;
        for (let i = 1; i <= numPoints; i++) defl[i] = defl[i-1] + slope[i] * dx;
        
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

// =========================================================================
// UI CONTROLLERS & RENDERING ENGINE
// =========================================================================

let currentMlResult = null; 

function launchMovingLoadTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    const appInterface = document.getElementById('activeAppInterface');
    appInterface.style.display = 'block';
    
    document.getElementById('appTitle').innerText = "MOVING LOAD CALCULATOR";
    
    document.getElementById('appContent').innerHTML = `
        <div class="app-section-title">System Parameters</div>
        <div class="app-grid">
            <div class="app-group">
                <label>Beam Length (L) in m:</label>
                <input type="number" id="ml_L" value="20" min="1" step="1">
            </div>
            <div class="app-group">
                <label>Support 1 (x) in m:</label>
                <input type="number" id="ml_s1" value="0" step="1">
            </div>
            <div class="app-group">
                <label>Support 2 (x) in m:</label>
                <input type="number" id="ml_s2" value="20" step="1">
            </div>
            <div class="app-group">
                <label>Flexural Stiffness (EI) in kNm²:</label>
                <input type="number" id="ml_EI" value="20000" step="1000">
            </div>
        </div>

        <div class="app-section-title">Vehicular Axle Loads (Train)</div>
        <div id="ml_axles_container">
            <div class="app-grid axle-row">
                <div class="app-group">
                    <label>Axle 1 (Front) Weight (kN):</label>
                    <input type="number" class="axle-weight" value="35">
                </div>
                <div class="app-group">
                    <label>Spacing from Prev (m):</label>
                    <input type="number" class="axle-spacing" value="0" readonly style="background:#F1F1F4 !important; color:#888 !important;">
                </div>
            </div>
            <div class="app-grid axle-row">
                <div class="app-group">
                    <label>Axle 2 Weight (kN):</label>
                    <input type="number" class="axle-weight" value="145">
                </div>
                <div class="app-group">
                    <label>Spacing from Axle 1 (m):</label>
                    <input type="number" class="axle-spacing" value="4.3" step="0.1">
                </div>
            </div>
            <div class="app-grid axle-row">
                <div class="app-group">
                    <label>Axle 3 (Rear) Weight (kN):</label>
                    <input type="number" class="axle-weight" value="145">
                </div>
                <div class="app-group">
                    <label>Spacing from Axle 2 (m):</label>
                    <input type="number" class="axle-spacing" value="4.3" step="0.1">
                </div>
            </div>
        </div>
        
        <div class="app-actions">
            <button class="btn-run" onclick="runMovingLoadAnalysis()">Generate Envelope</button>
        </div>

        <div class="app-results" id="ml_results" style="display:none; background: var(--bg-section-alt); padding: 25px; border-left: 4px solid var(--text-primary); margin-bottom: 20px;">
            <div class="app-section-title" style="color: #999999; border-bottom: 1px solid #111111; padding-bottom: 10px;">Envelope Extremes</div>
            
            <p style="color: var(--text-secondary); display: flex; justify-content: space-between; border-bottom: 1px solid rgba(17,17,17,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                <span>Absolute Max Shear (|V|):</span> <span id="ml_maxV" class="result-val" style="color: var(--text-primary); font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700;">-</span>
            </p>
            <p style="color: var(--text-secondary); display: flex; justify-content: space-between; border-bottom: 1px solid rgba(17,17,17,0.1); padding-bottom: 15px; margin-bottom: 15px;">
                <span>Absolute Max Moment (|M|):</span> <span id="ml_maxM" class="result-val" style="color: var(--text-primary); font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700;">-</span>
            </p>
            <p style="color: var(--text-secondary); display: flex; justify-content: space-between; padding-bottom: 15px; margin-bottom: 15px;">
                <span>Absolute Max Deflection (|Δ|):</span> <span id="ml_maxY" class="result-val" style="color: var(--text-primary); font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700;">-</span>
            </p>
            
            <div style="margin-top: 30px; margin-bottom: 10px; padding: 20px; background: var(--bg-card); border: 1px solid rgba(17,17,17,0.1); border-radius: 4px;">
                <label style="color: var(--text-primary); font-weight: bold; font-family: 'Lato', sans-serif;">Simulate Train Position (Lead Axle):</label>
                <div style="display: flex; align-items: center; gap: 15px; margin-top: 15px;">
                    <input type="range" id="ml_truck_slider" min="0" max="20" step="0.1" value="0" style="flex-grow: 1;" oninput="updateTruckPosition()">
                    <span id="ml_truck_pos_display" style="color: var(--text-primary); font-family: 'Playfair Display', serif; font-weight: bold; width: 60px;">0.0 m</span>
                </div>
                
                <div id="ml_instant_readout" style="display: flex; justify-content: space-between; font-family: 'Lato', sans-serif; font-size: 0.9rem; margin-top: 20px; color: var(--text-secondary);">
                    <div><strong>Cut x:</strong> <span id="rd_x" style="color:var(--text-primary);">0.0</span> m</div>
                    <div><strong>V:</strong> <span id="rd_vmin" style="color:var(--text-primary);">0.0</span> to <span id="rd_v" style="color:var(--text-primary);">0.0</span> kN</div>
                    <div><strong>M:</strong> <span id="rd_mmin" style="color:var(--text-primary);">0.0</span> to <span id="rd_m" style="color:var(--text-primary);">0.0</span> kN·m</div>
                    <div><strong>Δ:</strong> <span id="rd_dmin" style="color:var(--text-primary);">0.0</span> to <span id="rd_d" style="color:var(--text-primary);">0.0</span> mm</div>
                </div>
            </div>

            <div style="position: relative; margin: 20px auto 0;">
                <canvas id="mlCanvas" width="800" height="1100" style="background: transparent; width: 100%; max-width: 800px; display: block;"></canvas>
            </div>
        </div>
    `;
    appInterface.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function runMovingLoadAnalysis() {
    const L = parseFloat(document.getElementById('ml_L').value) || 20;
    const s1 = parseFloat(document.getElementById('ml_s1').value) || 0;
    const s2 = parseFloat(document.getElementById('ml_s2').value) || L;
    const EI = parseFloat(document.getElementById('ml_EI').value) || 20000;

    const axleRows = document.querySelectorAll('.axle-row');
    let axles = [];
    axleRows.forEach(row => {
        const w = parseFloat(row.querySelector('.axle-weight').value) || 0;
        const s = parseFloat(row.querySelector('.axle-spacing').value) || 0;
        if (w > 0 || s > 0) axles.push({ weight: w, spacing: s });
    });

    if (axles.length === 0) return alert('Please enter at least one axle weight.');

    let type = 'simply';
    if (s1 > 0 || s2 < L) type = 'overhanging';
    
    currentMlResult = MovingLoadCalc.solve(L, type, axles, EI, s1, s2, null, null, 0.2);
    currentMlResult.supports = [{x: s1, type: 'pin'}, {x: s2, type: 'roller'}];
    currentMlResult.axles = axles;
    currentMlResult.EI = EI; 

    document.getElementById('ml_results').style.display = 'block';
    document.getElementById('ml_maxV').innerText = currentMlResult.maxV.toFixed(2) + ' kN';
    document.getElementById('ml_maxM').innerText = currentMlResult.maxM.toFixed(2) + ' kN·m';
    document.getElementById('ml_maxY').innerText = currentMlResult.maxY.toFixed(2) + ' mm';

    let totalTrainLength = axles.reduce((sum, ax) => sum + ax.spacing, 0);
    const slider = document.getElementById('ml_truck_slider');
    slider.max = L + totalTrainLength;
    slider.value = 0;

    updateTruckPosition();
}

function updateTruckPosition() {
    if (!currentMlResult) return;
    const slider = document.getElementById('ml_truck_slider');
    const posDisplay = document.getElementById('ml_truck_pos_display');
    
    let exactX = parseFloat(slider.value);
    posDisplay.innerText = exactX.toFixed(1) + ' m';
    
    let activeLoads = [];
    let currentPos = exactX;
    currentMlResult.axles.forEach((axle, j) => {
        if (j > 0) currentPos -= axle.spacing;
        if (currentPos >= 0 && currentPos <= currentMlResult.L) {
            activeLoads.push({ type: 'P', mag: axle.weight, a: currentPos });
        }
    });

    let snapFrame;
    if (currentMlResult.type === 'continuous') {
        snapFrame = ComplexBeams.solve(currentMlResult.L, 'continuous', activeLoads, currentMlResult.EI, 'matrix_stiffness', currentMlResult.supports.map(s=>s.x).join(','));
        if (typeof MovingLoadCalc.fixContinuousDeflection === 'function') {
            snapFrame = MovingLoadCalc.fixContinuousDeflection(snapFrame, currentMlResult.L, currentMlResult.EI);
        }
    } else {
        snapFrame = CommonBeams.solve(currentMlResult.L, currentMlResult.type, activeLoads, currentMlResult.EI, currentMlResult.supports[0].x, currentMlResult.supports[1].x);
    }
    
    let evalX = Math.max(0, Math.min(exactX, currentMlResult.L));
    
    let pEnv = currentMlResult.envelopeData.reduce((prev, curr) => Math.abs(curr.x - evalX) < Math.abs(prev.x - evalX) ? curr : prev);
    let pInst = snapFrame.mathData.reduce((prev, curr) => Math.abs(curr.x - evalX) < Math.abs(prev.x - evalX) ? curr : prev);

    document.getElementById('rd_x').innerText = pEnv.x.toFixed(2);
    document.getElementById('rd_v').innerText = pEnv.maxV.toFixed(2);
    document.getElementById('rd_vmin').innerText = pEnv.minV.toFixed(2);
    document.getElementById('rd_m').innerText = pEnv.maxM.toFixed(2);
    document.getElementById('rd_mmin').innerText = pEnv.minM.toFixed(2);
    document.getElementById('rd_d').innerText = pEnv.maxY.toFixed(2);
    document.getElementById('rd_dmin').innerText = pEnv.minY.toFixed(2);

    let renderPoint = { 
        ...pEnv, 
        truckX: exactX, 
        snapFrame: snapFrame,
        instV: pInst.V,
        instM: pInst.M,
        instY: pInst.y
    };
    
    drawMLEnvelopes(renderPoint);
}

function drawMLEnvelopes(renderPoint) {
    if (!currentMlResult) return;
    const canvas = document.getElementById('mlCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padX = 80;
    const gWidth = canvas.width - padX * 2;
    
    const schemaCenterY = 120; 
    const dimCenterY = 220; 
    const sfdCenterY = 460; 
    const bmdCenterY = 720; 
    const defCenterY = 980;
    const graphHeight = 130;

    const mapX = x => padX + (x / currentMlResult.L) * gWidth;
    const mapV = v => sfdCenterY - (v / (currentMlResult.maxV || 1)) * (graphHeight/2);
    const mapM = m => bmdCenterY + (m / (currentMlResult.maxM || 1)) * (graphHeight/2); 
    const mapD = d => defCenterY + (d / (currentMlResult.maxY || 1)) * (graphHeight/2);

    ctx.strokeStyle = '#111111'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mapX(0), schemaCenterY); ctx.lineTo(mapX(currentMlResult.L), schemaCenterY); ctx.stroke();

    currentMlResult.supports.forEach(sup => {
        let sx = mapX(sup.x);
        ctx.lineWidth = 2; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#111111';
        if(sup.type === 'pin') {
            ctx.beginPath(); ctx.moveTo(sx, schemaCenterY); ctx.lineTo(sx-10, schemaCenterY+15); ctx.lineTo(sx+10, schemaCenterY+15); ctx.closePath(); ctx.stroke(); ctx.fill();
        } else if (sup.type === 'roller') {
            ctx.beginPath(); ctx.moveTo(sx, schemaCenterY); ctx.lineTo(sx-10, schemaCenterY+12); ctx.lineTo(sx+10, schemaCenterY+12); ctx.closePath(); ctx.stroke(); ctx.fill();
            ctx.beginPath(); ctx.arc(sx-4, schemaCenterY+16, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(sx+4, schemaCenterY+16, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
        }
    });

    ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1;
    [0, currentMlResult.supports[0].x, currentMlResult.supports[1].x, currentMlResult.L].forEach(cx => {
        ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mapX(cx), schemaCenterY+20); ctx.lineTo(mapX(cx), dimCenterY+15); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(mapX(0), dimCenterY); ctx.lineTo(mapX(currentMlResult.L), dimCenterY); ctx.stroke();
    ctx.fillStyle = '#7f8c8d'; ctx.font = '12px Courier'; ctx.textAlign = 'center';
    let crits = [...new Set([0, currentMlResult.supports[0].x, currentMlResult.supports[1].x, currentMlResult.L])].sort((a,b)=>a-b);
    for(let i=0; i<crits.length-1; i++) {
        let span = crits[i+1] - crits[i];
        if(span > 0.1) ctx.fillText(`|-${span.toFixed(2)}m-|`, mapX(crits[i] + span/2), dimCenterY + 4);
    }

    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.5;
    [sfdCenterY, bmdCenterY, defCenterY].forEach(y => {
        ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + gWidth, y); ctx.stroke();
    });

    const drawEnv = (data, mapFn, color) => {
        ctx.strokeStyle = `rgba(${color}, 0.5)`; 
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); 
        ctx.beginPath(); ctx.moveTo(mapX(data[0].x), mapFn(data[0].max));
        for(let i=1; i<data.length; i++) ctx.lineTo(mapX(data[i].x), mapFn(data[i].max));
        ctx.stroke();

        ctx.beginPath(); ctx.moveTo(mapX(data[0].x), mapFn(data[0].min));
        for(let i=1; i<data.length; i++) ctx.lineTo(mapX(data[i].x), mapFn(data[i].min));
        ctx.stroke();
        
        ctx.setLineDash([]); 
    };

    const vData = currentMlResult.envelopeData.map(d => ({x: d.x, max: d.maxV, min: d.minV}));
    const mData = currentMlResult.envelopeData.map(d => ({x: d.x, max: d.maxM, min: d.minM}));
    const dData = currentMlResult.envelopeData.map(d => ({x: d.x, max: d.maxY, min: d.minY}));

    drawEnv(vData, mapV, '39, 174, 96');
    drawEnv(mData, mapM, '41, 128, 185');
    drawEnv(dData, mapD, '142, 68, 173');
    
    if (renderPoint && renderPoint.snapFrame && renderPoint.snapFrame.mathData.length > 0) {
        let sData = renderPoint.snapFrame.mathData;
        
        ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(mapX(sData[0].x), mapV(sData[0].V));
        sData.forEach(d => ctx.lineTo(mapX(d.x), mapV(d.V)));
        ctx.stroke();

        ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(mapX(sData[0].x), mapM(sData[0].M));
        sData.forEach(d => ctx.lineTo(mapX(d.x), mapM(d.M)));
        ctx.stroke();

        ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(mapX(sData[0].x), mapD(sData[0].y));
        sData.forEach(d => ctx.lineTo(mapX(d.x), mapD(d.y)));
        ctx.stroke();
    }

    ctx.fillStyle = '#111111'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';
    ctx.fillText("Shear Envelope (V) kN", padX, sfdCenterY - (graphHeight/2) - 25);
    ctx.fillText("Moment Envelope (M) kN·m", padX, bmdCenterY - (graphHeight/2) - 25);
    ctx.fillText("Deflection Envelope (Δ) mm", padX, defCenterY - (graphHeight/2) - 25);

    if (renderPoint) {
        let evalX = mapX(renderPoint.truckX); 
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(evalX, schemaCenterY-10); ctx.lineTo(evalX, defCenterY + graphHeight/2 + 10); ctx.stroke(); ctx.setLineDash([]);

        ctx.fillStyle = '#e74c3c';
        let yV = mapV(renderPoint.instV || 0);
        let yM = mapM(renderPoint.instM || 0);
        let yD = mapD(renderPoint.instY || 0);
        
        [yV, yM, yD].forEach(yCoord => {
            ctx.beginPath(); ctx.arc(evalX, yCoord, 6, 0, 2 * Math.PI); ctx.fill();
        });

        let currentPos = renderPoint.truckX;
        let prevPos = currentPos;
        
        currentMlResult.axles.forEach((axle, j) => {
            if (j > 0) currentPos -= axle.spacing; 
            
            let ax = mapX(currentPos);
            
            if (currentPos >= 0 && currentPos <= currentMlResult.L) {
                ctx.strokeStyle = '#e74c3c'; ctx.fillStyle = '#e74c3c'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(ax, schemaCenterY - 50); ctx.lineTo(ax, schemaCenterY - 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ax, schemaCenterY); ctx.lineTo(ax-8, schemaCenterY-12); ctx.lineTo(ax+8, schemaCenterY-12); ctx.closePath(); ctx.fill();
                ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(`${axle.weight}kN`, ax, schemaCenterY - 55);
            }
            
            if (j > 0 && axle.spacing > 0) {
                let px = mapX(prevPos);
                let cx = mapX(currentPos);
                let dimY = schemaCenterY - 80;
                
                ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(cx, dimY); ctx.lineTo(px, dimY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, dimY - 5); ctx.lineTo(cx, dimY + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, dimY - 5); ctx.lineTo(px, dimY + 5); ctx.stroke();
                
                ctx.fillStyle = '#7f8c8d'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
                ctx.fillText(`${axle.spacing}m`, (cx + px) / 2, dimY - 5);
            }
            prevPos = currentPos;
        });
    }
}