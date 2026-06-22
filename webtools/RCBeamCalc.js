/**
 * RC Beam Calculator Engine - ACI 318-19M & ACI 318-25M
 * Handles UI String Templates, Toggle Interactions, and Live Engineering Analysis
 */

// --- 1. INTERFACE INJECTION LAYER ---
function launchRCBeamTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    document.getElementById('activeAppInterface').style.display = 'block';
    document.getElementById('appTitle').innerText = "RC Beam Capacity Analyzer";

    const appContent = document.getElementById('appContent');
    appContent.innerHTML = `
        <div class="app-section-title">Geometry and Materials</div>
        
        <div class="app-grid" style="margin-bottom: 15px;">
            <div class="app-group">
                <label>Beam Section Type</label>
                <select id="beamType" onchange="toggleBeamInputs(); triggerCalculate();">
                    <option value="singly">Singly Reinforced (Rectangular)</option>
                    <option value="doubly">Doubly Reinforced (Rectangular)</option>
                    <option value="tbeam">T-Beam / Flanged Section</option>
                </select>
            </div>
            <div class="app-group">
                <label>ACI Code Standard</label>
                <select id="codeVersion" onchange="triggerCalculate()">
                    <option value="ACI318_19M">ACI 318-19M</option>
                    <option value="ACI318_25M" selected>ACI 318-25M</option>
                </select>
            </div>
        </div>

        <div class="app-grid">
            <div class="app-group tbeam-hide">
                <label>Beam Width, b (mm)</label>
                <input type="number" id="beamWidth" value="300" min="100" step="10" oninput="triggerCalculate()">
            </div>
            <div class="app-group">
                <label>Total Depth, h (mm)</label>
                <input type="number" id="beamHeight" value="500" min="100" step="10" oninput="triggerCalculate()">
            </div>
            <div class="app-group">
                <label>Clear Cover, cc (mm)</label>
                <input type="number" id="clearCover" value="40" min="20" step="5" oninput="triggerCalculate()">
            </div>
            <div class="app-group">
                <label>Concrete Strength, f'c (MPa)</label>
                <input type="number" id="concreteStrength" value="28" min="21" oninput="triggerCalculate()">
            </div>
            <div class="app-group">
                <label>Steel Yield Strength, fy (MPa)</label>
                <input type="number" id="fy" value="420" min="275" oninput="triggerCalculate()">
            </div>
            <div class="app-group">
                <label>Tension Steel Area, As (mm²)</label>
                <input type="number" id="barArea" value="1200" min="50" oninput="triggerCalculate()">
            </div>

            <div class="app-group doubly-only" style="display:none;">
                <label>Compression Steel, A's (mm²)</label>
                <input type="number" id="compBarArea" value="400" min="0" oninput="triggerCalculate()">
            </div>
            <div class="app-group doubly-only" style="display:none;">
                <label>Comp. Steel Depth, d' (mm)</label>
                <input type="number" id="compDepth" value="65" min="20" oninput="triggerCalculate()">
            </div>

            <div class="app-group tbeam-only" style="display:none;">
                <label>Effective Flange Width, bf (mm)</label>
                <input type="number" id="flangeWidth" value="1000" min="100" oninput="triggerCalculate()">
            </div>
            <div class="app-group tbeam-only" style="display:none;">
                <label>Flange Thickness, hf (mm)</label>
                <input type="number" id="flangeThickness" value="120" min="50" oninput="triggerCalculate()">
            </div>
            <div class="app-group tbeam-only" style="display:none;">
                <label>Web Width, bw (mm)</label>
                <input type="number" id="webWidth" value="300" min="100" oninput="triggerCalculate()">
            </div>
        </div>

        <div class="app-actions">
            <button class="btn-run" onclick="toggleAnalysis()">Run Analysis</button>
            <button class="btn-formula" onclick="toggleEquationView()">Check Equation</button>
        </div>

        <div class="app-results" id="resultsPanel" style="display: none;">
            <div class="app-section-title" style="color: #ffffff; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Analysis Results</div>
            <div id="errorMessage" style="color: #ef4444; font-weight: bold; margin-bottom: 10px;"></div>
            
            <p><span>Nominal Moment (\\(M_n\\)):</span> <span id="outNominalMoment" class="result-val">-</span></p>
            <p><span>Design Moment (\\(\\phi M_n\\)):</span> <span id="outMoment" class="result-val">-</span></p>
            <p><span>Concrete Shear (\\(\\phi V_c\\)):</span> <span id="outShear" class="result-val">-</span></p>
            <p><span>Effective Depth (\\(d\\)):</span> <span id="outDepth" class="result-val">-</span></p>
            <p><span>Neutral Axis Depth (\\(c\\)):</span> <span id="outNA" class="result-val">-</span></p>
            <p><span>Strength Reduction Factor (\\(\\phi\\)):</span> <span id="outPhi" class="result-val">-</span></p>
            <p><span>Failure Mode / Classification:</span> <span id="outClassification" class="result-val">-</span></p>
        </div>

        <div class="app-results" id="equationPanel" style="display: none; border-left-color: #a0aec0;">
            <div class="app-section-title" style="color: #a0aec0; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Governing Equations & Substitutions</div>
            <div id="equationSubstitutions" style="color: #cbd5e1;">
                <p style="display: block;">Click "Run Analysis" to generate substituted equations.</p>
            </div>
        </div>
    `;

    if (window.MathJax) { MathJax.typesetPromise(); }
}


