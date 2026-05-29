// ==========================================
// ADVANCED STRUCTURAL ENGINE: UNIFIED VDL & STANDARD EQUILIBRIUM
// ==========================================

let beamState = { L: 10, loads: [], supports: [], mathData: [], maxV: 0, maxM: 0, maxY: 0, invert: true, supportType: 'simply', E: 200, I: 100 };

// ---------------------------------------------------------
// UI SYNC & GUARDRAIL UTILITIES
// ---------------------------------------------------------
function setupDualControls() {
    const L_input = document.getElementById('beamLength');
    const typeSelect = document.getElementById('supportType');
    
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
        let L = parseFloat(L_input.value) || 10;
        binds.forEach(b => {
            let numEl = document.getElementById(b.n);
            let sliEl = document.getElementById(b.s);
            if(sliEl) sliEl.max = L;
            
            let val = parseFloat(numEl.value) || 0;
            if (val > L) { val = L; numEl.value = L; if(sliEl) sliEl.value = L; }
            
            if (b.pairN) {
                let pairVal = parseFloat(document.getElementById(b.pairN).value) || 0;
                if (b.isEnd && val < pairVal) { numEl.value = pairVal; if(sliEl) sliEl.value = pairVal; }
                if (!b.isEnd && val > pairVal) { numEl.value = pairVal; if(sliEl) sliEl.value = pairVal; }
            }
        });
    }

    binds.forEach(b => {
        let numEl = document.getElementById(b.n);
        let sliEl = document.getElementById(b.s);
        if(numEl && sliEl) {
            numEl.addEventListener('input', () => { sliEl.value = numEl.value; enforceBoundaries(); calculateAndDraw(); });
            sliEl.addEventListener('input', () => { numEl.value = sliEl.value; enforceBoundaries(); calculateAndDraw(); });
        }
    });

    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.id === 'supportType') {
                document.getElementById('multiSpanInputs').style.display = input.value === 'continuous' ? 'block' : 'none';
                document.getElementById('overhangInputs').style.display = input.value === 'overhanging' ? 'grid' : 'none';
            }
            if(input.id === 'beamLength') enforceBoundaries();
            calculateAndDraw();
        });
    });
}

// ---------------------------------------------------------
// MATH ENGINE & EQUILIBRIUM SOLVERS
// ---------------------------------------------------------

function mac(x, a, n) {
    if (x < a) return 0;
    if (n === 0) return 1;
    return Math.pow(x - a, n);
}

function solveLinearSystem(A, B) {
    let n = B.length;
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        [A[i], A[maxRow]] = [A[maxRow], A[i]]; [B[i], B[maxRow]] = [B[maxRow], B[i]];
        for (let k = i + 1; k < n; k++) {
            let c = -A[k][i] / A[i][i];
            for (let j = i; j < n; j++) A[k][j] = (i === j) ? 0 : A[k][j] + c * A[i][j];
            B[k] += c * B[i];
        }
    }
    let X = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        X[i] = B[i] / A[i][i];
        for (let k = i - 1; k >= 0; k--) B[k] -= A[k][i] * X[i];
    }
    return X;
}

