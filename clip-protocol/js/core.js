//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\clip-protocol\js\core.js total lines 489 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * CLIP PROTOCOL CORE v9.9 (SANITIZER UPDATE)
 * Base: v9.8
 * Fixes: Auto-remove Zero Width Space, Hidden Chars & ChatGPT Formatting Artifacts.
 */

let currentFile = null;
let outputMode = 'original';
let videoDuration = 0;
let fontBuffer = null;
let parsedCuts = [];

const FONTS = [
    { name: "Roboto Black", file: "Roboto-Black.ttf" },
    { name: "Roboto ExtraBold", file: "Roboto-ExtraBold.ttf" },
    { name: "Bitcount Single", file: "BitcountSingle-Black.ttf" },
    { name: "Macondo", file: "Macondo-Regular.ttf" },
    { name: "Oswald", file: "Oswald-VariableFont_wght.ttf" },
    { name: "Raleway", file: "Raleway-VariableFont_wght.ttf" },
    { name: "Gravitas One", file: "GravitasOne-Regular.ttf" },
    { name: "Roboto Slab", file: "RobotoSlab-Light.ttf" },
    { name: "Special Gothic", file: "SpecialGothicExpandedOne-Regular.ttf" }
];

let dragState = { active: false, target: null, action: null, dir: null, startX: 0, startY: 0, initLeft: 0, initTop: 0, initW: 0, initH: 0 };


