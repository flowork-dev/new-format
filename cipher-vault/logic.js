({
    state: {
        appName: 'cipher-vault',
        currentView: 'lander', // 'lander' | 'app'
        mode: 'encrypt', // 'encrypt' | 'decrypt'
        file: null,
        password: '',
        showPass: false,
        isProcessing: false,
        isDragging: false,
        processLog: '',

        // TEMA: DIUBAH KE CYBERPUNK BLUE VIBE
        themes: {
            dark: {
                '--bg-root': '#05050a',
                '--surface-1': 'rgba(10, 10, 30, 0.9)',
                '--surface-2': 'rgba(0, 85, 255, 0.1)',
                '--txt-high': '#00d2ff', // Wajib Biru Neon
                '--txt-med': '#0077ff',  // Biru Sedang
                '--prm': '#00d2ff',      // Primary Blue
                '--on-prm': '#050505',
                '--prm-container': 'rgba(0, 210, 255, 0.15)',
                '--error': '#0099ff',    // Error pun tetap Biru agar konsisten request
                '--on-error': '#050505',
                '--error-container': 'rgba(0, 153, 255, 0.2)',
                '--brd': '#00d2ff',
                '--shadow-sm': '0px 0px 10px rgba(0, 210, 255, 0.3)',
                '--shadow-md': '0px 0px 20px rgba(0, 210, 255, 0.5)'
            },
            light: {
                // Dibikin Biru juga agar tetap terlihat di mode apapun sesuai request
                '--bg-root': '#f0faff',
                '--surface-1': '#ffffff',
                '--surface-2': '#e6f3ff',
                '--txt-high': '#0055ff',
                '--txt-med': '#0077ff',
                '--prm': '#0055ff',
                '--on-prm': '#ffffff',
                '--prm-container': '#cce5ff',
                '--error': '#0044cc',
                '--on-error': '#ffffff',
                '--error-container': '#b3d7ff',
                '--brd': '#0055ff',
                '--shadow-sm': '0px 2px 4px rgba(0, 85, 255, 0.1)',
                '--shadow-md': '0px 4px 12px rgba(0, 85, 255, 0.2)'
            }
        }
    },

    sys: null,
    observer: null,

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_' + this.state.appName);
        if (hasVisited) { this.state.currentView = 'app'; }

        this.render();

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
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        let targetTheme = t;
        if (!this.state.themes[t]) targetTheme = 'dark';
        const theme = this.state.themes[targetTheme];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async processFile() {
        const { file, password, mode } = this.state;
        if (!file || !password) {
            this.sys.toast('Please select a file and enter a password.', 'error');
            return;
        }

        this.state.isProcessing = true;
        this.state.processLog = 'Initializing Crypto Engine...';
        this.render();

        try {
            this.state.processLog = 'Reading file stream...';
            this.render();
            const fileBuffer = await file.arrayBuffer();
            const passBuffer = new TextEncoder().encode(password);

            if (mode === 'encrypt') {
                this.state.processLog = 'Generating Salt & IV...';
                this.render();
                const salt = window.crypto.getRandomValues(new Uint8Array(16));
                const iv = window.crypto.getRandomValues(new Uint8Array(12));

                this.state.processLog = 'Deriving Key (PBKDF2)...';
                this.render();
                const keyMaterial = await window.crypto.subtle.importKey("raw", passBuffer, "PBKDF2", false, ["deriveKey"]);
                const key = await window.crypto.subtle.deriveKey(
                    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
                    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
                );

                this.state.processLog = 'Encrypting (AES-256-GCM)...';
                this.render();
                const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, fileBuffer);

                const finalBuffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
                finalBuffer.set(salt, 0);
                finalBuffer.set(iv, salt.byteLength);
                finalBuffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

                this.downloadBlob(new Blob([finalBuffer]), file.name + '.enc');
                this.sys.toast('File Encrypted Successfully!', 'success');

            } else {
                this.state.processLog = 'Parsing encrypted container...';
                this.render();
                if (fileBuffer.byteLength < 28) throw new Error("Invalid file format.");
                const salt = new Uint8Array(fileBuffer.slice(0, 16));
                const iv = new Uint8Array(fileBuffer.slice(16, 28));
                const data = new Uint8Array(fileBuffer.slice(28));

                this.state.processLog = 'Deriving Key & Authenticating...';
                this.render();
                const keyMaterial = await window.crypto.subtle.importKey("raw", passBuffer, "PBKDF2", false, ["deriveKey"]);
                const key = await window.crypto.subtle.deriveKey(
                    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
                    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
                );

                this.state.processLog = 'Decrypting data...';
                this.render();
                const decryptedContent = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);

                const originalName = file.name.replace('.enc', '');
                this.downloadBlob(new Blob([decryptedContent]), originalName);
                this.sys.toast('File Decrypted Successfully!', 'success');
            }
        } catch (e) {
            console.error(e);
            this.sys.toast('Operation Failed! Wrong password or corrupted file.', 'error');
        } finally {
            this.state.isProcessing = false;
            this.state.processLog = '';
            this.render();
            this.bindEvents();
        }
    },

    downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    },

    render() {
        const { currentView } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderApp();

        this.sys.root.innerHTML = `
            <div class="cipher-root no-scrollbar">
                ${content}
            </div>
            <style>
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .no-scrollbar::-webkit-scrollbar { display: none; }

                .cipher-root {
                    width: 100%; height: 100%;
                    background: var(--bg-root);
                    /* Cyberpunk Grid Background */
                    background-image: linear-gradient(rgba(0, 210, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0, 210, 255, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                    color: var(--txt-high);
                    font-family: 'Segoe UI', Roboto, sans-serif;
                    display: flex; flex-direction: column;
                    overflow-y: auto;
                }

                .container-app {
                    width: 100%;
                    padding: 20px;
                    display: flex; flex-direction: column; align-items: center;
                    flex-grow: 1;
                }

                /* Mobile Adjustment - Posisi lebih turun agar tidak kena header app */
                @media (max-width: 768px) {
                    .container-app {
                        padding-top: 80px; /* Jarak aman dari header OS */
                        justify-content: center;
                        min-height: 85vh;
                    }
                }

                .md-card {
                    background: var(--surface-1);
                    border-radius: 28px;
                    box-shadow: var(--shadow-sm);
                    padding: 24px;
                    width: 100%; max-width: 500px;
                    backdrop-filter: blur(15px);
                    border: 1px solid var(--brd);
                    transition: all 0.3s ease;
                }
                .md-card:hover { box-shadow: var(--shadow-md); border-color: var(--prm); }

                /* Wajib Biru untuk semua teks */
                .text-high { color: var(--txt-high) !important; text-shadow: 0 0 5px rgba(0, 210, 255, 0.3); }
                .text-med { color: var(--txt-med) !important; }
                .headline-small { font-size: 24px; font-weight: bold; line-height: 32px; letter-spacing: 1px; }
                .title-medium { font-size: 16px; font-weight: 600; }
                .body-medium { font-size: 14px; font-weight: 400; }
                .label-large { font-size: 12px; font-weight: bold; text-transform: uppercase; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                /* Material Buttons - Tetap Biru */
                .md-btn {
                    border: 1px solid var(--prm); font-family: inherit; cursor: pointer;
                    padding: 0 24px; height: 50px;
                    border-radius: 12px; font-weight: bold; font-size: 14px;
                    text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center;
                    transition: 0.2s; background: rgba(0, 210, 255, 0.1);
                    color: var(--prm) !important;
                }
                .md-btn-filled {
                    background: var(--prm); color: #000 !important;
                    box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
                }
                .md-btn-filled:hover { box-shadow: 0 0 25px rgba(0, 210, 255, 0.6); }
                .md-btn:disabled { opacity: 0.3; cursor: not-allowed; }

                /* Form Input - Teks Wajib Biru saat mengetik */
                .md-input-field {
                    background: var(--surface-2);
                    border-radius: 12px;
                    border: 1px solid var(--txt-med);
                    padding: 12px 16px; transition: 0.2s;
                }
                .md-input-field:focus-within { border-color: var(--prm); box-shadow: 0 0 10px rgba(0, 210, 255, 0.2); }
                .md-input {
                    background: transparent; border: none; outline: none;
                    color: var(--txt-high) !important; /* Biru saat mengetik */
                    font-size: 16px; width: 100%; font-weight: bold;
                }
                .md-input::placeholder { color: var(--txt-med); opacity: 0.5; }

                /* Tab Styles */
                .tab-btn {
                    flex: 1; background: none; border: none; padding: 16px;
                    font-family: inherit; font-size: 13px; font-weight: bold;
                    color: var(--txt-med); cursor: pointer; border-bottom: 2px solid transparent;
                    transition: 0.2s;
                }
                .tab-btn.active { color: var(--prm); border-bottom-color: var(--prm); background: rgba(0, 210, 255, 0.05); }

                svg { fill: var(--prm); }

                @media (min-width: 768px) {
                    .cipher-root { align-items: center; justify-content: center; overflow: hidden; }
                    .container-app { flex-grow: 0; }
                }
            </style>
        `;

        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="container-app" style="justify-content: center;">
                <div class="md-card fade-in" style="text-align: center;">
                    <div style="margin-bottom: 24px;">
                        <svg width="64" height="64" viewBox="0 0 24 24"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,11.94L10.28,10.22C10.58,9.93 10.75,9.53 10.75,9.09C10.75,8.2 10.03,7.47 9.14,7.47C8.25,7.47 7.53,8.2 7.53,9.09C7.53,9.98 8.25,10.7 9.14,10.7C9.58,10.7 9.98,10.53 10.28,10.22L12,11.94M12,16.5L9.46,13.96C10.13,13.16 10.5,12.11 10.5,11C10.5,9.89 10.13,8.84 9.46,8.04L12,5.5L14.54,8.04C13.87,8.84 13.5,9.89 13.5,11C13.5,12.11 13.87,13.16 14.54,13.96L12,16.5Z" /></svg>
                    </div>
                    <h1 class="headline-small text-high" style="margin-bottom: 16px;">Cipher Vault</h1>
                    <p class="body-medium text-med" style="margin-bottom: 32px; line-height: 1.6;">
                        Secure your sensitive files with military-grade AES-256 encryption. Client-side processing. Zero-knowledge.
                    </p>
                    <button id="btn-launch" class="md-btn md-btn-filled" style="width: 100%;">Initialize System</button>
                </div>
            </div>
        `;
    },

    renderApp() {
        const { mode, file, password, showPass, isDragging, isProcessing, processLog } = this.state;
        const isEnc = mode === 'encrypt';

        return `
            <div class="container-app">
                <div class="md-card fade-in" style="padding: 0; overflow: hidden;">
                    <div style="display: flex; background: rgba(0,0,0,0.2);">
                        <button id="mode-enc" class="tab-btn ${isEnc ? 'active' : ''}">ENCRYPT</button>
                        <button id="mode-dec" class="tab-btn ${!isEnc ? 'active' : ''}">DECRYPT</button>
                    </div>

                    <div style="padding: 24px;">
                        <div id="drop-zone" class="md-drop-zone ${isDragging ? 'dragging' : ''}" style="border: 2px dashed var(--prm); border-radius: 16px; padding: 30px; text-align: center; background: rgba(0, 210, 255, 0.05); cursor: pointer;">
                            ${file ? `
                                <div style="display: flex; align-items: center; gap: 16px; text-align: left;">
                                    <svg width="32" height="32" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" /></svg>
                                    <div style="flex-grow: 1; overflow: hidden;">
                                        <div class="title-medium text-high" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
                                        <div class="body-medium text-med">${this.formatSize(file.size)}</div>
                                    </div>
                                    <button id="btn-clear-file" style="background: none; border: none; color: var(--error); cursor: pointer; font-weight: bold;">[X]</button>
                                </div>
                            ` : `
                                <div style="color: var(--txt-med);">
                                    <svg width="40" height="40" viewBox="0 0 24 24" style="margin-bottom: 12px; opacity: 0.6;"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,12L8,16H11V18H13V16H16L12,12Z" /></svg>
                                    <div class="title-medium text-high">Select File</div>
                                    <div class="body-medium">Tap to browse or drop here</div>
                                </div>
                            `}
                            <input type="file" id="inp-file" style="display: none;">
                        </div>

                        <div style="margin-top: 24px;">
                            <div class="md-input-field">
                                <label class="label-large text-med" style="display: block; margin-bottom: 6px;">Access Key</label>
                                <div style="display: flex; align-items: center;">
                                    <input id="inp-pass" type="${showPass ? 'text' : 'password'}" class="md-input" value="${password}" placeholder="Enter passphrase...">
                                    <button id="btn-toggle-pass" style="background: none; border: none; color: var(--prm); cursor: pointer; padding: 5px;">
                                        ${showPass ? 'HIDE' : 'SHOW'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 30px;">
                            <button id="btn-run" class="md-btn md-btn-filled" style="width: 100%;" ${(!file || !password || isProcessing) ? 'disabled' : ''}>
                                ${isProcessing ? `WORKING...` : (isEnc ? 'ENCRYPT NOW' : 'DECRYPT NOW')}
                            </button>
                            ${isProcessing ? `<div class="body-medium text-med" style="text-align: center; margin-top: 15px; font-family: monospace;">> ${processLog}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        const $ = (sel) => root.querySelector(sel);
        const $$ = (sel) => root.querySelectorAll(sel);

        $$('button, input').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        if (this.state.currentView === 'lander') {
            const btn = $('#btn-launch');
            if(btn) btn.onclick = () => {
                localStorage.setItem('app_visited_' + this.state.appName, 'true');
                this.state.currentView = 'app';
                this.render();
            };
        } else {
            const modeEnc = $('#mode-enc'); if(modeEnc) modeEnc.onclick = () => { this.state.mode = 'encrypt'; this.render(); };
            const modeDec = $('#mode-dec'); if(modeDec) modeDec.onclick = () => { this.state.mode = 'decrypt'; this.render(); };

            const dropZone = $('#drop-zone');
            const fileInput = $('#inp-file');

            if(dropZone) dropZone.onclick = (e) => { if(!e.target.closest('#btn-clear-file')) fileInput.click(); };
            if(fileInput) fileInput.onchange = (e) => { if (e.target.files[0]) { this.state.file = e.target.files[0]; this.render(); } };

            const btnClear = $('#btn-clear-file');
            if (btnClear) btnClear.onclick = (e) => { e.stopPropagation(); this.state.file = null; this.render(); };

            const inpPass = $('#inp-pass');
            if (inpPass) inpPass.oninput = (e) => this.state.password = e.target.value;

            const togglePass = $('#btn-toggle-pass');
            if(togglePass) togglePass.onclick = () => { this.state.showPass = !this.state.showPass; this.render(); };

            const btnRun = $('#btn-run');
            if(btnRun) btnRun.onclick = () => this.processFile();
        }
    }
})