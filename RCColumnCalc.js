/**
 * RC Column Capacity Analyzer
 * Compliant with ACI 318-19M/25M
 * Calculates theoretical axial strength and maximum design axial strength with full substitution.
 */

function launchRCColumnTool() {
    document.getElementById('webtoolsDashboard').style.display = 'none';
    const appInterface = document.getElementById('activeAppInterface');
    appInterface.style.display = 'block';
    
    document.getElementById('appTitle').innerText = 'RC COLUMN CAPACITY ANALYZER';

    const content = `
        <div class="app-section-title">Geometry & Materials</div>
        <div class="app-grid">
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
    
    // Hide results if geometry changes to avoid mismatched data
    document.getElementById('colResults').style.display = 'none';
    document.getElementById('colFormulas').style.display = 'none';
}

function runColAnalysis() {
    // 1. Gather Inputs
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
    let Ag_formula = "";
    if (shape === 'rectangular') {
        Ag = b * h;
        Ag_formula = `$$ A_g = b \\times h = (${b})(${h}) = ${Ag.toLocaleString(undefined, {maximumFractionDigits: 0})} \\text{ mm}^2 $$`;
    } else {
        Ag = (Math.PI / 4) * Math.pow(b, 2);
        Ag_formula = `$$ A_g = \\frac{\\pi}{4} D^2 = \\frac{\\pi}{4} (${b})^2 = ${Ag.toLocaleString(undefined, {maximumFractionDigits: 1})} \\text{ mm}^2 $$`;
    }
    
    const Ast = N * (Math.PI / 4) * Math.pow(db, 2);
    const rho = Ast / Ag;

    // 3. ACI 318 Constraints Limits Check
    let rhoStatus = "";
    let rhoColor = "#4ade80"; 
    if (rho < 0.01) {
        rhoStatus = "FAIL (ρ < 1%) ❌";
        rhoColor = "#ef4444"; 
    } else if (rho > 0.08) {
        rhoStatus = "FAIL (ρ > 8%) ❌";
        rhoColor = "#ef4444"; 
    } else {
        rhoStatus = "OK ✔";
    }

    // 4. Compute Nominal Axial Strength (Po)
    const Po = (0.85 * fc * (Ag - Ast)) + (fy * Ast); 
    const Po_kN = Po / 1000;

    // 5. Apply ACI Reduction Factors
    let phi = 0.65;
    let alpha = 0.80; 
    let tieText = "Tied";

    if (transverse === 'spiral') {
        phi = 0.75;
        alpha = 0.85;
        tieText = "Spiral";
    }

    const phiPn_max_kN = (phi * alpha * Po) / 1000;

    // 6. Display Primary Results Grid
    const resultsDiv = document.getElementById('colResults');
    resultsDiv.style.display = 'block';
    
    resultsDiv.innerHTML = `
        <p><span>Gross Area, Ag:</span> <span class="result-val">${Ag.toLocaleString(undefined, {maximumFractionDigits: 0})} mm²</span></p>
        <p><span>Steel Area, Ast:</span> <span class="result-val">${Ast.toLocaleString(undefined, {maximumFractionDigits: 1})} mm²</span></p>
        <p><span>Rebar Ratio, ρ:</span> <span class="result-val" style="color: ${rhoColor};">${(rho * 100).toFixed(2)} % ${rhoStatus}</span></p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;">
        <p><span>Nominal Capacity, P<sub>o</sub>:</span> <span class="result-val">${Po_kN.toLocaleString(undefined, {maximumFractionDigits: 1})} kN</span></p>
        <p><span>Design Capacity, φP<sub>n,max</sub>:</span> <span class="result-val" style="color: #FFEE91; font-size: 1.2rem;">${phiPn_max_kN.toLocaleString(undefined, {maximumFractionDigits: 1})} kN</span></p>
    `;

    // 7. Inject Dynamic Formulas & Substitutions
    const formulasDiv = document.getElementById('colFormulas');
    formulasDiv.innerHTML = `
        <div style="color: #FFEE91; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 1rem; margin-bottom: 10px;">1. Section Properties</div>
        
        ${Ag_formula}
        
        $$ A_{st} = N \\times \\frac{\\pi}{4} d_b^2 = ${N} \\times \\frac{\\pi}{4} (${db})^2 = ${Ast.toLocaleString(undefined, {maximumFractionDigits: 1})} \\text{ mm}^2 $$
        
        <div style="color: #FFEE91; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 1rem; margin-top: 25px; margin-bottom: 10px;">2. ACI 318 Steel Limits (0.01 \\le \\rho \\le 0.08)</div>
        
        $$ \\rho_g = \\frac{A_{st}}{A_g} = \\frac{${Ast.toFixed(1)}}{${Ag.toFixed(1)}} = ${(rho).toFixed(4)} $$
        
        <p style="color: ${rhoColor}; font-family: monospace; font-size: 0.95rem; margin-top: 5px;">* Limit Check: ${rhoStatus}</p>

        <div style="color: #FFEE91; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 1rem; margin-top: 25px; margin-bottom: 10px;">3. Nominal Axial Strength</div>
        
        $$ P_o = 0.85f'_c(A_g - A_{st}) + f_yA_{st} $$
        $$ P_o = 0.85(${fc})(${Ag.toFixed(1)} - ${Ast.toFixed(1)}) + (${fy})(${Ast.toFixed(1)}) $$
        $$ P_o = ${Po_kN.toLocaleString(undefined, {maximumFractionDigits: 2})} \\text{ kN} $$

        <div style="color: #FFEE91; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 1rem; margin-top: 25px; margin-bottom: 10px;">4. Maximum Design Axial Strength</div>
        <p style="color: #94a3b8; font-family: 'Inter', sans-serif; font-size: 0.85rem; margin: 0 0 10px 0;">
            * Assumptions for ${tieText} columns: $\\phi = ${phi.toFixed(2)}$, max $\\alpha = ${alpha.toFixed(2)}$
        </p>
        
        $$ \\phi P_{n,max} = \\phi \\cdot \\alpha \\cdot P_o $$
        $$ \\phi P_{n,max} = (${phi.toFixed(2)})(${alpha.toFixed(2)})(${Po_kN.toLocaleString(undefined, {maximumFractionDigits: 2})}) $$
        $$ \\phi P_{n,max} = ${phiPn_max_kN.toLocaleString(undefined, {maximumFractionDigits: 2})} \\text{ kN} $$
    `;

    // If formulas are visible, process the new equations
    if (formulasDiv.style.display === 'block' && window.MathJax) {
        MathJax.typesetPromise([formulasDiv]).catch((err) => console.error(err));
    }
}

function toggleColFormulas() {
    const formulasDiv = document.getElementById('colFormulas');
    
    if (formulasDiv.style.display === 'block') {
        formulasDiv.style.display = 'none';
    } else {
        // Run analysis to ensure data is generated before showing
        runColAnalysis();
        formulasDiv.style.display = 'block';
        if (window.MathJax) {
            MathJax.typesetPromise([formulasDiv]).catch((err) => console.error(err));
        }
    }
}