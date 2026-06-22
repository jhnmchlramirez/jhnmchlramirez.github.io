/**
 * RC Slab Calculator Engine - ACI 318-19M & ACI 318-25M
 * Automatically detects One-Way vs Two-Way slab configurations via aspect ratio rules.
 */

// --- 1. INTERFACE INJECTION LAYER ---
function launchRCSlabTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    document.getElementById('activeAppInterface').style.display = 'block';
    document.getElementById('appTitle').innerText = "RC Slab Capacity Analyzer";

    const appContent = document.getElementById('appContent');
    appContent.innerHTML = `
        <div class="app-section-title">Geometry and Materials (1m Design Strip)</div>
        
        <div class="app-grid" style="margin-bottom: 15px;">
            <div class="app-group">
                <label>Clear Short Span, Ls (mm)</label>
                <input type="number" id="slabShortSpan" value="3000" min="500" step="100" oninput="handleSlabTypeDetection(); triggerCalculateSlab();">
            </div>
            <div class="app-group">
                <label>Clear Long Span, Ll (mm)</label>
                <input type="number" id="slabLongSpan" value="4500" min="500" step="100" oninput="handleSlabTypeDetection(); triggerCalculateSlab();">
            </div>
            <div class="app-group">
                <label>Detected Slab Configuration</label>
                <input type="text" id="detectedSlabTypeDisplay" value="Two-Way Slab" readonly style="background: #111111; color: #FFEE91; font-weight: bold; border-color: #2d2d35;">
                <input type="hidden" id="slabType" value="twoway">
            </div>
            <div class="app-group">
                <label>ACI Code Standard</label>
                <select id="codeVersionSlab" onchange="triggerCalculateSlab()">
                    <option value="ACI318_19M">ACI 318-19M</option>
                    <option value="ACI318_25M" selected>ACI 318-25M</option>
                </select>
            </div>
        </div>

        <div class="app-grid">
            <div class="app-group">
                <label>Slab Thickness, h (mm)</label>
                <input type="number" id="slabHeight" value="150" min="50" step="10" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group">
                <label>Clear Cover, cc (mm)</label>
                <input type="number" id="slabClearCover" value="20" min="15" step="5" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group">
                <label>Concrete Strength, f'c (MPa)</label>
                <input type="number" id="slabConcreteStrength" value="28" min="21" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group">
                <label>Steel Yield Strength, fy (MPa)</label>
                <input type="number" id="slabFy" value="420" min="275" oninput="triggerCalculateSlab()">
            </div>

            <div class="app-group oneway-only" style="display:none;">
                <label>Main Rebar Dia., db (mm)</label>
                <input type="number" id="slabBarDia" value="12" min="10" step="2" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group oneway-only" style="display:none;">
                <label>Main Rebar Spacing, s (mm)</label>
                <input type="number" id="slabBarSpacing" value="200" min="50" step="10" oninput="triggerCalculateSlab()">
            </div>

            <div class="app-group twoway-only">
                <label>Short Span Dia., dbs (mm)</label>
                <input type="number" id="shortBarDia" value="12" min="10" step="2" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group twoway-only">
                <label>Short Span Spacing, ss (mm)</label>
                <input type="number" id="shortBarSpacing" value="200" min="50" step="10" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group twoway-only">
                <label>Long Span Dia., dbl (mm)</label>
                <input type="number" id="longBarDia" value="12" min="10" step="2" oninput="triggerCalculateSlab()">
            </div>
            <div class="app-group twoway-only">
                <label>Long Span Spacing, sl (mm)</label>
                <input type="number" id="longBarSpacing" value="200" min="50" step="10" oninput="triggerCalculateSlab()">
            </div>
        </div>

        <div class="app-actions">
            <button class="btn-run" onclick="toggleSlabAnalysis()">Run Analysis</button>
            <button class="btn-formula" onclick="toggleSlabEquationView()">Check Equation</button>
        </div>

        <div class="app-results" id="slabResultsPanel" style="display: none;">
            <div class="app-section-title" style="color: #ffffff; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Analysis Results (per 1m strip)</div>
            <div id="slabErrorMessage" style="color: #ef4444; font-weight: bold; margin-bottom: 10px;"></div>
            
            <p><span>Design Moment (\\(\\phi M_n\\)):</span> <span id="outSlabMoment" class="result-val">-</span></p>
            <p><span>Concrete Shear (\\(\\phi V_c\\)):</span> <span id="outSlabShear" class="result-val">-</span></p>
            <p><span>Effective Depth (\\(d\\)):</span> <span id="outSlabDepth" class="result-val">-</span></p>
            <p><span>Reinforcement Ratio (\\(\\rho\\)):</span> <span id="outSlabRho" class="result-val">-</span></p>
            <p><span>Failure Classification:</span> <span id="outSlabClassification" class="result-val">-</span></p>
        </div>

        <div class="app-results" id="slabEquationPanel" style="display: none; border-left-color: #a0aec0;">
            <div class="app-section-title" style="color: #a0aec0; border-bottom: 1px solid #2d2d35; padding-bottom: 5px;">Governing Equations & Substitutions</div>
            <div id="slabEquationSubstitutions" style="color: #cbd5e1;">
                <p style="display: block;">Click "Run Analysis" to generate substituted equations.</p>
            </div>
        </div>
    `;

    // Ensure initial structural toggle matches state setup defaults
    handleSlabTypeDetection();
    if (window.MathJax) { MathJax.typesetPromise(); }
}