function getCaptionConfig() {
    return {
        textColor: document.getElementById('textColor').value,
        bgColor: document.getElementById('bgColor').value,
        bgOpacity: document.getElementById('bgOpacity').value,
        fontSize: parseInt(document.getElementById('fontSize').value)
    };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function sanitizeInput(text) {
    if(!text) return "";
    return text
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
        .replace(/\t/g, ' ')
        .trim();
}

function parseTimestamps(text) {
    if (!text) return [];

    const cleanText = sanitizeInput(text);

    const lines = cleanText.split('\n');
    return lines.map(line => {
        const times = line.match(/(\d{1,2}:\d{2}:\d{2})/g);
        if (!times || times.length < 2) return null;

        let caption = "";
        if (line.includes('|')) {
            caption = line.split('|').slice(1).join('|').trim();
        } else {
            const lastTime = times[1];
            const idx = line.lastIndexOf(lastTime);
            if(idx > -1) caption = line.substring(idx + lastTime.length).replace(/^[\s\-\:]+/, '').trim();
        }

        return { start: times[0], end: times[1], caption };
    }).filter(i => i!==null);
}

function timeToSeconds(timeStr) {
    if(!timeStr) return 0;
    const p = timeStr.split(':').map(Number);
    let sec = 0;
    if (p.length === 3) sec = p[0]*3600 + p[1]*60 + p[2];
    else if (p.length === 2) sec = p[0]*60 + p[1];
    return sec;
}

function formatTime(s) { const d = new Date(0); d.setSeconds(s); return d.toISOString().substr(11, 8); }
function formatDuration(s) { return `${Math.floor(s/60)}m ${Math.floor(s%60)}s`; }
function log(msg, type="") { const t = document.getElementById('terminalLog'); t.innerHTML += `<div class="log-line ${type}">> ${msg}</div>`; t.scrollTop = t.scrollHeight; }

function getResConfig() {
    const val = document.getElementById('resSelect').value;
    if (val === 'original') return null;
    const h = parseInt(val);
    if (outputMode === 'tiktok') {
        const w = Math.round(h * (9/16));
        return { w: w - (w%2), h: h };
    } else {
        return { w: -2, h: h };
    }
}


setupGlobals();

export async function init() {
    const vid = document.getElementById('videoPreview');
    const mirror = document.getElementById('overlayMirror');

    if (!vid || !mirror) {
        setTimeout(init, 200);
        return;
    }

    console.log("[ClipProtocol v9.9] Sanitizer Engine Online.");

    setupFontSelector();
    setupUI();
    setupUnifiedInteraction();
    setupLivePreview();
    updateStyle();

    setTimeout(loadSelectedFont, 500);
}


function updateOverlayDimensions() {
    const video = document.getElementById('videoPreview');
    const mirror = document.getElementById('overlayMirror');
    if (!video || !mirror || !video.videoWidth) return;

    const vidRatio = video.videoWidth / video.videoHeight;
    const stage = video.parentElement;
    if(!stage) return;

    const stageRatio = stage.clientWidth / stage.clientHeight;
    let w, h, top, left;

    if (stageRatio > vidRatio) {
        h = stage.clientHeight; w = h * vidRatio;
        top = 0; left = (stage.clientWidth - w) / 2;
    } else {
        w = stage.clientWidth; h = w / vidRatio;
        left = 0; top = (stage.clientHeight - h) / 2;
    }

    mirror.style.width = w + 'px';
    mirror.style.height = h + 'px';
    mirror.style.top = top + 'px';
    mirror.style.left = left + 'px';
}
setInterval(updateOverlayDimensions, 500);
window.addEventListener('resize', updateOverlayDimensions);

function centerCropBox() {
    const mirror = document.getElementById('overlayMirror');
    const cropBox = document.getElementById('cropBox');
    if(!mirror || !cropBox) return;
    const h = mirror.offsetHeight * 0.8;
    const w = h * (9/16);
    cropBox.style.width = w + 'px';
    cropBox.style.height = h + 'px';
    cropBox.style.left = (mirror.offsetWidth - w) / 2 + 'px';
    cropBox.style.top = (mirror.offsetHeight - h) / 2 + 'px';
}


function getCaptionFilter(text, config) {
    const cropBox = document.getElementById('cropBox');
    const capBox = document.getElementById('captionBox');
    const mirror = document.getElementById('overlayMirror');
    const video = document.getElementById('videoPreview');

    let parentW, parentH, parentOffsetX, parentOffsetY;
    let targetW, targetH;

    const resVal = document.getElementById('resSelect').value;
    const targetHeight = (resVal === 'original') ? video.videoHeight : parseInt(resVal);

    if (outputMode === 'tiktok') {
        parentW = cropBox.offsetWidth;
        parentH = cropBox.offsetHeight;
        parentOffsetX = cropBox.offsetLeft;
        parentOffsetY = cropBox.offsetTop;

        const h = targetHeight;
        const w = Math.round(h * (9/16));
        targetW = w - (w%2);
        targetH = h;
    } else {
        parentW = mirror.offsetWidth;
        parentH = mirror.offsetHeight;
        parentOffsetX = 0;
        parentOffsetY = 0;

        targetW = Math.round(targetHeight * (video.videoWidth / video.videoHeight));
        targetW = targetW - (targetW%2);
        targetH = targetHeight;
    }

    const relX = capBox.offsetLeft - parentOffsetX;
    const relY = capBox.offsetTop - parentOffsetY;

    const safeParentW = parentW || 1;
    const safeParentH = parentH || 1;

    let realX = Math.round((relX / safeParentW) * targetW);
    let realY = Math.round((relY / safeParentH) * targetH);
    let realW = Math.round((capBox.offsetWidth / safeParentW) * targetW);
    let realH = Math.round((capBox.offsetHeight / safeParentH) * targetH);

    if(realW < 2) realW = 2;
    if(realH < 2) realH = 2;
    if(realW % 2 !== 0) realW--;
    if(realH % 2 !== 0) realH--;

    const scaleFactor = targetW / safeParentW;
    let realFontSize = Math.floor((config.fontSize * scaleFactor) * 0.95);
    let lineSpacing = Math.round(realFontSize * 0.2);

    const safeTextWidth = realW * 0.98;
    const avgCharWidth = realFontSize * 0.70;
    const maxCharsPerLine = Math.floor(safeTextWidth / avgCharWidth);

    const cleanText = sanitizeInput(text);
    const wrappedRaw = wrapTextSimple(cleanText, maxCharsPerLine);
    const lines = wrappedRaw.split('\n');

    const bgHex = config.bgColor.replace('#', '0x') + Math.round(config.bgOpacity*255).toString(16).padStart(2,'0').toUpperCase();
    let filters = [`drawbox=x=${realX}:y=${realY}:w=${realW}:h=${realH}:color=${bgHex}:t=fill`];

    const totalTextH = (lines.length * realFontSize) + ((lines.length - 1) * lineSpacing);
    const startY = realY + ((realH - totalTextH) / 2);

    lines.forEach((line, i) => {
        if(!line.trim()) return;
        const cleanLine = line.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '').replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Remove emojis
        const currentY = startY + (i * (realFontSize + lineSpacing));
        filters.push(`drawtext=fontfile=/font.ttf:text='${cleanLine}':x=${realX}+((${realW}-text_w)/2):y=${currentY}:fontsize=${realFontSize}:fontcolor=${config.textColor}`);
    });

    return filters.join(',');
}

