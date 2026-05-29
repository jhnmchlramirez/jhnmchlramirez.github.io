// =========================================================================
// MainUIController.js - PRO STRUCTURAL ANALYSIS ENGINE (CENTRAL UI & RENDER)
// =========================================================================

let beamState = { L: 20, loads: [], supports: [], mathData: [], maxV: 0, maxM: 0, maxY: 0, invert: true, supportType: 'custom', analysisMethod: 'matrix_stiffness', E: 200, I: 100 };
let currentHoverPoint = null; 

function launchSFDBMDTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    const appInterface = document.getElementById('activeAppInterface');
    appInterface.style.display = 'block';
    
    document.getElementById('appTitle').innerText = 'PRO STRUCTURAL ANALYSIS ENGINE';

    const content = document.getElementById('appContent');
    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="background: #1e1e24; padding: 20px; border-radius: 6px; border: 1px solid #2d2d35;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: #FFEE91; margin: 0; font-size: 1.1rem; text-transform: uppercase;">1. System Parameters</h3>
                    <label style="color: #f8fafc; font-size: 0.9rem; cursor: pointer;">
                        <input type="checkbox" id="invertBMD" checked> Draw BMD on Tension Side
                    </label>
                </div>
                
                <div class="app-grid" style="margin-bottom: 15px;">
                    <div class="app-group">
                        <label>Beam Mode:</label>
                        <select id="beamMode">
                            <option value="single" selected>Single Span</option>
                            <option value="continuous">Multi-Span / Continuous</option>
                        </select>
                    </div>
                    
                    <div class="app-group" id="analysisMethodGroup" style="display: none;">
                        <label>Analysis Method:</label>
                        <select id="analysisMethod">
                            <option value="matrix_stiffness" selected>Matrix Stiffness Method</option>
                            <option value="three_moment">Three-Moment Equation</option>
                        </select>
                    </div>

                    <div class="app-group">
                        <label>Total Beam Length (L) in m:</label>
                        <input type="number" id="beamLength" value="20" min="1" step="0.5">
                    </div>
                </div>

                <div class="app-grid" id="singleSpanInputs" style="margin-bottom: 20px; border-left: 3px solid #3498db; padding-left: 10px;">
                    <div class="app-group">
                        <label>Support 1 Pos (x1) in m:</label>
                        <input type="number" id="sup1_pos" value="0" step="0.5">
                        <select id="sup1_type" style="margin-top: 5px;">
                            <option value="pin" selected>Pin</option>
                            <option value="roller">Roller</option>
                            <option value="fixed">Fixed</option>
                        </select>
                    </div>
                    <div class="app-group">
                        <label>Support 2 Pos (x2) in m:</label>
                        <input type="number" id="sup2_pos" value="20" step="0.5">
                        <select id="sup2_type" style="margin-top: 5px;">
                            <option value="pin">Pin</option>
                            <option value="roller" selected>Roller</option>
                            <option value="fixed">Fixed</option>
                        </select>
                    </div>
                </div>

                <div class="app-grid" id="multiSpanInputs" style="display: none; margin-bottom: 20px; border-left: 3px solid #3498db; padding-left: 10px;">
                    <div class="app-group" style="grid-column: 1 / -1;">
                        <label>Manual Supports (Format -> x:type) e.g. 0:pin, 5:roller, 10:fixed:</label>
                        <input type="text" id="customSupports" value="0:pin, 10:roller, 20:roller" placeholder="e.g. 0:pin, 10:roller, 20:fixed">
                    </div>
                </div>

                <h3 style="color: #FFEE91; margin-top: 15px; font-size: 1.1rem; text-transform: uppercase;">2. Cross Section (Deflection)</h3>
                <div class="app-grid" style="margin-bottom: 20px;">
                    <div class="app-group"><label>Young's Modulus (E) in GPa:</label><input type="number" id="matE" value="200" step="10"></div>
                    <div class="app-group"><label>Moment of Inertia (I) in 10⁶ mm⁴:</label><input type="number" id="matI" value="100" step="10"></div>
                </div>

                <h3 style="color: #FFEE91; margin-top: 15px; font-size: 1.1rem; text-transform: uppercase;">3. Complex Loading Matrix</h3>
                
                <div class="load-card">
                    <div class="load-toggle-wrapper">
                        <input type="checkbox" id="enablePoint" checked>
                        <label style="color: #FFEE91; font-weight: bold; margin: 0;">Include Point Load</label>
                    </div>
                    <div class="app-grid">
                        <div class="app-group"><label>Magnitude (P) in kN:</label><input type="number" id="P_val" value="50"></div>
                        <div class="app-group">
                            <label>Position (x1) in m:</label>
                            <input type="number" id="P_pos_num" value="7.5" step="0.1">
                            <input type="range" id="P_pos_slider" value="7.5" min="0" step="0.1">
                        </div>
                    </div>
                </div>

                <div class="load-card">
                    <div class="load-toggle-wrapper">
                        <input type="checkbox" id="enablePartUDL">
                        <label style="color: #FFEE91; font-weight: bold; margin: 0;">Include Uniform Load (UDL)</label>
                    </div>
                    <div class="app-grid">
                        <div class="app-group"><label>Magnitude (w) in kN/m:</label><input type="number" id="wPart_val" value="20"></div>
                        <div class="app-group">
                            <label>Start Position (x1) in m:</label>
                            <input type="number" id="wPart_start_num" value="2" step="0.1">
                            <input type="range" id="wPart_start_slider" value="2" min="0" step="0.1">
                        </div>
                        <div class="app-group">
                            <label>End Position (x2) in m:</label>
                            <input type="number" id="wPart_end_num" value="7" step="0.1">
                            <input type="range" id="wPart_end_slider" value="7" min="0" step="0.1">
                        </div>
                    </div>
                </div>

                <div class="load-card">
                    <div class="load-toggle-wrapper">
                        <input type="checkbox" id="enableTriLoad" checked>
                        <label style="color: #FFEE91; font-weight: bold; margin: 0;">Include Triangular Load 1</label>
                    </div>
                    <div class="app-grid">
                        <div class="app-group">
                            <label>Peak Magnitude (w) in kN/m:</label><input type="number" id="wTri_val" value="50">
                            <label style="margin-top:5px; display:block;">Peak Side Condition:</label>
                            <select id="triPeakSide">
                                <option value="left">Peak on Left Side</option>
                                <option value="right" selected>Peak on Right Side</option>
                            </select>
                        </div>
                        <div class="app-group">
                            <label>Start Position (x1) in m:</label>
                            <input type="number" id="wTri_start_num" value="1.9" step="0.1">
                            <input type="range" id="wTri_start_slider" value="1.9" min="0" step="0.1">
                        </div>
                        <div class="app-group">
                            <label>End Peak Position (x2) in m:</label>
                            <input type="number" id="wTri_end_num" value="6.0" step="0.1">
                            <input type="range" id="wTri_end_slider" value="6.0" min="0" step="0.1">
                        </div>
                    </div>
                </div>

                <div class="load-card">
                    <div class="load-toggle-wrapper">
                        <input type="checkbox" id="enableTrapLoad" checked>
                        <label style="color: #FFEE91; font-weight: bold; margin: 0;">Include Triangular Load 2 (Trap UI)</label>
                    </div>
                    <div class="app-grid">
                        <div class="app-group">
                            <label>Start Magnitude (w1) in kN/m:</label><input type="number" id="wTrap_val1" value="0">
                            <label style="margin-top:5px; display:block;">Peak Side Condition:</label>
                            <select id="trapPeakSide">
                                <option value="left">Left Side Heavy (w1 > w2)</option>
                                <option value="right" selected>Right Side Heavy (w2 > w1)</option>
                            </select>
                        </div>
                        <div class="app-group"><label>End Magnitude (w2) in kN/m:</label><input type="number" id="wTrap_val2" value="30"></div>
                        <div class="app-group">
                            <label>Start Position (x1) in m:</label>
                            <input type="number" id="wTrap_start_num" value="10.2" step="0.1">
                            <input type="range" id="wTrap_start_slider" value="10.2" min="0" step="0.1">
                        </div>
                        <div class="app-group">
                            <label>End Position (x2) in m:</label>
                            <input type="number" id="wTrap_end_num" value="17.8" step="0.1">
                            <input type="range" id="wTrap_end_slider" value="17.8" min="0" step="0.1">
                        </div>
                    </div>
                </div>

            </div>

            <div style="background: #ffffff; padding: 20px; border-radius: 6px; position: relative;">
                <canvas id="diagramCanvas" width="800" height="960" style="background: #ffffff; width: 100%; max-width: 800px; display: block; margin: 0 auto; cursor: crosshair;"></canvas>
                <div id="htmlTooltip" class="canvas-tooltip"></div>
            </div>

            <div class="app-results" style="margin-top: 0; background: #1e1e24; display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: #FFEE91; margin: 0; font-size: 1.1rem; text-transform: uppercase;">Results & System Analysis</h3>
                    <button class="btn-launch" onclick="showDerivationModal()">Show Calculation Breakdown</button>
                </div>
                <div id="macaulayOutput" style="color: #f8fafc; font-family: sans-serif; line-height: 1.6; overflow-x: auto; padding: 10px;">
                    Processing system vectors...
                </div>
            </div>
        </div>

        <div id="calcModal" class="structural-modal" onclick="closeDerivationModal(event)">
            <div class="structural-modal-content" onclick="event.stopPropagation()">
                <button class="close-modal-btn" onclick="closeDerivationModal(event)">&times;</button>
                <div id="calcBreakdown"></div>
            </div>
        </div>
    `;

    setupDualControls();
    calculateAndDraw();
}

function setupDualControls() {
    const L_input = document.getElementById('beamLength');
    const binds = [
        { n: 'P_pos_num', s: 'P_pos_slider', isEnd: false },
        { n: 'wPart_start_num', s: 'wPart_start_slider', isEnd: false, pairN: 'wPart_end_num' },
        { n: 'wPart_end_num', s: 'wPart_end_slider', isEnd: true, pairN: 'wPart_start_num' },
        { n: 'wTri_start_num', s: 'wTri_start_slider', isEnd: false, pairN: 'wTri_end_num' },
        { n: 'wTri_end_num', s: 'wTri_end_slider', isEnd: true, pairN: 'wTri_start_num' },
        { n: 'wTrap_start_num', s: 'wTrap_start_slider', isEnd: false, pairN: 'wTrap_end_num' },
        { n: 'wTrap_end_num', s: 'wTrap_end_slider', isEnd: true, pairN: 'wTrap_start_num' }
    ];

    function enforceBoundaries() {
        let L = parseFloat(L_input.value) || 20;
        binds.forEach(b => {
            let numEl = document.getElementById(b.n);
            let sliEl = document.getElementById(b.s);
            if(!numEl || !sliEl) return;
            sliEl.max = L;
            let val = parseFloat(numEl.value) || 0;
            if (val > L) { val = L; numEl.value = L; sliEl.value = L; }
            if (b.pairN) {
                let pairVal = parseFloat(document.getElementById(b.pairN).value) || 0;
                if (b.isEnd && val < pairVal) { numEl.value = pairVal; sliEl.value = pairVal; }
                if (!b.isEnd && val > pairVal) { numEl.value = pairVal; sliEl.value = pairVal; }
            }
        });
    }

    binds.forEach(b => {
        let numEl = document.getElementById(b.n);
        let sliEl = document.getElementById(b.s);
        if(!numEl || !sliEl) return;
        numEl.addEventListener('input', () => { sliEl.value = numEl.value; enforceBoundaries(); calculateAndDraw(); });
        sliEl.addEventListener('input', () => { numEl.value = sliEl.value; enforceBoundaries(); calculateAndDraw(); });
    });

    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', () => {
            if (input.id === 'beamMode') {
                const isContinuous = input.value === 'continuous';
                document.getElementById('analysisMethodGroup').style.display = isContinuous ? 'flex' : 'none';
                document.getElementById('multiSpanInputs').style.display = isContinuous ? 'block' : 'none';
                document.getElementById('singleSpanInputs').style.display = isContinuous ? 'none' : 'grid';
            }
            if(input.id === 'beamLength') enforceBoundaries();
            calculateAndDraw();
        });
    });
}

function calculateAndDraw() {
    const L = parseFloat(document.getElementById('beamLength').value) || 20;
    const mode = document.getElementById('beamMode').value;
    const invert = document.getElementById('invertBMD').checked;
    const E = parseFloat(document.getElementById('matE').value) || 200;
    const I = parseFloat(document.getElementById('matI').value) || 100;
    const EI = E * I;

    let loads = [];
    if (document.getElementById('enablePoint').checked) {
        loads.push({ type: 'P', mag: parseFloat(document.getElementById('P_val').value)||0, a: parseFloat(document.getElementById('P_pos_num').value)||0 });
    }
    
    if (document.getElementById('enablePartUDL').checked) {
        let w = parseFloat(document.getElementById('wPart_val').value)||0;
        let a = parseFloat(document.getElementById('wPart_start_num').value)||0;
        let b = parseFloat(document.getElementById('wPart_end_num').value)||0;
        if(b > a) loads.push({ type: 'U', mag: w, a: a, b: b, renderShape: 'trap', w1: w, w2: w });
    }

    if (document.getElementById('enableTriLoad').checked) {
        let w = parseFloat(document.getElementById('wTri_val').value)||0;
        let a = parseFloat(document.getElementById('wTri_start_num').value)||0;
        let b = parseFloat(document.getElementById('wTri_end_num').value)||0;
        let condition = document.getElementById('triPeakSide').value;
        let w1 = condition === 'left' ? w : 0;
        let w2 = condition === 'right' ? w : 0;
        if (w !== 0 && b > a) {
            loads.push({ type: 'U', mag: w1, a: a, b: b, renderShape: 'trap', w1: w1, w2: w2 });
            if (w2 !== w1) loads.push({ type: 'Tri', m: (w2 - w1) / (b - a), mag: (w2 - w1), a: a, b: b, renderShape: 'hidden' });
        }
    }

    if (document.getElementById('enableTrapLoad').checked) {
        let w1 = parseFloat(document.getElementById('wTrap_val1').value)||0;
        let w2 = parseFloat(document.getElementById('wTrap_val2').value)||0;
        let a = parseFloat(document.getElementById('wTrap_start_num').value)||0;
        let b = parseFloat(document.getElementById('wTrap_end_num').value)||0;
        let condition = document.getElementById('trapPeakSide').value;
        
        if(condition === 'left' && w1 < w2) { let temp = w1; w1 = w2; w2 = temp; }
        if(condition === 'right' && w2 < w1) { let temp = w1; w1 = w2; w2 = temp; }

        if ((w1 !== 0 || w2 !== 0) && b > a) {
            loads.push({ type: 'U', mag: w1, a: a, b: b, renderShape: 'trap', w1: w1, w2: w2 }); 
            if (w2 !== w1) loads.push({ type: 'Tri', m: (w2 - w1) / (b - a), mag: (w2 - w1), a: a, b: b, renderShape: 'hidden' }); 
        }
    }

    if (mode === 'continuous') {
        const method = document.getElementById('analysisMethod').value;
        const customSupportsRaw = document.getElementById('customSupports').value;
        let supportLocationsStr = customSupportsRaw.split(',').map(s => s.split(':')[0].trim()).join(',');
        
        beamState = ComplexBeams.solve(L, 'continuous', loads, EI, method, supportLocationsStr);
        beamState.type = 'continuous';

        if (!beamState.supports || beamState.supports.length === 0) {
            beamState.supports = customSupportsRaw.split(',').map(s => {
                let parts = s.trim().split(':');
                return { x: parseFloat(parts[0]) || 0, R: 0 };
            });
        }

        customSupportsRaw.split(',').forEach((token, idx) => {
            let parts = token.trim().split(':');
            if(beamState.supports[idx]) beamState.supports[idx].type = parts[1] || 'roller';
        });
    } else {
        const sup1_x = parseFloat(document.getElementById('sup1_pos').value) || 0;
        const sup2_x = parseFloat(document.getElementById('sup2_pos').value) || L;
        const sup1_type = document.getElementById('sup1_type').value;
        const sup2_type = document.getElementById('sup2_type').value;
        
        let beamConfig = 'simply'; 
        if (sup1_type === 'fixed' && sup2_type === 'fixed') {
            beamConfig = 'fixed'; 
        } else if ((sup1_type === 'fixed' && (sup2_type === 'pin' || sup2_type === 'roller')) || 
                   ((sup1_type === 'pin' || sup1_type === 'roller') && sup2_type === 'fixed')) {
            beamConfig = 'propped'; 
        }
        
        beamState = CommonBeams.solve(L, 'simply', loads, EI, sup1_x, sup2_x);
        beamState.type = 'single';
        
        if (!beamState.supports || beamState.supports.length === 0) {
            beamState.supports = [
                { x: sup1_x, R: 0 },
                { x: sup2_x, R: 0 }
            ];
        }

        if (beamState.mathData) {
            beamState.mathData = beamState.mathData.map(p => ({
                x: Number(p.x),
                V: Number(p.V),
                M: Number(p.M),
                y: Number(p.y)
            }));
        }

        if (beamConfig === 'fixed' || beamConfig === 'propped') {
            let MA_ff = 0, MB_ff = 0;
            let spanL = sup2_x - sup1_x;
            
            if (spanL > 0) {
                const steps = 1000;
                const dx = spanL / steps;
                
                for(let i=0; i<steps; i++) {
                    let x = sup1_x + (i + 0.5) * dx;
                    let wx = 0;
                    loads.forEach(ld => {
                        if (ld.renderShape === 'hidden') return; 
                        if (ld.type === 'U' || ld.renderShape === 'trap') {
                            if (x >= ld.a && x <= ld.b) {
                                let w1 = ld.w1 !== undefined ? ld.w1 : ld.mag;
                                let w2 = ld.w2 !== undefined ? ld.w2 : ld.mag;
                                wx += w1 + (w2 - w1) * ((x - ld.a) / (ld.b - ld.a));
                            }
                        }
                    });
                    if (wx !== 0) {
                        let P_eq = wx * dx;
                        let a = x - sup1_x;
                        let b = sup2_x - x;
                        MA_ff += -P_eq * a * b*b / (spanL*spanL);
                        MB_ff += -P_eq * a*a * b / (spanL*spanL);
                    }
                }
                
                loads.forEach(ld => {
                    if (ld.type === 'P' && ld.a > sup1_x && ld.a < sup2_x) {
                        let a = ld.a - sup1_x; 
                        let b = sup2_x - ld.a;
                        MA_ff += -ld.mag * a * b*b / (spanL*spanL);
                        MB_ff += -ld.mag * a*a * b / (spanL*spanL);
                    }
                });

                let M_A = 0, M_B = 0;
                if (sup1_type === 'fixed' && sup2_type === 'fixed') {
                    M_A = MA_ff; M_B = MB_ff;
                } else if (sup1_type === 'fixed') { 
                    M_A = MA_ff + 0.5 * MB_ff;
                } else if (sup2_type === 'fixed') { 
                    M_B = MB_ff + 0.5 * MA_ff;
                }

                let dR = (M_B - M_A) / spanL; 
                if(beamState.supports[0]) { beamState.supports[0].R += dR; beamState.supports[0].M = M_A; }
                if(beamState.supports[1]) { beamState.supports[1].R -= dR; beamState.supports[1].M = M_B; }

                let maxV = 0, maxM = 0, maxY = 0;
                
                beamState.mathData.forEach(p => {
                    let x = p.x;
                    if (x >= sup1_x && x <= sup2_x) {
                        let x_rel = x - sup1_x;
                        p.V = p.V + dR;
                        p.M = p.M + M_A + (M_B - M_A) * (x_rel / spanL);
                        
                        let dy_math = (M_A * x_rel*x_rel / 2 + (M_B - M_A) * x_rel*x_rel*x_rel / (6*spanL) - (2*M_A + M_B) * spanL * x_rel / 6) / EI;
                        p.y = p.y + dy_math * 1000; 
                    }
                    
                    if (Math.abs(p.V) > maxV) maxV = Math.abs(p.V);
                    if (Math.abs(p.M) > maxM) maxM = Math.abs(p.M);
                    if (Math.abs(p.y) > maxY) maxY = Math.abs(p.y);
                });

                beamState.maxV = maxV;
                beamState.maxM = maxM;
                beamState.maxY = maxY;
            }
        }

        if(beamState.supports[0]) beamState.supports[0].type = sup1_type;
        if(beamState.supports[1]) beamState.supports[1].type = sup2_type;
    }

    beamState.invert = invert;
    drawDiagrams();
    renderOutputMetrics();
}

function renderOutputMetrics() {
    let html = `<p><strong>Support Reactions:</strong></p><ul>`;
    beamState.supports.forEach((sup, i) => {
        let label = String.fromCharCode(65 + i);
        html += `<li>Reaction R<sub>${label}</sub> at x = ${sup.x.toFixed(2)} m [${sup.type.toUpperCase()}]: ${sup.R.toFixed(2)} kN</li>`;
        
        if (sup.M && Math.abs(sup.M) > 0.01) {
            html += `<li>Moment M<sub>${label}</sub> at x = ${sup.x.toFixed(2)} m [${sup.type.toUpperCase()}]: ${sup.M.toFixed(2)} kN&middot;m</li>`;
        }
    });
    html += `</ul><hr style="border-color: #333;">`;
    html += `<p><strong>Mathematical Synthesis:</strong> System successfully resolved via piecewise singularity integration (with matrix superposition if fixed).</p>`;
    document.getElementById('macaulayOutput').innerHTML = html;
}

// --- CORE DERIVATION MATHEMATICS GENERATOR ---
function showDerivationModal() {
    const modal = document.getElementById('calcModal');
    const content = document.getElementById('calcBreakdown');
    
    let html = `<h2 style="color: #FFEE91; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px;">Structural Derivation Breakdown</h2>`;
    
    // 1. GLOBAL EQUILIBRIUM
    html += `<h3 style="color: #3498db; margin-top:20px;">Global Equilibrium (Support Reactions)</h3>`;
    html += `<div style="background:#111; padding:15px; border-radius:6px; font-family: monospace; line-height:1.6;">`;
    html += `&Sigma;F<sub>y</sub> = 0<br>`;
    
    let sumF = 0;
    beamState.loads.forEach(ld => {
        if (ld.renderShape === 'hidden') return;
        if (ld.type === 'P') sumF += ld.mag;
        else sumF += ((ld.w1 || ld.mag) + (ld.w2 || ld.mag)) / 2 * (ld.b - ld.a);
    });
    
    html += `[Sum of all applied downward forces acting on the beam span]<br>`;
    html += `Total Downward Force = ${sumF.toFixed(2)} kN<br><br>`;
    
    let rxnEquipText = beamState.supports.map((s, i) => `R<sub>${String.fromCharCode(65+i)}</sub> = ${s.R.toFixed(2)} kN`).join(', ');
    html += `${rxnEquipText}<br><br>`;
    html += `&Sigma;M = 0<br>`;
    html += `[Global Rotational Equilibrium implicitly verified through matrix constraints]<br>`;
    html += `</div>`;

    // 2. SEGMENT INTERVAL EXTRACTION
    let crits = new Set([0, beamState.L]);
    beamState.supports.forEach(s => crits.add(s.x));
    beamState.loads.forEach(l => { crits.add(l.a); if (l.b !== undefined) crits.add(l.b); });
    let sortedCrits = Array.from(crits).sort((a,b) => a-b);
    let segmentIndex = 65; 

    let isBoundaryRedDot = false;
    let boundaryX = null;
    if (currentHoverPoint) {
        for (let i = 1; i < sortedCrits.length - 1; i++) {
            if (Math.abs(currentHoverPoint.x - sortedCrits[i]) < 0.05) {
                isBoundaryRedDot = true;
                boundaryX = sortedCrits[i];
                break;
            }
        }
    }

    for (let i = 0; i < sortedCrits.length - 1; i++) {
        let x1 = sortedCrits[i];
        let x2 = sortedCrits[i+1];
        if (Math.abs(x2 - x1) < 0.001) continue;

        let segName = String.fromCharCode(segmentIndex) + String.fromCharCode(segmentIndex + 1);
        let vSetup = [];
        let mSetup = [];
        let loadFunctionText = "No distributed loads active within this specific segment.";

        beamState.supports.forEach(s => {
            if (s.x <= x1 + 0.001 && s.R !== 0) {
                let sign = s.R > 0 ? '+' : '-';
                vSetup.push(`${sign} ${Math.abs(s.R).toFixed(2)}`);
                mSetup.push(`${sign} ${Math.abs(s.R).toFixed(2)}(x - ${s.x.toFixed(2)})`);
            }
        });

        beamState.loads.forEach(l => {
            if(l.renderShape === 'hidden') return;
            if(l.type === 'P' && l.a <= x1 + 0.001) {
                vSetup.push(`- ${l.mag.toFixed(2)}`);
                mSetup.push(`- ${l.mag.toFixed(2)}(x - ${l.a.toFixed(2)})`);
            } else if ((l.type === 'U' || l.renderShape === 'trap') && l.a <= x1 + 0.001) {
                let w1 = l.w1 !== undefined ? l.w1 : l.mag;
                let w2 = l.w2 !== undefined ? l.w2 : l.mag;
                
                if (x2 <= l.b + 0.001) {
                    if(w1 === w2) {
                        loadFunctionText = `w(x) = ${w1.toFixed(2)} kN/m (Uniform)`;
                        vSetup.push(`- ${w1.toFixed(2)}(x - ${l.a.toFixed(2)})`);
                        mSetup.push(`- 0.5(${w1.toFixed(2)})(x - ${l.a.toFixed(2)})&sup2;`);
                    } else {
                        let slope = (w2 - w1) / (l.b - l.a);
                        loadFunctionText = `w(x) = ${w1.toFixed(2)} + ${slope.toFixed(2)}(x - ${l.a.toFixed(2)}) kN/m (Sloped Profile)`;
                        vSetup.push(`- &int; [${w1.toFixed(2)} + ${slope.toFixed(2)}(x-${l.a.toFixed(2)})]dx`);
                        mSetup.push(`- &int; [w(x)](x-&xi;)d&xi;`);
                    }
                } else {
                    let F = ((w1+w2)/2) * (l.b - l.a);
                    let cent = l.a + (l.b - l.a)/2; 
                    vSetup.push(`- ${F.toFixed(2)}`);
                    mSetup.push(`- ${F.toFixed(2)}(x - ${cent.toFixed(2)})`);
                }
            }
        });

        let strV = vSetup.length > 0 ? vSetup.join(' ') : "0";
        let strM = mSetup.length > 0 ? mSetup.join(' ') : "0";
        if(strV.startsWith('+ ')) strV = strV.substring(2);
        if(strM.startsWith('+ ')) strM = strM.substring(2);

        // --- EXTRACT SEGMENT MAXIMUMS (Including Deflection) ---
        let segmentData = beamState.mathData.filter(d => d.x >= x1 && d.x <= x2);
        let maxVSeg = 0, maxMSeg = 0, maxYSeg = 0;
        
        if (segmentData.length > 0) {
            maxVSeg = Math.max(...segmentData.map(d => Math.abs(d.V)));
            maxMSeg = Math.max(...segmentData.map(d => Math.abs(d.M)));
            maxYSeg = Math.max(...segmentData.map(d => Math.abs(d.y))); // Pulls max deflection in segment
        }

        html += `
        <hr style="border-color: #444; margin: 25px 0;">
        <h3 style="color: #e74c3c; margin-bottom: 10px;">Segment ${segName} (${x1.toFixed(2)}m to ${x2.toFixed(2)}m)</h3>
        <div style="background:#111; padding:15px; border-radius:6px; font-family: monospace; line-height: 1.6;">
            <p style="color:#2ecc71; margin:0 0 10px 0;">* Load Function w(x): ${loadFunctionText}</p>
            
            <p style="color:#aaa; margin:0 0 5px 0;">* Shear Equation Setup:</p>
            V<sub>${segName}</sub>(x) = ${strV}<br>
            |V<sub>max</sub>| in Segment &asymp; ${maxVSeg.toFixed(2)} kN<br><br>
            
            <p style="color:#aaa; margin:0 0 5px 0;">* Moment Equation Setup:</p>
            M<sub>${segName}</sub>(x) = ${strM}<br>
            |M<sub>max</sub>| in Segment &asymp; ${maxMSeg.toFixed(2)} kN&middot;m<br><br>

            <p style="color:#aaa; margin:0 0 5px 0;">* Deflection Evaluation:</p>
            &Delta;<sub>${segName}</sub>(x) = &int;&int; [M(x) / EI] dx<br>
            |&Delta;<sub>max</sub>| in Segment &asymp; ${maxYSeg.toFixed(2)} mm
        </div>`;
        
        segmentIndex++;
    }

    if (currentHoverPoint) {
        html += `<hr style="border-color: #444; margin: 30px 0;">`;
        html += `<h2 style="color: #FFEE91;">Target Point Evaluation ("Red Dot" Boundary Analysis)</h2>`;
        
        if (isBoundaryRedDot) {
            let segL_idx = sortedCrits.indexOf(boundaryX) - 1;
            let segR_idx = sortedCrits.indexOf(boundaryX);
            
            let sL1 = String.fromCharCode(65 + segL_idx); let sL2 = String.fromCharCode(66 + segL_idx);
            let sR1 = String.fromCharCode(65 + segR_idx); let sR2 = String.fromCharCode(66 + segR_idx);

            let pLeft = beamState.mathData.find(d => d.x >= boundaryX - 0.05 && d.x < boundaryX) || currentHoverPoint;
            let pRight = beamState.mathData.find(d => d.x > boundaryX && d.x <= boundaryX + 0.05) || currentHoverPoint;

            html += `
            <div style="background:#2c3e50; border-left: 4px solid #e74c3c; padding:20px; border-radius:0 6px 6px 0;">
                <p style="margin-top:0; font-size: 15px;"><strong>Note:</strong> The target evaluation point lies exactly on the boundary transition (x = ${boundaryX.toFixed(2)} m). To guarantee full visualization without boundary cut-offs, the limits from both adjacent segments are derived simultaneously:</p>
                
                <h4 style="color:#3498db; margin: 15px 0 5px 0; font-size: 16px;">Left-Side Approach (Evaluating using Segment ${sL1}${sL2} equations):</h4>
                <p style="font-family:monospace; margin:0 0 15px 15px; font-size: 15px;">
                    * At x = ${boundaryX.toFixed(2)} m:<br>
                    &nbsp;&nbsp;V<sub>${sL1}${sL2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pLeft.V.toFixed(2)} kN<br>
                    &nbsp;&nbsp;M<sub>${sL1}${sL2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pLeft.M.toFixed(2)} kN&middot;m<br>
                    &nbsp;&nbsp;&Delta;<sub>${sL1}${sL2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pLeft.y.toFixed(2)} mm
                </p>

                <h4 style="color:#2ecc71; margin: 15px 0 5px 0; font-size: 16px;">Right-Side Approach (Evaluating using Segment ${sR1}${sR2} equations):</h4>
                <p style="font-family:monospace; margin:0 0 0 15px; font-size: 15px;">
                    * At x = ${boundaryX.toFixed(2)} m:<br>
                    &nbsp;&nbsp;V<sub>${sR1}${sR2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pRight.V.toFixed(2)} kN<br>
                    &nbsp;&nbsp;M<sub>${sR1}${sR2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pRight.M.toFixed(2)} kN&middot;m<br>
                    &nbsp;&nbsp;&Delta;<sub>${sR1}${sR2}</sub>(${boundaryX.toFixed(2)}) = [Substitution Step] = ${pRight.y.toFixed(2)} mm
                </p>
            </div>`;
        } else {
            let actSegIdx = sortedCrits.findIndex((c, i) => currentHoverPoint.x > c && currentHoverPoint.x < sortedCrits[i+1]);
            let s1 = String.fromCharCode(65 + actSegIdx); let s2 = String.fromCharCode(66 + actSegIdx);
            
            html += `
            <div style="background:#2c3e50; border-left: 4px solid #e74c3c; padding:20px; border-radius:0 6px 6px 0;">
                <h4 style="color:#3498db; margin:0 0 10px 0; font-size: 16px;">Internal Span Evaluation (Segment ${s1}${s2}):</h4>
                <p style="font-family:monospace; margin:0 0 0 15px; font-size: 15px;">
                    * At x = ${currentHoverPoint.x.toFixed(2)} m:<br>
                    &nbsp;&nbsp;V<sub>${s1}${s2}</sub>(${currentHoverPoint.x.toFixed(2)}) = [Substitution] = ${currentHoverPoint.V.toFixed(2)} kN<br>
                    &nbsp;&nbsp;M<sub>${s1}${s2}</sub>(${currentHoverPoint.x.toFixed(2)}) = [Substitution] = ${currentHoverPoint.M.toFixed(2)} kN&middot;m<br>
                    &nbsp;&nbsp;&Delta;<sub>${s1}${s2}</sub>(${currentHoverPoint.x.toFixed(2)}) = [Substitution] = ${currentHoverPoint.y.toFixed(2)} mm
                </p>
            </div>`;
        }
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function closeDerivationModal() { document.getElementById('calcModal').style.display = 'none'; }

// --- REACTION DRAWING HELPERS ---
function drawReactionArrow(ctx, fromX, fromY, toX, toY) {
    const headlen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawReactionMoment(ctx, x, y, isLeft) {
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if(isLeft) {
        ctx.arc(x, y, 20, 0.7 * Math.PI, 1.3 * Math.PI);
        let endX = x + 20 * Math.cos(1.3 * Math.PI);
        let endY = y + 20 * Math.sin(1.3 * Math.PI);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 8, endY - 4);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + 2, endY - 8);
    } else {
        ctx.arc(x, y, 20, 1.7 * Math.PI, 0.3 * Math.PI);
        let endX = x + 20 * Math.cos(1.7 * Math.PI);
        let endY = y + 20 * Math.sin(1.7 * Math.PI);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + 8, endY - 4);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - 2, endY - 8);
    }
    ctx.stroke();
}

function drawDiagrams(hoverPoint = null) {
    currentHoverPoint = hoverPoint;
    const canvas = document.getElementById('diagramCanvas');
    const tooltip = document.getElementById('htmlTooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { L, loads, supports, mathData, maxV, maxM, maxY, invert } = beamState;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const paddingX = 80;
    const graphWidth = canvas.width - (paddingX * 2);
    
    const schemaCenterY = 120; const dimCenterY = 220; const sfdCenterY = 400; const bmdCenterY = 640; const defCenterY = 860;
    const graphHeight = 130;

    const mapX = (x) => paddingX + (x / L) * graphWidth;
    const mapYSFD = (v) => sfdCenterY - (v / (maxV || 1)) * (graphHeight / 2);
    const mapYBMD = (m) => bmdCenterY + (m / (maxM || 1)) * (graphHeight / 2) * (invert ? 1 : -1);
    const mapYDEF = (y) => defCenterY + (y / Math.max(maxY, 0.001)) * (graphHeight / 2); 

    let isSystemLoaded = loads.length > 0;

    // 1. Draw Beam Line
    ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mapX(0), schemaCenterY); ctx.lineTo(mapX(L), schemaCenterY); ctx.stroke();

    // 2. Draw Support Shapes & Structurally Applicable Reaction Arrows
    supports.forEach(sup => {
        let sx = mapX(sup.x);
        let isLeft = sup.x <= L/2;
        
        ctx.lineWidth = 2; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1e1e24';

        if(sup.type === 'pin') {
            ctx.beginPath(); ctx.moveTo(sx, schemaCenterY); ctx.lineTo(sx-10, schemaCenterY+15); ctx.lineTo(sx+10, schemaCenterY+15); ctx.closePath(); ctx.stroke(); ctx.fill();
        } else if (sup.type === 'roller') {
            ctx.beginPath(); ctx.moveTo(sx, schemaCenterY); ctx.lineTo(sx-10, schemaCenterY+12); ctx.lineTo(sx+10, schemaCenterY+12); ctx.closePath(); ctx.stroke(); ctx.fill();
            ctx.beginPath(); ctx.arc(sx-4, schemaCenterY+16, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(sx+4, schemaCenterY+16, 3, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
        } else if (sup.type === 'fixed') {
            let offset = sup.x === 0 ? -10 : 10;
            ctx.beginPath(); ctx.moveTo(sx, schemaCenterY-25); ctx.lineTo(sx, schemaCenterY+25); ctx.stroke();
            for(let i=-20; i<=20; i+=8) { ctx.beginPath(); ctx.moveTo(sx, schemaCenterY+i); ctx.lineTo(sx+offset, schemaCenterY+i+8); ctx.stroke(); }
        }

        if (isSystemLoaded) {
            drawReactionArrow(ctx, sx, schemaCenterY + 45, sx, schemaCenterY + 22); 
            
            if (sup.type === 'pin' || sup.type === 'fixed') {
                if (isLeft) drawReactionArrow(ctx, sx - 40, schemaCenterY + 10, sx - 15, schemaCenterY + 10); 
                else drawReactionArrow(ctx, sx + 40, schemaCenterY + 10, sx + 15, schemaCenterY + 10); 
            }
            
            if (sup.type === 'fixed') {
                drawReactionMoment(ctx, sx, schemaCenterY, isLeft); 
            }
        }
    });

    let distributedLoads = loads.filter(l => l.type !== 'P' && l.renderShape !== 'hidden');
    let globalMaxW = Math.max(1, ...distributedLoads.map(l => Math.max(Math.abs(l.w1 || 0), Math.abs(l.w2 || 0))));

    // 3. Render Vector Loading Diagrams
    loads.forEach(ld => {
        if (ld.renderShape === 'hidden') return;
        
        if (ld.type === 'P') {
            const ax = mapX(ld.a);
            let heightOffset = 0;
            
            distributedLoads.forEach(dl => {
                if (ld.a >= dl.a && ld.a <= dl.b) {
                    let w1 = dl.w1 !== undefined ? dl.w1 : dl.mag;
                    let w2 = dl.w2 !== undefined ? dl.w2 : dl.mag;
                    let ratio = (ld.a - dl.a) / (dl.b - dl.a);
                    let intensityAtPoint = w1 + ratio * (w2 - w1);
                    let computedHeight = (Math.abs(intensityAtPoint) / globalMaxW) * 45;
                    if (computedHeight > heightOffset) heightOffset = computedHeight;
                }
            });

            let calculatedTipY = schemaCenterY - heightOffset;
            ctx.strokeStyle = '#e74c3c'; ctx.fillStyle = '#e74c3c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(ax, calculatedTipY - 50); ctx.lineTo(ax, calculatedTipY - 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ax, calculatedTipY); ctx.lineTo(ax-8, calculatedTipY-12); ctx.lineTo(ax+8, calculatedTipY-12); ctx.closePath(); ctx.fill();
            ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText(`${ld.mag}kN`, ax, calculatedTipY - 55);
        } else if (ld.renderShape === 'trap') {
            let w1 = ld.w1 !== undefined ? ld.w1 : ld.mag;
            let w2 = ld.w2 !== undefined ? ld.w2 : ld.mag;
            let h1 = (Math.abs(w1) / globalMaxW) * 45;
            let h2 = (Math.abs(w2) / globalMaxW) * 45;
            
            ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
            ctx.beginPath();
            ctx.moveTo(mapX(ld.a), schemaCenterY);
            ctx.lineTo(mapX(ld.a), schemaCenterY - h1);
            ctx.lineTo(mapX(ld.b), schemaCenterY - h2);
            ctx.lineTo(mapX(ld.b), schemaCenterY);
            ctx.closePath(); ctx.fill();
            
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mapX(ld.a), schemaCenterY - h1); ctx.lineTo(mapX(ld.b), schemaCenterY - h2); ctx.stroke();
            
            for(let i = ld.a; i <= ld.b; i += (ld.b-ld.a)/10 || 1) {
                let r = (i - ld.a) / ((ld.b - ld.a) || 1);
                let hi = h1 + r * (h2 - h1);
                ctx.beginPath(); ctx.moveTo(mapX(i), schemaCenterY - hi); ctx.lineTo(mapX(i), schemaCenterY); ctx.stroke();
            }
        }
    });

    // 4. Dimension Guide Rendering Engine
    let crits = [0, L];
    loads.forEach(ld => { crits.push(ld.a); if(ld.b) crits.push(ld.b); });
    supports.forEach(sup => crits.push(sup.x));
    crits = [...new Set(crits)].sort((a,b) => a-b);

    ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1;
    crits.forEach(cx => {
        ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mapX(cx), schemaCenterY+20); ctx.lineTo(mapX(cx), dimCenterY+15); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(mapX(0), dimCenterY); ctx.lineTo(mapX(L), dimCenterY); ctx.stroke();
    ctx.fillStyle = '#7f8c8d'; ctx.font = '12px Courier'; ctx.textAlign = 'center';
    
    for(let i=0; i<crits.length-1; i++) {
        let span = crits[i+1] - crits[i];
        if(span > 0.1) ctx.fillText(`|-${span.toFixed(2)}m-|`, mapX(crits[i] + span/2), dimCenterY + 4);
    }

    // 5. Build Graph Frame Bounds
    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.5;
    [sfdCenterY, bmdCenterY, defCenterY].forEach(y => { ctx.beginPath(); ctx.moveTo(paddingX, y); ctx.lineTo(paddingX + graphWidth, y); ctx.stroke(); });

    const drawFilledGraph = (dataField, mapY, color) => {
        if(!mathData || mathData.length === 0) return;
        let plotData = [{ x: 0, y: 0 }, ...mathData.map(d => ({x: d.x, y: d[dataField]})), { x: L, y: 0 }];
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mapX(plotData[0].x), mapY(0));
        plotData.forEach(d => ctx.lineTo(mapX(d.x), mapY(d.y)));
        ctx.lineTo(mapX(L), mapY(0)); ctx.closePath();
        ctx.fillStyle = `rgba(${color}, 0.15)`; ctx.fill();
        ctx.strokeStyle = `rgb(${color})`; ctx.beginPath(); ctx.moveTo(mapX(mathData[0].x), mapY(mathData[0][dataField]));
        for(let i=0; i<mathData.length; i++) { ctx.lineTo(mapX(mathData[i].x), mapY(mathData[i][dataField])); }
        ctx.stroke();
    };

    drawFilledGraph('V', mapYSFD, '39, 174, 96');
    drawFilledGraph('M', mapYBMD, '41, 128, 185');
    drawFilledGraph('y', mapYDEF, '142, 68, 173');

    ctx.fillStyle = '#2c3e50'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
    ctx.fillText("V (kN)", 15, sfdCenterY + 5); ctx.fillText("M (kN·m)", 15, bmdCenterY + 5); ctx.fillText("Δ (mm)", 15, defCenterY + 5);
    
    ctx.textAlign = 'center'; ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#27ae60'; ctx.fillText(`Max |V| = ${maxV.toFixed(2)} kN`, canvas.width / 2, sfdCenterY + (graphHeight / 2) + 25);
    ctx.fillStyle = '#2980b9'; ctx.fillText(`Max |M| = ${maxM.toFixed(2)} kN·m`, canvas.width / 2, bmdCenterY + (graphHeight / 2) + 30);
    ctx.fillStyle = '#8e44ad'; ctx.fillText(`Max |Δ| = ${maxY.toFixed(2)} mm`, canvas.width / 2, defCenterY + (graphHeight / 2) + 30);

    // 6. Interactive Crosshair Hover Processing
    if (hoverPoint) {
        let hoverX = mapX(hoverPoint.x);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(hoverX, schemaCenterY-10); ctx.lineTo(hoverX, defCenterY+graphHeight/2+10); ctx.stroke(); ctx.setLineDash([]);
        
        ctx.fillStyle = '#e74c3c';
        
        let profileHeightAtHover = 0;
        distributedLoads.forEach(dl => {
            if (hoverPoint.x >= dl.a && hoverPoint.x <= dl.b) {
                let w1 = dl.w1 !== undefined ? dl.w1 : dl.mag;
                let w2 = dl.w2 !== undefined ? dl.w2 : dl.mag;
                let ratio = (hoverPoint.x - dl.a) / (dl.b - dl.a);
                let currentIntensity = w1 + ratio * (w2 - w1);
                let currentHeight = (Math.abs(currentIntensity) / globalMaxW) * 45;
                if (currentHeight > profileHeightAtHover) profileHeightAtHover = currentHeight;
            }
        });

        let targetSchemaY = schemaCenterY - profileHeightAtHover;
        const dotY_V = sfdCenterY - (hoverPoint.V / (maxV || 1)) * (graphHeight / 2);
        const dotY_M = bmdCenterY + (hoverPoint.M / (maxM || 1)) * (graphHeight / 2) * (invert ? 1 : -1);
        const dotY_D = defCenterY + (hoverPoint.y / Math.max(maxY, 0.001)) * (graphHeight / 2);

        [targetSchemaY, dotY_V, dotY_M, dotY_D].forEach(yCoord => {
            ctx.beginPath(); ctx.arc(hoverX, yCoord, 5, 0, 2 * Math.PI); ctx.fill();
        });
    }

    // FIX: Update the event listener to strictly fetch from the global `beamState` 
    // so it doesn't get trapped in a stale closure after the math array is deep-copied.
    if (!canvas.onmousemove) {
        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            let mouseX = (e.clientX - rect.left) * scaleX;
            const padX = 80;
            const gWidth = canvas.width - (padX * 2);

            if (mouseX >= padX && mouseX <= padX + gWidth) {
                let exactX = ((mouseX - padX) / gWidth) * beamState.L;
                if(!beamState.mathData || beamState.mathData.length === 0) return;
                
                // Pull nearest coordinate point directly from the globally updated state object
                let p = beamState.mathData.reduce((prev, curr) => Math.abs(curr.x - exactX) < Math.abs(prev.x - exactX) ? curr : prev);

                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX - rect.left + 20) + 'px';
                tooltip.style.top = (e.clientY - rect.top + 20) + 'px';
                tooltip.innerHTML = `x: ${p.x.toFixed(2)} m<br>V: ${p.V.toFixed(2)} kN<br>M: ${p.M.toFixed(2)} kN·m<br>Δ: ${p.y.toFixed(2)} mm`;

                drawDiagrams(p); 
            } else {
                tooltip.style.display = 'none';
                drawDiagrams(null); 
            }
        };
        canvas.onmouseleave = () => { tooltip.style.display = 'none'; drawDiagrams(null); };
    }
}