// --- 2. AUTOMATED CONFIGURATION & UI ROUTING ---

let slabCalcTimeout;

function triggerCalculateSlab() {
    clearTimeout(slabCalcTimeout);
    slabCalcTimeout = setTimeout(() => {
        calculateSlab();
    }, 300);
}

// Dynamic classification framework executing code rules using structural dimensions
function handleSlabTypeDetection() {
    const input1 = parseFloat(document.getElementById("slabShortSpan").value) || 1;
    const input2 = parseFloat(document.getElementById("slabLongSpan").value) || 1;
    
    // BUG FIX 3: Automatically sort spans to prevent user input errors
    const Ls = Math.min(input1, input2);
    const Ll = Math.max(input1, input2);
    
    const displayField = document.getElementById("detectedSlabTypeDisplay");
    const hiddenField = document.getElementById("slabType");
    
    const onewayInputs = document.querySelectorAll(".oneway-only");
    const twowayInputs = document.querySelectorAll(".twoway-only");
    
    const ratio = Ll / Ls;

    if (ratio > 2.0) {
        displayField.value = `One-Way (Ratio: ${ratio.toFixed(2)} > 2.0)`;
        hiddenField.value = "oneway";
        onewayInputs.forEach(el => el.style.display = 'flex');
        twowayInputs.forEach(el => el.style.display = 'none');
    } else {
        displayField.value = `Two-Way (Ratio: ${ratio.toFixed(2)} ≤ 2.0)`;
        hiddenField.value = "twoway";
        onewayInputs.forEach(el => el.style.display = 'none');
        twowayInputs.forEach(el => el.style.display = 'flex');
    }
}

function toggleSlabAnalysis() {
    const panel = document.getElementById('slabResultsPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateSlab();
    }
}

