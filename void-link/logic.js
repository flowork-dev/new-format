({
    state: {
        // --- APP STATE ---
        isFirstVisit: true,
        currentView: 'lander', // 'lander', 'sender', 'receiver'
        isLoading: true,
        loadingMessage: 'Initializing Neural Uplink...',
        libsLoaded: false,

        // --- SCANNER STATE ---
        isScanning: false,
        html5QrCode: null,
        scannedResult: null,

        // --- GENERATOR STATE ---
        qrInstance: null,

        // --- P2P LOGIC STATE ---
        role: null, // 'sender' | 'receiver'
        myPeerId: null,
        targetPeerId: '',
        connection: null,
        file: null,
        transferProgress: 0,
        transferStatus: 'idle', // idle, connecting, waiting, transferring, completed, error
        receivedChunks: [],
        receivedSize: 0,
        expectedSize: 0,
        expectedName: '',
        expectedType: ''
    },

    sys: null,
    observer: null,
    peer: null,

    // --- THEME ENGINE (GOLDEN PATTERN) ---
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8', // Sky Blue
            '--prm-glow': '0 0 20px rgba(56, 189, 248, 0.2)',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            // INPUT SPECIFIC (FIX LIGHT MODE)
            '--input-bg': 'rgba(0, 0, 0, 0.3)',
            '--input-txt': '#ffffff'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb', // Deep Blue
            '--prm-glow': '0 0 15px rgba(37, 99, 235, 0.15)',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            // INPUT SPECIFIC (FIX LIGHT MODE)
            '--input-bg': 'rgba(255, 255, 255, 1)',
            '--input-txt': '#000000'
        }
    },

    // --- LIFECYCLE ---

    async mount(sys) {
        this.sys = sys;

        const hasVisited = localStorage.getItem('app_visited_void_link');
        if (hasVisited) {
            this.state.isFirstVisit = false;
        } else {
            localStorage.setItem('app_visited_void_link', 'true');
        }

        this.render();
        await this.loadDependencies();

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
        this.stopScanner();
        if (this.peer) { this.peer.destroy(); this.peer = null; }
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    async loadDependencies() {
        const load = (url) => new Promise((resolve, reject) => {
            if (url.includes('peerjs') && window.Peer) return resolve();
            if (url.includes('qr-code-styling') && window.QRCodeStyling) return resolve();
            if (url.includes('html5-qrcode') && window.Html5Qrcode) return resolve();

            const s = document.createElement('script');
            s.src = url;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });

        try {
            await Promise.all([
                load('https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'),
                load('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js'),
                load('https://unpkg.com/html5-qrcode')
            ]);

            this.state.libsLoaded = true;
            this.state.isLoading = false;
            this.render();
        } catch (e) {
            this.state.loadingMessage = "Connection Failed. Libraries unmatched.";
            this.render();
        }
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    // --- P2P & LOGIC CORE ---

    initPeer(role) {
        if (!window.Peer) return;

        this.state.role = role;
        this.state.transferStatus = 'connecting';
        this.render();

        if (this.peer) this.peer.destroy();

        this.peer = new Peer(null, { debug: 1 });

        this.peer.on('open', (id) => {
            this.state.myPeerId = id;
            if (role === 'sender') {
                this.state.currentView = 'sender';
                this.state.transferStatus = 'waiting';
            } else {
                this.state.currentView = 'receiver';
                this.state.transferStatus = 'idle';
            }
            this.render();
        });

        this.peer.on('connection', (conn) => {
            this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
            if(this.sys.toast) this.sys.toast("Network Error: " + err.type, 'error');
            this.state.transferStatus = 'error';
            this.render();
        });
    },

    handleConnection(conn) {
        this.state.connection = conn;
        this.state.transferStatus = 'connected';
        this.render();

        conn.on('open', () => {
            if (this.state.role === 'sender' && this.state.file) {
                this.sendFile();
            }
        });

        conn.on('data', (data) => this.handleData(data));

        conn.on('close', () => {
            if (this.state.transferStatus !== 'completed') {
                this.state.transferStatus = 'error';
                this.render();
            }
        });
    },

    connectToPeer() {
        if (!this.state.targetPeerId || !this.peer) return;
        this.state.transferStatus = 'connecting';
        this.render();

        const conn = this.peer.connect(this.state.targetPeerId);
        this.handleConnection(conn);
    },

    sendFile() {
        const { connection: conn, file } = this.state;
        if (!conn || !file) return;

        this.state.transferStatus = 'transferring';
        this.render();

        // 1. Send Metadata
        conn.send({ type: 'meta', name: file.name, size: file.size, mime: file.type });

        // 2. Chunking
        const chunkSize = 16384;
        let offset = 0;

        const readSlice = (o) => {
            const slice = file.slice(offset, o + chunkSize);
            const reader = new FileReader();

            reader.onload = (e) => {
                if (!conn.open) return;
                conn.send(e.target.result);
                offset += chunkSize;

                this.state.transferProgress = Math.min(100, Math.round((offset / file.size) * 100));
                this.updateProgressBar();

                if (offset < file.size) {
                    requestAnimationFrame(() => readSlice(offset));
                } else {
                    this.state.transferStatus = 'completed';
                    conn.send({ type: 'end' });
                    this.render();
                }
            };
            reader.readAsArrayBuffer(slice);
        };
        readSlice(0);
    },

    handleData(data) {
        if (data.type === 'meta') {
            this.state.expectedName = data.name;
            this.state.expectedSize = data.size;
            this.state.expectedType = data.mime;
            this.state.receivedChunks = [];
            this.state.receivedSize = 0;
            this.state.transferStatus = 'transferring';
            this.render();
        } else if (data.type === 'end') {
            this.saveFile();
        } else {
            this.state.receivedChunks.push(data);
            this.state.receivedSize += data.byteLength;

            if (this.state.expectedSize > 0) {
                this.state.transferProgress = Math.min(100, Math.round((this.state.receivedSize / this.state.expectedSize) * 100));
                this.updateProgressBar();
            }
        }
    },

    saveFile() {
        this.state.transferStatus = 'completed';
        this.render();

        try {
            const blob = new Blob(this.state.receivedChunks, { type: this.state.expectedType });

            if (this.sys && typeof this.sys.download === 'function') {
                if(this.sys.toast) this.sys.toast("Saving file to device...", "info");
                this.sys.download(blob, this.state.expectedName, this.state.expectedType);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.state.expectedName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                if(this.sys.toast) this.sys.toast("File downloaded successfully!", "success");
            }
        } catch(e) {
            if(this.sys.toast) this.sys.toast("Error saving file: " + e.message, 'error');
        }
    },

    updateQR() {
        const tgt = this.sys.root.querySelector('#qrcode');
        if (!tgt || !this.state.myPeerId || !window.QRCodeStyling) return;

        if (!this.state.qrInstance) {
            const prmColor = getComputedStyle(this.sys.root).getPropertyValue('--prm').trim() || '#38bdf8';
            this.state.qrInstance = new QRCodeStyling({
                width: 200, height: 200, type: "svg",
                data: this.state.myPeerId,
                qrOptions: { errorCorrectionLevel: 'M' },
                dotsOptions: { color: "#000000", type: "rounded" },
                backgroundOptions: { color: "#ffffff" },
                cornersSquareOptions: { color: prmColor, type: "extra-rounded" },
                imageOptions: { margin: 5 }
            });
        } else {
            this.state.qrInstance.update({ data: this.state.myPeerId });
        }
        tgt.innerHTML = '';
        this.state.qrInstance.append(tgt);
    },

    async startScanner() {
        if (!window.Html5Qrcode) return;
        this.state.isScanning = true;
        this.render();

        setTimeout(async () => {
            const readerEl = this.sys.root.querySelector('#reader');
            if(!readerEl) return;

            if(this.state.html5QrCode) {
                 try { await this.state.html5QrCode.stop(); } catch(e){}
            }

            this.state.html5QrCode = new Html5Qrcode("reader");
            const config = { fps: 15, qrbox: { width: 220, height: 220 } };

            const onSuccess = (decodedText) => {
                this.state.targetPeerId = decodedText;
                this.stopScanner();
                this.connectToPeer();
                if(this.sys.toast) this.sys.toast("Target Found!", "success");
            };

            try {
                await this.state.html5QrCode.start({ facingMode: "environment" }, config, onSuccess, () => {});
            } catch (err) {
                try {
                    await this.state.html5QrCode.start({ facingMode: "user" }, config, onSuccess, () => {});
                } catch(e) {
                    this.state.isScanning = false;
                    this.render();
                    if(this.sys.toast) this.sys.toast("Camera Access Denied", "error");
                }
            }
        }, 100);
    },

    async stopScanner() {
        if (this.state.html5QrCode) {
            try { await this.state.html5QrCode.stop(); } catch(e) {}
            this.state.html5QrCode = null;
        }
        this.state.isScanning = false;
        this.render();
    },

    // --- RENDERERS ---

    render() {
        const { currentView, isLoading, loadingMessage } = this.state;
        let content = '';

        if (isLoading) content = this.renderLoader(loadingMessage);
        else if (currentView === 'lander') content = this.renderLander();
        else if (currentView === 'sender') content = this.renderSender();
        else if (currentView === 'receiver') content = this.renderReceiver();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
                    overflow-y: scroll;
                    overflow-x: hidden;
                    /* CENTER LAYOUT SYSTEM */
                    display: flex;
                    flex-direction: column;
                    justify-content: center; /* Center Vertical */
                    align-items: center;     /* Center Horizontal */
                    padding-bottom: 20px;

                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; width: 0; background: transparent; }

                .content-limit {
                    width: 100%; max-width: 1020px;
                    margin: 0 auto; padding: 20px;
                    display: flex; flex-direction: column; align-items: center;
                    box-sizing: border-box;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 24px;
                    padding: 30px;
                    width: 100%; max-width: 500px;
                    box-shadow: var(--shadow);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                h1 {
                    font-size: 32px; font-weight: 800; margin-bottom: 8px;
                    background: linear-gradient(135deg, var(--prm), #a855f7);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                h2 { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: var(--txt); }
                p { color: var(--txt-dim); font-size: 14px; line-height: 1.5; margin-bottom: 30px; }

                /* BUTTONS */
                .btn {
                    width: 100%; height: 50px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    background: var(--prm); color: #fff;
                    border: none; border-radius: 14px;
                    font-weight: 700; font-size: 14px; letter-spacing: 0.5px;
                    cursor: pointer; transition: all 0.2s;
                    box-shadow: var(--prm-glow);
                }
                .btn:active { transform: scale(0.98); }
                .btn.secondary {
                    background: var(--surface); color: var(--txt);
                    border: 1px solid var(--glass-border);
                    box-shadow: none;
                }
                .btn.danger { background: rgba(239, 68, 68, 0.15); color: var(--err); border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: none; }

                .btn-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; }

                /* INPUTS & DROPZONES */
                .drop-zone {
                    border: 2px dashed var(--glass-border); border-radius: 18px;
                    padding: 40px 20px; margin-bottom: 20px;
                    background: var(--surface);
                    cursor: pointer; transition: 0.2s;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                }
                .drop-zone:hover { border-color: var(--prm); background: rgba(56, 189, 248, 0.05); }

                /* FIXED INPUT COLOR FOR LIGHT MODE */
                input[type="text"] {
                    width: 100%;
                    background: var(--input-bg) !important;
                    color: var(--input-txt) !important;
                    border: 1px solid var(--glass-border);
                    padding: 14px; border-radius: 12px;
                    font-family: monospace; text-align: center;
                    outline: none; margin-bottom: 15px;
                }
                input[type="text"]:focus { border-color: var(--prm); }

                /* UTILS */
                .badge {
                    display: inline-block; padding: 4px 12px; border-radius: 20px;
                    font-size: 11px; font-weight: 800; margin-bottom: 15px;
                    background: var(--surface); border: 1px solid var(--glass-border);
                    letter-spacing: 1px;
                }

                .progress-wrap { width: 100%; background: var(--surface); height: 8px; border-radius: 4px; overflow: hidden; margin: 20px 0 10px 0; }
                .progress-bar { height: 100%; background: var(--prm); width: 0%; transition: width 0.2s; }

                #qrcode {
                    background: white; padding: 10px; border-radius: 16px;
                    display: inline-block; margin-bottom: 15px;
                }

                #reader {
                    width: 100%; aspect-ratio: 1; border-radius: 16px; overflow: hidden;
                    background: #000; margin-bottom: 20px; border: 1px solid var(--glass-border);
                }

                .code-box {
                    font-family: monospace; background: var(--surface);
                    padding: 10px; border-radius: 8px; cursor: pointer;
                    word-break: break-all; font-size: 12px; color: var(--prm);
                }

                .fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                @media (max-width: 600px) {
                    .btn-group { grid-template-columns: 1fr; }
                    .content-limit { padding: 10px; }
                }
            </style>
        `;

        this.bindEvents();

        if (currentView === 'sender' && this.state.myPeerId) {
            setTimeout(() => this.updateQR(), 50);
        }
    },

    renderLoader(msg) {
        return `
            <div class="glass-panel">
                <div style="font-size: 40px; margin-bottom: 20px; display: inline-block; animation: spin 1s infinite linear;">🌀</div>
                <h2>System Initializing</h2>
                <p>${msg}</p>
            </div>
        `;
    },

    renderLander() {
        return `
            <div class="glass-panel">
                <div style="font-size: 48px; margin-bottom: 15px;">📡</div>
                <h1>VOID LINK</h1>
                <p>Secure, peer-to-peer file transfer.<br>Direct connection. No cloud storage.</p>

                <div class="btn-group">
                    <button id="btn-sender" class="btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        SEND FILE
                    </button>
                    <button id="btn-receiver" class="btn secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        RECEIVE
                    </button>
                </div>
            </div>
        `;
    },

    renderSender() {
        const { myPeerId, transferStatus, file, transferProgress } = this.state;
        const isWaiting = transferStatus === 'waiting';
        const isTransferring = transferStatus === 'transferring';
        const isCompleted = transferStatus === 'completed';

        return `
            <div class="glass-panel">
                <div class="badge" style="color: ${isWaiting ? 'var(--txt-dim)' : 'var(--prm)'}">
                    ${isWaiting ? 'AWAITING PEER' : transferStatus.toUpperCase()}
                </div>

                ${!file ? `
                    <div id="drop-zone" class="drop-zone">
                        <div style="font-size: 32px; margin-bottom: 10px; opacity: 0.7;">📁</div>
                        <span style="font-weight: 600;">Tap to select file</span>
                        <span style="font-size: 12px; opacity: 0.6;">or drag & drop here</span>
                        <input type="file" id="file-input" style="display: none;">
                    </div>
                ` : ''}
                ${(file && myPeerId && !isCompleted) ? `
                    <p style="margin-bottom: 5px; font-size:12px;">Sending: <strong>${file.name}</strong></p>
                    <div id="qrcode"></div>
                    <div class="code-box" id="copy-id" title="Click to copy">${myPeerId}</div>
                ` : ''}

                ${isTransferring ? `
                    <div class="progress-wrap"><div id="p-bar" class="progress-bar" style="width: ${transferProgress}%"></div></div>
                    <div style="text-align: right; font-size: 12px; font-weight: bold;">${transferProgress}%</div>
                ` : ''}

                ${isCompleted ? `<h2 style="color: var(--scs); margin-top: 20px;">Transfer Successful!</h2>` : ''}

                <div style="margin-top: 30px;">
                    <button id="btn-back" class="btn secondary">CANCEL / BACK</button>
                </div>
            </div>
        `;
    },

    renderReceiver() {
        const { transferStatus, expectedName, isScanning } = this.state;
        const isConnected = ['connected', 'transferring', 'completed'].includes(transferStatus);

        return `
            <div class="glass-panel">
                <div class="badge">RECEIVER MODE</div>

                ${!isConnected ? `
                    ${isScanning ? `
                        <div id="reader"></div>
                        <button id="btn-stop-scan" class="btn danger" style="margin-bottom: 20px;">STOP CAMERA</button>
                    ` : `
                        <button id="btn-scan" class="btn" style="margin-bottom: 20px; background: var(--prm); color: #fff; box-shadow: 0 0 15px var(--prm);">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            SCAN QR CODE
                        </button>

                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; opacity:0.5;">
                            <div style="flex:1; height:1px; background:var(--txt-dim);"></div>
                            <span style="font-size:11px; font-weight:bold;">OR MANUAL ENTRY</span>
                            <div style="flex:1; height:1px; background:var(--txt-dim);"></div>
                        </div>

                        <input type="text" id="target-id" placeholder="Paste Sender ID..." value="${this.state.targetPeerId}">
                        <button id="btn-connect" class="btn secondary">CONNECT PEER</button>
                    `}
                ` : `
                    <div style="background: var(--surface); padding: 20px; border-radius: 16px; margin-bottom: 20px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">⬇️</div>
                        <h3 style="margin: 0; color: var(--txt);">${expectedName || 'Establishing Link...'}</h3>
                        <p style="margin: 5px 0 0 0; font-size: 12px;">${transferStatus === 'completed' ? 'Saved to Device' : 'Receiving Data...'}</p>
                    </div>

                    ${transferStatus === 'transferring' ? `
                        <div class="progress-wrap"><div id="p-bar" class="progress-bar" style="width: ${this.state.transferProgress}%"></div></div>
                        <div style="text-align: right; font-size: 12px; font-weight: bold;">${this.state.transferProgress}%</div>
                    ` : ''}
                `}

                <div style="margin-top: 30px;">
                    <button id="btn-back" class="btn secondary">BACK</button>
                </div>
            </div>
        `;
    },

    updateProgressBar() {
        const bar = this.sys.root.querySelector('#p-bar');
        if (bar) bar.style.width = this.state.transferProgress + '%';
    },

    bindEvents() {
        const root = this.sys.root;
        const $ = (sel) => root.querySelector(sel);
        const stop = (e) => e.stopPropagation();

        root.querySelectorAll('button, input, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', stop);
            el.addEventListener('touchstart', stop);
        });

        if ($('#btn-sender')) $('#btn-sender').onclick = () => this.initPeer('sender');
        if ($('#btn-receiver')) $('#btn-receiver').onclick = () => this.initPeer('receiver');

        if ($('#btn-back')) $('#btn-back').onclick = () => {
            this.stopScanner();
            if (this.peer) { this.peer.destroy(); this.peer = null; }
            this.state.currentView = 'lander';
            this.state.file = null;
            this.state.qrInstance = null;
            this.state.transferStatus = 'idle';
            this.state.isScanning = false;
            this.render();
        };

        if ($('#drop-zone')) {
            const dz = $('#drop-zone');
            const inp = $('#file-input');
            dz.onclick = () => inp.click();
            inp.onchange = (e) => { if (e.target.files.length) { this.state.file = e.target.files[0]; this.render(); }};
            dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = 'var(--prm)'; };
            dz.ondragleave = (e) => { e.preventDefault(); dz.style.borderColor = 'var(--glass-border)'; };
            dz.ondrop = (e) => { e.preventDefault(); if (e.dataTransfer.files.length) { this.state.file = e.dataTransfer.files[0]; this.render(); }};
        }

        if ($('#copy-id')) $('#copy-id').onclick = () => {
            navigator.clipboard.writeText(this.state.myPeerId);
            if(this.sys.toast) this.sys.toast('ID Copied to Clipboard', 'success');
        };

        if ($('#target-id')) $('#target-id').oninput = (e) => this.state.targetPeerId = e.target.value.trim();
        if ($('#btn-connect')) $('#btn-connect').onclick = () => this.connectToPeer();

        if ($('#btn-scan')) $('#btn-scan').onclick = () => this.startScanner();
        if ($('#btn-stop-scan')) $('#btn-stop-scan').onclick = () => this.stopScanner();
    }
})