function wrapTextSimple(text, limit) {
    if (!text) return "";
    const words = text.split(' ');
    let lines = [];
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
        if (current.length + 1 + words[i].length <= limit) {
            current += " " + words[i];
        } else {
            lines.push(current);
            current = words[i];
        }
    }
    lines.push(current);
    return lines.join('\n');
}


function setupUnifiedInteraction() {
    const mirror = document.getElementById('overlayMirror');
    if (!mirror) return;
    mirror.addEventListener('mousedown', startDrag);
    mirror.addEventListener('touchstart', startDrag, {passive:false});
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', doDrag, {passive:false});
    document.addEventListener('touchend', stopDrag);
}

function startDrag(e) {
    const target = e.target.closest('.crop-box') || e.target.closest('.caption-box');
    const handle = e.target.closest('.handle') || e.target.closest('.handle-cap');
    if (!target && !handle) return;
    e.preventDefault(); e.stopPropagation();

    const evt = e.touches ? e.touches[0] : e;
    const el = target || handle.parentElement;

    dragState.active = true;
    dragState.element = el;
    dragState.startX = evt.clientX;
    dragState.startY = evt.clientY;
    dragState.initLeft = el.offsetLeft;
    dragState.initTop = el.offsetTop;
    dragState.initW = el.offsetWidth;
    dragState.initH = el.offsetHeight;

    if (handle) {
        dragState.action = 'resize';
        dragState.dir = handle.dataset.dir;
    } else {
        dragState.action = 'move';
    }
}

function doDrag(e) {
    if (!dragState.active) return;
    e.preventDefault();
    const evt = e.touches ? e.touches[0] : e;
    const dx = evt.clientX - dragState.startX;
    const dy = evt.clientY - dragState.startY;
    const el = dragState.element;
    const parent = el.parentElement;

    if (dragState.action === 'move') {
        let newX = dragState.initLeft + dx;
        let newY = dragState.initTop + dy;
        if(newX < 0) newX = 0;
        if(newY < 0) newY = 0;
        if(newX + el.offsetWidth > parent.offsetWidth) newX = parent.offsetWidth - el.offsetWidth;
        if(newY + el.offsetHeight > parent.offsetHeight) newY = parent.offsetHeight - el.offsetHeight;
        el.style.left = newX + 'px';
        el.style.top = newY + 'px';
    }
    else if (dragState.action === 'resize') {
        let newW = dragState.initW;
        let newH = dragState.initH;
        let newX = dragState.initLeft;
        let newY = dragState.initTop;
        const d = dragState.dir;
        if (d.includes('e')) newW += dx;
        if (d.includes('s')) newH += dy;
        if (d.includes('w')) { newW -= dx; newX += dx; }
        if (d.includes('n')) { newH -= dy; newY += dy; }
        if(newW > 20) { el.style.width = newW + 'px'; el.style.left = newX + 'px'; }
        if(newH > 20) { el.style.height = newH + 'px'; el.style.top = newY + 'px'; }
    }
}

function stopDrag() { dragState.active = false; dragState.element = null; }


