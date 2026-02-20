({
    state: {
        activeTab: 'encode', // 'encode' | 'decode'

        // Encode Data (Input File Dibuang)
        encodeText: '',
        encodePassword: '',

        // Decode Data
        decodeFile: null,
        decodePassword: '',
        decodeStatus: 'idle', // idle, ready, processing, success, error
        decodedResult: '',

        // Hidden Temp Data
        extractedSecret: null,

        // UI Animation
        isLoading: false,
        loadingText: 'INITIALIZING...',
        showUnlockModal: false,
        modalPassword: '',
        blobs: { blue: {x:0, y:0}, gold: {x:0, y:0} }
    },

    sys: null,
    observer: null,
    animInterval: null,

    // THEME CONFIG - UPDATED TO CYBERPUNK
    themes: {
        dark: {
            /* '--bg-root': '#050505', */
            '--bg-root': '#0d0221', // Cyberpunk Deep Purple/Black
            /* '--panel-bg': 'rgba(15, 16, 20, 0.75)', */
            '--panel-bg': 'rgba(13, 2, 33, 0.85)',
            '--glass-border': 'rgba(0, 212, 255, 0.3)', // Cyan border
            '--accent': '#00d4ff', // Electric Blue
            '--gold': '#ff00ff',   // Cyberpunk Pink/Magenta
            '--err': '#ff003c',    // Cyberpunk Red
            '--green': '#00ff9f',  // Neon Green
            /* '--txt': '#e0f0ff', */
            '--txt': '#00d4ff',    // Wajib Biru
            /* '--txt-dim': '#94a3b8', */
            '--txt-dim': '#005f73', // Darker Blue
            '--font-hud': "'Rajdhani', sans-serif",
            '--font-mono': "'JetBrains Mono', monospace"
        },
        light: {
            /* '--bg-root': '#f0f4f8', */
            '--bg-root': '#e0f0ff', // Light Blue background
            '--panel-bg': 'rgba(255, 255, 255, 0.9)',
            '--glass-border': 'rgba(0, 0, 255, 0.2)',
            '--accent': '#0000ff', // Pure Blue
            '--gold': '#ff00ff',
            '--err': '#dc2626',
            '--green': '#059669',
            /* '--txt': '#0f172a', */
            '--txt': '#0000ff',    // Wajib Biru
            /* '--txt-dim': '#64748b', */
            '--txt-dim': '#00008b', // Deep Blue
            '--font-hud': "sans-serif",
            '--font-mono': "monospace"
        }
    },

    mount(sys) {
        this.sys = sys;
        this.loadFonts();
        this.render();
        this.startAnimation();

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
        this.bindEvents();
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        if (this.animInterval) clearInterval(this.animInterval);
        this.sys.root.innerHTML = '';
    },

    loadFonts() {
        if (!document.getElementById('font-flowork-secret')) {
            const link = document.createElement('link');
            link.id = 'font-flowork-secret';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap';
            document.head.appendChild(link);
        }
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving to device...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    // --- STEGANOGRAPHY ENGINE ---

    generateStegoAudio(secretText) {
        const sampleRate = 44100;
        const duration = 3;
        const numChannels = 1;
        const dataSize = sampleRate * duration * 2;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        const writeString = (offset, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        };

        // Header WAV
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // Synth Tone Generation
        for (let i = 0; i < sampleRate * duration; i++) {
            const t = i / sampleRate;
            const freq = 600 + (Math.sin(t * 30) * 150); // Sci-Fi FM Synthesis
            const val = Math.sin(2 * Math.PI * freq * t);
            const noise = (Math.random() - 0.5) * 0.05;
            const sample = (val * 0.5 + noise) * 0x7FFF;
            view.setInt16(44 + i * 2, sample, true);
        }

        // EOF Injection
        const delimiter = "###FLOWORK_SECURE_DATA###";
        const payload = delimiter + btoa(secretText);

        return new Blob([view, payload], { type: 'audio/wav' });
    },

    async extractStegoData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const rawText = e.target.result;
                    const delimiter = "###FLOWORK_SECURE_DATA###";
                    const parts = rawText.split(delimiter);

                    if (parts.length > 1) {
                        const secretB64 = parts[parts.length - 1];
                        const secret = atob(secretB64);
                        resolve({ success: true, data: secret });
                    } else {
                        resolve({ success: false });
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsBinaryString(file);
        });
    },

    // --- UI & LOGIC ---

    startAnimation() {
        this.animInterval = setInterval(() => {
            const t = Date.now() / 3000;
            this.state.blobs.blue = { x: Math.sin(t) * 20, y: Math.cos(t) * 15 };
            this.state.blobs.gold = { x: Math.cos(t) * 20, y: Math.sin(t) * 15 };

            const bBlue = this.sys.root.querySelector('.blob-blue');
            const bGold = this.sys.root.querySelector('.blob-gold');

            if(bBlue) bBlue.style.transform = `translate(${this.state.blobs.blue.x}px, ${this.state.blobs.blue.y}px)`;
            if(bGold) bGold.style.transform = `translate(${this.state.blobs.gold.x}px, ${this.state.blobs.gold.y}px)`;
        }, 50);
    },

    async handleEncode() {
        if(!this.state.encodeText) return this.sys.toast("Payload Empty: Text required", "error");

        this.state.isLoading = true;
        this.state.loadingText = "SYNTHESIZING SIGNAL...";
        this.render();

        await new Promise(r => setTimeout(r, 1500));

        try {
            const finalBlob = this.generateStegoAudio(this.state.encodeText);
            this.saveToDevice(finalBlob, `SIGNAL_${Date.now()}.wav`, 'audio/wav');
            this.sys.toast("Audio Signal Generated", "success");
        } catch(e) {
            console.error(e);
            this.sys.toast("Encoding Failed", "error");
        }

        this.state.isLoading = false;
        this.render();
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.state.decodeFile = file;
            this.state.decodeStatus = 'ready';
            this.state.decodedResult = '';
            this.render();
        }
    },

    async executeDecode() {
        if(!this.state.decodeFile) return;

        this.state.isLoading = true;
        this.state.loadingText = "ANALYZING SPECTRUM...";
        this.render();

        await new Promise(r => setTimeout(r, 1500));

        try {
            const result = await this.extractStegoData(this.state.decodeFile);

            if (result.success) {
                this.state.extractedSecret = result.data;
                this.state.decodeStatus = 'encrypted';
                this.state.showUnlockModal = true;
            } else {
                this.sys.toast("No hidden signal found.", "error");
                this.state.decodeStatus = 'ready';
            }
        } catch(e) {
            console.error(e);
            this.sys.toast("File Error", "error");
        }

        this.state.isLoading = false;
        this.render();
    },

    handleUnlock() {
        // Password hanyalah formalitas UI di versi ini (simulasi security)
        const pass = this.state.modalPassword;
        if(pass.length > 0) {
            this.state.showUnlockModal = false;
            this.state.decodeStatus = 'success';
            this.state.decodedResult = this.state.extractedSecret;
            this.sys.toast("Signal Decrypted", "success");
        } else {
            this.sys.toast("Password Required", "error");
        }
        this.render();
    },

    // --- RENDER ENGINE ---

    render() {
        const { activeTab, isLoading, showUnlockModal } = this.state;

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="ambient-bg">
                    <div class="blob blob-blue"></div>
                    <div class="blob blob-gold"></div>
                </div>

                <nav class="glass-header">
                    <div class="nav-brand">
                        <div class="logo-box">
                            <i data-lucide="zap" class="icon-brand"></i>
                        </div>
                        <div class="brand-text">
                            <h1>FLOWORK</h1>
                            <span>SIGNAL PROCESSOR V4.5</span>
                        </div>
                    </div>
                    <div class="status-badge">
                        <div class="status-dot"></div>
                        <span>ONLINE</span>
                    </div>
                </nav>

                <div class="tabs-container">
                    <button id="tab-encode" class="tab-btn ${activeTab === 'encode' ? 'active' : ''}">
                        <i data-lucide="lock"></i> ENCODER
                    </button>
                    <button id="tab-decode" class="tab-btn ${activeTab === 'decode' ? 'active' : ''}">
                        <i data-lucide="unlock"></i> DECODER
                    </button>
                </div>

                <div class="content-viewport custom-scroll">
                    ${activeTab === 'encode' ? this.renderEncoder() : this.renderDecoder()}
                    <div class="mobile-footer-gap"></div>
                </div>

                ${isLoading ? this.renderLoader() : ''}
                ${showUnlockModal ? this.renderModal() : ''}
            </div>
            ${this.getStyles()}
        `;

        if (window.lucide) window.lucide.createIcons();
        this.bindEvents();
    },

    renderEncoder() {
        const { encodeText, encodePassword } = this.state;
        return `
            <div class="split-view">
                <div class="panel-left">
                    <div class="glass-card shadow-cyan">
                        <label class="label-hud text-cyan">PAYLOAD DATA</label>
                        <textarea id="inp-text" class="input-area" placeholder="Enter top secret message here...">${encodeText}</textarea>
                    </div>

                    <div class="glass-card hover-red">
                        <label class="label-hud text-red"><i data-lucide="key" class="icon-sm"></i> SECURITY KEY (OPTIONAL)</label>
                        <input id="inp-pass" type="password" value="${encodePassword}" class="input-field text-red" placeholder="Enter Password">
                    </div>

                    <button id="btn-process" class="btn-action btn-cyan">
                        GENERATE AUDIO SIGNAL
                    </button>
                </div>

                <div class="panel-right">
                    <div class="preview-box">
                        <div class="preview-content opacity-50">
                            <i data-lucide="activity" class="icon-xl text-cyan pulse"></i>
                            <p class="label-hud text-cyan mt-4">SYSTEM READY</p>
                            <p class="text-dim text-[10px] mt-2">NO CARRIER INPUT NEEDED.<br>SIGNAL WILL BE SYNTHESIZED.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDecoder() {
        const { decodeStatus, decodedResult, decodeFile } = this.state;

        let fileLabel = "UPLOAD SIGNAL FILE (.WAV)";
        let iconColor = "text-dim";
        if (decodeFile) {
            fileLabel = decodeFile.name;
            iconColor = "text-green";
        }

        return `
            <div class="single-view">
                <div class="upload-box large ${decodeFile ? 'border-green' : ''}">
                    <input id="inp-scan-file" type="file" class="file-trigger" accept="audio/*,video/*">
                    <div class="upload-icon bg-green-dim">
                        <i data-lucide="${decodeFile ? 'check-circle' : 'scan-line'}" class="${iconColor}"></i>
                    </div>
                    <h3 class="font-hud text-lg ${decodeFile ? 'text-green' : 'text-white'}">${decodeFile ? 'MEDIA LOADED' : 'SCAN AUDIO FILE'}</h3>
                    <p class="label-hud text-dim">${fileLabel}</p>
                </div>

                ${(decodeStatus === 'ready' || decodeStatus === 'encrypted') ? `
                    <button id="btn-execute-decode" class="btn-action bg-green text-white fade-in">
                        <i data-lucide="cpu" class="icon-sm"></i> DECRYPT SIGNAL
                    </button>
                ` : ''}

                ${decodeStatus === 'success' ? `
                    <div class="glass-card border-green bg-green-dim fade-in">
                        <div class="header-row">
                            <span class="label-hud text-green">DECODED MESSAGE</span>
                            <button id="btn-copy" class="text-green hover:text-white"><i data-lucide="copy"></i></button>
                        </div>
                        <div class="result-box">
                            <p class="font-mono text-green text-sm break-all">${decodedResult}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderLoader() {
        return `
            <div class="overlay-backdrop">
                <div class="loader-content">
                    <i data-lucide="loader-2" class="icon-xl text-white spin"></i>
                    <h3 class="font-hud text-xl text-white mt-4 tracking-widest">PROCESSING</h3>
                    <div class="pill-badge text-cyan border-cyan bg-cyan-dim">${this.state.loadingText}</div>
                </div>
            </div>
        `;
    },

    renderModal() {
        return `
            <div class="overlay-backdrop">
                <div class="glass-card modal-box border-red shadow-red">
                    <div class="modal-header">
                        <div class="icon-circle bg-red-dim border-red">
                            <i data-lucide="lock" class="text-red"></i>
                        </div>
                        <h3 class="font-hud text-lg text-white">SIGNAL LOCKED</h3>
                        <p class="text-dim text-xs font-mono">Enter password to view payload.</p>
                    </div>
                    <div class="modal-body">
                        <input id="modal-pass" type="password" class="input-field text-center text-lg font-bold" placeholder="ENTER PASSWORD">
                        <button id="btn-unlock" class="btn-action bg-red text-white">UNLOCK</button>
                        <button id="btn-cancel" class="btn-text text-dim">CANCEL</button>
                    </div>
                </div>
            </div>
        `;
    },

    getStyles() {
        return `
        <style>
            .app-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-root); color: var(--txt); font-family: var(--font-mono); overflow: hidden; position: relative; }
            .custom-scroll { overflow-y: auto; scrollbar-width: none; } .custom-scroll::-webkit-scrollbar { display: none; }
            .ambient-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
            .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; width: 60vw; height: 60vw; transition: transform 0.1s linear; }
            .blob-blue { top: -20%; left: -20%; background: radial-gradient(circle, var(--accent) 0%, transparent 70%); }
            .blob-gold { bottom: -20%; right: -20%; background: radial-gradient(circle, var(--gold) 0%, transparent 70%); }

            /* Header Responsiveness 85px gap for Mobile */
            .glass-header { height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: var(--panel-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--glass-border); z-index: 20; }
            @media (max-width: 768px) {
                .glass-header { height: 85px; padding-top: 15px; } /* Gap header mobile 85px */
            }

            .nav-brand { display: flex; align-items: center; gap: 12px; }
            .logo-box { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #1e3a8a, #000); border: 1px solid rgba(84, 215, 246, 0.3); display: flex; align-items: center; justify-content: center; }
            .brand-text h1 { font-family: var(--font-hud); font-weight: 700; font-size: 18px; letter-spacing: 0.15em; line-height: 1; margin: 0; }
            .brand-text span { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); opacity: 0.7; }
            .status-badge { display: flex; align-items: center; gap: 8px; padding: 4px 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; font-size: 10px; font-weight: bold; color: var(--green); letter-spacing: 0.1em; }
            .status-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; box-shadow: 0 0 8px var(--green); }
            .tabs-container { display: flex; background: rgba(0,0,0,0.4); border-bottom: 1px solid var(--glass-border); z-index: 10; }
            .tab-btn { flex: 1; padding: 16px; background: transparent; border: none; color: var(--txt-dim); font-family: var(--font-hud); font-weight: 700; font-size: 12px; letter-spacing: 0.2em; cursor: pointer; transition: 0.3s; border-bottom: 2px solid transparent; display: flex; justify-content: center; gap: 8px; align-items: center; }
            .tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--txt); }
            .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); background: rgba(84, 215, 246, 0.05); }

            /* Viewport and Footer Gap 85px */
            .content-viewport { flex: 1; padding: 24px; position: relative; z-index: 10; }
            .mobile-footer-gap { display: none; height: 85px; width: 100%; }
            @media (max-width: 768px) {
                .mobile-footer-gap { display: block; } /* Memberikan space scroll di bawah */
            }

            .split-view { display: flex; gap: 24px; height: 100%; flex-direction: column; }
            @media(min-width: 768px) { .split-view { flex-direction: row; } }
            .panel-left { flex: 1; display: flex; flex-direction: column; gap: 20px; }
            .panel-right { width: 100%; height: 300px; }
            @media(min-width: 768px) { .panel-right { width: 400px; height: auto; } }
            .single-view { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
            .glass-card { background: var(--panel-bg); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 20px; transition: border-color 0.3s; }
            .shadow-cyan:focus-within { border-color: var(--accent); box-shadow: 0 0 20px rgba(84, 215, 246, 0.1); }
            .hover-red:hover { border-color: var(--err); }
            .border-green { border-color: var(--green); }
            .label-hud { font-size: 10px; font-weight: bold; letter-spacing: 0.15em; display: block; margin-bottom: 8px; }
            .text-cyan { color: var(--accent); } .text-red { color: var(--err); } .text-green { color: var(--green); } .text-white { color: #fff; } .text-dim { color: var(--txt-dim); }

            /* Input Colors (Wajib Biru saat mengetik) */
            .input-area { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; padding: 16px; color: #0080ff !important; font-family: var(--font-mono); height: 120px; resize: none; outline: none; transition: 0.3s; }
            .input-field { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px; color: #0080ff !important; font-family: var(--font-mono); outline: none; transition: 0.3s; }
            .input-area:focus, .input-field:focus { border-color: var(--accent); background: rgba(0,0,0,0.5); }

            .btn-action { width: 100%; padding: 16px; border: none; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: var(--font-hud); font-weight: 800; font-size: 16px; letter-spacing: 0.2em; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
            .btn-action:active { transform: scale(0.98); }
            .btn-cyan { background: linear-gradient(to right, #0891b2, #2563eb); color: white; }
            .bg-green { background: var(--green); }
            .upload-box { border: 2px dashed var(--glass-border); background: rgba(255,255,255,0.03); border-radius: 16px; padding: 24px; text-align: center; cursor: pointer; position: relative; transition: 0.3s; }
            .upload-box:hover { border-color: var(--accent); background: rgba(84, 215, 246, 0.05); }
            .file-trigger { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
            .upload-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
            .preview-box { height: 100%; min-height: 200px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
            .bg-green-dim { background: rgba(16, 185, 129, 0.1); }
            .overlay-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
            .modal-box { width: 100%; max-width: 320px; text-align: center; }
            .border-red { border-color: var(--err); } .shadow-red { box-shadow: 0 0 30px rgba(239, 68, 68, 0.2); }
            .icon-circle { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; border: 1px solid transparent; }
            .bg-red-dim { background: rgba(239, 68, 68, 0.1); }
            .modal-body { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
            .bg-red { background: var(--err); }
            .btn-text { background: transparent; border: none; font-size: 12px; letter-spacing: 0.1em; cursor: pointer; }
            .icon-brand { width: 20px; height: 20px; color: var(--accent); } .icon-sm { width: 14px; height: 14px; display: inline-block; } .icon-xl { width: 64px; height: 64px; }
            .pulse { animation: pulse 2s infinite; } .spin { animation: spin 1s linear infinite; } .fade-in { animation: fadeIn 0.4s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .result-box { background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); }
            .pill-badge { margin-top: 12px; font-size: 10px; padding: 4px 12px; border: 1px solid; border-radius: 20px; display: inline-block; letter-spacing: 0.1em; }
            .bg-cyan-dim { background: rgba(84, 215, 246, 0.1); border-color: var(--accent); color: var(--accent); }
        </style>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        const bind = (id, fn) => { const el = root.querySelector(id); if(el) el.onclick = fn; };

        root.querySelectorAll('.glass-card, button, input, nav').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        // Tabs
        bind('#tab-encode', () => { this.state.activeTab = 'encode'; this.render(); });
        bind('#tab-decode', () => {
            this.state.activeTab = 'decode';
            this.state.decodeStatus = 'idle';
            this.state.decodeFile = null;
            this.render();
        });

        // Encode Actions
        const inpText = root.querySelector('#inp-text');
        if(inpText) inpText.oninput = (e) => this.state.encodeText = e.target.value;

        const inpPass = root.querySelector('#inp-pass');
        if(inpPass) inpPass.oninput = (e) => this.state.encodePassword = e.target.value;

        bind('#btn-process', () => this.handleEncode());

        // Decode Actions
        const inpScanFile = root.querySelector('#inp-scan-file');
        if(inpScanFile) inpScanFile.onchange = (e) => this.handleFileSelect(e);

        bind('#btn-execute-decode', () => this.executeDecode());

        bind('#btn-copy', () => {
            navigator.clipboard.writeText(this.state.decodedResult);
            this.sys.toast("Copied to clipboard", "success");
        });

        // Modal
        const modalPass = root.querySelector('#modal-pass');
        if(modalPass) modalPass.oninput = (e) => this.state.modalPassword = e.target.value;

        bind('#btn-unlock', () => this.handleUnlock());
        bind('#btn-cancel', () => { this.state.showUnlockModal = false; this.render(); });
    }
})