function toggleSlabEquationView() {
    const panel = document.getElementById('slabEquationPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none'; 
    } else {
        panel.style.display = 'block'; 
        calculateSlab(); 
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

// --- 3. MATHEMATICAL COMPUTATION & DYNAMIC SUBSTITUTION ENGINE ---
function calculateSlab() {
    const errorDiv = document.getElementById("slabErrorMessage");
    if(!errorDiv) return; 
    
    errorDiv.innerText = "";
    
    const type = document.getElementById("slabType").value;
    const code = document.getElementById("codeVersionSlab").value;
    const h = parseFloat(document.getElementById("slabHeight").value) || 0;
    const cc = parseFloat(document.getElementById("slabClearCover").value) || 0;
    const fc = parseFloat(document.getElementById("slabConcreteStrength").value) || 0;
    const fy = parseFloat(document.getElementById("slabFy").value) || 0;
    const b = 1000; // Standard 1-meter strip evaluation width
    
    if (h <= 0 || fc <= 0 || fy <= 0) {
        errorDiv.innerText = "Error: Invalid geometric or material inputs.";
        return;
    }

    let beta1 = 0.85;
    if (fc > 28) {
        beta1 = 0.85 - (0.05 * (fc - 28)) / 7;
        if (beta1 < 0.65) beta1 = 0.65;
    }

    let dynamicMathHTML = ""; 
    let resMn = 0, resVc = 0, resD = 0, resRho = 0, resStatus = "";

    try {
        const analyzeStrip = (dia, spacing, isInnerLayer) => {
            const As = (b / spacing) * (Math.PI * Math.pow(dia, 2) / 4);
            const outerOffset = isInnerLayer ? parseFloat(document.getElementById("shortBarDia").value) : 0;
            const d = h - cc - outerOffset - (dia / 2);
            
            const a = (As * fy) / (0.85 * fc * b);
            const c = a / beta1;
            const Mn = As * fy * (d - a / 2);
            
            const netStrain = (0.003 * (d - c)) / c;
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

            // BUG FIX 1: Dynamic ACI 318 Sec. 24.4.3 Shrinkage/Temperature Steel
            let As_min = 0;
            if (fy < 420) {
                As_min = 0.0020 * b * h;
            } else {
                As_min = Math.max((0.0018 * 420 / fy) * b * h, 0.0014 * b * h);
            }
            const rebarCheck = (As < As_min) ? `❌ Failed (As < ${As_min.toFixed(0)} mm²)` : `✔ Passed (As ≥ ${As_min.toFixed(0)} mm²)`;
            
            // BUG FIX 2: Shear capacity bounds corrected for solid slabs (Av = 0)
            const lambda = 1.0; 
            let lambda_s = Math.sqrt(2 / (1 + 0.004 * d));
            if (lambda_s > 1.0) lambda_s = 1.0;
            
            let Vc = 0;
            if (code === "ACI318_19M") {
                // Simplified legacy conservative assumption
                Vc = 0.17 * lambda_s * lambda * Math.sqrt(fc) * b * d;
            } else {
                // Correct ACI formulation for members without shear reinforcement
                const rho_w = As / (b * d);
                Vc = (0.16 * lambda_s * lambda * Math.sqrt(fc) + 17 * rho_w) * b * d;
            }
            
            return {
                As, d, a, c, Mn, phiFlexure, netStrain, status, color, rebarCheck, Vc, lambda_s
            };
        };

        if (type === "oneway") {
            const db = parseFloat(document.getElementById("slabBarDia").value) || 0;
            const s = parseFloat(document.getElementById("slabBarSpacing").value) || 0;
            
            const r = analyzeStrip(db, s, false);
            resMn = r.Mn * r.phiFlexure; resVc = r.Vc * 0.75; resD = r.d; resRho = r.As / (b * r.d); resStatus = r.status;
            
            dynamicMathHTML += `
                <h4 style="color:#FFEE91; margin-top:0;">One-Way Slab Flexure (ACI 318 Sec. 7.5.1 & 22.2)</h4>
                <p style="display: block;">Steel Area (\\(A_s\\)):</p>
                <div class="equation">\\[ A_s = \\frac{1000}{s} \\cdot \\frac{\\pi d_b^2}{4} = \\frac{1000}{${s}} \\cdot \\frac{\\pi (${db})^2}{4} = ${r.As.toFixed(2)} \\text{ mm}^2/\\text{m} \\]</div>
                <p style="display: block;">Nominal Moment (\\(M_n\\)):</p>
                <div class="equation">\\[ M_n = A_s f_y \\left(${r.d.toFixed(1)} - \\frac{${r.a.toFixed(2)}}{2}\\right) \\times 10^{-6} = ${(r.Mn/1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m} \\]</div>
                <p style="display: block; font-weight:bold; color:${r.color};">Strain Check: ${r.status} (\\(\\phi = ${r.phiFlexure.toFixed(3)}\\))</p>
                <p style="display: block;">Min. Temperature/Shrinkage Steel Check (Sec. 24.4): ${r.rebarCheck}</p>
                
                <hr style="border: 1px solid #2d2d35; margin: 15px 0;">
                <h4 style="color:#FFEE91;">One-Way Shear Capacity (\\(V_c\\)) - ACI 318 Sec. 22.5</h4>
                <p style="display: block;">Size Effect Factor (\\(\\lambda_s\\) per Sec. 22.5.5.1):</p>
                <div class="equation">\\[ \\lambda_s = \\sqrt{\\frac{2}{1 + 0.004d}} = ${r.lambda_s.toFixed(3)} \\le 1.0 \\]</div>
                <div class="equation">\\[ \\phi V_c = 0.75 \\times ${(r.Vc/1000).toFixed(2)} = ${(r.Vc * 0.75 / 1000).toFixed(2)} \\text{ kN/m} \\]</div>
            `;
            
            document.getElementById("outSlabMoment").innerText = (resMn / 1000000).toFixed(2) + " kN·m/m";
            document.getElementById("outSlabShear").innerText = (resVc / 1000).toFixed(2) + " kN/m";
            document.getElementById("outSlabDepth").innerText = resD.toFixed(1) + " mm";
            document.getElementById("outSlabRho").innerText = resRho.toFixed(5);
            document.getElementById("outSlabClassification").innerText = resStatus.replace(/[✔❌⚠]/g, "").trim();

        } else if (type === "twoway") {
            const dbs = parseFloat(document.getElementById("shortBarDia").value) || 0;
            const ss = parseFloat(document.getElementById("shortBarSpacing").value) || 0;
            const dbl = parseFloat(document.getElementById("longBarDia").value) || 0;
            const sl = parseFloat(document.getElementById("longBarSpacing").value) || 0;

            const rs = analyzeStrip(dbs, ss, false); // Outer Layer evaluation
            const rl = analyzeStrip(dbl, sl, true);  // Inner Layer evaluation
            
            dynamicMathHTML += `
                <h4 style="color:#FFEE91; margin-top:0;">Two-Way Slab Flexure (ACI 318 Sec. 8.5.1 & 22.2)</h4>
                <p style="display: block; color: #a0aec0; margin-bottom: 10px;"><i>System classified per ACI 318 Chapter 2 definition framework. Short span layer assumed bottom-most (outermost).</i></p>
                
                <h5 style="color: #f8fafc; border-bottom: 1px dotted #444; padding-bottom: 5px;">Short Span Direction (Outer Reinforcement Layer)</h5>
                <p style="display: block;">\\(d_{\\text{short}} = h - cc - d_{bs}/2 = ${rs.d.toFixed(1)}\\) mm</p>
                <div class="equation">\\[ \\phi M_{n,s} = ${rs.phiFlexure.toFixed(3)} \\times ${(rs.Mn/1000000).toFixed(2)} = ${(rs.Mn * rs.phiFlexure / 1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m/m} \\]</div>
                <div class="equation">\\[ \\phi V_{c,s} = 0.75 \\times ${(rs.Vc/1000).toFixed(2)} = ${(rs.Vc * 0.75 / 1000).toFixed(2)} \\text{ kN/m} \\]</div>
                <p style="display: block;">Strain Check: <span style="color:${rs.color}">${rs.status}</span> | Min Steel (Sec. 24.4): ${rs.rebarCheck}</p>
                
                <h5 style="color: #f8fafc; border-bottom: 1px dotted #444; padding-bottom: 5px; margin-top: 15px;">Long Span Direction (Inner Reinforcement Layer)</h5>
                <p style="display: block;">\\(d_{\\text{long}} = h - cc - d_{bs} - d_{bl}/2 = ${rl.d.toFixed(1)}\\) mm</p>
                <div class="equation">\\[ \\phi M_{n,l} = ${rl.phiFlexure.toFixed(3)} \\times ${(rl.Mn/1000000).toFixed(2)} = ${(rl.Mn * rl.phiFlexure / 1000000).toFixed(2)} \\text{ kN}\\cdot\\text{m/m} \\]</div>
                <div class="equation">\\[ \\phi V_{c,l} = 0.75 \\times ${(rl.Vc/1000).toFixed(2)} = ${(rl.Vc * 0.75 / 1000).toFixed(2)} \\text{ kN/m} \\]</div>
                <p style="display: block;">Strain Check: <span style="color:${rl.color}">${rl.status}</span> | Min Steel (Sec. 24.4): ${rl.rebarCheck}</p>
                
                <hr style="border: 1px solid #2d2d35; margin: 15px 0;">
                <h4 style="color:#FFEE91;">One-Way (Beam-Action) Shear Capacity - ACI 318 Sec. 8.5 & 22.5</h4>
                <p style="display: block; color: #a0aec0;"><i>* One-way shear demands checked per strip layer utilizing size effect factor \\(\\lambda_s\\). Two-way punching actions (Sec. 22.6) must be calculated separately around support points.</i></p>
            `;
            
            document.getElementById("outSlabMoment").innerHTML = `Short: ${(rs.Mn * rs.phiFlexure / 1000000).toFixed(2)} <br> Long: ${(rl.Mn * rl.phiFlexure / 1000000).toFixed(2)}`;
            document.getElementById("outSlabShear").innerHTML = `Short: ${(rs.Vc * 0.75 / 1000).toFixed(2)} <br> Long: ${(rl.Vc * 0.75 / 1000).toFixed(2)}`;
            document.getElementById("outSlabDepth").innerHTML = `Short: ${rs.d.toFixed(1)} mm <br> Long: ${rl.d.toFixed(1)} mm`;
            document.getElementById("outSlabRho").innerHTML = `S: ${(rs.As / (b * rs.d)).toFixed(5)} <br> L: ${(rl.As / (b * rl.d)).toFixed(5)}`;
            document.getElementById("outSlabClassification").innerHTML = `S: ${rs.status.replace(/[✔❌⚠]/g, "").trim()} <br> L: ${rl.status.replace(/[✔❌⚠]/g, "").trim()}`;
        }

        document.getElementById("slabEquationSubstitutions").innerHTML = dynamicMathHTML;
        
        if (window.MathJax && document.getElementById('slabEquationPanel').style.display === 'block') { 
            MathJax.typesetPromise([document.getElementById("slabEquationSubstitutions")]); 
        }

    } catch (e) {
        errorDiv.innerText = "Error in calculations. Check your section limits.";
    }
}