/**
 * RC Column Capacity Analyzer
 * Compliant with ACI 318-19M & ACI 318-25M
 * Calculates theoretical axial strength and maximum design axial strength with full substitution and strict code referencing.
 */

function launchRCColumnTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    const appInterface = document.getElementById('activeAppInterface');
    appInterface.style.display = 'block';
    
    document.getElementById('appTitle').innerText = 'RC COLUMN CAPACITY ANALYZER';

    const content = `
        <div class="app-section-title">Design Parameters, Geometry & Materials</div>
        <div class="app-grid">
            <div class="app-group">
                <label>Design Code</label>
                <select id="aciCode" onchange="runColAnalysis()">
                    <option value="ACI 318-19M">ACI 318-19M</option>
                    <option value="ACI 318-25M">ACI 318-25M</option>
                </select>
            </div>
            <div class="app-group">
                <label>Column Shape</label>
                <select id="colShape" onchange="toggleColShape()">
                    <option value="rectangular">Rectangular</option>
                    <option value="circular">Circular</option>
                </select>
            </div>
            <div class="app-group">
                <label>Transverse Ties</label>
                <select id="colTransverse">
                    <option value="tied">Tied</option>
                    <option value="spiral">Spiral</option>
                </select>
            </div>
            <div class="app-group">
                <label>Concrete, f'c (MPa)</label>
                <input type="number" id="colFc" value="28" step="1">
            </div>
            <div class="app-group">
                <label>Steel, fy (MPa)</label>
                <input type="number" id="colFy" value="420" step="1">
            </div>
            
            <div class="app-group" id="grpWidth">
                <label id="lblWidth">Width, b (mm)</label>
                <input type="number" id="colB" value="400" step="10">
            </div>
            <div class="app-group" id="grpDepth">
                <label>Depth, h (mm)</label>
                <input type="number" id="colH" value="400" step="10">
            </div>

            <div class="app-group">
                <label>Total Long. Bars (N)</label>
                <input type="number" id="colN" value="8" step="1">
            </div>
            <div class="app-group">
                <label>Bar Diameter, db (mm)</label>
                <input type="number" id="colDb" value="20" step="1">
            </div>
        </div>

        <div class="app-actions">
            <button class="btn-run" onclick="runColAnalysis()">Run Analysis</button>
            <button class="btn-formula" id="btnToggleFormulas" onclick="toggleColFormulas()">Check Equation</button>
        </div>

        <div id="colResults" class="app-results" style="display: none;">
            </div>

        <div id="colFormulas" style="display: none; margin-top: 15px; padding: 20px; background: #1a1a1a; border-radius: 6px; border-left: 4px solid #94a3b8;">
            </div>
    `;

    document.getElementById('appContent').innerHTML = content;
    toggleColShape(); 
}

function toggleColShape() {
    const shape = document.getElementById('colShape').value;
    const grpDepth = document.getElementById('grpDepth');
    const lblWidth = document.getElementById('lblWidth');
    const transverseSelect = document.getElementById('colTransverse');

    if (shape === 'circular') {
        grpDepth.style.display = 'none';
        lblWidth.innerText = 'Diameter, D (mm)';
        transverseSelect.value = 'spiral';
    } else {
        grpDepth.style.display = 'flex';
        lblWidth.innerText = 'Width, b (mm)';
        transverseSelect.value = 'tied'; 
    }
    
    document.getElementById('colResults').style.display = 'none';
    document.getElementById('colFormulas').style.display = 'none';
}

