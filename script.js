// Element selection
const farbfeldAufgabe = document.querySelector('.farbfeld.aufgabe');
const farbfeldEingabe = document.querySelector('.farbfeld.eingabe');

const sliders = document.querySelectorAll('.slider-row input[type="range"]');
const rSlider = sliders[0];
const gSlider = sliders[1];
const bSlider = sliders[2];

const rValue = rSlider.nextElementSibling;
const gValue = gSlider.nextElementSibling;
const bValue = bSlider.nextElementSibling;

const submitBtn = document.querySelector('.submit-btn');
const copyBtn = document.querySelector('.copy-btn');
const helpBtn = document.querySelector('.help-btn');
const hexCode = document.querySelector('.hex-code span');
const levelBoxes = document.querySelectorAll('.lvl');

// Modal elements
const modalOverlay = document.querySelector('.modal-overlay');
const modalContent = document.querySelector('.modal-content');

let level = 1;
const maxLevel = 10;
let targetColor = { r: 0, g: 0, b: 0 };

// NEU: Konstanter Wert für die Level-Anforderung (Punkt 1 & 2)
const PASS_SIMILARITY = 90;


/* --- Helper Functions --- */

function rgbToHex(r,g,b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase();
}

// ALTE Funktion: colorDifference (Euklidische Distanz)
// Da wir jetzt die Manhattan-Distanz direkt in submitColor berechnen,
// wird diese Funktion nicht mehr benötigt. Ich lasse sie als Kommentar 
// stehen, falls du sie behalten möchtest, ansonsten kannst du sie entfernen.
/*
function colorDifference(c1,c2){
    return Math.sqrt(Math.pow(c1.r-c2.r,2)+Math.pow(c1.g-c2.g,2)+Math.pow(c1.b-c2.b,2));
}
*/

// Slider Step dynamic based on level
function getSliderStep() {
    if (level <= 2) return 50;
    if (level <= 4) return 25;
    if (level <= 6) return 10;
    if (level <= 8) return 5;
    return 1;
}

function setSliderStep(){
    const step = getSliderStep();
    sliders.forEach(s => s.step = step);
}

function getRandomColorForStep(step) {
    return {
        r: Math.floor(Math.random() * (256/step)) * step,
        g: Math.floor(Math.random() * (256/step)) * step,
        b: Math.floor(Math.random() * (256/step)) * step
    };
}

function updateUserColor(){
    const r=parseInt(rSlider.value), g=parseInt(gSlider.value), b=parseInt(bSlider.value);
    farbfeldEingabe.style.backgroundColor=`rgb(${r},${g},${b})`;
    rValue.textContent=r; gValue.textContent=g; bValue.textContent=b;
    hexCode.textContent = rgbToHex(r,g,b);
}


/* --- Modal Logic --- */

function showModal(contentHTML) {
    modalContent.innerHTML = contentHTML;
    modalOverlay.classList.remove('hidden');
}

function hideModal() {
    modalOverlay.classList.add('hidden');
    modalContent.innerHTML = '';
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        hideModal();
    }
});

/* --- Game Logic --- */

function updateLevelBar() {
    levelBoxes.forEach((box, index) => {
        // Removes all status classes
        box.classList.remove("level-active", "level-current", "level-inactive", "completed");

        // Da die HTML-Struktur der Level-Bar in zwei Gruppen aufgeteilt wurde, 
        // müssen wir sie hier wieder als eine zusammenhängende Liste behandeln.
        
        if (index < level - 1) {
            // Completed levels → active (blue) + completed (checkmark)
            box.classList.add("level-active", "completed");
        } 
        else if (index === level - 1) {
            // Current level
            box.classList.add("level-current");
        } 
        else {
            // Future levels
            box.classList.add("level-inactive");
        }
    });
}

function startLevel() {
    rSlider.value = 0; gSlider.value = 0; bSlider.value = 0;
    
    const step = getSliderStep();
    setSliderStep();
    targetColor = getRandomColorForStep(step);
    farbfeldAufgabe.style.backgroundColor=`rgb(${targetColor.r},${targetColor.g},${targetColor.b})`;
    
    updateUserColor();
    updateLevelBar();
}

function nextLevel(){
    if(level > maxLevel){
        // Game Over Modal
        const content = `
            <h3>GAME OVER!</h3>
            <p class="modal-message-text">Congratulations! You have mastered all ${maxLevel} levels of the Color Matcher.</p>
            <button class="submit-btn" id="resetBtn" style="width: 100%;">Reset Game</button>
        `;
        showModal(content);
        
        document.getElementById("resetBtn").addEventListener("click", () => {
            level = 1;
            hideModal();
            startLevel();
        });
        return;
    }
    
    startLevel();
}