function calculateAndDraw() {
    const L = parseFloat(document.getElementById('beamLength').value) || 10;
    const type = document.getElementById('supportType').value;
    const invert = document.getElementById('invertBMD').checked;
    const EI = (parseFloat(document.getElementById('matE').value) || 200) * (parseFloat(document.getElementById('matI').value) || 100); 

    // UNIFIED LOAD PARSING: ALL DISTRIBUTED LOADS ARE NOW 'Trap' (Trapezoidal)
    let loads = [];
    if (document.getElementById('enablePoint').checked) 
        loads.push({ type: 'P', mag: parseFloat(document.getElementById('P_val').value)||0, a: parseFloat(document.getElementById('P_pos_num').value)||0 });
    
    if (document.getElementById('enablePartUDL').checked) {
        let w = parseFloat(document.getElementById('wPart_val').value)||0;
        let a = parseFloat(document.getElementById('wPart_start_num').value)||0;
        let b = parseFloat(document.getElementById('wPart_end_num').value)||0;
        if (w !== 0 && b > a) loads.push({ type: 'Trap', w1: w, w2: w, a: a, b: b });
    }

    if (document.getElementById('enableTriLoad').checked) {
        let w = parseFloat(document.getElementById('wTri_val').value)||0;
        let a = parseFloat(document.getElementById('wTri_start_num').value)||0;
        let b = parseFloat(document.getElementById('wTri_end_num').value)||0;
        let loc = document.getElementById('wTri_peak_loc').value;
        if (w !== 0 && b > a) loads.push({ type: 'Trap', w1: (loc==='left'?w:0), w2: (loc==='right'?w:0), a: a, b: b });
    }

    if (document.getElementById('enableTrapLoad').checked) {
        let w1 = parseFloat(document.getElementById('wTrap_val1').value)||0;
        let w2 = parseFloat(document.getElementById('wTrap_val2').value)||0;
        let a = parseFloat(document.getElementById('wTrap_start_num').value)||0;
        let b = parseFloat(document.getElementById('wTrap_end_num').value)||0;
        if ((w1 !== 0 || w2 !== 0) && b > a) loads.push({ type: 'Trap', w1: w1, w2: w2, a: a, b: b });
    }

    const getGlobalEquilibrium = () => {
        let sumF = 0, sumM_0 = 0;
        loads.forEach(ld => {
            if (ld.type === 'P') {
                sumF += ld.mag; sumM_0 += ld.mag * ld.a;
            } else if (ld.type === 'Trap') {
                let f_rect = ld.w1 * (ld.b - ld.a);
                let f_tri = 0.5 * (ld.w2 - ld.w1) * (ld.b - ld.a);
                sumF += (f_rect + f_tri);
                sumM_0 += (f_rect * (ld.a + (ld.b-ld.a)/2)) + (f_tri * (ld.a + 2*(ld.b-ld.a)/3));
            }
        });
        return { sumF, sumM_0 };
    };

    const getApplied = (x) => {
        let V = 0, M = 0, EI_theta = 0, EI_y = 0;
        loads.forEach(ld => {
            if (ld.type === 'P') {
                V -= ld.mag * mac(x, ld.a, 0); M -= ld.mag * mac(x, ld.a, 1);
                EI_theta -= (ld.mag / 2) * mac(x, ld.a, 2); EI_y -= (ld.mag / 6) * mac(x, ld.a, 3);
            } else if (ld.type === 'Trap') {
                // Base UDL Evaluation
                if (ld.w1 !== 0) {
                    V -= ld.w1 * mac(x, ld.a, 1); M -= (ld.w1 / 2) * mac(x, ld.a, 2);
                    EI_theta -= (ld.w1 / 6) * mac(x, ld.a, 3); EI_y -= (ld.w1 / 24) * mac(x, ld.a, 4);
                    if (ld.b < L) {
                        V += ld.w1 * mac(x, ld.b, 1); M += (ld.w1 / 2) * mac(x, ld.b, 2);
                        EI_theta += (ld.w1 / 6) * mac(x, ld.b, 3); EI_y += (ld.w1 / 24) * mac(x, ld.b, 4);
                    }
                }
                // Sloped Triangular Evaluation
                let dw = ld.w2 - ld.w1;
                if (dw !== 0) {
                    let m = dw / (ld.b - ld.a);
                    V -= (m / 2) * mac(x, ld.a, 2); M -= (m / 6) * mac(x, ld.a, 3);
                    EI_theta -= (m / 24) * mac(x, ld.a, 4); EI_y -= (m / 120) * mac(x, ld.a, 5);
                    if (ld.b < L) {
                        V += (m / 2) * mac(x, ld.b, 2) + dw * mac(x, ld.b, 1);
                        M += (m / 6) * mac(x, ld.b, 3) + (dw / 2) * mac(x, ld.b, 2);
                        EI_theta += (m / 24) * mac(x, ld.b, 4) + (dw / 6) * mac(x, ld.b, 3);
                        EI_y += (m / 120) * mac(x, ld.b, 5) + (dw / 24) * mac(x, ld.b, 4);
                    }
                }
            }
        });
        return { V, M, EI_theta, EI_y };
    };

    let supports = [], Ma = 0, Mb = 0, C1 = 0, C2 = 0;
    const appL = getApplied(L);
    const eq = getGlobalEquilibrium();

    if (type === 'simply') {
        let R2 = eq.sumM_0 / L; let R1 = eq.sumF - R2;
        supports.push({ x: 0, R: R1, type: 'pin' });
        supports.push({ x: L, R: R2, type: 'pin' });
        C2 = 0; C1 = -(getApplied(L).EI_y + (R1/6)*Math.pow(L,3)) / L;
    } else if (type === 'cantilever') {
        supports.push({ x: 0, R: eq.sumF, type: 'fixed' });
        Ma = -eq.sumM_0; C1 = 0; C2 = 0; 
    } else if (type === 'overhanging') {
        let s1 = parseFloat(document.getElementById('sup1_pos').value) || 0;
        let s2 = parseFloat(document.getElementById('sup2_pos').value) || L;
        let sumM_s1 = 0; 
        loads.forEach(ld => {
            if(ld.type === 'P') sumM_s1 += ld.mag * (ld.a - s1);
            if(ld.type === 'Trap') {
                sumM_s1 += (ld.w1 * (ld.b-ld.a)) * (ld.a + (ld.b-ld.a)/2 - s1);
                sumM_s1 += (0.5*(ld.w2-ld.w1)*(ld.b-ld.a)) * (ld.a + 2*(ld.b-ld.a)/3 - s1);
            }
        });
        let R2 = sumM_s1 / (s2 - s1);
        let R1 = eq.sumF - R2;
        supports.push({ x: s1, R: R1, type: 'pin' });
        supports.push({ x: s2, R: R2, type: 'pin' });
        let det = s2 - s1;
        C1 = -(getApplied(s2).EI_y - getApplied(s1).EI_y + (R1/6)*mac(s2,s1,3)) / det;
        C2 = -(getApplied(s1).EI_y + C1*s1);
    } else if (type === 'propped') {
        let det = Math.pow(L, 3) / 3;
        let R2 = -appL.EI_y / det * 2;
        let R1 = eq.sumF - R2;
        Ma = -(eq.sumM_0 - R2*L);
        supports.push({ x: 0, R: R1, type: 'fixed' });
        supports.push({ x: L, R: R2, type: 'pin' });
        C1 = 0; C2 = 0;
    } else if (type === 'fixed') {
        let det = (Math.pow(L, 4) / 12);
        Ma = (-appL.EI_theta * (Math.pow(L, 3) / 6) + appL.EI_y * (Math.pow(L, 2) / 2)) / -det;
        let R1 = (-appL.EI_y * L + appL.EI_theta * (Math.pow(L, 2) / 2)) / -det;
        supports.push({ x: 0, R: R1, type: 'fixed' });
        supports.push({ x: L, R: eq.sumF - R1, type: 'fixed' });
        Mb = -(eq.sumM_0 - R1*L - Ma);
        C1 = 0; C2 = 0;
    } else if (type === 'continuous') {
        let supArray = document.getElementById('customSupports').value.split(',').map(s => parseFloat(s.trim())).filter(s => !isNaN(s) && s >= 0 && s <= L);
        let n = supArray.length;
        if(n >= 2) {
            let A = Array(n + 2).fill(0).map(() => Array(n + 2).fill(0));
            let B = Array(n + 2).fill(0);
            for (let i = 0; i < n; i++) A[0][i] = 1; B[0] = eq.sumF;
            for (let i = 0; i < n; i++) A[1][i] = L - supArray[i]; B[1] = eq.sumM_0;
            for (let k = 0; k < n; k++) {
                for (let i = 0; i < n; i++) A[k+2][i] = (1/6) * mac(supArray[k], supArray[i], 3);
                A[k+2][n] = supArray[k]; A[k+2][n+1] = 1; B[k+2] = -getApplied(supArray[k]).EI_y;
            }
            let X = solveLinearSystem(A, B);
            for(let i=0; i<n; i++) supports.push({ x: supArray[i], R: X[i], type: 'pin' });
            C1 = X[n]; C2 = X[n+1];
        }
    }

    let mathData = [];
    const numPoints = 600; 
    let maxV = 0.001, maxM = 0.001, maxY = 0.001;

    for(let i=0; i<=numPoints; i++) {
        let x = i * (L / numPoints);
        let app = getApplied(x);
        
        let V = app.V; let M = app.M; let EI_y = app.EI_y + C1 * x + C2;
        supports.forEach(sup => {
            V += sup.R * mac(x, sup.x, 0);
            M += sup.R * mac(x, sup.x, 1);
            EI_y += (sup.R / 6) * mac(x, sup.x, 3);
        });
        M += Ma * mac(x, 0, 0) + Mb * mac(x, L, 0);
        EI_y += (Ma / 2) * mac(x, 0, 2) + (Mb / 2) * mac(x, L, 2);

        if (Math.abs(M) < 1e-9 || x === L || x === 0) {
            let isHinge = type !== 'cantilever' && supports.find(s => Math.abs(s.x - x) < 0.01 && s.type !== 'fixed');
            if (isHinge) M = 0;
        }

        let def_mm = (EI_y / EI) * 1000; 
        mathData.push({ x, V, M, y: def_mm });
        maxV = Math.max(maxV, Math.abs(V));
        maxM = Math.max(maxM, Math.abs(M));
        maxY = Math.max(maxY, Math.abs(def_mm));
    }

    beamState = { L, loads, supports, mathData, maxV, maxM, maxY, invert, type, Ma, Mb };
    drawDiagrams();
    renderMathJaxOutput();
}

