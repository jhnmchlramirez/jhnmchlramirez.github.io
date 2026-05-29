/**
 * RC Footing Calculator Engine - ACI 318-19M & ACI 318-25M
 * Supports Isolated, Combined, and Mat foundation capacity evaluations.
 */

// --- 1. INTERFACE INJECTION LAYER ---
function launchRCFootingTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    document.getElementById('activeAppInterface').style.display = 'block';
    document.getElementById('appTitle').innerText = "RC Footing Capacity Analyzer";

    const appContent = document.getElementById('appContent');
    appContent.innerHTML = `
        <div class="app-section-title">Geometry and Materials</div>
        
        <div class="app-grid" style="margin-bottom: 15px;">
            <div class="app-group">
                <label>Footing Classification</label>
                <select id="footingType" onchange="handleFootingTypeDetection(); triggerCalculateFooting();">
                    <option value="isolated">Isolated Footing</option>
                    <option value="combined">Combined Footing</option>
                    <option value="mat">Mat Foundation (1m Strip)</option>
                </select>
            </div>
            <div class="app-group">
                <label>ACI Code Standard</label>
                <select id="codeVersionFooting" onchange="triggerCalculateFooting()">
                    <option value="ACI318_19M">ACI 318-19M</option>
                    <option value="ACI318_25M" selected>ACI 318-25M</option>
                </select>
            </div>
            <div class="app-group">
                <label>Thickness, h (mm)</label>
                <input type="number" id="footingHeight" value="400" min="150" step="50" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group">
                <label>Clear Cover, cc (mm)</label>
                <input type="number" id="footingClearCover" value="75" min="40" step="5" oninput="triggerCalculateFooting()">
            </div>
            
            <div class="app-group footing-dim">
                <label>Footing Length, L (mm)</label>
                <input type="number" id="footingL" value="2000" min="500" step="100" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group footing-dim">
                <label>Footing Width, B (mm)</label>
                <input type="number" id="footingB" value="2000" min="500" step="100" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group footing-dim" style="visibility: hidden;"></div>
            <div class="app-group footing-dim" style="visibility: hidden;"></div>
        </div>

        <div class="app-grid" style="margin-bottom: 15px;">
            <div class="app-group col1-dim">
                <label>Col 1 Width, c1x (mm)</label>
                <input type="number" id="col1X" value="300" min="100" step="50" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group col1-dim">
                <label>Col 1 Depth, c1y (mm)</label>
                <input type="number" id="col1Y" value="300" min="100" step="50" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group col1-pos">
                <label>Col 1 Position</label>
                <select id="col1Position" onchange="triggerCalculateFooting()">
                    <option value="40">Interior (αs = 40)</option>
                    <option value="30">Edge (αs = 30)</option>
                    <option value="20">Corner (αs = 20)</option>
                </select>
            </div>
            <div class="app-group col1-dim" style="visibility: hidden;"></div> <div class="app-group col2-dim">
                <label>Col 2 Width, c2x (mm)</label>
                <input type="number" id="col2X" value="300" min="100" step="50" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group col2-dim">
                <label>Col 2 Depth, c2y (mm)</label>
                <input type="number" id="col2Y" value="300" min="100" step="50" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group col2-pos">
                <label>Col 2 Position</label>
                <select id="col2Position" onchange="triggerCalculateFooting()">
                    <option value="40">Interior (αs = 40)</option>
                    <option value="30">Edge (αs = 30)</option>
                    <option value="20">Corner (αs = 20)</option>
                </select>
            </div>
            <div class="app-group col2-dim" style="visibility: hidden;"></div> </div>

        <div class="app-section-title">Material & Reinforcement</div>
        <div class="app-grid">
            <div class="app-group">
                <label>Concrete Strength, f'c (MPa)</label>
                <input type="number" id="footingConcreteStrength" value="28" min="21" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group">
                <label>Steel Yield Strength, fy (MPa)</label>
                <input type="number" id="footingFy" value="420" min="275" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group">
                <label>Main Rebar Dia., db (mm)</label>
                <input type="number" id="footingBarDia" value="16" min="10" step="2" oninput="triggerCalculateFooting()">
            </div>
            <div class="app-group">
                <label>Rebar Spacing, s (mm)</label>
                <input type="number" id="footingBarSpacing" value="150" min="50" step="10" oninput="triggerCalculateFooting()">
            </div>
        </div>

        <div class="app-actions">
            <button class="btn-run" onclick="toggleFootingAnalysis()">Run Analysis</button>
            <button class="btn-formula" onclick="toggleFootingEquationView()">Check Equation</button>
        </div>

        <div class="app-results" id="footingResultsPanel" style="display: none;">
            <div class="app-section-title" style="color: #ffffff; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Capacity Results</div>
            <div id="footingErrorMessage" style="color: #ef4444; font-weight: bold; margin-bottom: 10px;"></div>
            
            <p><span>Flexural Capacity (\\(\\phi M_n\\)):</span> <span id="outFootingMoment" class="result-val">-</span></p>
            <p><span>One-Way Shear (\\(\\phi V_c\\)):</span> <span id="outFootingOneWayShear" class="result-val">-</span></p>
            <p class="punching-result"><span>Two-Way Punching Shear (\\(\\phi V_c\\)):</span> <span id="outFootingPunchingShear" class="result-val">-</span></p>
            <p><span>Effective Depth (\\(d\\)):</span> <span id="outFootingDepth" class="result-val">-</span></p>
            <p><span>Failure Classification:</span> <span id="outFootingClassification" class="result-val">-</span></p>
        </div>

        <div class="app-results" id="footingEquationPanel" style="display: none; border-left-color: #a0aec0;">
            <div class="app-section-title" style="color: #a0aec0; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Governing Equations & Substitutions</div>
            <div id="footingEquationSubstitutions" style="color: #cbd5e1;">
                <p style="display: block;">Click "Run Analysis" to generate substituted equations.</p>
            </div>
        </div>
    `;

    handleFootingTypeDetection();
    if (window.MathJax) { MathJax.typesetPromise(); }
}