function runColAnalysis() {
    // 1. Gather Inputs
    const codeSelected = document.getElementById('aciCode').value;
    const shape = document.getElementById('colShape').value;
    const transverse = document.getElementById('colTransverse').value;
    const fc = parseFloat(document.getElementById('colFc').value) || 0;
    const fy = parseFloat(document.getElementById('colFy').value) || 0;
    const b = parseFloat(document.getElementById('colB').value) || 0; 
    const h = parseFloat(document.getElementById('colH').value) || 0;
    const N = parseInt(document.getElementById('colN').value) || 0;
    const db = parseFloat(document.getElementById('colDb').value) || 0;

    // 2. Compute Geometrics & Steel
    let Ag = 0;
    let Ag_substitution = "";
    if (shape === 'rectangular') {
        Ag = b * h;
        Ag_substitution = `A_g = b \\times h = (${b})(${h}) = ${Ag.toLocaleString(undefined, {maximumFractionDigits: 1})} \\text{ mm}^2`;
    } else {
        Ag = (Math.PI / 4) * Math.pow(b, 2);
        Ag_substitution = `A_g = \\frac{\\pi}{4} D^2 = \\frac{\\pi}{4} (${b})^2 = ${Ag.toLocaleString(undefined, {maximumFractionDigits: 1})} \\text{ mm}^2`;
    }
    
    const Ast = N * (Math.PI / 4) * Math.pow(db, 2);
    const rho = Ast / Ag;

    // 3. ACI Constraints Limits Check
    let rhoStatus = "";
    let rhoColor = "#4ade80"; 
    let statusText = "OK ✔";
    
    if (Ag === 0 || isNaN(rho)) {
        rhoStatus = "ERROR (Invalid Inputs) ❌";
        rhoColor = "#ef4444";
        statusText = "Invalid Inputs ❌";
    } else if (rho < 0.01) {
        rhoStatus = `As (${Ast.toFixed(0)} mm²) < As_min (${(Ag * 0.01).toFixed(0)} mm²) ❌ Section fails minimum steel requirement.`;
        rhoColor = "#ef4444"; 
        statusText = "FAIL (ρ < 1%) ❌";
    } else if (rho > 0.08) {
        rhoStatus = `As (${Ast.toFixed(0)} mm²) > As_max (${(Ag * 0.08).toFixed(0)} mm²) ❌ Section exceeds maximum steel requirement.`;
        rhoColor = "#ef4444"; 
        statusText = "FAIL (ρ > 8%) ❌";
    } else {
        rhoStatus = `As_min (${(Ag * 0.01).toFixed(0)} mm²) ≤ As (${Ast.toFixed(0)} mm²) ≤ As_max (${(Ag * 0.08).toFixed(0)} mm²) ✔ Section satisfies reinforcement limits.`;
    }

    // 4. Compute Nominal Axial Strength (Po)
    const Po = (0.85 * fc * (Ag - Ast)) + (fy * Ast); 
    const Po_kN = Po / 1000;

    // 5. Apply ACI Reduction Factors
    let phi = 0.65;
    let alpha = 0.80; 
    let tieTypeWord = "Tied";

    if (transverse === 'spiral') {
        phi = 0.75;
        alpha = 0.85;
        tieTypeWord = "Spiral";
    }

    const phiPn_max_kN = (phi * alpha * Po) / 1000;

    // 6. Display Primary Results Grid
    const resultsDiv = document.getElementById('colResults');
    resultsDiv.style.display = 'block';
    
    resultsDiv.innerHTML = `
        <p><span>Gross Area, Ag:</span> <span class="result-val">${Ag.toLocaleString(undefined, {maximumFractionDigits: 1})} mm²</span></p>
        <p><span>Steel Area, Ast:</span> <span class="result-val">${Ast.toLocaleString(undefined, {maximumFractionDigits: 1})} mm²</span></p>
        <p><span>Rebar Ratio, ρ:</span> <span class="result-val" style="color: ${rhoColor};">${(isNaN(rho) ? 0 : rho * 100).toFixed(2)} % (${statusText})</span></p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;">
        <p><span>Nominal Capacity, P<sub>o</sub>:</span> <span class="result-val">${(isNaN(Po_kN) ? 0 : Po_kN).toLocaleString(undefined, {maximumFractionDigits: 1})} kN</span></p>
        <p><span>Design Capacity, φP<sub>n,max</sub>:</span> <span class="result-val" style="color: #FFEE91; font-size: 1.2rem;">${(isNaN(phiPn_max_kN) ? 0 : phiPn_max_kN).toLocaleString(undefined, {maximumFractionDigits: 1})} kN</span></p>
    `;

    // 7. Inject Strict Layout matched with the reference style image
    const formulasDiv = document.getElementById('colFormulas');
    formulasDiv.innerHTML = `
        <div style="color: #ffffff; font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; border-bottom: 1px solid #2d2d2d; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase;">GOVERNING EQUATIONS & SUBSTITUTIONS</div>
        
        <div style="color: #FFD54F; font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Section & Geometric Mechanics</div>
        
        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-bottom: 12px; padding-left: 5px; color: #e0e0e0;">
            Gross Area of Section (\(A_g\)):
            <div style="margin: 8px 0; text-align: center;">
                \\( ${Ag_substitution} \\)
            </div>
        </div>

        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-bottom: 25px; padding-left: 5px; color: #e0e0e0;">
            Area of Longitudinal Reinforcement (\(A_{st}\)):
            <div style="margin: 8px 0; text-align: center;">
                \\( A_{st} = N \\times \\frac{\\pi}{4} d_b^2 = ${N} \\times \\frac{\\pi}{4} (${db})^2 = ${Ast.toLocaleString(undefined, {maximumFractionDigits: 1})} \\text{ mm}^2 \\)
            </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #2d2d2d; margin: 15px 0;">

        <div style="color: #FFD54F; font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Reinforcement & Ductility Verification</div>
        
        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-bottom: 12px; padding-left: 5px; color: #e0e0e0;">
            Longitudinal Reinforcement Ratio (\(\\rho_g\)):
            <div style="margin: 8px 0; text-align: center;">
                \\( \\rho_g = \\frac{A_{st}}{A_g} = \\frac{${Ast.toFixed(1)}}{${Ag.toFixed(1)}} = ${(isNaN(rho) ? 0 : rho).toFixed(4)} \\) &nbsp;&nbsp;&nbsp;&nbsp; <span style="color: #ff4444; font-size: 0.85rem; font-weight: bold; font-family: monospace;">[${codeSelected} Sec. 10.6.1.1]</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.8rem; margin: 4px 0 8px 0; font-style: italic;">* Permissible Code Limits: 0.01 ≤ \(\\rho_g\) ≤ 0.08</p>
            <p style="color: ${rhoColor}; font-weight: 600; font-size: 0.88rem; margin: 4px 0 0 0;">${rhoStatus}</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #2d2d2d; margin: 15px 0;">

        <div style="color: #FFD54F; font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Axial Compressive Strength Mechanics</div>
        
        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-bottom: 15px; padding-left: 5px; color: #e0e0e0;">
            Nominal Axial Compressive Strength (\(P_o\)):
            <div style="margin: 8px 0; text-align: center;">
                \\( P_o = 0.85f'_c(A_g - A_{st}) + f_yA_{st} \\)
            </div>
            <div style="margin: 8px 0; text-align: center;">
                \\( P_o = 0.85(${fc})(${Ag.toFixed(1)} - ${Ast.toFixed(1)}) + (${fy})(${Ast.toFixed(1)}) = ${(isNaN(Po_kN) ? 0 : Po_kN * 1000).toLocaleString(undefined, {maximumFractionDigits: 0})} \\text{ N} \\)
            </div>
            <div style="margin: 8px 0; text-align: center;">
                \\( P_o = ${(isNaN(Po_kN) ? 0 : Po_kN).toLocaleString(undefined, {maximumFractionDigits: 2})} \\text{ kN} \\) &nbsp;&nbsp;&nbsp;&nbsp; <span style="color: #ff4444; font-size: 0.85rem; font-weight: bold; font-family: monospace;">[${codeSelected} Eq. 22.4.2.2]</span>
            </div>
        </div>

        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; margin-bottom: 10px; padding-left: 5px; color: #e0e0e0;">
            Maximum Design Axial Compressive Strength (\(\\phi P_{n,max}\)):
            <p style="color: #4ade80; font-size: 0.85rem; margin: 4px 0 8px 0; font-weight: 500;">Compression-Controlled (${tieTypeWord}) Member &nbsp;&nbsp;➔&nbsp;&nbsp; \\(\\phi = ${phi.toFixed(2)}\\), \\(\\alpha = ${alpha.toFixed(2)}\\)</p>
            <div style="margin: 8px 0; text-align: center;">
                \\( \\phi P_{n,max} = \\phi \\cdot \\alpha \\cdot [0.85f'_c(A_g - A_{st}) + f_yA_{st}] \\)
            </div>
            <div style="margin: 8px 0; text-align: center;">
                \\( \\phi P_{n,max} = (${phi.toFixed(2)})(${alpha.toFixed(2)})(${(isNaN(Po_kN) ? 0 : Po_kN).toLocaleString(undefined, {maximumFractionDigits: 2})}) \\)
            </div>
            <div style="margin: 8px 0; text-align: center;">
                \\( \\phi P_{n,max} = ${(isNaN(phiPn_max_kN) ? 0 : phiPn_max_kN).toLocaleString(undefined, {maximumFractionDigits: 2})} \\text{ kN} \\) &nbsp;&nbsp;&nbsp;&nbsp; <span style="color: #ff4444; font-size: 0.85rem; font-weight: bold; font-family: monospace;">[${codeSelected} Table 22.4.2.1 &amp; 21.2.2]</span>
            </div>
        </div>
    `;

    // 8. Typeset MathJax safely
    if (formulasDiv.style.display === 'block' && window.MathJax) {
        MathJax.typesetClear([formulasDiv]);
        MathJax.typesetPromise([formulasDiv]).catch((err) => console.error(err));
    }
}

function toggleColFormulas() {
    const formulasDiv = document.getElementById('colFormulas');
    
    if (formulasDiv.style.display === 'block') {
        formulasDiv.style.display = 'none';
    } else {
        runColAnalysis();
        formulasDiv.style.display = 'block';
        if (window.MathJax) {
            MathJax.typesetClear([formulasDiv]);
            MathJax.typesetPromise([formulasDiv]).catch((err) => console.error(err));
        }
    }
}