function submitColor(){
    const userColor={r:parseInt(rSlider.value),g:parseInt(gSlider.value),b:parseInt(bSlider.value)};
    
    // NEUE PUNKTBERECHNUNG: Manhattan-Distanz
    const rDiff = Math.abs(targetColor.r - userColor.r);
    const gDiff = Math.abs(targetColor.g - userColor.g);
    const bDiff = Math.abs(targetColor.b - userColor.b);
    
    // Die Gesamt-Differenz (Summe der einzelnen Differenzen)
    const totalDiff = rDiff + gDiff + bDiff;

    // Maximale mögliche Differenz: 255 + 255 + 255 = 765
    const MAX_DIFFERENCE = 765;
    
    // Berechnung der Ähnlichkeit in Prozent
    // 100% - (Prozentualer Anteil der Differenz an der MaxDiff)
    const similarity = Math.max(0, 100 - Math.round((totalDiff / MAX_DIFFERENCE) * 100));

    // NEU: Verwendung der PASS_SIMILARITY Konstante (Punkt 1)
    let levelPassed = similarity >= PASS_SIMILARITY; 
    let resultText, resultClass, buttonText;

    if (levelPassed) {
        level++;
        resultText = "LEVEL PASSED!";
        resultClass = "passed";
        buttonText = "Next Level";
    } else {
        resultText = "LEVEL FAILED!";
        resultClass = "failed";
        buttonText = "Try Again";
    }

    // Modal Content creation
    const modalContentHTML = `
        <div class="modal-message-result ${resultClass}">${resultText}</div>

        <div class="modal-comparison">
            <div class="modal-color-box">
                <h3>Target:</h3>
            </div>
            <div class="modal-color-box">
                <h3>Input:</h3>
            </div>
        </div>
        
        <div class="modal-color-fields-wrapper"> 
            <div class="modal-color-box field-only">
                <div class="modal-color-field" style="background-color: rgb(${targetColor.r},${targetColor.g},${targetColor.b});"></div>
            </div>
            <div class="modal-color-box field-only">
                <div class="modal-color-field" style="background-color: rgb(${userColor.r},${userColor.g},${userColor.b});"></div>
            </div>
        </div>
        <p class="modal-message-similarity">Similarity: ${similarity}%</p>
        <p style="text-align: center; font-size: 0.8rem; padding-top: 0;">(Goal: minimum ${PASS_SIMILARITY}%)</p> <button class="submit-btn" id="modalNextBtn" style="width: 100%;">${buttonText}</button>
    `;

    showModal(modalContentHTML);

    document.getElementById("modalNextBtn").addEventListener('click', () => {
        hideModal();
        nextLevel(); 
    });
}


/* --- Event Listener --- */

sliders.forEach(slider=>slider.addEventListener('input',updateUserColor));
submitBtn.addEventListener('click',submitColor);

// Help Button Logic (Punkt 2)
helpBtn.addEventListener('click', () => {
    const content = `
        <h3>Instructions</h3>
        <p class="modal-message-text">
        Try to match the <b>Target Color</b> using the RGB sliders.
        </p>
        <p class="modal-message-text">
        Click <b>'Submit'</b>. You need a <b>Similarity of at least ${PASS_SIMILARITY}%</b> to pass the level. </p>
        <button class="submit-btn" id="modalCloseBtn" style="width: 100%;">Close</button>
    `; 
    showModal(content);
    document.getElementById("modalCloseBtn").addEventListener('click', hideModal);
});

// Copy Button Logic (Punkt 4)
copyBtn.addEventListener('click',() => {
    const hex = hexCode.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(hex)
            .then(() => {
                const content = `
                    <h3>Copied!</h3>
                    <p class="modal-message-text" style="text-align: center;">HEX code ${hex} copied to clipboard.</p>
                    <button class="submit-btn" id="modalCloseBtn" style="width: 100%;">OK</button>
                `;
                showModal(content);
                document.getElementById("modalCloseBtn").addEventListener('click', hideModal);
            })
            .catch(() => {
                const content = `
                    <h3>Error</h3>
                    <p class="modal-message-text" style="text-align: center;">Could not copy HEX code.</p>
                    <button class="submit-btn" id="modalCloseBtn" style="width: 100%;">OK</button>
                `;
                showModal(content);
                document.getElementById("modalCloseBtn").addEventListener('click', hideModal);
            });
    } else {
        const content = `
            <h3>Error</h3>
            <p class="modal-message-text" style="text-align: center;">Your browser does not support automatic copying.</p>
            <button class="submit-btn" id="modalCloseBtn" style="width: 100%;">OK</button>
        `;
        showModal(content);
        document.getElementById("modalCloseBtn").addEventListener('click', hideModal);
    }
});

// Initialization
nextLevel();