function setupGlobals() {
    window.loadSelectedFont = loadSelectedFont;

    window.updateStyle = () => {
        const conf = getCaptionConfig();
        const txt = document.getElementById('liveCaptionText');
        const box = document.getElementById('captionBox');
        if(!box || !txt) return;

        const rgba = hexToRgba(conf.bgColor, conf.bgOpacity);
        box.style.background = rgba;
        box.style.borderColor = conf.textColor;
        txt.style.color = conf.textColor;
        txt.style.fontSize = conf.fontSize + 'px';
        txt.style.textAlign = 'center';
        txt.style.lineHeight = '1.2';
        txt.style.width = '98%';
    };

    window.setMode = (mode) => {
        outputMode = mode;
        document.querySelectorAll('.mode-opt').forEach(el => el.classList.remove('active'));
        document.querySelector(`.mode-opt[data-mode="${mode}"]`).classList.add('active');
        const cropBox = document.getElementById('cropBox');
        if(!cropBox) return;

        if (mode === 'tiktok') {
            cropBox.classList.remove('hidden');
            document.getElementById('resSelect').value = "1080";
            centerCropBox();
        } else {
            cropBox.classList.add('hidden');
            document.getElementById('resSelect').value = "original";
        }
        updateOverlayDimensions();
    };

    window.switchTab = (tab) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        let idx = 0; if(tab==='magic') idx=1; if(tab==='style') idx=2;
        document.querySelectorAll('.tab')[idx].classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    };

    window.generateByDuration = () => {
        if(!currentFile) return alert("Upload dulu");
        const sec = parseInt(document.getElementById('splitDuration').value);
        let res = ""; for(let i=0; i<videoDuration; i+=sec) res += `${formatTime(i)}-${formatTime(Math.min(i+sec, videoDuration))}| Caption\n`;
        document.getElementById('timeInput').value = res; window.switchTab('manual');
        const event = new Event('input'); document.getElementById('timeInput').dispatchEvent(event);
    };
    window.generateByCount = () => {
        if(!currentFile) return alert("Upload dulu");
        const count = parseInt(document.getElementById('splitCount').value);
        const chunk = videoDuration/count; let res = ""; for(let i=0; i<count; i++) res += `${formatTime(i*chunk)}-${formatTime((i+1)*chunk)}| Caption\n`;
        document.getElementById('timeInput').value = res; window.switchTab('manual');
        const event = new Event('input'); document.getElementById('timeInput').dispatchEvent(event);
    };
}

function setupLivePreview() {
    const video = document.getElementById('videoPreview');
    const textArea = document.getElementById('timeInput');
    const previewBox = document.getElementById('liveCaptionText');
    if(!video || !textArea || !previewBox) return;

    textArea.addEventListener('paste', (e) => {
        e.preventDefault();
        const raw = (e.clipboardData || window.clipboardData).getData('text');
        const clean = sanitizeInput(raw);
        document.execCommand("insertText", false, clean);
    });

    const update = () => {
        parsedCuts = parseTimestamps(textArea.value);
        updateStyle();
    };
    textArea.addEventListener('input', update);
    update();

    setInterval(() => {
        if(!video || parsedCuts.length === 0) return;
        const ct = video.currentTime;
        let active = "PREVIEW TEXT";
        const found = parsedCuts.find(c => {
            const s = timeToSeconds(c.start); const e = timeToSeconds(c.end);
            return ct >= s && ct < e;
        });

        if (found && found.caption) {
            const capBox = document.getElementById('captionBox');
            if(capBox) {
                const conf = getCaptionConfig();
                const safeW = capBox.offsetWidth * 0.98;
                const charW = conf.fontSize * 0.70;
                const limit = Math.floor(safeW / charW);
                active = wrapTextSimple(found.caption, limit);
            } else {
                active = found.caption;
            }
        }

        if(previewBox.innerText !== active) previewBox.innerText = active;
    }, 100);
}

function handleFileSelect(e) {
    const file = e.target.files[0]; if (!file) return;
    currentFile = file;
    document.getElementById('uploadPlaceholder').classList.add('hidden');
    document.getElementById('videoStage').classList.remove('hidden');
    document.getElementById('smartCopyBtn').disabled = false;
    document.getElementById('processBtn').disabled = false;
    const video = document.getElementById('videoPreview');
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
        videoDuration = video.duration;
        document.getElementById('fileInfo').innerText = `${file.name} [${formatDuration(videoDuration)}]`;
        updateOverlayDimensions();
    };
}

function setupUI() {
    const input = document.getElementById('videoInput');
    input.addEventListener('change', handleFileSelect);
    document.getElementById('smartCopyBtn').addEventListener('click', handleSmartCopy);
    document.getElementById('processBtn').addEventListener('click', startProcessing);
    window.addEventListener('resize', updateOverlayDimensions);
}

