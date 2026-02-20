({
    state: {
        isFirstVisit: false,
        currentView: 'main', // Langsung masuk ke aplikasi (Lander dihapus)
        currentMode: 'audio_master',
        showModal: false,
        categories: {},
        logs: [],
        progress: { text: 'IDLE', percent: 0 },
        isProcessing: false
    },
    sys: null,
    observer: null,

    // TEMA CYBERPUNK - SEMUA TULISAN WAJIB BIRU
    themes: {
        dark: {
            '--bg-root': '#05050a',
            '--glass': 'rgba(10, 10, 30, 0.85)',
            '--glass-border': '1px solid #0055ff',
            '--txt': '#00d2ff', // Neon Blue
            '--txt-dim': '#0077ff', // Deeper Blue
            '--prm': '#0055ff', // Blue Button
            '--scs': '#00ffcc',
            '--err': '#ff0055',
            '--brd': 'rgba(0, 210, 255, 0.3)',
            '--surface': 'rgba(0, 85, 255, 0.1)',
            '--shadow': '0 0 20px rgba(0, 85, 255, 0.4)'
        },
        light: {
            '--bg-root': '#eef7ff',
            '--glass': 'rgba(230, 245, 255, 0.9)',
            '--glass-border': '1px solid #0077ff',
            '--txt': '#0055ff', // Darker Blue
            '--txt-dim': '#0033aa',
            '--prm': '#0077ff',
            '--scs': '#009977',
            '--err': '#cc0044',
            '--brd': 'rgba(0, 85, 255, 0.2)',
            '--surface': 'rgba(0, 85, 255, 0.05)',
            '--shadow': '0 8px 32px rgba(0, 85, 255, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        // Langsung bypass lander
        this.state.currentView = 'main';
        this.render();

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver((m) => {
            if (m[0].attributeName === 'data-theme') this.onThemeChange(document.documentElement.getAttribute('data-theme'));
        });
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        for (const [key, value] of Object.entries(theme)) this.sys.root.style.setProperty(key, value);
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    deleteCategory(name) {
        if (this.state.isProcessing) return;
        delete this.state.categories[name];
        this.addLog(`Category [${name}] destroyed.`, 'err');
        this.render();
    },

    clearPool(catName, type) {
        if (this.state.isProcessing) return;
        this.state.categories[catName][type] = [];
        this.addLog(`Pool ${type} in [${catName}] reset.`, 'dim');
        this.render();
    },

    async handleUpload(input, type, catName) {
        const files = Array.from(input.files).filter(f => f.size > 0);
        if (!this.state.categories[catName]) this.state.categories[catName] = { video: [], audio: [] };
        this.addLog(`Scanning ${files.length} items for ${catName}...`);

        let count = 0;
        for (let f of files) {
            if ((type === 'video' && f.type.startsWith('video/')) || (type === 'audio' && f.type.startsWith('audio/'))) {
                try {
                    const duration = await this.getMediaDuration(f);
                    this.state.categories[catName][type].push({ file: f, duration });
                    count++;
                } catch (e) { console.error("Corrupt File:", f.name); }
            }
        }
        this.updateProgress(0, 0, "IDLE");
        this.sys.toast(`Imported ${count} items.`, "success");
        this.render();
    },

    getMediaDuration(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const el = file.type.startsWith('audio') ? document.createElement('audio') : document.createElement('video');
            el.preload = 'metadata';
            el.onloadedmetadata = () => {
                const dur = el.duration;
                URL.revokeObjectURL(url);
                el.remove();
                resolve(dur);
            };
            el.onerror = () => { URL.revokeObjectURL(url); el.remove(); reject(); };
            el.src = url;
        });
    },

    async startFusion() {
        const cats = Object.keys(this.state.categories);
        if (cats.length === 0) return this.sys.toast("Error: Setup categories!", "error");

        this.state.isProcessing = true;
        this.addLog("Initializing Massive Fusion Automation...", 'prm');
        this.render();

        const workerPath = '/store/bulk-mixer/js/worker.js';

        for (let catName of cats) {
            const pool = this.state.categories[catName];
            const masters = this.state.currentMode === 'audio_master' ? pool.audio : pool.video;
            const slaves = this.state.currentMode === 'audio_master' ? pool.video : pool.audio;

            if (masters.length === 0 || slaves.length === 0) continue;

            for (let i = 0; i < masters.length; i++) {
                const master = masters[i];
                let currentDur = 0;
                let selectedSlaves = [];
                const shuffledSlaves = [...slaves].sort(() => Math.random() - 0.5);
                let ptr = 0;

                while (currentDur < master.duration) {
                    if (ptr >= shuffledSlaves.length) { shuffledSlaves.sort(() => Math.random() - 0.5); ptr = 0; }
                    const pick = shuffledSlaves[ptr];
                    selectedSlaves.push(pick.file);
                    currentDur += pick.duration;
                    ptr++;
                }

                this.updateProgress(i, masters.length, `Fusing ${catName} [${i+1}/${masters.length}]`);

                await this.runWorker({
                    masterFile: master.file,
                    slaveFiles: selectedSlaves,
                    mode: this.state.currentMode,
                    index: `${catName}_item_${i+1}`
                }, workerPath);

                if (i < masters.length - 1) {
                    this.addLog("Cooling down for 5 seconds...", 'dim');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        this.state.isProcessing = false;
        this.updateProgress(100, 100, "SYSTEM IDLE");
        this.sys.toast("Batch Processing Complete!", "success");
        this.render();
    },

    runWorker(job, path) {
        return new Promise((resolve) => {
            const worker = new Worker(path);
            worker.postMessage({ type: 'PROCESS_STITCH', data: job });
            worker.onmessage = (e) => {
                if (e.data.type === 'DONE') {
                    this.saveToDevice(new Blob([e.data.buffer], { type: 'video/mp4' }), e.data.name, 'video/mp4');
                    this.addLog(`Output Ready: ${e.data.name}`, 'scs');
                    worker.terminate();
                    resolve();
                } else if (e.data.type === 'ERROR') {
                    this.addLog(`Error in Job ${job.index}: ${e.data.msg}`, 'err');
                    worker.terminate();
                    resolve();
                }
            };
            worker.onerror = () => {
                this.addLog(`CRITICAL: Worker Failure.`, 'err');
                worker.terminate();
                resolve();
            };
        });
    },

    addLog(msg, type = 'dim') {
        const time = new Date().toLocaleTimeString();
        this.state.logs.unshift({ msg, type, time });
        this.render();
    },

    updateProgress(curr, tot, txt) {
        this.state.progress = { text: txt, percent: tot > 0 ? Math.round((curr / tot) * 100) : 0 };
        this.render();
    },

    render() {
        // Hanya render main karena lander dihapus
        const content = this.renderMain();
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    <div class="cyber-header">FUSION_FACTORY PRO</div>
                    ${content}
                </div>
                ${this.state.showModal ? this.renderModal() : ''}
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif; overflow-y: scroll;
                    scrollbar-width: none; position: relative;
                    /* Cyberpunk Grid Background */
                    background-image: linear-gradient(rgba(0, 210, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0, 210, 255, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }

                /* Mobile Adjustment - Posisi lebih turun agar tidak kena header app */
                @media (max-width: 768px) {
                    .app-root { padding-top: 100px; padding-bottom: 100px; }
                    .content-limit { display: flex; flex-direction: column; justify-content: center; min-height: 80vh; }
                }

                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                .cyber-header { text-align: center; font-size: 24px; font-weight: 900; color: var(--txt); text-shadow: 0 0 10px var(--txt); margin-bottom: 20px; letter-spacing: 2px; }
                .glass-panel { background: var(--glass); backdrop-filter: blur(20px); border: var(--glass-border); border-radius: 28px; padding: 30px; box-shadow: var(--shadow); }

                /* Semua teks paksa biru */
                * { color: var(--txt); }

                .btn { background: var(--prm); color: #fff !important; border: 1px solid var(--txt); padding: 14px 28px; border-radius: 12px; cursor: pointer; font-weight: 700; transition: 0.2s; text-transform: uppercase; box-shadow: 0 0 10px rgba(0, 85, 255, 0.3); }
                .btn:active { transform: scale(0.97); box-shadow: none; }
                .btn-red { background: var(--err); border-color: #ff0055; }
                .btn-green { background: #0088ff; border-color: var(--txt); }

                .cat-card { background: var(--surface); border: 1px solid var(--brd); border-radius: 24px; padding: 20px; margin-bottom: 20px; position: relative; }
                .drop-btn { background: rgba(0, 210, 255, 0.05); border: 1px dashed var(--txt); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; position: relative; font-size: 10px; font-weight: 800; }

                .log-box { background: rgba(0,0,10,0.6); border-radius: 18px; padding: 15px; height: 140px; overflow-y: auto; font-family: monospace; font-size: 10px; margin-top: 15px; border: 1px solid var(--brd); }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: var(--glass); border: var(--glass-border); border-radius: 28px; padding: 30px; width: 90%; max-width: 420px; box-shadow: var(--shadow); }

                /* Input & Form: Tulisan Wajib Biru saat mengetik */
                .input-field, select {
                    width: 100%; background: var(--surface); border: 1px solid var(--txt);
                    border-radius: 14px; padding: 14px;
                    color: var(--txt) !important; /* Paksa Biru */
                    margin: 20px 0; outline: none; font-weight: 600;
                }
                .input-field::placeholder { color: var(--txt); opacity: 0.5; }
                .input-field:focus { box-shadow: 0 0 15px var(--txt); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
    },

    renderMain() {
        const { categories, logs, progress, isProcessing, currentMode } = this.state;
        const catKeys = Object.keys(categories);
        return `<div class="glass-panel">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px">
                <h2 style="font-weight:900; font-size:16px; letter-spacing:1px">SYSTEM_WORKSPACE</h2>
                <select id="mode-select">
                    <option value="audio_master" ${currentMode==='audio_master'?'selected':''}>MASTER AUDIO</option>
                    <option value="video_master" ${currentMode==='video_master'?'selected':''}>MASTER VIDEO</option>
                </select>
            </div>

            <button class="btn btn-green" style="width:100%; margin-bottom:25px;" id="add-cat-ui">+ CREATE NEW SEGMENT</button>

            <div id="cat-list">
                ${catKeys.map(k => `
                    <div class="cat-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
                            <span style="font-weight:900; color:var(--txt); font-size:14px; text-shadow: 0 0 5px var(--txt)">> ${k.toUpperCase()}</span>
                            <button class="btn btn-red" style="padding: 6px 12px; font-size:10px" onclick="window.smDeleteCat('${k}')">DESTROY</button>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                            <div style="display:flex; flex-direction:column; gap:5px">
                                <div class="drop-btn">VIDEOS <input type="file" webkitdirectory directory multiple style="position:absolute; inset:0; opacity:0; cursor:pointer" onchange="window.smUpload(this, 'video', '${k}')"></div>
                                <div style="display:flex; justify-content:space-between; font-size:9px;"><span>${categories[k].video.length}V</span><span style="color:var(--err); cursor:pointer" onclick="window.smClearPool('${k}', 'video')">CLEAR</span></div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:5px">
                                <div class="drop-btn">AUDIOS <input type="file" webkitdirectory directory multiple style="position:absolute; inset:0; opacity:0; cursor:pointer" onchange="window.smUpload(this, 'audio', '${k}')"></div>
                                <div style="display:flex; justify-content:space-between; font-size:9px;"><span>${categories[k].audio.length}A</span><span style="color:var(--err); cursor:pointer" onclick="window.smClearPool('${k}', 'audio')">CLEAR</span></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <button class="btn" style="width:100%; margin-top:10px; font-size:16px" id="btn-start" ${isProcessing?'disabled':''}>
                ${isProcessing ? 'BATH PROCESSING...' : 'EXECUTE FUSION 🧵'}
            </button>

            <div class="log-box">${logs.map(l => `<div style="color:var(--${l.type}); margin-bottom:5px; font-family: 'Courier New', monospace;"> [${l.time}] ${l.msg}</div>`).join('')}</div>
            <div style="margin-top:20px">
                <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:900; margin-bottom:8px"><span>${progress.text}</span><span>${progress.percent}%</span></div>
                <div style="height:4px; background:rgba(0,210,255,0.1); border-radius:2px; overflow:hidden"><div style="width:${progress.percent}%; height:100%; background:var(--txt); box-shadow: 0 0 10px var(--txt); transition:0.4s"></div></div>
            </div>
        </div>`;
    },

    renderModal() {
        return `<div class="modal-overlay"><div class="modal-content fade-in"><h3 style="font-weight:900; font-size:18px;">INITIALIZE_SEGMENT</h3><input type="text" id="modal-input" class="input-field" placeholder="Segment Name..." autofocus><div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;"><button class="btn" style="background:transparent; border: 1px solid var(--txt);" id="modal-cancel">ABORT</button><button class="btn" id="modal-save">CONFIRM</button></div></div></div>`;
    },

    bindEvents() {
        const root = this.sys.root;
        window.smUpload = (i, t, c) => this.handleUpload(i, t, c);
        window.smDeleteCat = (k) => this.deleteCategory(k);
        window.smClearPool = (k, t) => this.clearPool(k, t);

        root.querySelectorAll('button, input, select, .modal-content, .log-box').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const btnAddUI = root.querySelector('#add-cat-ui');
        if(btnAddUI) btnAddUI.onclick = () => { this.state.showModal = true; this.render(); };

        const modalCancel = root.querySelector('#modal-cancel');
        if(modalCancel) modalCancel.onclick = () => { this.state.showModal = false; this.render(); };

        const modalSave = root.querySelector('#modal-save');
        if(modalSave) modalSave.onclick = () => {
            const val = root.querySelector('#modal-input').value.trim().toLowerCase();
            if(val) { this.state.categories[val] = { video: [], audio: [] }; this.state.showModal = false; this.render(); }
            else this.sys.toast("Invalid name", "error");
        };

        const btnStart = root.querySelector('#btn-start');
        if(btnStart) btnStart.onclick = () => this.startFusion();

        const modeSel = root.querySelector('#mode-select');
        if(modeSel) modeSel.onchange = (e) => { this.state.currentMode = e.target.value; this.render(); };
    }
})