// ---------------------------------------------------------
// TEXT OUTPUTS & DERIVATION OVERLAYS
// ---------------------------------------------------------
function renderMathJaxOutput() {
    const { L, loads, supports, Ma, Mb, type } = beamState;
    let eqV = `V(x) = `, eqM = `M(x) = `;
    
    supports.forEach((sup, i) => {
        if (Math.abs(sup.R) > 0.01) {
            eqV += `${i>0?' + ':''}${sup.R.toFixed(2)}\\langle x - ${sup.x} \\rangle^0`; 
            eqM += `${i>0?' + ':''}${sup.R.toFixed(2)}\\langle x - ${sup.x} \\rangle^1`;
        }
    });
    if (Math.abs(Ma) > 0.01) eqM += ` ${Ma > 0 ? '+' : '-'} ${Math.abs(Ma).toFixed(2)}\\langle x - 0 \\rangle^0`;
    
    loads.forEach(ld => {
        if (ld.type === 'P') {
            eqV += ` - ${ld.mag}\\langle x - ${ld.a} \\rangle^0`;
            eqM += ` - ${ld.mag}\\langle x - ${ld.a} \\rangle^1`;
        } else if (ld.type === 'Trap') {
            if (ld.w1 !== 0) {
                eqV += ` - ${ld.w1}\\langle x - ${ld.a} \\rangle^1`;
                eqM += ` - \\frac{${ld.w1}}{2}\\langle x - ${ld.a} \\rangle^2`;
            }
            let dw = ld.w2 - ld.w1;
            if (dw !== 0) {
                let m = dw / (ld.b - ld.a);
                // Dynamically handles negative slopes (m < 0) for proper mathematical notation logic
                eqV += ` ${m < 0 ? '+' : '-'} \\frac{${Math.abs(m).toFixed(2)}}{2}\\langle x - ${ld.a} \\rangle^2`;
                eqM += ` ${m < 0 ? '+' : '-'} \\frac{${Math.abs(m).toFixed(2)}}{6}\\langle x - ${ld.a} \\rangle^3`;
            }
        }
    });

    let html = `<p><strong>Reactions:</strong></p><ul>`;
    supports.forEach((sup, i) => {
        html += `<li>Support ${i+1} ($x_n=${sup.x}\\text{ m}$): $R = ${sup.R.toFixed(2)} \\text{ kN}$</li>`;
    });
    html += `</ul><hr style="border-color: #333;">`;
    
    if (type === 'continuous' || type === 'fixed' || type === 'propped') {
        html += `<p><strong>Boundary Constraints & Macaulay Equations:</strong></p>
        <div style="overflow-x: auto;">$$ ${eqV} $$</div>
        <div style="overflow-x: auto;">$$ ${eqM} $$</div>`;
    } else {
        html += `<p><strong>Internal Forces Evaluated via Standard Static Equilibrium</strong></p>`;
    }

    document.getElementById('macaulayOutput').innerHTML = html;
    if (window.MathJax) MathJax.typesetPromise();
}