function setupFontSelector() { const sel = document.getElementById('fontSelect'); if(!sel) return; sel.innerHTML = ""; FONTS.forEach(f => { const opt = document.createElement('option'); opt.value = f.file; opt.innerText = f.name; sel.appendChild(opt); }); }
async function loadSelectedFont() { const filename = document.getElementById('fontSelect').value; if(!filename) return; const path = `./libs/fonts/${filename}`; try { const response = await fetch(path); if(!response.ok) throw new Error(); fontBuffer = await response.arrayBuffer(); const fontFace = new FontFace("CustomPreviewFont", `url(${path})`); const loadedFace = await fontFace.load(); document.fonts.add(loadedFace); document.getElementById('liveCaptionText').style.fontFamily = "CustomPreviewFont"; log(`Font Loaded: ${filename}`, "success"); } catch (e) { log("Font Load Error", "error"); } }
function handleSmartCopy() { if(!currentFile) return alert("Upload video dulu!"); const video = document.getElementById('videoPreview'); const time = formatTime(video.currentTime); const btn = document.getElementById('smartCopyBtn'); const area = document.getElementById('timeInput'); if (copyState.step === 0) { copyState.startTime = time; copyState.step = 1; btn.innerHTML = `SET END [B] (${time})`; btn.classList.add('state-end'); } else { area.value += `${copyState.startTime}-${time}\n`; copyState.step = 0; btn.innerHTML = "SET START [A]"; btn.classList.remove('state-end'); } }

function getCropCommand() {
    const crop = document.getElementById('cropBox');
    const mirror = document.getElementById('overlayMirror');
    const video = document.getElementById('videoPreview');
    const scale = video.videoWidth / mirror.offsetWidth;
    const x = Math.round(crop.offsetLeft * scale);
    const y = Math.round(crop.offsetTop * scale);
    const w = Math.round(crop.offsetWidth * scale);
    const h = Math.round(crop.offsetHeight * scale);
    const safeW = w - (w%2); const safeH = h - (h%2);
    return `crop=${safeW}:${safeH}:${x}:${y}`;
}

async function startProcessing() { if (!currentFile) { alert("Upload video!"); return; } parsedCuts = parseTimestamps(document.getElementById('timeInput').value); if (parsedCuts.length === 0) { alert("List kosong!"); return; } if (!fontBuffer && !confirm("Font gagal. Lanjut?")) return; const btn = document.getElementById('processBtn'); btn.disabled = true; log("=== PROCESSING ===", "info"); let baseFilter = outputMode === 'tiktok' ? getCropCommand() : ""; const res = getResConfig(); if (res) { baseFilter += baseFilter ? `,scale=${res.w}:${res.h}` : `scale=${res.w}:${res.h}`; } const captionConfig = getCaptionConfig(); for (let i = 0; i < parsedCuts.length; i++) { const cut = parsedCuts[i]; const idx = i + 1; let finalFilter = baseFilter; if (cut.caption && fontBuffer) { const capFilter = getCaptionFilter(cut.caption, captionConfig); finalFilter += finalFilter ? `,${capFilter}` : capFilter; } log(`Processing ${idx}/${parsedCuts.length}...`); try { await processClipInWorker(idx, cut.start, cut.end, finalFilter); if (i < parsedCuts.length - 1) await new Promise(r => setTimeout(r, 2000)); } catch (e) { log("Error: " + e, "error"); } } log("DONE!", "success"); btn.disabled = false; }
function processClipInWorker(index, start, end, videoFilter) { return new Promise((resolve, reject) => { const worker = new Worker('./js/worker.js'); worker.onmessage = (e) => { const { type, buffer, name, msg } = e.data; if (type === 'CLIP_DONE') { saveAs(new Blob([buffer], { type: 'video/mp4' }), name); } else if (type === 'ERROR') reject(msg); else if (type === 'WORKER_FINISHED') { worker.terminate(); resolve(); } }; worker.onerror = (e) => { worker.terminate(); reject(e.message); }; worker.postMessage({ type: 'PROCESS_SINGLE', data: { file: currentFile, fontBuffer, start, end, mode: outputMode, videoFilter, index } }); }); }
