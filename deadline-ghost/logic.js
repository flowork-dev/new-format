({
    state: {
        isFirstVisit: true,
        currentView: 'lander', // 'lander' or 'main'
        selectedFile: null,
        statusLog: 'READY FOR TARGET ACQUISITION.',
        progress: 0,
        isSabotaging: false,
        missionAccomplished: false
    },

    sys: null,
    observer: null,
    appName: 'deadline-ghost',

    // DEFINISI TEMA (Warna Biru diprioritaskan untuk Teks & Aksi)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 17, 26, 0.95)',
            '--glass-border': '1px solid rgba(255, 50, 50, 0.2)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8', // Biru Utama
            '--scs': '#10b981',
            '--err': '#ff2a6d', // Merah Aksen Bahaya
            '--brd': 'rgba(255, 255, 255, 0.05)',
            '--surface': 'rgba(255, 255, 255, 0.03)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.6)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb', // Biru Tegas (Wajib Biru)
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_' + this.appName);
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }

        this.render();

        // Theme Observer
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'data-theme') {
                    this.onThemeChange(document.documentElement.getAttribute('data-theme'));
                }
            });
        });
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    // --- HELPER DOWNLOAD (PROTOKOL HYBRID) ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving sabotaged file...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    // --- LOGIC ENGINE ---
    handleFileSelect(file) {
        if (!file) return;
        this.state.selectedFile = file;
        this.state.statusLog = "TARGET LOCKED. WAITING FOR COMMAND.";
        this.state.missionAccomplished = false;
        this.render();
    },

    async executeSabotage() {
        if (!this.state.selectedFile || this.state.isSabotaging) return;

        this.state.isSabotaging = true;
        this.state.statusLog = "INJECTING GARBAGE DATA INTO HEADERS...";
        this.render();

        // UI Animation Simulation
        await new Promise(r => setTimeout(r, 800));
        this.state.progress = 60;
        this.render();

        try {
            const buffer = await this.state.selectedFile.arrayBuffer();
            const uint8View = new Uint8Array(buffer);

            // ORIGINAL CORRUPTION LOGIC
            const damageLevel = Math.min(1000, uint8View.length);
            for (let i = 0; i < damageLevel; i++) {
                uint8View[i] = Math.floor(Math.random() * 255);
            }

            const midPoint = Math.floor(uint8View.length / 2);
            for (let i = midPoint; i < midPoint + 50; i++) {
                if(i < uint8View.length) uint8View[i] = Math.floor(Math.random() * 255);
            }

            this.state.progress = 100;
            this.state.statusLog = "SABOTAGE COMPLETE. FILE DESTROYED.";
            this.state.missionAccomplished = true;
            this.render();

            const corruptedBlob = new Blob([uint8View], { type: this.state.selectedFile.type });
            this.saveToDevice(corruptedBlob, "CORRUPTED_" + this.state.selectedFile.name, this.state.selectedFile.type);

            // Auto Reset after 4 seconds
            setTimeout(() => {
                this.state.isSabotaging = false;
                this.state.missionAccomplished = false;
                this.state.progress = 0;
                this.state.statusLog = "READY FOR NEXT TARGET.";
                this.render();
            }, 4000);

        } catch (e) {
            console.error(e);
            this.state.statusLog = "ERROR: SYSTEM FAILURE.";
            this.state.isSabotaging = false;
            this.render();
        }
    },

    render() {
        const { currentView } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMain();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'JetBrains Mono', monospace;
                    overflow-y: scroll; padding-top: 70px; padding-bottom: 90px;
                    scrollbar-width: none;
                }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 20px; box-sizing: border-box; flex: 1; }

                .glass-panel {
                    background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); border-radius: 24px; padding: 30px; box-shadow: var(--shadow);
                }

                .font-hud { font-family: 'Orbitron', sans-serif; letter-spacing: 2px; }

                .btn {
                    background: var(--prm); color: #fff; border: none; padding: 16px 32px;
                    border-radius: 12px; cursor: pointer; font-weight: 800; text-transform: uppercase;
                    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
                    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4); transition: all 0.2s;
                }
                .btn:active { transform: scale(0.95); }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
                .btn-sabotage { background: var(--err); box-shadow: 0 4px 20px rgba(255, 42, 109, 0.3); }

                .file-zone {
                    border: 2px dashed var(--brd); border-radius: 20px; padding: 40px;
                    text-align: center; cursor: pointer; transition: all 0.3s; position: relative;
                }
                .file-zone:hover { border-color: var(--prm); background: rgba(56, 189, 248, 0.05); }

                /* TEKS WAJIB BIRU */
                .txt-blue { color: var(--prm) !important; font-weight: 700; }

                .progress-container { width: 100%; height: 6px; background: var(--surface); border-radius: 10px; overflow: hidden; margin: 20px 0; }
                .progress-bar { height: 100%; background: var(--err); transition: width 0.5s ease-out; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .glitch { animation: glitch 1s linear infinite; }
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="glass-panel fade-in" style="text-align: center; max-width: 600px; margin: auto;">
                <div style="width:70px; height:70px; background:rgba(255,42,109,0.1); border:2px solid var(--err); border-radius:20px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:var(--err);">
                    <i class="material-icons" style="font-size:36px;">bolt</i>
                </div>
                <h1 class="font-hud" style="font-size: 32px; margin-bottom: 10px;">DEADLINE_<span style="color:var(--err);">GHOST</span></h1>
                <p style="color: var(--txt-dim); margin-bottom: 30px; font-size: 13px; line-height: 1.6;">
                    The ultimate emergency tool. Sabotage your files locally to buy more time. <br>
                    Binary header destruction ensures no IT support can recover it.
                </p>
                <button id="btn-initialize" class="btn" style="width: 100%;">INITIALIZE SABOTAGE</button>
            </div>
        `;
    },

    renderMain() {
        const { selectedFile, statusLog, progress, isSabotaging, missionAccomplished } = this.state;
        return `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid var(--brd); padding-bottom: 15px;">
                    <div class="font-hud" style="font-size: 18px;">SABOTAGE_STATION</div>
                    <div class="txt-blue" style="font-size: 10px; letter-spacing: 1px;">V2.0 STABLE</div>
                </div>

                <div id="drop-zone" class="file-zone">
                    <input type="file" id="file-input" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index:5;">

                    ${!selectedFile ? `
                        <i class="material-icons" style="font-size:48px; color:var(--txt-dim); margin-bottom:15px;">cloud_upload</i>
                        <div class="txt-blue" style="font-size:14px;">SELECT TARGET FILE</div>
                        <div style="font-size:10px; color:var(--txt-dim); margin-top:5px;">Word, Excel, PDF, ZIP (Max 100MB)</div>
                    ` : `
                        <i class="material-icons ${isSabotaging ? 'glitch' : ''}" style="font-size:48px; color:var(--err); margin-bottom:15px;">file_present</i>
                        <div class="txt-blue" style="font-size:14px; text-transform:uppercase;">${selectedFile.name}</div>
                        <div style="font-size:10px; color:var(--txt-dim); margin-top:5px;">${(selectedFile.size / (1024*1024)).toFixed(2)} MB</div>
                        <div style="display:inline-block; margin-top:15px; font-size:9px; background:rgba(255,42,109,0.1); color:var(--err); padding:4px 12px; border-radius:30px; font-weight:900;">TARGET ACQUIRED</div>
                    `}
                </div>

                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>

                <div style="margin-bottom: 25px;">
                    <div style="font-size: 9px; font-weight: 800; color: var(--txt-dim); margin-bottom: 8px; text-transform: uppercase;">System Log:</div>
                    <div id="status-display" class="${missionAccomplished ? 'txt-blue' : ''}" style="font-family:'JetBrains Mono'; font-size: 11px; color: var(--err);">${statusLog}</div>
                </div>

                <button id="btn-execute" class="btn btn-sabotage" style="width:100%;" ${!selectedFile || isSabotaging ? 'disabled' : ''}>
                    ${isSabotaging ? 'SABOTAGING...' : missionAccomplished ? 'MISSION ACCOMPLISHED' : 'EXECUTE CORRUPTION'}
                </button>

                <div style="text-align: center; margin-top: 25px; opacity: 0.5;">
                    <p style="font-size: 9px; line-height: 1.5;">
                        PROCESSED LOCALLY. NO DATA LEAVES YOUR DEVICE.<br>
                        USE RESPONSIBLY.
                    </p>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, .file-zone').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const initBtn = root.querySelector('#btn-initialize');
        if (initBtn) initBtn.onclick = () => {
            localStorage.setItem('app_visited_' + this.appName, 'true');
            this.state.currentView = 'main';
            this.render();
        };

        const fileIn = root.querySelector('#file-input');
        if (fileIn) {
            fileIn.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleFileSelect(e.target.files[0]);
                }
            };
        }

        const execBtn = root.querySelector('#btn-execute');
        if (execBtn) execBtn.onclick = () => this.executeSabotage();
    }
})