function showDerivationModal() {
    const modal = document.getElementById('calcModal');
    const content = document.getElementById('calcBreakdown');
    const { type } = beamState;
    
    let subStr = `\\sum M = 0 \\quad \\text{and} \\quad \\sum F_y = 0`;
    
    let html = `
        <h3 style="color: #FFEE91;">1. Global Static Equilibrium Principles</h3>
        <p>The standard system boundaries are initially resolved by balancing moments and vertical forces to zero:</p>
        <div style="background:#111; padding: 15px; border-radius: 4px; margin: 10px 0;">$$ ${subStr} $$</div>
    `;

    if (type === 'continuous' || type === 'fixed' || type === 'propped') {
        html += `<h3 style="color: #FFEE91; margin-top: 25px;">2. Direct Macaulay Derivations</h3>
        <p>Using singularity brackets $\\langle x - a \\rangle^n$, we synthesize the indeterminate beam span into continuous expressions using the stiffness matrix method.</p>`;
    } else {
        html += `<h3 style="color: #FFEE91; margin-top: 25px;">2. Standard Boundary Conditions Applied</h3>
        <p>This statically determinate system was resolved mathematically using standard equilibrium methodology without reliance on generalized Macaulay integration limits.</p>`;
    }

    content.innerHTML = html;
    modal.style.display = 'flex';
    if(window.MathJax) MathJax.typesetPromise();
}