// --- 2. AUTOMATED CONFIGURATION & UI ROUTING ---
let footingCalcTimeout;

function triggerCalculateFooting() {
    clearTimeout(footingCalcTimeout);
    footingCalcTimeout = setTimeout(() => {
        calculateFooting();
    }, 300);
}

function handleFootingTypeDetection() {
    const type = document.getElementById("footingType").value;
    const dimInputs = document.querySelectorAll(".footing-dim");
    const col1Inputs = document.querySelectorAll(".col1-dim");
    const col1Pos = document.querySelectorAll(".col1-pos");
    const col2Inputs = document.querySelectorAll(".col2-dim");
    const col2Pos = document.querySelectorAll(".col2-pos");
    const punchingResults = document.querySelectorAll(".punching-result");
    
    if (type === "mat") {
        dimInputs.forEach(el => el.style.display = 'none');
        col1Inputs.forEach(el => el.style.display = 'none');
        col1Pos.forEach(el => el.style.display = 'none');
        col2Inputs.forEach(el => el.style.display = 'none');
        col2Pos.forEach(el => el.style.display = 'none');
        punchingResults.forEach(el => el.style.display = 'none');
    } else if (type === "isolated") {
        dimInputs.forEach(el => el.style.display = 'flex');
        col1Inputs.forEach(el => el.style.display = 'flex');
        col1Pos.forEach(el => el.style.display = 'flex');
        col2Inputs.forEach(el => el.style.display = 'none'); 
        col2Pos.forEach(el => el.style.display = 'none');
        punchingResults.forEach(el => el.style.display = 'flex');
    } else if (type === "combined") {
        dimInputs.forEach(el => el.style.display = 'flex');
        col1Inputs.forEach(el => el.style.display = 'flex');
        col1Pos.forEach(el => el.style.display = 'flex');
        col2Inputs.forEach(el => el.style.display = 'flex'); 
        col2Pos.forEach(el => el.style.display = 'flex');
        punchingResults.forEach(el => el.style.display = 'flex');
    }
}

function toggleFootingAnalysis() {
    const panel = document.getElementById('footingResultsPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateFooting();
    }
}

