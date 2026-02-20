({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        activeTab: 'manual',
        videoFile: null,
        videoURL: null,
        duration: 0,
        mode: 'original',
        manualText: '', // Persistent storage for textarea
        logs: [],
        progress: { text: 'SYSTEM READY', percent: 0 },
        isProcessing: false,
        copyState: { step: 0, startTime: "00:00:00" },
        // Style Sync
        style: {
            font: 'GoogleSans-Bold.ttf',
            textColor: '#ffffff',
            bgColor: '#000000',
            bgOpacity: 0.7,
            fontSize: 30
        },
        // Internal Precision Drag State
        drag: { active: false, element: null, action: null, dir: null, startX: 0, startY: 0, initLeft: 0, initTop: 0, initW: 0, initH: 0 }
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(10, 10, 15, 0.95)',
            '--glass-border': '1px solid #222',
            '--txt': '#e0f0ff',
            '--txt-dim': '#888',
            '--prm': '#00f5ff', // Cyan from original
            '--scs': '#10b981',
            '--err': '#ff4444',
            '--surface': '#08080a'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid #ccc',
            '--txt': '#050507',
            '--txt-dim': '#666',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--surface': '#f1f5f9'
        }
    },

    mount(sys) {
        this.sys = sys;
        if (localStorage.getItem('app_visited_clip_protocol')) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.render();

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver((m) => {
            if (m[0].attributeName === 'data-theme') this.onThemeChange(document.documentElement.getAttribute('data-theme'));
        });
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        console.log("%c[CLIP_PROTOCOL] v7.2.0 Robust Build Active.", "color: #00f5ff; font-weight: bold;");
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        if (this.state.videoURL) URL.revokeObjectURL(this.state.videoURL);
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        for (const [key, value] of Object.entries(theme)) this.sys.root.style.setProperty(key, value);
    },

    // --- F12 TACTICAL LOGS ---
    addLog(msg, type = 'dim') {
        const time = new Date().toLocaleTimeString();
        this.state.logs.unshift({ msg, type, time });
        const colors = { prm: '#00f5ff', scs: '#10b981', err: '#ff4444', dim: '#888' };
        console.log(`%c[${time}] %c${msg.toUpperCase()}`, `color: gray;`, `color: ${colors[type] || colors.dim}; font-weight: bold;`);
        this.render();
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.style.display = 'none';
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        }
    },

    // --- DRAG ENGINE (CONTEK 1:1 DARI CORE.JS) ---
    initDrag(e) {
        const target = e.target.closest('.crop-box') || e.target.closest('.caption-box');
        const handle = e.target.closest('.handle') || e.target.closest('.handle-cap');
        if (!target && !handle) return;

        e.preventDefault(); e.stopPropagation();
        const evt = e.touches ? e.touches[0] : e;
        const el = target || handle.parentElement;

        this.state.drag = {
            active: true, element: el,
            startX: evt.clientX, startY: evt.clientY,
            initLeft: el.offsetLeft, initTop: el.offsetTop,
            initW: el.offsetWidth, initH: el.offsetHeight,
            action: handle ? 'resize' : 'move',
            dir: handle ? handle.dataset.dir : null
        };
    },

    handleDrag(e) {
        if (!this.state.drag.active) return;
        e.preventDefault();
        const evt = e.touches ? e.touches[0] : e;
        const ds = this.state.drag;
        const dx = evt.clientX - ds.startX;
        const dy = evt.clientY - ds.startY;
        const el = ds.element;
        const parent = el.parentElement;

        if (ds.action === 'move') {
            let newX = ds.initLeft + dx;
            let newY = ds.initTop + dy;
            if(newX < 0) newX = 0;
            if(newY < 0) newY = 0;
            if(newX + el.offsetWidth > parent.offsetWidth) newX = parent.offsetWidth - el.offsetWidth;
            if(newY + el.offsetHeight > parent.offsetHeight) newY = parent.offsetHeight - el.offsetHeight;
            el.style.left = newX + 'px';
            el.style.top = newY + 'px';
        } else {
            let newW = ds.initW; let newH = ds.initH;
            let newX = ds.initLeft; let newY = ds.initTop;
            const dir = ds.dir;
            if (dir.includes('e')) newW += dx;
            if (dir.includes('s')) newH += dy;
            if (dir.includes('w')) { newW -= dx; newX += dx; }
            if (dir.includes('n')) { newH -= dy; newY += dy; }
            if(newW > 40) { el.style.width = newW + 'px'; el.style.left = newX + 'px'; }
            if(newH > 40) { el.style.height = newH + 'px'; el.style.top = newY + 'px'; }
        }
    },

    endDrag() { this.state.drag.active = false; },

    // --- CORE PROCESSING ---
    async handleFileUpload(input) {
        const file = input.files[0]; if (!file) return;
        this.state.videoFile = file;
        if (this.state.videoURL) URL.revokeObjectURL(this.state.videoURL);
        this.state.videoURL = URL.createObjectURL(file);
        this.addLog(`Monitor Ingest: ${file.name}`, 'prm');
        const video = document.createElement('video');
        video.src = this.state.videoURL;
        video.onloadedmetadata = () => {
            this.state.duration = video.duration;
            this.addLog(`Sync Complete: ${Math.floor(video.duration)}s detected.`, 'scs');
            this.render();
            video.remove();
        };
    },

    handleSmartCopy() {
        const video = this.sys.root.querySelector('#videoPreview');
        if(!video) return;
        const fmt = (s) => new Date(s * 1000).toISOString().substr(11, 8);
        const time = fmt(video.currentTime);
        if (this.state.copyState.step === 0) {
            this.state.copyState = { step: 1, startTime: time };
        } else {
            const entry = `${this.state.copyState.startTime}-${time} | New Clip\n`;
            this.state.manualText += entry;
            this.state.copyState = { step: 0, startTime: "00:00:00" };
        }
        this.render();
    },

    async startBatchProcess() {
        const splits = this.state.manualText.split('\n').filter(l => l.trim().includes('-')).map(line => {
            const [times, caption] = line.split('|');
            const [start, end] = times.split('-');
            return { start: start.trim(), end: end.trim(), caption: caption ? caption.trim() : 'Clip' };
        });

        if (splits.length === 0 || !this.state.videoFile) return this.sys.toast("Missing data!", "error");

        this.state.isProcessing = true;
        this.addLog("Executing Batch Automation...", 'prm');
        this.render();

        const workerPath = '/store/clip-protocol/js/worker.js';

        for (let i = 0; i < splits.length; i++) {
            const clip = splits[i];
            this.state.progress = { text: `Clip ${i+1}/${splits.length}`, percent: Math.round((i/splits.length)*100) };
            this.render();

            await this.runWorker({
                type: 'PROCESS_CLIP', videoFile: this.state.videoFile,
                start: clip.start, end: clip.end, caption: clip.caption,
                style: this.state.style, mode: this.state.mode, index: i+1
            }, workerPath);

            if (i < splits.length - 1) {
                this.addLog("Cooldown: 5s interval...", 'dim');
                await new Promise(r => setTimeout(r, 5000));
            }
        }
        this.state.isProcessing = false;
        this.state.progress = { text: 'TASK FINISHED', percent: 100 };
        this.render();
    },

    runWorker(job, path) {
        return new Promise((resolve) => {
            const worker = new Worker(path);
            worker.postMessage({ type: job.type, data: job });
            worker.onmessage = (e) => {
                if (e.data.type === 'DONE') {
                    this.saveToDevice(new Blob([e.data.buffer], { type: 'video/mp4' }), e.data.name, 'video/mp4');
                    this.addLog(`Output Saved: ${e.data.name}`, 'scs');
                    worker.terminate(); resolve();
                } else if (e.data.type === 'ERROR') {
                    this.addLog(`Error on ${job.index}: ${e.data.msg}`, 'err');
                    worker.terminate(); resolve();
                }
            };
        });
    },

    // --- UI RENDER (CONTEK MENTAH-MENTAH DESIGN ASLI) ---
    render() {
        const content = this.state.currentView === 'lander' ? this.renderLander() : this.renderMain();
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">${content}</div>
            </div>
            <style>
                .app-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-root); color: var(--txt); font-family: 'Inter', sans-serif; overflow-y: scroll; padding: 70px 0 90px 0; scrollbar-width: none; }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 15px; box-sizing: border-box; }

                .clip-layout { display: flex; width: 100%; min-height: 600px; background: var(--glass); border: var(--glass-border); border-radius: 24px; overflow: hidden; box-shadow: var(--shadow); backdrop-filter: blur(20px); }
                .panel-left { width: 50%; display: flex; flex-direction: column; background: rgba(10, 10, 15, 0.5); border-right: 1px solid #222; position: relative; }
                .panel-right { width: 50%; display: flex; flex-direction: column; background: rgba(5, 5, 7, 0.5); }
                .panel-header { padding: 12px 15px; background: rgba(8, 8, 10, 0.8); border-bottom: 1px solid #222; font-family: 'Orbitron'; font-size: 0.7rem; color: #888; }

                .toolbar-grid { display: flex; border-bottom: 1px solid #222; height: 40px; }
                .mode-selector { flex: 1; display: flex; }
                .mode-opt { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; cursor: pointer; color: #555; background: #0c0c10; font-family: 'Orbitron'; border-right: 1px solid #222; }
                .mode-opt.active { background: #00f5ff; color: #000; font-weight: 900; }
                .res-selector { width: 100px; background: #000; }
                .cyber-select { width: 100%; height: 100%; background: transparent; color: #fff; border: none; font-size: 0.7rem; padding: 0 5px; }

                .video-workspace { flex: 1; position: relative; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; min-height: 350px; }
                video { max-width: 100%; max-height: 100%; display: block; }

                /* PRECISION OVERLAY MIRROR */
                .overlay-mirror { position: absolute; inset: 0; pointer-events: none; }
                .crop-box { position: absolute; width: 100px; height: 177px; top: 15%; left: 35%; border: 2px solid #00f5ff; background: rgba(0, 245, 255, 0.1); pointer-events: auto; }
                .caption-box { position: absolute; width: 180px; height: 60px; bottom: 15%; left: 15%; border: 2px dashed #ff00ff; background: rgba(0,0,0,0.5); pointer-events: auto; display: flex; align-items: center; justify-content: center; }
                .handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid #000; z-index: 100; }
                .nw { top: -5px; left: -5px; cursor: nw-resize; } .ne { top: -5px; right: -5px; cursor: ne-resize; }
                .sw { bottom: -5px; left: -5px; cursor: sw-resize; } .se { bottom: -5px; right: -5px; cursor: se-resize; }
                #previewTxt { color: #fff; font-weight: bold; text-align: center; font-size: 14px; padding: 5px; }

                .player-controls { padding: 10px 15px; background: #0a0a0f; border-top: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
                .tabs-header { display: flex; background: #08080a; border-bottom: 1px solid #222; }
                .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-size: 0.7rem; color: #666; font-family: 'Orbitron'; }
                .tab.active { color: #00f5ff; background: #111; border-bottom: 2px solid #00f5ff; }

                textarea { width: 100%; background: #08080a; border: 1px solid #333; color: #00f5ff; padding: 15px; height: 220px; resize: none; font-family: 'JetBrains Mono'; font-size: 12px; outline: none; }
                .magic-tools { display: flex; flex-direction: column; gap: 15px; padding: 15px; }
                .tool-group label { display: block; color: #00f5ff; font-size: 0.65rem; margin-bottom: 5px; font-family: 'Orbitron'; }

                .terminal-area { height: 100px; padding: 10px; font-family: monospace; font-size: 0.7rem; overflow-y: auto; color: #666; background: #000; border-top: 1px solid #222; }
                .cyber-btn { width: 100%; padding: 12px; background: #00f5ff; border: none; font-weight: 900; cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
                .cyber-btn:disabled { background: #333; color: #555; }
                #smartCopyBtn.state-end { background: #ff4444; color: #fff; }

                @media (max-width: 768px) { .clip-layout { flex-direction: column; } .panel-left, .panel-right { width: 100%; } }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .hidden { display: none !important; }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `<div class="glass-panel text-center" style="padding:50px;"><h1 style="font-size: 3rem; font-weight: 900;">CLIP <span style="color:#00f5ff">PROTOCOL</span></h1><p style="color:#888; margin: 20px 0;">Studio Monitor & Segmenting Engine v7.1</p><button class="cyber-btn" style="width:250px" id="btn-enter">INITIALIZE ENGINE</button></div>`;
    },

    renderMain() {
        const { activeTab, videoURL, logs, progress, isProcessing, mode, copyState } = this.state;
        return `
            <div class="clip-layout">
                <div class="panel-left">
                    <div class="panel-header">STUDIO MONITOR</div>
                    <div class="toolbar-grid">
                        <div class="mode-selector">
                            <div class="mode-opt ${mode==='original'?'active':''}" onclick="window.cpMode('original')">ORIG</div>
                            <div class="mode-opt ${mode==='tiktok'?'active':''}" onclick="window.cpMode('tiktok')">TIKTOK</div>
                        </div>
                        <div class="res-selector"><select class="cyber-select"><option>FHD 1080p</option></select></div>
                    </div>
                    <div class="video-workspace" id="mirrorParent">
                        ${videoURL ? `
                            <video src="${videoURL}" controls id="videoPreview"></video>
                            <div class="overlay-mirror">
                                <div class="crop-box ${mode==='tiktok'?'':'hidden'}" id="cropBox">
                                    <div class="handle nw" data-dir="nw"></div><div class="handle ne" data-dir="ne"></div>
                                    <div class="handle sw" data-dir="sw"></div><div class="handle se" data-dir="se"></div>
                                </div>
                                <div class="caption-box" id="captionBox" style="background:rgba(0,0,0,${this.state.style.bgOpacity});">
                                    <div id="previewTxt" style="color:${this.state.style.textColor}; font-size:${this.state.style.fontSize}px;">PREVIEW TEXT</div>
                                    <div class="handle nw" data-dir="nw"></div><div class="handle ne" data-dir="ne"></div>
                                    <div class="handle sw" data-dir="sw"></div><div class="handle se" data-dir="se"></div>
                                </div>
                            </div>
                        ` : `
                            <div style="text-align:center; cursor:pointer" onclick="this.querySelector('input').click()">
                                <input type="file" accept="video/*" style="display:none" onchange="window.cpUpload(this)">
                                <i class="mdi mdi-upload" style="font-size:3rem; color:#00f5ff"></i><br>TAP TO LOAD MEDIA
                            </div>
                        `}
                    </div>
                    <div class="player-controls">
                        <div style="font-size:10px; color:#666;">MONITOR_READY</div>
                        <button id="smartCopyBtn" class="cyber-btn sm ${copyState.step===1?'state-end':''}" style="width:180px; padding:8px; font-size:10px;" ${!videoURL?'disabled':''}>
                            ${copyState.step===0?'SET START [A]':`SET END [B] (${copyState.startTime})`}
                        </button>
                    </div>
                </div>

                <div class="panel-right">
                    <div class="tabs-header">
                        <div class="tab ${activeTab==='manual'?'active':''}" onclick="window.cpTab('manual')">MANUAL</div>
                        <div class="tab ${activeTab==='magic'?'active':''}" onclick="window.cpTab('magic')">MAGIC</div>
                        <div class="tab ${activeTab==='style'?'active':''}" onclick="window.cpTab('style')">STYLE</div>
                    </div>
                    <div style="flex:1; overflow-y:auto;">
                        ${this.renderTabContent()}
                    </div>
                    <div class="terminal-area">${logs.map(l => `<div style="color:var(--${l.type})">> ${l.msg}</div>`).join('')}</div>
                    <div style="padding:10px; background:#0a0a0f">
                        <button class="cyber-btn" id="btn-process" ${isProcessing?'disabled':''}>
                            ${isProcessing ? 'RENDERING...' : 'PROCESS BATCH'}
                        </button>
                        <div style="height:4px; background:#111; margin-top:10px; border-radius:2px; overflow:hidden">
                            <div style="width:${progress.percent}%; height:100%; background:#00f5ff; transition:0.3s"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderTabContent() {
        if (this.state.activeTab === 'manual') return `<textarea id="timeInput" placeholder="00:00:01-00:00:10 | Caption">${this.state.manualText}</textarea>`;
        if (this.state.activeTab === 'magic') return `
            <div class="magic-tools">
                <div class="tool-group"><label>DURASI (DETIK)</label><input type="number" id="magic-dur" value="30" style="width:100%; background:#111; color:#fff; border:1px solid #333; padding:8px;"></div>
                <button class="cyber-btn sm" onclick="window.cpMagicGen()">GENERATE CLIPS</button>
            </div>`;
        return `
            <div class="magic-tools">
                <div class="tool-group"><label>TEXT COLOR</label><input type="color" value="${this.state.style.textColor}" onchange="window.cpStyle('textColor', this.value)"></div>
                <div class="tool-group"><label>FONT SIZE</label><input type="range" min="10" max="100" value="${this.state.style.fontSize}" oninput="window.cpStyle('fontSize', this.value)"></div>
                <div class="tool-group"><label>BG OPACITY</label><input type="range" min="0" max="1" step="0.1" value="${this.state.style.bgOpacity}" oninput="window.cpStyle('bgOpacity', this.value)"></div>
            </div>`;
    },

    bindEvents() {
        const root = this.sys.root;
        window.cpUpload = (i) => this.handleFileUpload(i);
        window.cpTab = (t) => {
            const area = root.querySelector('#timeInput');
            if(area) this.state.manualText = area.value;
            this.state.activeTab = t; this.render();
        };
        window.cpMode = (m) => { this.state.mode = m; this.render(); };
        window.cpStyle = (k, v) => {
            this.state.style[k] = v;
            const p = root.querySelector('#previewTxt');
            const box = root.querySelector('#captionBox');
            if(p) { if(k==='textColor') p.style.color = v; if(k==='fontSize') p.style.fontSize = v + 'px'; }
            if(box && k==='bgOpacity') box.style.background = `rgba(0,0,0,${v})`;
        };
        window.cpMagicGen = () => {
            const dur = parseInt(root.querySelector('#magic-dur').value);
            let text = "";
            for(let t=0; t < this.state.duration; t+=dur) {
                const end = Math.min(t+dur, this.state.duration);
                const fmt = (s) => new Date(s * 1000).toISOString().substr(11, 8);
                text += `${fmt(t)}-${fmt(end)} | Clip ${Math.floor(t/dur)+1}\n`;
            }
            this.state.manualText = text; this.state.activeTab = 'manual'; this.render();
        };

        // DRAG & RESIZE BINDINGS
        const mirror = root.querySelector('#mirrorParent');
        if(mirror) {
            mirror.addEventListener('mousedown', (e) => this.initDrag(e));
            mirror.addEventListener('touchstart', (e) => this.initDrag(e), {passive:false});
            document.addEventListener('mousemove', (e) => this.handleDrag(e));
            document.addEventListener('touchmove', (e) => this.handleDrag(e), {passive:false});
            document.addEventListener('mouseup', () => this.endDrag());
            document.addEventListener('touchend', () => this.endDrag());
        }

        // TEXTAREA SYNC
        const area = root.querySelector('#timeInput');
        if(area) area.addEventListener('input', (e) => { this.state.manualText = e.target.value; });

        root.querySelectorAll('button, input, select, textarea').forEach(el => { el.addEventListener('mousedown', e => e.stopPropagation()); el.addEventListener('touchstart', e => e.stopPropagation()); });

        const btnEnter = root.querySelector('#btn-enter');
        if(btnEnter) btnEnter.onclick = () => { this.state.currentView = 'main'; localStorage.setItem('app_visited_clip_protocol', 'true'); this.render(); };

        const btnCopy = root.querySelector('#smartCopyBtn');
        if(btnCopy) btnCopy.onclick = () => this.handleSmartCopy();

        const btnProcess = root.querySelector('#btn-process');
        if(btnProcess) btnProcess.onclick = () => this.startBatchProcess();
    }
})