function closeDerivationModal(e) { document.getElementById('calcModal').style.display = 'none'; }

// ---------------------------------------------------------
// RENDER ENGINE (Geometry & Sub-dimensions)
// ---------------------------------------------------------
function drawDiagrams() {
    const canvas = document.getElementById('diagramCanvas');
    const tooltip = document.getElementById('htmlTooltip');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { L, loads, supports, mathData, maxV, maxM, maxY, invert } = beamState;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const paddingX = 80;
    const graphWidth = canvas.width - (paddingX * 2);
    
    const schemaCenterY = 120;
    const dimCenterY = 220;
    const sfdCenterY = 400;
    const bmdCenterY = 640;
    const defCenterY = 860;
    const graphHeight = 130;

    const mapX = (x) => paddingX + (x / L) * graphWidth;
    const mapYSFD = (v) => sfdCenterY - (v / maxV) * (graphHeight / 2);
    const mapYBMD = (m) => bmdCenterY + (m / maxM) * (graphHeight / 2) * (invert ? 1 : -1);
    const mapYDEF = (y) => defCenterY + (y / maxY) * (graphHeight / 2); 

    ctx.strokeStyle = '#1e1e24'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mapX(0), schemaCenterY); ctx.lineTo(mapX(L), schemaCenterY); ctx.stroke();

    supports.forEach(sup => {
        ctx.lineWidth = 2; ctx.fillStyle = '#ffffff';
        if(sup.type === 'pin') {
            ctx.beginPath(); ctx.moveTo(mapX(sup.x), schemaCenterY); ctx.lineTo(mapX(sup.x)-10, schemaCenterY+15); ctx.lineTo(mapX(sup.x)+10, schemaCenterY+15); ctx.closePath(); ctx.stroke(); ctx.fill();
        } else if (sup.type === 'fixed') {
            let offset = sup.x === 0 ? -10 : 10;
            ctx.beginPath(); ctx.moveTo(mapX(sup.x), schemaCenterY-25); ctx.lineTo(mapX(sup.x), schemaCenterY+25); ctx.stroke();
            for(let i=-20; i<=20; i+=8) { ctx.beginPath(); ctx.moveTo(mapX(sup.x), schemaCenterY+i); ctx.lineTo(mapX(sup.x)+offset, schemaCenterY+i+8); ctx.stroke(); }
        }
    });

    // 1. Draw UNIFIED Dist Load Polygons
    let maxW = 0;
    loads.forEach(ld => { if (ld.type === 'Trap') maxW = Math.max(maxW, Math.abs(ld.w1), Math.abs(ld.w2)); });
    if (maxW === 0) maxW = 1;

    loads.forEach(ld => {
        if (ld.type === 'P') {
            const ax = mapX(ld.a);
            ctx.strokeStyle = '#e74c3c'; ctx.fillStyle = '#e74c3c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(ax, schemaCenterY - 50); ctx.lineTo(ax, schemaCenterY - 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ax, schemaCenterY); ctx.lineTo(ax-8, schemaCenterY-12); ctx.lineTo(ax+8, schemaCenterY-12); ctx.closePath(); ctx.fill();
            ctx.font = 'bold 12px Arial'; ctx.fillText(`${ld.mag}kN`, ax, schemaCenterY - 55);
        } else if (ld.type === 'Trap') {
            // Unified Polygon Renderer mapping directly to w1 and w2 parameters
            let h1 = (ld.w1 / maxW) * 40; 
            let h2 = (ld.w2 / maxW) * 40; 
            
            ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
            ctx.beginPath();
            ctx.moveTo(mapX(ld.a), schemaCenterY);
            ctx.lineTo(mapX(ld.a), schemaCenterY - h1);
            ctx.lineTo(mapX(ld.b), schemaCenterY - h2);
            ctx.lineTo(mapX(ld.b), schemaCenterY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mapX(ld.a), schemaCenterY - h1); ctx.lineTo(mapX(ld.b), schemaCenterY - h2); ctx.stroke();

            for(let i = ld.a; i <= ld.b; i += (ld.b-ld.a)/10 || 1) {
                if (i>ld.b) break;
                let t = (i - ld.a) / (ld.b - ld.a);
                let hi = h1 + t * (h2 - h1);
                ctx.beginPath(); ctx.moveTo(mapX(i), schemaCenterY - hi); ctx.lineTo(mapX(i), schemaCenterY); ctx.stroke();
            }

            ctx.fillStyle = '#c0392b'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
            if (ld.w1 !== 0) ctx.fillText(`${ld.w1}kN/m`, mapX(ld.a), schemaCenterY - h1 - 5);
            if (ld.w2 !== 0 && ld.w2 !== ld.w1) ctx.fillText(`${ld.w2}kN/m`, mapX(ld.b), schemaCenterY - h2 - 5);
            if (ld.w1 === ld.w2 && ld.w1 !== 0) ctx.fillText(`${ld.w1}kN/m`, mapX(ld.a + (ld.b-ld.a)/2), schemaCenterY - h1 - 5);
        }
    });

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
    ctx.beginPath(); ctx.moveTo(mapX(0), dimCenterY+25); ctx.lineTo(mapX(L), dimCenterY+25); ctx.stroke();
    ctx.fillText(`TOTAL SPAN: ${L.toFixed(2)} m`, mapX(L/2), dimCenterY + 22);

    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.5;
    [sfdCenterY, bmdCenterY, defCenterY].forEach(y => { ctx.beginPath(); ctx.moveTo(paddingX, y); ctx.lineTo(paddingX + graphWidth, y); ctx.stroke(); });

    const drawFilledGraph = (dataField, mapY, color) => {
        let plotData = [{ x: 0, y: 0 }, ...mathData.map(d => ({x: d.x, y: d[dataField]})), { x: L, y: 0 }];
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mapX(plotData[0].x), mapY(0));
        plotData.forEach(d => ctx.lineTo(mapX(d.x), mapY(d.y)));
        ctx.lineTo(mapX(L), mapY(0)); ctx.closePath();
        ctx.fillStyle = `rgba(${color}, 0.15)`; ctx.fill();
        ctx.strokeStyle = `rgb(${color})`; ctx.beginPath(); ctx.moveTo(mapX(mathData[0].x), mapY(mathData[0][dataField]));
        for(let i=0; i<mathData.length; i++) {
            ctx.lineTo(mapX(mathData[i].x), mapY(mathData[i][dataField]));
        }
        ctx.stroke();
    };
    drawFilledGraph('V', mapYSFD, '39, 174, 96');
    drawFilledGraph('M', mapYBMD, '41, 128, 185');
    drawFilledGraph('y', mapYDEF, '142, 68, 173');

    ctx.fillStyle = '#2c3e50'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
    ctx.fillText("V (kN)", 15, sfdCenterY + 5); 
    ctx.fillText("M (kN·m)", 15, bmdCenterY + 5);
    ctx.fillText("Δ (mm)", 15, defCenterY + 5);
    
    ctx.textAlign = 'center'; ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#27ae60'; ctx.fillText(`Max |V| = ${maxV.toFixed(2)} kN`, canvas.width / 2, sfdCenterY + (graphHeight / 2) + 25);
    ctx.fillStyle = '#2980b9'; ctx.fillText(`Max |M| = ${maxM.toFixed(2)} kN·m`, canvas.width / 2, bmdCenterY + (graphHeight / 2) + 30);
    ctx.fillStyle = '#8e44ad'; ctx.fillText(`Max |Δ| = ${maxY.toFixed(2)} mm`, canvas.width / 2, defCenterY + (graphHeight / 2) + 30);

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        let mouseX = (e.clientX - rect.left) * scaleX;

        if (mouseX >= paddingX && mouseX <= paddingX + graphWidth) {
            let exactX = ((mouseX - paddingX) / graphWidth) * L;
            let p = mathData.reduce((prev, curr) => Math.abs(curr.x - exactX) < Math.abs(prev.x - exactX) ? curr : prev);

            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX - rect.left + 20) + 'px';
            tooltip.style.top = (e.clientY - rect.top + 20) + 'px';
            tooltip.innerHTML = `
                $x_n$: ${p.x.toFixed(2)} m<br>
                $V(x)$: ${p.V.toFixed(2)} kN<br>
                $M(x)$: ${p.M.toFixed(2)} kN·m<br>
                Δ: ${p.y.toFixed(2)} mm
            `;

            drawDiagramsHoverLine(mouseX);
        } else {
            tooltip.style.display = 'none';
            drawDiagramsHoverLine(null); 
        }
    };
    canvas.onmouseleave = () => { tooltip.style.display = 'none'; drawDiagramsHoverLine(null); };

    function drawDiagramsHoverLine(hoverX) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.onmousemove = null;
        drawDiagrams(); 
        if (hoverX) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(hoverX, schemaCenterY-10); ctx.lineTo(hoverX, defCenterY+graphHeight/2+10); ctx.stroke(); ctx.setLineDash([]);
        }
    }
}