// --- 2. LIVE INTERACTIVITY & NAVIGATORS ---

let calcTimeout;
let mathJaxPromise = Promise.resolve(); 

function triggerCalculate() {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => {
        calculateBeam();
    }, 300); 
}

function toggleBeamInputs() {
    const type = document.getElementById("beamType").value;
    const doublyInputs = document.querySelectorAll(".doubly-only");
    const tbeamInputs = document.querySelectorAll(".tbeam-only");
    const tbeamHide = document.querySelectorAll(".tbeam-hide");

    doublyInputs.forEach(el => el.style.display = 'none');
    tbeamInputs.forEach(el => el.style.display = 'none');
    tbeamHide.forEach(el => el.style.display = 'flex');

    if (type === "doubly") {
        doublyInputs.forEach(el => el.style.display = 'flex');
    } else if (type === "tbeam") {
        tbeamInputs.forEach(el => el.style.display = 'flex');
        tbeamHide.forEach(el => el.style.display = 'none');
    }
}

function toggleAnalysis() {
    const panel = document.getElementById('resultsPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateBeam();
    }
}

function toggleEquationView() {
    const panel = document.getElementById('equationPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateBeam(); 
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


// --- 3. MATHEMATICAL COMPUTATION & DYNAMIC SUBSTITUTION ENGINE ---
function calculateBeam() {
    const errorDiv = document.getElementById("errorMessage");
    if(!errorDiv) return; 
    
    errorDiv.innerText = "";

    const type = document.getElementById("beamType").value;
    const code = document.getElementById("codeVersion").value;
    
    // Dynamically set the reference string based on active selection
    const codeDisplay = code === "ACI318_19M" ? "ACI 318-19M" : "ACI 318-25M";

    const h = parseFloat(document.getElementById("beamHeight").value) || 0;
    const cc = parseFloat(document.getElementById("clearCover").value) || 0;
    const fc = parseFloat(document.getElementById("concreteStrength").value) || 0;
    const fy = parseFloat(document.getElementById("fy").value) || 0;
    const As = parseFloat(document.getElementById("barArea").value) || 0;
    
    const d = h - cc - 10 - 12.5; 
    
    if (d <= 0 || fc <= 0 || As <= 0 || fy <= 0) {
        errorDiv.innerText = "Error: Invalid geometric or material inputs.";
        clearOutputs();
        return;
    }

    let beta1 = 0.85;
    if (fc > 28) {
        beta1 = 0.85 - (0.05 * (fc - 28)) / 7;
        if (beta1 < 0.65) beta1 = 0.65;
    }

    let Mn = 0; 
    let c = 0;  
    let a = 0;
    let b_shear = 0; 
    let dynamicMathHTML = ""; 

    try {
        // --- ROUTE 1: SINGLY REINFORCED ---
        if (type === "singly") {
            const b = parseFloat(document.getElementById("beamWidth").value) || 0;
            if (b <= 0) {
                errorDiv.innerText = "Error: Beam width must be greater than zero.";
                clearOutputs();
                return;
            }
            b_shear = b;
            a = (As * fy) / (0.85 * fc * b);
            c = a / beta1;
            Mn = As * fy * (d - a / 2); 
            
            dynamicMathHTML += `
                <h4 style="color:#FFEE91; margin-top:0;">Flexural Strength Mechanics</h4>
                <p style="display: block;">Depth of equivalent stress block (\\(a\\)):</p>
                <div class="equation">\\[ a = \\frac{A_s f_y}{0.85 f'_c b} = \\frac{(${As})(${fy})}{0.85(${fc})(${b})} = ${a.toFixed(2)} \\text{ mm} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.2.2.4.1]}} \\]</div>
                <p style="display: block;">Nominal Moment (\\(M_n\\)):</p>
                <div class="equation">\\[ M_n = A_s f_y \\left(d - \\frac{a}{2}\\right) = (${As})(${fy})\\left(${d.toFixed(1)} - \\frac{${a.toFixed(2)}}{2}\\right) \\times 10^{-6} = ${(Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.3.1.1]}} \\]</div>
            `;
        }

        // --- ROUTE 2: DOUBLY REINFORCED ---
        else if (type === "doubly") {
            const b = parseFloat(document.getElementById("beamWidth").value) || 0;
            if (b <= 0) {
                errorDiv.innerText = "Error: Beam width must be greater than zero.";
                clearOutputs();
                return;
            }
            b_shear = b;
            const Asc = parseFloat(document.getElementById("compBarArea").value) || 0; 
            const dp = parseFloat(document.getElementById("compDepth").value) || 0;    
            
            a = ((As - Asc) * fy) / (0.85 * fc * b);
            c = a / beta1;
            let fsc = 600 * (c - dp) / c;

            if (c <= dp) {
                errorDiv.innerText = "WARNING: Neutral axis is above compression steel (c < d'). 'Compression' steel is in tension.";
            }

            if (fsc < fy) {
                const A_quad = 0.85 * fc * b * beta1;
                const B_quad = (Asc * 600) - (As * fy);
                const C_quad = -1 * Asc * 600 * dp;
                c = (-B_quad + Math.sqrt(Math.pow(B_quad, 2) - 4 * A_quad * C_quad)) / (2 * A_quad);
                a = beta1 * c;
                fsc = 600 * (c - dp) / c;
            } else {
                fsc = fy; 
            }
            
            const Cc = 0.85 * fc * a * b; 
            const Cs = Asc * fsc;         
            Mn = Cc * (d - a/2) + Cs * (d - dp);

            dynamicMathHTML += `
                <h4 style="color:#FFEE91; margin-top:0;">Flexural Strength Mechanics (Doubly Reinforced)</h4>
                <p style="display: block;">Calculated Neutral Axis (\\(c\\)) based on stress equilibrium: ${c.toFixed(2)} mm</p>
                <p style="display: block;">Nominal Moment (\\(M_n = M_c + M_{cs}\\)):</p>
                <div class="equation">\\[ M_n = C_c \\left(d - \\frac{a}{2}\\right) + C_s(d - d') = ${(Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.3.1.1]}} \\]</div>
            `;
        }

        // --- ROUTE 3: T-BEAM ---
        else if (type === "tbeam") {
            const bf = parseFloat(document.getElementById("flangeWidth").value) || 0;
            const hf = parseFloat(document.getElementById("flangeThickness").value) || 0;
            const bw = parseFloat(document.getElementById("webWidth").value) || 0;
            
            if (bf <= 0 || bw <= 0) {
                errorDiv.innerText = "Error: Web width and Flange width must be greater than zero.";
                clearOutputs();
                return;
            }
            b_shear = bw;

            a = (As * fy) / (0.85 * fc * bf);
            
            if (a <= hf) {
                c = a / beta1;
                Mn = As * fy * (d - a / 2);
                dynamicMathHTML += `
                    <h4 style="color:#FFEE91; margin-top:0;">Flexural Strength Mechanics</h4>
                    <p style="display: block;">Acts as False T-Beam (\\(a \\le h_f\\)). Analyzed as rectangular section with \\(b = b_f\\).</p>
                    <div class="equation">\\[ a = \\frac{(${As})(${fy})}{0.85(${fc})(${bf})} = ${a.toFixed(2)} \\text{ mm} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.2.2.4.1]}} \\]</div>
                    <div class="equation">\\[ M_n = (${As})(${fy})\\left(${d.toFixed(1)} - \\frac{${a.toFixed(2)}}{2}\\right) \\times 10^{-6} = ${(Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.3.1.1]}} \\]</div>
                `;
            } else {
                const Cf = 0.85 * fc * (bf - bw) * hf; 
                const Asf = Cf / fy;                   
                const Asw = As - Asf;                  
                
                a = (Asw * fy) / (0.85 * fc * bw);
                c = a / beta1;
                const Cw = 0.85 * fc * a * bw; 
                Mn = Cf * (d - hf / 2) + Cw * (d - a / 2);

                dynamicMathHTML += `
                    <h4 style="color:#FFEE91; margin-top:0;">Flexural Strength Mechanics (True T-Beam)</h4>
                    <p style="display: block;">Moment is composed of Flange forces (\\(C_f\\)) and Web forces (\\(C_w\\)):</p>
                    <div class="equation">\\[ M_n = C_f\\left(d - \\frac{h_f}{2}\\right) + C_w\\left(d - \\frac{a}{2}\\right) = ${(Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.3.1.1]}} \\]</div>
                `;
            }
        }

        // --- STRAIN & DUCTILITY CLASSIFICATION ENGINE ---
        const netStrain = (0.003 * (d - c)) / c;
        const tyStrain = fy / 200000; 
        
        let phiFlexure = 0.90; 
        let sectionStatus = "";
        let statusColor = "#34d399"; 

        if (netStrain >= 0.005) {
            phiFlexure = 0.90;
            sectionStatus = "Tension-Controlled (Ductile) ✔";
        } else if (netStrain <= tyStrain) {
            phiFlexure = 0.65; 
            sectionStatus = "Compression-Controlled (Brittle) ❌";
            statusColor = "#ef4444"; 
            if (errorDiv.innerText === "") {
                errorDiv.innerText = "CRITICAL: Section is compression-controlled. Increase dimensions or f'c.";
            }
        } else {
            phiFlexure = 0.65 + (netStrain - tyStrain) * (0.25 / (0.005 - tyStrain)); 
            sectionStatus = "Transition Zone ⚠";
            statusColor = "#fbbf24"; 
        }

        // --- CODE MINIMUM REINFORCEMENT CHECK (ACI 318) ---
        const b_flex = (type === "tbeam") ? (parseFloat(document.getElementById("webWidth").value) || b_shear) : b_shear;
        const As_min1 = (0.25 * Math.sqrt(fc) * b_flex * d) / fy;
        const As_min2 = (1.4 * b_flex * d) / fy;
        const As_min = Math.max(As_min1, As_min2);
        let rebarCheckText = "";
        
        if (As < As_min) {
            rebarCheckText = `As_min Check: As (${As.toFixed(0)} mm²) < As_min (${As_min.toFixed(0)} mm²) ❌ Rebar area is insufficient. <span style="color: red;">[${codeDisplay} Sec. 9.6.1.2]</span>`;
            if (errorDiv.innerText === "") errorDiv.innerText = "WARNING: Reinforcement is below code absolute minimums.";
        } else {
            rebarCheckText = `As_min Check: As (${As.toFixed(0)} mm²) ≥ As_min (${As_min.toFixed(0)} mm²) ✔ Section satisfies minimum steel requirement. <span style="color: red;">[${codeDisplay} Sec. 9.6.1.2]</span>`;
        }

        dynamicMathHTML += `
            <hr style="border: 1px solid #2d2d35; margin: 15px 0;">
            <h4 style="color:#FFEE91;">Ductility & Rebar Verification</h4>
            <p style="display: block;">Net Tensile Strain in Extreme Tension Steel (\\(\\varepsilon_t\\)):</p>
            <div class="equation">\\[ \\varepsilon_t = 0.003 \\left(\\frac{d - c}{c}\\right) = 0.003 \\left(\\frac{${d.toFixed(1)} - ${c.toFixed(1)}}{${c.toFixed(1)}}\\right) = ${netStrain.toFixed(5)} \\quad \\color{red}{\\text{[${codeDisplay} Sec. 22.2.1.2]}} \\]</div>
            <p style="display: block; color: #a0aec0;"><i>* Yield Strain Limit (\\(\\varepsilon_{ty} = f_y / E_s\\)): ${tyStrain.toFixed(5)}</i></p>
            <p style="display: block; font-weight: bold; color: ${statusColor};">${sectionStatus} (\\(\\phi = ${phiFlexure.toFixed(3)}\\))</p>
            <p style="display: block; margin-top: 10px; font-family: monospace; color: #cbd5e1;">${rebarCheckText}</p>
        `;

        const Mn_kNm = Mn / 1000000;
        const phiMn_kNm = phiFlexure * Mn_kNm;

        // --- SHEAR ENGINE ROUTING ---
        let Vc = 0;
        const lambda = 1.0; 

        dynamicMathHTML += `<hr style="border: 1px solid #2d2d35; margin: 15px 0;"><h4 style="color:#FFEE91;">Shear Capacity (\\(V_c\\))</h4>`;

        if (code === "ACI318_19M") {
            Vc = 0.17 * lambda * Math.sqrt(fc) * b_shear * d;
            dynamicMathHTML += `
                <p style="display: block;">Based on ACI 318-19M:</p>
                <div class="equation">\\[ V_c = 0.17 \\lambda \\sqrt{f'_c} b_w d \\quad \\color{red}{\\text{[${codeDisplay} Table 22.5.5.1]}} \\]</div>
                <div class="equation">\\[ V_c = 0.17(1.0)\\sqrt{${fc}}(${b_shear})(${d.toFixed(1)}) = ${(Vc/1000).toFixed(2)} \\text{ kN} \\]</div>
            `;
        } else if (code === "ACI318_25M") {
            const rho_w = As / (b_shear * d);
            let Vc_calc = (0.16 * lambda * Math.sqrt(fc) + 17 * rho_w) * b_shear * d;
            const VcMin = 0.17 * lambda * Math.sqrt(fc) * b_shear * d;
            
            dynamicMathHTML += `
                <p style="display: block;">Based on ACI 318-25M (Accounting for \\(\\rho_w\\) = ${rho_w.toFixed(4)}):</p>
                <div class="equation">\\[ V_{c,(calc)} = \\left(0.16 \\lambda \\sqrt{f'_c} + 17 \\rho_w\\right) b_w d = ${(Vc_calc/1000).toFixed(2)} \\text{ kN} \\quad \\color{red}{\\text{[${codeDisplay} Table 22.5.5.1]}} \\]</div>
                <div class="equation">\\[ V_{c,(min)} = 0.17 \\lambda \\sqrt{f'_c} b_w d = ${(VcMin/1000).toFixed(2)} \\text{ kN} \\quad \\color{red}{\\text{[${codeDisplay} Table 22.5.5.1]}} \\]</div>
            `;

            if (Vc_calc < VcMin) {
                Vc = VcMin;
                dynamicMathHTML += `<p style="display: block; color:#a0aec0;"><i>* \\(V_{c,(min)}\\) governs.</i></p>`;
            } else {
                Vc = Vc_calc;
                dynamicMathHTML += `<p style="display: block; color:#a0aec0;"><i>* \\(V_{c,(calc)}\\) governs.</i></p>`;
            }
        }

        const phiVc = (0.75 * Vc) / 1000; 

        // Update Standard DOM Results
        document.getElementById("outNominalMoment").innerText = Mn_kNm.toFixed(2) + " kN·m";
        document.getElementById("outMoment").innerText = phiMn_kNm.toFixed(2) + " kN·m";
        document.getElementById("outShear").innerText = phiVc.toFixed(2) + " kN";
        document.getElementById("outDepth").innerText = d.toFixed(1) + " mm";
        document.getElementById("outNA").innerText = c.toFixed(1) + " mm";
        document.getElementById("outPhi").innerText = phiFlexure.toFixed(3);
        document.getElementById("outClassification").innerText = sectionStatus.replace(" ✔","").replace(" ❌","").replace(" ⚠","");

        // Update Dynamic Formula Substitutions
        document.getElementById("equationSubstitutions").innerHTML = dynamicMathHTML;
        
        if (window.MathJax && document.getElementById('equationPanel').style.display === 'block') { 
            mathJaxPromise = mathJaxPromise.then(() => {
                return MathJax.typesetPromise([document.getElementById("equationSubstitutions")]);
            }).catch((err) => console.log('MathJax rendering error:', err));
        }

    } catch (e) {
        errorDiv.innerText = "Error in calculations. Check your section limits.";
    }
}

function clearOutputs() {
    document.getElementById("outNominalMoment").innerText = "-";
    document.getElementById("outMoment").innerText = "-";
    document.getElementById("outShear").innerText = "-";
    document.getElementById("outDepth").innerText = "-";
    document.getElementById("outNA").innerText = "-";
    document.getElementById("outPhi").innerText = "-";
    document.getElementById("outClassification").innerText = "-";
}