function toggleFootingEquationView() {
    const panel = document.getElementById('footingEquationPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateFooting(); 
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// Helper Function for Two-Way Punching Shear
function evaluatePunchingShear(cx, cy, d, alpha_s, lambda, fc_sqrt) {
    const bo = 2 * (cx + d) + 2 * (cy + d);
    let beta = 1;
    if (cx > 0 && cy > 0) {
        beta = Math.max(cx, cy) / Math.min(cx, cy);
    }
    const vc1 = 0.33 * lambda * fc_sqrt;
    const vc2 = 0.17 * (1 + 2 / beta) * lambda * fc_sqrt;
    const vc3 = 0.083 * ((alpha_s * d) / bo + 2) * lambda * fc_sqrt;
    
    const vc_gov = Math.min(vc1, vc2, vc3);
    const Vc = vc_gov * bo * d;
    return { bo, beta, vc1, vc2, vc3, phiVc: 0.75 * Vc };
}

// --- 3. MATHEMATICAL COMPUTATION & DYNAMIC SUBSTITUTION ENGINE ---
function calculateFooting() {
    const errorDiv = document.getElementById("footingErrorMessage");
    if(!errorDiv) return; 
    
    errorDiv.innerText = "";
    
    const type = document.getElementById("footingType").value;
    const code = document.getElementById("codeVersionFooting").value;
    const codeRef = (code === "ACI318_19M") ? "ACI 318-19" : "ACI 318-25";
    
    const h = parseFloat(document.getElementById("footingHeight").value) || 0;
    const cc = parseFloat(document.getElementById("footingClearCover").value) || 0;
    const fc = parseFloat(document.getElementById("footingConcreteStrength").value) || 0;
    const fy = parseFloat(document.getElementById("footingFy").value) || 0;
    const db = parseFloat(document.getElementById("footingBarDia").value) || 0;
    const s = parseFloat(document.getElementById("footingBarSpacing").value) || 0;
    
    let L, B, b_eval;
    if (type === "mat") {
        L = 1000; B = 1000; b_eval = 1000;
    } else {
        L = parseFloat(document.getElementById("footingL").value) || 0;
        B = parseFloat(document.getElementById("footingB").value) || 0;
        b_eval = B; 
    }

    if (h <= 0 || fc <= 0 || fy <= 0 || L <= 0 || B <= 0) {
        errorDiv.innerText = "Error: Invalid geometric or material inputs.";
        return;
    }

    let beta1 = 0.85;
    if (fc > 28) {
        beta1 = 0.85 - (0.05 * (fc - 28)) / 7;
        if (beta1 < 0.65) beta1 = 0.65;
    }

    const fc_sqrt = Math.min(Math.sqrt(fc), 8.3);
    let dynamicMathHTML = ""; 

    try {
        const d = h - cc - db; 
        
        // Flexure
        const As = (b_eval / s) * (Math.PI * Math.pow(db, 2) / 4);
        const a = (As * fy) / (0.85 * fc * b_eval);
        const c = a / beta1;
        const Mn = As * fy * (d - a / 2);
        
        const netStrain = c > 0 ? (0.003 * (d - c)) / c : 0.05; 
        const tyStrain = fy / 200000;
        let phiFlexure = 0.90;
        let status = "Ductile ✔";
        let color = "#34d399";
        
        if (netStrain < tyStrain) {
            phiFlexure = 0.65;
            status = "Brittle ❌"; color = "#ef4444";
        } else if (netStrain < 0.005) {
            phiFlexure = 0.65 + (netStrain - tyStrain) * (0.25 / (0.005 - tyStrain)); 
            status = "Transition ⚠"; color = "#fbbf24";
        }

        let As_min = (fy < 420) ? (0.0020 * b_eval * h) : Math.max((0.0018 * 420 / fy) * b_eval * h, 0.0014 * b_eval * h);
        const rebarCheck = (As < As_min) ? `❌ Failed (As < ${As_min.toFixed(0)} mm²)` : `✔ Passed`;

        // One-Way Shear
        const lambda = 1.0; 
        let lambda_s = Math.sqrt(2 / (1 + 0.004 * d));
        if (lambda_s > 1.0) lambda_s = 1.0;
        
        let Vc_1way = 0;
        const rho_w = As / (b_eval * d);

        if (code === "ACI318_19M") {
            Vc_1way = 0.66 * lambda_s * lambda * Math.pow(rho_w, 1/3) * fc_sqrt * b_eval * d;
        } else {
            Vc_1way = (0.16 * lambda_s * lambda * fc_sqrt + 17 * rho_w) * b_eval * d;
        }
        const phiVc_1way = 0.75 * Vc_1way;

        dynamicMathHTML += `
            <h4 style="color:#FFEE91; margin-top:0;">Flexural Capacity (${codeRef} Sec. 22.2)</h4>
            <p style="display: block;">Evaluated Width (\\(b\\)): ${b_eval} mm</p>
            <p style="display: block;">Steel Area (\\(A_s\\)):</p>
            <div class="equation">\\[ A_s = \\frac{${b_eval}}{s} \\cdot \\frac{\\pi d_b^2}{4} = ${As.toFixed(2)} \\text{ mm}^2 \\quad \\color{#ef4444}{\\text{[${codeRef} Sec. 7.6.1.1]}} \\]</div>
            <p style="display: block;">Nominal Moment (\\(M_n\\)):</p>
            <div class="equation">\\[ M_n = A_s f_y \\left(d - \\frac{a}{2}\\right) = ${(Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\quad \\color{#ef4444}{\\text{[${codeRef} Sec. 22.2.2]}} \\]</div>
            <p style="display: block; font-weight:bold; color:${color};">Strain Check: ${status} (\\(\\phi = ${phiFlexure.toFixed(3)}\\)) | Min Steel: ${rebarCheck}</p>
            
            <hr style="border: 1px solid #2d2d35; margin: 15px 0;">
            <h4 style="color:#FFEE91;">One-Way Shear Capacity (\\(V_c\\)) - ${codeRef} Sec. 22.5</h4>
            <div class="equation">\\[ \\lambda_s = \\sqrt{\\frac{2}{1 + 0.004d}} = ${lambda_s.toFixed(3)} \\le 1.0 \\quad \\color{#ef4444}{\\text{[${codeRef} Eq. 22.5.5.1.3]}} \\]</div>
            <div class="equation">\\[ \\phi V_c = 0.75 \\times ${(Vc_1way/1000).toFixed(2)} = ${(phiVc_1way / 1000).toFixed(2)} \\text{ kN} \\quad \\color{#ef4444}{\\text{[${codeRef} Table 22.5.5.1]}} \\]</div>
        `;

        // Two-Way (Punching) Shear
        if (type !== "mat") {
            const c1X = parseFloat(document.getElementById("col1X").value) || 0;
            const c1Y = parseFloat(document.getElementById("col1Y").value) || 0;
            const alpha_s1 = parseFloat(document.getElementById("col1Position").value) || 40;
            
            const p1 = evaluatePunchingShear(c1X, c1Y, d, alpha_s1, lambda, fc_sqrt);
            let gov_phiVc_2way = p1.phiVc;
            let punchingHTML = `
                <hr style="border: 1px solid #2d2d35; margin: 15px 0;">
                <h4 style="color:#FFEE91;">Two-Way Punching Shear (\\(V_c\\)) - ${codeRef} Sec. 22.6</h4>
                <p style="display: block; font-weight:bold;">Column 1 Evaluation:</p>
                <p style="display: block;">Critical Perimeter (\\(b_o\\)):</p>
                <div class="equation">\\[ b_{o1} = 2(c_{1x} + d) + 2(c_{1y} + d) = ${p1.bo.toFixed(1)} \\text{ mm} \\quad \\color{#ef4444}{\\text{[${codeRef} Sec. 22.6.4.1]}} \\]</div>
                <p style="display: block;">Governing shear stress (\\(v_c\\)) is the minimum of:</p>
                <div class="equation">\\[ 0.33\\sqrt{f'_c} = ${p1.vc1.toFixed(3)} \\text{ MPa} \\quad \\color{#ef4444}{\\text{[${codeRef} Table 22.6.5.2(a)]}} \\]</div>
                <div class="equation">\\[ 0.17\\left(1+\\frac{2}{\\beta}\\right)\\sqrt{f'_c} = ${p1.vc2.toFixed(3)} \\text{ MPa} \\quad \\color{#ef4444}{\\text{[${codeRef} Table 22.6.5.2(b)]}} \\]</div>
                <div class="equation">\\[ 0.083\\left(\\frac{\\alpha_s (${alpha_s1}) d}{b_o}+2\\right)\\sqrt{f'_c} = ${p1.vc3.toFixed(3)} \\text{ MPa} \\quad \\color{#ef4444}{\\text{[${codeRef} Table 22.6.5.2(c)]}} \\]</div>
                <p style="display: block; font-style: italic; font-size: 0.9em; color: #a0aec0;">*Note: \\(\\alpha_s\\) is ${alpha_s1} based on your Column 1 Position selection.</p>
                <div class="equation">\\[ \\phi V_{c1} = 0.75 \\times (v_c b_{o1} d) = ${(p1.phiVc / 1000).toFixed(2)} \\text{ kN} \\quad \\color{#ef4444}{\\text{[${codeRef} Eq. 22.6.1.4]}} \\]</div>
            `;

            if (type === "combined") {
                const c2X = parseFloat(document.getElementById("col2X").value) || 0;
                const c2Y = parseFloat(document.getElementById("col2Y").value) || 0;
                const alpha_s2 = parseFloat(document.getElementById("col2Position").value) || 40;
                
                const p2 = evaluatePunchingShear(c2X, c2Y, d, alpha_s2, lambda, fc_sqrt);
                
                punchingHTML += `
                    <p style="display: block; font-weight:bold; margin-top: 15px;">Column 2 Evaluation:</p>
                    <p style="display: block;">Critical Perimeter (\\(b_o\\)):</p>
                    <div class="equation">\\[ b_{o2} = 2(c_{2x} + d) + 2(c_{2y} + d) = ${p2.bo.toFixed(1)} \\text{ mm} \\quad \\color{#ef4444}{\\text{[${codeRef} Sec. 22.6.4.1]}} \\]</div>
                    <div class="equation">\\[ 0.083\\left(\\frac{\\alpha_s (${alpha_s2}) d}{b_o}+2\\right)\\sqrt{f'_c} = ${p2.vc3.toFixed(3)} \\text{ MPa} \\quad \\color{#ef4444}{\\text{[${codeRef} Table 22.6.5.2(c)]}} \\]</div>
                    <div class="equation">\\[ \\phi V_{c2} = 0.75 \\times (v_c b_{o2} d) = ${(p2.phiVc / 1000).toFixed(2)} \\text{ kN} \\quad \\color{#ef4444}{\\text{[${codeRef} Eq. 22.6.1.4]}} \\]</div>
                `;

                if (p2.phiVc < p1.phiVc) {
                    gov_phiVc_2way = p2.phiVc;
                    punchingHTML += `<p style="display: block; font-weight:bold; color: #ef4444;">Column 2 Governs.</p>`;
                } else {
                    punchingHTML += `<p style="display: block; font-weight:bold; color: #ef4444;">Column 1 Governs.</p>`;
                }
            }

            dynamicMathHTML += punchingHTML;
            document.getElementById("outFootingPunchingShear").innerText = (gov_phiVc_2way / 1000).toFixed(2) + " kN";
        }

        document.getElementById("outFootingMoment").innerText = (Mn * phiFlexure / 1000000).toFixed(2) + (type === "mat" ? " kN·m/m" : " kN·m");
        document.getElementById("outFootingOneWayShear").innerText = (phiVc_1way / 1000).toFixed(2) + (type === "mat" ? " kN/m" : " kN");
        document.getElementById("outFootingDepth").innerText = d.toFixed(1) + " mm";
        document.getElementById("outFootingClassification").innerText = status.replace(/[✔❌⚠]/g, "").trim();

        document.getElementById("footingEquationSubstitutions").innerHTML = dynamicMathHTML;
        
        if (window.MathJax && document.getElementById('footingEquationPanel').style.display === 'block') { 
            MathJax.typesetPromise([document.getElementById("footingEquationSubstitutions")]); 
        }

    } catch (e) {
        errorDiv.innerText = "Error in calculations. Check your dimensional limits.";
        console.error(e);
    }
}