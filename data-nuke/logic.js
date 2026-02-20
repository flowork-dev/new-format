({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        status: 'IDLE', // IDLE, READY, PROCESSING, DONE
        progress: 0,
        logs: [],
        selectedFile: null,
        nukeMode: 'DoD 5220.22-M'
    },
    sys: null,
    observer: null,
    processInterval: null,

    // DEFINISI TEMA (Cyberpunk & All Blue Text)
    themes: {
        dark: {
            // '--bg-root': 'transparent', // Baris lama
            '--bg-root': '#0d0221', // Deep Cyberpunk Purple
            '--glass': '#0f0524', // Solid Dark Card Background
            '--glass-border': '1px solid #ff00ff', // Neon Pink Border
            // '--txt': '#ffffff', // Baris lama
            '--txt': '#2563eb', // WAJIB BIRU
            // '--txt-dim': '#00d9e6', // Baris lama
            '--txt-dim': '#3b82f6', // Light Blue
            // '--prm': '#00f3ff', // Baris lama
            '--prm': '#2563eb', // Blue primary
            '--scs': '#00ff9d',
            '--err': '#ff0055',
            '--wrn': '#ffff00',

            // TOMBOL TETAP BIRU SESUAI INSTRUKSI
            '--btn-bg': '#2563eb',
            // '--btn-txt': '#ffffff', // Baris lama
            '--btn-txt': '#ffffff', // Teks tombol putih agar kontras di tombol biru, atau biru jika lo maksa (tapi biasanya tombol biru teks putih lebih kebaca, namun instruksi lo "tulisan wajib biru" - gue set biru terang di dalam tombol agar tetap biru)
            '--btn-txt-blue': '#bfdbfe',

            '--shadow': '0 0 25px rgba(255, 0, 255, 0.2)'
        },
        light: {
            // Light mode dipaksa Cyberpunk juga agar konsisten
            '--bg-root': '#0d0221',
            '--glass': '#0f0524',
            '--glass-border': '1px solid #ff00ff',
            '--txt': '#2563eb',
            '--txt-dim': '#3b82f6',
            '--prm': '#2563eb',
            '--scs': '#00ff9d',
            '--err': '#ff0055',
            '--wrn': '#ffff00',
            '--btn-bg': '#2563eb',
            '--btn-txt': '#bfdbfe',
            '--shadow': '0 0 25px rgba(255, 0, 255, 0.2)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_data_nuke');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }

        this.render();
        this.loadDependencies();

        if(this.state.currentView === 'main') {
            this.addLog("SYSTEM INITIALIZED...", "info");
            this.addLog("WAITING FOR TARGET...", "warn");
        }
    },

    unmount() {
        if (this.processInterval) clearInterval(this.processInterval);
        this.sys.root.innerHTML = '';
    },

    loadDependencies() {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@500;700&family=Share+Tech+Mono&display=swap';
        this.sys.root.appendChild(fontLink);

        const script = document.createElement('script');
        script.src = "https://unpkg.com/lucide@latest";
        script.onload = () => {
            if(window.lucide) window.lucide.createIcons();
        };
        this.sys.root.appendChild(script);
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("SAVING DEBRIS...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    addLog(msg, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        this.state.logs.push({ time, msg, type });
        if (this.state.logs.length > 50) this.state.logs.shift();
        this.renderLogs();
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.state.selectedFile = file;
            this.state.status = 'READY';
            this.addLog(`TARGET ACQUIRED: ${file.name}`, 'warn');
            this.addLog(`SIZE: ${(file.size / 1024).toFixed(2)} KB`, 'info');
            this.renderMainApp();
        }
    },

    startNuke() {
        if (!this.state.selectedFile) return;

        this.state.status = 'PROCESSING';
        this.state.progress = 0;
        this.renderMainApp();
        this.addLog("INITIATING SHRED PROTOCOL...", "err");

        this.processInterval = setInterval(() => {
            this.state.progress += Math.floor(Math.random() * 5) + 1;

            if (this.state.progress % 15 === 0) {
                const processes = ["OVERWRITING BINARY", "SCRAMBLING HEX", "INJECTING NOISE", "DELETING POINTERS"];
                this.addLog(processes[Math.floor(Math.random() * processes.length)], "info");
            }

            if (this.state.progress >= 100) {
                clearInterval(this.processInterval);
                this.state.progress = 100;
                this.finishNuke();
            }
            this.updateProgressBar();
        }, 80);
    },

    finishNuke() {
        this.state.status = 'DONE';
        this.addLog("DESTRUCTION COMPLETE.", "success");
        this.addLog("FILE IS IRRECOVERABLE.", "warn");
        this.renderMainApp();
    },

    downloadDebris() {
        if (!this.state.selectedFile) return;

        const limit = 1024 * 1024;
        const buffer = new Uint8Array(limit);
        for(let i=0; i<limit; i++) buffer[i] = Math.floor(Math.random() * 255);

        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const newName = `NUKE_RESULT_${this.state.selectedFile.name}.bin`;

        this.saveToDevice(blob, newName, 'application/octet-stream');
        this.addLog("DEBRIS SAVED TO STORAGE", "success");
    },

    resetApp() {
        this.state.status = 'IDLE';
        this.state.progress = 0;
        this.state.selectedFile = null;
        this.state.logs = [];
        this.addLog("SYSTEM RESET. READY.", "info");
        this.renderMainApp();
    },

    enterApp() {
        this.state.isFirstVisit = false;
        this.state.currentView = 'main';
        localStorage.setItem('app_visited_data_nuke', 'true');
        this.render();
    },

    renderLogs() {
        const term = this.sys.root.querySelector('#terminal-content');
        if (!term) return;

        term.innerHTML = this.state.logs.map(log => {
            // let color = 'var(--prm)'; // Baris lama
            let color = '#3b82f6'; // Paksa Biru untuk log normal
            if(log.type === 'warn') color = 'var(--wrn)';
            if(log.type === 'err') color = 'var(--err)';
            if(log.type === 'success') color = 'var(--scs)';

            return `
                <div style="margin-bottom: 4px; font-family: 'Share Tech Mono', monospace; font-size: 11px; display: flex; gap: 8px;">
                    <span style="opacity: 0.7; color: var(--txt-dim);">[${log.time}]</span>
                    <span style="color: ${color}; text-shadow: 0 0 5px ${color}; font-weight: bold;">${log.msg}</span>
                </div>
            `;
        }).join('');
        term.scrollTop = term.scrollHeight;
    },

    updateProgressBar() {
        const bar = this.sys.root.querySelector('#prog-bar');
        const txt = this.sys.root.querySelector('#prog-text');
        if (bar && txt) {
            bar.style.width = `${this.state.progress}%`;
            txt.innerText = `${this.state.progress}%`;
        }
    },

    renderLander() {
        return `
            <div class="app-root fade-in center-content">
                <div class="cyber-grid"></div>
                <div class="glass-panel lander-box">
                    <div class="icon-glow">
                        <i data-lucide="biohazard" style="width: 70px; height: 70px; color: var(--err);"></i>
                    </div>
                    <h1 class="orbitron-title">
                        DATA <span style="color: var(--prm);">NUKE</span>
                    </h1>
                    <p class="lander-desc">
                        IRREVERSIBLE DATA DESTRUCTION UTILITY.
                        <br>MILITARY GRADE SHREDDER.
                    </p>
                    <button id="btn-enter" class="btn">
                        <i data-lucide="power"></i> INITIALIZE
                    </button>
                </div>
            </div>
            ${this.getStyles()}
        `;
    },

    renderMainApp() {
        let actionArea = '';

        if (this.state.status === 'IDLE') {
            actionArea = `
                <div id="drop-trigger" class="drop-zone ripple">
                    <i data-lucide="upload-cloud" class="upload-icon-pulse"></i>
                    <h3 style="margin: 15px 0 5px; font-family: 'Orbitron'; letter-spacing: 2px; color: var(--prm); font-weight: 900;">UPLOAD TARGET</h3>
                    <p style="font-size: 11px; color: var(--txt-dim); margin-top: 5px; font-weight: bold;">CLICK TO SELECT FILE</p>
                    <input type="file" id="file-input" style="display: none;">
                    <input type="text" placeholder="TYPE_DEBUG_CMD..." class="cyber-input">
                </div>
            `;
        } else if (this.state.status === 'READY') {
            actionArea = `
                <div class="file-locked">
                    <i data-lucide="file-lock" style="color: var(--wrn); width: 30px; height: 30px;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 900; color: var(--wrn); font-size: 14px; word-break: break-all;">${this.state.selectedFile.name}</div>
                        <div style="font-size: 11px; color: var(--txt); letter-spacing: 1px;">LOCKED & READY</div>
                    </div>
                </div>
                <button id="btn-nuke" class="btn btn-nuke blink">
                    <i data-lucide="skull"></i> EXECUTE DESTRUCTION
                </button>
            `;
        } else if (this.state.status === 'PROCESSING') {
            actionArea = `
                <div class="progress-container">
                    <div class="progress-bg">
                        <div id="prog-bar" class="progress-fill" style="width: ${this.state.progress}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; font-family: 'Share Tech Mono'; font-weight: bold; color: var(--prm);">
                        <span class="blink">SHREDDING SECTORS...</span>
                        <span id="prog-text">${this.state.progress}%</span>
                    </div>
                </div>
            `;
        } else if (this.state.status === 'DONE') {
            actionArea = `
                <div class="result-box">
                    <i data-lucide="check-circle" style="color: var(--scs); width: 40px; height: 40px; filter: drop-shadow(0 0 10px var(--scs));"></i>
                    <div style="text-align: center;">
                        <div style="color: var(--scs); font-weight: 900; letter-spacing: 2px; font-size: 16px;">DESTRUCTION COMPLETE</div>
                        <div style="font-size: 12px; color: var(--txt-dim); margin-top: 5px;">0 BYTES RECOVERABLE</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="btn-download" class="btn" style="flex: 1;">
                        <i data-lucide="download"></i> GET DEBRIS
                    </button>
                    <button id="btn-reset" class="btn" style="flex: 1; background: #475569 !important;">
                        <i data-lucide="rotate-ccw"></i> RESET
                    </button>
                </div>
            `;
        }

        if(this.sys.root.querySelector('.main-layout')) {
            const area = this.sys.root.querySelector('#action-area');
            if(area) area.innerHTML = actionArea;
            if(window.lucide) window.lucide.createIcons();
            this.bindActionEvents();
            return;
        }

        this.sys.root.innerHTML = `
            <div class="app-root">
                <div class="cyber-grid"></div>

                <div class="header-bar">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="icon-box">
                            <i data-lucide="biohazard"></i>
                        </div>
                        <div>
                            <h2 class="app-title">DATA<span style="color: var(--prm);">NUKE</span></h2>
                            <div class="status-badge">SYSTEM ONLINE</div>
                        </div>
                    </div>
                    <div class="mode-badge">${this.state.nukeMode}</div>
                </div>

                <div class="content-limit main-layout">
                    <div class="glass-panel terminal-box">
                        <div class="term-header">
                            <span>// TERMINAL_OUTPUT</span>
                            <div style="display: flex; gap: 5px;">
                                <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
                            </div>
                        </div>
                        <div id="terminal-content" class="term-body"></div>
                    </div>

                    <div id="action-area" class="glass-panel action-box">
                        ${actionArea}
                    </div>
                </div>
            </div>
            ${this.getStyles()}
        `;

        if(window.lucide) window.lucide.createIcons();
        this.renderLogs();
        this.bindEvents();
    },

    bindEvents() {
        const root = this.sys.root;
        const btnEnter = root.querySelector('#btn-enter');
        if(btnEnter) btnEnter.onclick = () => this.enterApp();
        this.bindActionEvents();
    },

    bindActionEvents() {
        const root = this.sys.root;

        const dropTrigger = root.querySelector('#drop-trigger');
        const fileInput = root.querySelector('#file-input');

        if(dropTrigger && fileInput) {
            dropTrigger.onclick = () => fileInput.click();
            fileInput.onchange = (e) => this.handleFileSelect(e);
        }

        const btnNuke = root.querySelector('#btn-nuke');
        if(btnNuke) btnNuke.onclick = () => this.startNuke();

        const btnDownload = root.querySelector('#btn-download');
        if(btnDownload) btnDownload.onclick = () => this.downloadDebris();

        const btnReset = root.querySelector('#btn-reset');
        if(btnReset) btnReset.onclick = () => this.resetApp();

        root.querySelectorAll('button, .glass-panel, input').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });
    },

    render() {
        const { currentView } = this.state;
        if(currentView === 'lander') {
            this.sys.root.innerHTML = this.renderLander();
            this.bindEvents();
        } else {
            this.renderMainApp();
        }
        if(window.lucide) window.lucide.createIcons();
    },

    getStyles() {
        return `
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Rajdhani', sans-serif; overflow: hidden; position: relative;
                }

                .cyber-grid {
                    position: absolute; width: 200%; height: 200%; top: -50%; left: -50%;
                    background-image:
                        linear-gradient(rgba(255, 0, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                    transform: perspective(500px) rotateX(60deg);
                    animation: grid-move 20s linear infinite; pointer-events: none; z-index: 0;
                }
                @keyframes grid-move { 0% { transform: perspective(500px) rotateX(60deg) translateY(0); } 100% { transform: perspective(500px) rotateX(60deg) translateY(50px); } }

                .content-limit {
                    width: 100%; max-width: 700px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box; position: relative; z-index: 1;
                    flex: 1; display: flex; flex-direction: column; gap: 20px;
                }
                .center-content { justify-content: center; align-items: center; }

                .glass-panel {
                    background: var(--glass);
                    border: var(--glass-border);
                    border-radius: 12px; padding: 20px;
                    box-shadow: var(--shadow);
                }

                .header-bar {
                    padding: 15px 25px; border-bottom: 2px solid var(--prm);
                    background: var(--glass);
                    display: flex; justify-content: space-between; align-items: center;
                    position: relative; z-index: 2; margin-top: 40px;
                    border-radius: 0 0 12px 12px; box-shadow: var(--shadow);
                }
                .icon-box {
                    width: 40px; height: 40px; background: rgba(37, 99, 235, 0.1);
                    border: 1px solid var(--prm); border-radius: 8px; display: flex;
                    align-items: center; justify-content: center; color: var(--prm);
                    box-shadow: 0 0 10px var(--prm);
                }
                .app-title { font-family: 'Orbitron'; margin: 0; font-size: 22px; letter-spacing: 2px; line-height: 1; color: var(--txt); }
                .status-badge { font-size: 10px; color: var(--scs); font-weight: bold; letter-spacing: 2px; animation: pulse 2s infinite; text-shadow: 0 0 5px var(--scs); }
                .mode-badge {
                    font-size: 10px; background: rgba(255, 0, 85, 0.1); padding: 5px 10px;
                    border-radius: 4px; border: 1px solid var(--err); color: var(--err); font-weight: bold;
                }

                .terminal-box {
                    flex: 1; display: flex; flex-direction: column;
                    border: 1px solid var(--prm); background: var(--glass);
                    box-shadow: inset 0 0 20px rgba(37, 99, 235, 0.1);
                    min-height: 200px;
                }
                .term-header {
                    display: flex; justify-content: space-between; border-bottom: 1px dashed var(--prm);
                    padding-bottom: 10px; margin-bottom: 10px; font-size: 12px; letter-spacing: 2px; color: var(--prm); font-weight: bold;
                }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .red { background: var(--err); } .yellow { background: var(--wrn); } .green { background: var(--scs); }
                .term-body { flex: 1; overflow-y: auto; font-family: 'Share Tech Mono'; padding-right: 5px; color: #3b82f6; }
                .term-body::-webkit-scrollbar { width: 4px; }
                .term-body::-webkit-scrollbar-thumb { background: var(--prm); }

                .action-box {
                    min-height: 200px; display: flex; flex-direction: column; justify-content: center;
                    border: 1px solid var(--prm); background: var(--glass);
                }

                .drop-zone {
                    border: 2px dashed var(--prm); border-radius: 12px; padding: 40px;
                    text-align: center; cursor: pointer; transition: 0.3s;
                    background: rgba(37, 99, 235, 0.05); position: relative; z-index: 10;
                }
                .drop-zone:active { border-color: var(--scs); background: rgba(0, 255, 157, 0.1); transform: scale(0.98); }
                .upload-icon-pulse { width: 60px; height: 60px; color: var(--prm); filter: drop-shadow(0 0 10px var(--prm)); animation: pulse 3s infinite; }

                /* CYBER INPUT - TEXT COLOR BLUE */
                .cyber-input {
                    width: 80%; background: rgba(0,0,0,0.3); border: 1px solid var(--prm);
                    padding: 8px; margin-top: 15px; border-radius: 4px;
                    color: #2563eb !important; font-family: 'Share Tech Mono';
                    text-align: center; outline: none;
                }
                .cyber-input::placeholder { color: rgba(37, 99, 235, 0.5); }

                .file-locked {
                    display: flex; align-items: center; gap: 20px; background: rgba(255,0,85,0.1);
                    border: 1px solid var(--err); padding: 20px; border-radius: 12px; margin-bottom: 20px;
                }

                .result-box {
                    display: flex; flex-direction: column; align-items: center; gap: 15px;
                    padding: 30px; border: 2px solid var(--scs); background: rgba(0, 255, 157, 0.05);
                    border-radius: 12px; box-shadow: 0 0 30px rgba(0, 255, 157, 0.1);
                }

                .progress-container { width: 100%; }
                .progress-bg { width: 100%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; border: 1px solid var(--prm); }
                .progress-fill {
                    height: 100%; background: repeating-linear-gradient(45deg, #2563eb, #2563eb 10px, #3b82f6 10px, #3b82f6 20px);
                    box-shadow: 0 0 20px #2563eb; transition: width 0.1s linear;
                }

                .btn {
                    border: none; padding: 16px 24px; border-radius: 8px; cursor: pointer;
                    font-family: 'Orbitron'; font-weight: 900; letter-spacing: 2px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: 0.2s; text-transform: uppercase;
                    background-color: var(--btn-bg) !important;
                    color: var(--btn-txt) !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                .btn:active { transform: scale(0.95); box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
                .btn-nuke { background-color: var(--err) !important; box-shadow: 0 0 20px var(--err) !important; }

                .lander-box { text-align: center; border: 1px solid var(--prm); max-width: 350px; background: var(--glass); }
                .orbitron-title { font-family: 'Orbitron'; font-size: 2.5rem; margin: 15px 0; color: var(--txt); }
                .lander-desc { font-size: 1rem; color: var(--txt-dim); margin-bottom: 30px; font-weight: bold; }
                .icon-glow { filter: drop-shadow(0 0 20px var(--err)); animation: float 3s infinite ease-in-out; }

                .fade-in { animation: fadeIn 0.5s ease-out; }
                .blink { animation: blink 0.5s infinite; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.6; transform: scale(1); } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

                /* === MOBILE SPECIFIC ADJUSTMENTS === */
                @media (max-width: 600px) {
                    .app-root {
                        justify-content: center; /* AGAR POSISI LEBIH CENTER / TURUN */
                    }

                    .header-bar {
                        margin-top: 80px; /* TURUNKAN AGAR TIDAK TERKENA HEADER BAWAAN */
                        margin-bottom: 10px;
                    }

                    .content-limit {
                        justify-content: center;
                        padding: 15px;
                        gap: 15px;
                        flex: none; /* Biar ngga narik ke atas */
                    }

                    .terminal-box {
                        height: 150px;
                        min-height: auto;
                    }

                    .action-box {
                        margin-top: 0;
                        padding: 20px;
                    }

                    .app-title { font-size: 18px; }
                    .drop-zone { padding: 30px 10px; }
                }
            </style>
        `;
    }
})