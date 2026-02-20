({
    state: {
        appName: 'vc_no_header',
        tab: 'encrypt', // encrypt | decrypt
        loading: false,
        loadingPercent: 0,

        // Data State
        msgInput: '',
        password: '',
        layerA: null,
        layerB: null,
        resA: null,
        resB: null,
        resDecText: ''
    },

    sys: null,
    observer: null,

    // TEMA (Updated to Cyberpunk & Blue Text Only)
    themes: {
        dark: {
            // '--bg-root': 'transparent',
            '--bg-root': '#0d0221', /* Deep Cyberpunk Purple */
            // '--glass': 'rgba(15, 23, 42, 0.9)',
            '--glass': 'rgba(13, 2, 33, 0.8)',
            // '--surface-2': 'rgba(30, 41, 59, 0.95)',
            '--surface-2': 'rgba(26, 26, 46, 0.95)',
            // '--txt': '#f1f5f9',
            '--txt': '#00d9ff', /* Neon Blue */
            // '--txt-sec': '#94a3b8',
            '--txt-sec': '#0084ff', /* Royal Blue */
            // '--prm': '#38bdf8',
            '--prm': '#00d9ff',
            // '--prm-txt': '#0f172a',
            '--prm-txt': '#0d0221',
            '--acc': '#f472b6',
            // '--brd': 'rgba(255, 255, 255, 0.1)',
            '--brd': '#00d9ff44',
            // '--input-bg': 'rgba(2, 6, 23, 0.6)',
            '--input-bg': '#020617',
            '--shadow': '0 0 20px rgba(0, 217, 255, 0.3)'
        },
        light: {
            // Tema Light juga dipaksa Biru agar tetap terbaca sesuai request
            // '--bg-root': 'transparent',
            '--bg-root': '#e0f2fe', /* Light Cyberpunk Blue */
            // '--glass': 'rgba(255, 255, 255, 0.9)',
            '--glass': 'rgba(224, 242, 254, 0.9)',
            // '--surface-2': 'rgba(241, 245, 249, 0.95)',
            '--surface-2': '#bae6fd',
            // '--txt': '#0f172a',
            '--txt': '#1e40af', /* Deep Blue */
            // '--txt-sec': '#64748b',
            '--txt-sec': '#3b82f6',
            '--prm': '#2563eb',
            '--prm-txt': '#ffffff',
            '--acc': '#ef4444',
            '--brd': 'rgba(37, 99, 235, 0.2)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',
            '--shadow': '0 10px 15px -3px rgba(30, 58, 138, 0.2)'
        },
        hacker: {
            // '--bg-root': 'transparent',
            '--bg-root': '#000500',
            '--glass': 'rgba(0, 10, 0, 0.9)',
            '--surface-2': 'rgba(0, 20, 0, 0.95)',
            // '--txt': '#00ff00',
            '--txt': '#00d9ff', /* Force Blue even in hacker mode */
            // '--txt-sec': '#008f00',
            '--txt-sec': '#005f73',
            '--prm': '#00d9ff',
            '--prm-txt': '#000000',
            '--acc': '#ff0000',
            '--brd': '#004488',
            '--input-bg': '#000000',
            '--shadow': '0 0 20px rgba(0, 217, 255, 0.2)'
        }
    },

    mount(sys) {
        this.sys = sys;
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

        if (document.documentElement) {
            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

        this.bindEvents();
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

    // --- LOGIC FUNCTIONS ---

    switchTab(tab) {
        this.state.tab = tab;
        this.state.resA = null; this.state.resB = null; this.state.resDecText = '';
        this.render();
        this.bindEvents();
    },

    handleFile(file, layer) {
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.state[layer] = img;
                this.render();
                this.bindEvents();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    applyCipher(text, pass) {
        if (!pass || pass.length === 0) return text;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length);
            result += String.fromCharCode(code);
        }
        return result;
    },

    async runProcess(type) {
        if (type === 'enc' && !this.state.msgInput) return this.sys.toast("Enter a message first!");
        if (type === 'dec' && (!this.state.layerA || !this.state.layerB)) return this.sys.toast("Both Layer A and B are needed!");

        this.state.loading = true;
        this.state.loadingPercent = 0;
        this.render();

        let p = 0;
        const intv = setInterval(() => {
            p += 5;
            this.state.loadingPercent = p;
            const bar = this.sys.root.querySelector('.progress-fill');
            if(bar) bar.style.width = p + '%';

            if (p >= 100) {
                clearInterval(intv);
                setTimeout(() => {
                   if(type === 'enc') this.encryptData();
                   else this.decryptData();
                   this.state.loading = false;
                   this.render();
                   this.bindEvents();
                }, 200);
            }
        }, 20);
    },

    encryptData() {
        try {
            const W=400; const H=400;
            let txt = this.state.msgInput;
            if(this.state.password) txt = this.applyCipher(txt, this.state.password);

            const cA=document.createElement('canvas'); cA.width=W; cA.height=H; const ctxA=cA.getContext('2d');
            const cB=document.createElement('canvas'); cB.width=W; cB.height=H; const ctxB=cB.getContext('2d');
            const iA = ctxA.createImageData(W, H); const iB = ctxB.createImageData(W, H);

            for (let i = 0; i < iA.data.length; i += 4) {
                const charIndex = i / 4;
                const noise = Math.floor(Math.random() * 255);
                iA.data[i] = noise; iA.data[i+1] = Math.random()*255; iA.data[i+2] = Math.random()*255; iA.data[i+3] = 255;

                if (charIndex < txt.length) {
                    iB.data[i] = (noise + txt.charCodeAt(charIndex)) % 255;
                } else if (charIndex === txt.length) {
                    iB.data[i] = (noise + 0) % 255;
                } else {
                    iB.data[i] = Math.floor(Math.random() * 255);
                }
                iB.data[i+1] = iA.data[i+1]; iB.data[i+2] = iA.data[i+2]; iB.data[i+3] = 255;
            }
            ctxA.putImageData(iA, 0, 0); ctxB.putImageData(iB, 0, 0);
            this.state.resA = cA.toDataURL(); this.state.resB = cB.toDataURL();
        } catch(e) { this.sys.alert(e.message); }
    },

    decryptData() {
        try {
            const W=400; const H=400;
            const cA=document.createElement('canvas'); cA.width=W; cA.height=H; const ctxA=cA.getContext('2d');
            const cB=document.createElement('canvas'); cB.width=W; cB.height=H; const ctxB=cB.getContext('2d');
            ctxA.drawImage(this.state.layerA, 0, 0, W, H); ctxB.drawImage(this.state.layerB, 0, 0, W, H);
            const dA = ctxA.getImageData(0, 0, W, H).data; const dB = ctxB.getImageData(0, 0, W, H).data;

            let result = "";
            for (let i = 0; i < dA.length; i += 4) {
                let diff = (dB[i] - dA[i]);
                if (diff < 0) diff += 255;
                if (diff === 0) break;
                result += String.fromCharCode(diff);
                if (result.length > 50000) break;
            }
            if(this.state.password) result = this.applyCipher(result, this.state.password);
            this.state.resDecText = result || "NO HIDDEN DATA FOUND.";
        } catch(e) { this.sys.alert("Image dimensions do not match!"); }
    },

    copyResult() {
        const el = this.sys.root.querySelector('#final-text');
        if(el) {
            el.select();
            navigator.clipboard.writeText(el.value);
            this.sys.toast("COPIED TO CLIPBOARD");
        }
    },

    // --- RENDER FUNCTIONS ---

    render() {
        const s = this.state;
        const isEnc = s.tab === 'encrypt';
        const content = s.loading ? this.renderLoading() : (isEnc ? this.renderEncrypt() : this.renderDecrypt());

        this.sys.root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;
                }

                /* MOBILE GAP 85PX HEADER & FOOTER */
                @media (max-width: 768px) {
                    .app-root {
                        padding-top: 85px !important;
                        padding-bottom: 85px !important;
                    }
                }

                /* Layout Utilities */
                .container {
                    max-width: 800px; margin: 0 auto; width: 100%;
                    padding: 24px 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column;
                }
                .scroll-content {
                    /* padding-bottom: 120px !important; */
                    padding-bottom: 20px !important;
                }

                /* Components */
                .card {
                    background: var(--surface-2); border: 1px solid var(--brd);
                    border-radius: 24px; padding: 24px; margin-bottom: 24px;
                    box-shadow: var(--shadow);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                }

                .input-group { margin-bottom: 20px; }
                .input-label { display: block; font-size: 12px; font-weight: 700; color: var(--txt-sec); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

                .input-field {
                    width: 100%; box-sizing: border-box;
                    background: var(--input-bg); border: 1px solid var(--brd);
                    /* color: var(--txt); */
                    color: #00d9ff !important; /* BLUE TYPING MANDATORY */
                    border-radius: 16px; padding: 16px;
                    font-family: 'JetBrains Mono', monospace; font-size: 14px;
                    outline: none; transition: 0.2s;
                }
                .input-field::placeholder { color: var(--txt-sec); opacity: 0.6; }
                .input-field:focus { border-color: var(--prm); box-shadow: 0 0 10px rgba(0, 217, 255, 0.4); }

                .btn {
                    border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 15px; border-radius: 16px;
                    transition: 0.2s; gap: 8px;
                }
                .btn:active { transform: scale(0.96); }
                .btn-prm { background: var(--prm); color: var(--prm-txt); padding: 18px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .btn-sec { background: transparent; border: 1px solid var(--brd); color: var(--txt); padding: 12px 24px; }
                .btn-block { width: 100%; }

                /* Tab Switcher - MOVED LOWER */
                .tabs {
                    display: flex; background: var(--surface-2); padding: 6px;
                    border-radius: 100px; border: 1px solid var(--brd);
                    margin-bottom: 24px;
                    margin-top: 40px; /* TAB KURANG KE BAWAH REQUEST */
                }
                .tab-item {
                    flex: 1; text-align: center; padding: 12px;
                    border-radius: 100px; font-weight: 600; font-size: 14px;
                    cursor: pointer; color: var(--txt-sec); transition: 0.3s;
                }
                .tab-item.active { background: var(--prm); color: var(--prm-txt); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

                /* File Upload */
                .file-drop {
                    border: 2px dashed var(--brd); border-radius: 20px;
                    height: 120px; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    position: relative; background: rgba(0,0,0,0.1);
                    transition: 0.2s;
                }
                .file-drop.has-file { border-style: solid; border-color: var(--prm); background: rgba(56, 189, 248, 0.1); }
                .file-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

                /* Progress */
                .progress-bar { height: 6px; background: var(--brd); border-radius: 4px; overflow: hidden; margin: 20px 0; }
                .progress-fill { height: 100%; background: var(--prm); width: 0%; transition: width 0.1s linear; }

                /* Icons/Text forcing blue */
                h3 { color: var(--prm) !important; }

                /* Animations */
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>

            <div class="app-root fade-in">
                <div class="container scroll-content">
                    <div class="tabs">
                        <div class="tab-item ${isEnc?'active':''}" id="tab-enc">ENCRYPT</div>
                        <div class="tab-item ${!isEnc?'active':''}" id="tab-dec">DECRYPT</div>
                    </div>

                    <div class="fade-in">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        if(window.lucide) window.lucide.createIcons();
    },

    renderLoading() {
        return `
            <div class="card" style="text-align:center; padding: 60px 20px;">
                <i data-lucide="loader-2" size="40" style="color:var(--prm); animation: spin 1s linear infinite;"></i>
                <h3 style="margin-top:20px; color:var(--prm);">Processing Artifacts...</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${this.state.loadingPercent}%"></div>
                </div>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
    },

    renderEncrypt() {
        const s = this.state;
        if(s.resA) {
            return `
                <div class="card" style="border-color:var(--prm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0; color:var(--prm);">// ARTIFACTS CREATED</h3>
                        <button class="btn btn-sec" style="padding:8px 16px; font-size:12px; border-radius:8px;" id="btn-reset">NEW</button>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <img src="${s.resA}" style="width:100%; border-radius:12px; border:1px solid var(--brd); display:block; background:#fff;">
                            <a href="${s.resA}" download="Layer_A.png" class="btn btn-sec" style="width:100%; margin-top:8px; border-radius:12px; font-size:12px;">SAVE A</a>
                        </div>
                        <div>
                            <img src="${s.resB}" style="width:100%; border-radius:12px; border:1px solid var(--brd); display:block; background:#fff;">
                            <a href="${s.resB}" download="Layer_B.png" class="btn btn-sec" style="width:100%; margin-top:8px; border-radius:12px; font-size:12px;">SAVE B</a>
                        </div>
                    </div>
                    <div style="margin-top:15px; padding:12px; background:rgba(0,217,255,0.1); border-radius:12px; display:flex; gap:10px; font-size:13px; color:var(--txt);">
                        <i data-lucide="alert-triangle" size="16" style="flex-shrink:0; margin-top:2px; color:var(--prm);"></i>
                        <span style="color:var(--txt);">Save both images! You cannot recover the message if you lose one.</span>
                    </div>
                </div>
            `;
        }
        return `
            <div class="card">
                <div class="input-group">
                    <label class="input-label">Secret Message</label>
                    <textarea id="inp-msg" class="input-field" rows="6" placeholder="Type your classified intelligence here...">${s.msgInput}</textarea>
                </div>
                <div class="input-group">
                    <label class="input-label">Encryption Key (Optional)</label>
                    <div style="position:relative;">
                        <input type="password" id="inp-pass" class="input-field" placeholder="Add a second layer of security..." value="${s.password}">
                        <i data-lucide="key" size="16" style="position:absolute; right:16px; top:16px; color:var(--txt-sec);"></i>
                    </div>
                </div>
            </div>

            <button class="btn btn-prm btn-block" id="btn-action">
                <i data-lucide="lock"></i> GENERATE NOISE
            </button>
        `;
    },

    renderDecrypt() {
        const s = this.state;
        if (s.resDecText) {
            return `
                 <div class="card" style="border-color:var(--prm);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="margin:0; color:var(--prm);">// DECRYPTED DATA</h3>
                        <button class="btn btn-sec" style="padding:8px 16px; font-size:12px; border-radius:8px;" id="btn-reset">CLEAR</button>
                    </div>
                    <textarea class="input-field" readonly rows="8" id="final-text" style="background:var(--bg-root);">${s.resDecText}</textarea>
                    <button class="btn btn-prm btn-block" id="btn-copy" style="margin-top:16px;">
                        <i data-lucide="copy"></i> COPY TEXT
                    </button>
                </div>
            `;
        }
        return `
            <div class="card">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                    <div>
                        <label class="input-label">Layer A</label>
                        <div class="file-drop ${s.layerA?'has-file':''}">
                            <i data-lucide="${s.layerA?'check-circle':'image'}" size="24" color="${s.layerA?'var(--prm)':'var(--txt-sec)'}"></i>
                            <span style="font-size:12px; margin-top:8px; color:var(--txt-sec);">${s.layerA?'Loaded':'Upload'}</span>
                            <input type="file" id="f-a" accept="image/*">
                        </div>
                    </div>
                    <div>
                        <label class="input-label">Layer B</label>
                        <div class="file-drop ${s.layerB?'has-file':''}">
                            <i data-lucide="${s.layerB?'check-circle':'image'}" size="24" color="${s.layerB?'var(--prm)':'var(--txt-sec)'}"></i>
                            <span style="font-size:12px; margin-top:8px; color:var(--txt-sec);">${s.layerB?'Loaded':'Upload'}</span>
                            <input type="file" id="f-b" accept="image/*">
                        </div>
                    </div>
                </div>
                <div class="input-group">
                    <label class="input-label">Decryption Key (If used)</label>
                    <input type="password" id="inp-pass" class="input-field" placeholder="Enter password..." value="${s.password}">
                </div>
            </div>

            <button class="btn btn-prm btn-block" id="btn-action">
                <i data-lucide="unlock"></i> REVEAL SECRETS
            </button>
        `;
    },

    bindEvents() {
        const r = this.sys.root;
        const click = (sel, fn) => { const el = r.querySelector(sel); if(el) el.onclick = fn; };
        const input = (sel, fn) => { const el = r.querySelector(sel); if(el) el.oninput = fn; };
        const change = (sel, fn) => { const el = r.querySelector(sel); if(el) el.onchange = fn; };

        // Stop propagation for inputs/buttons
        r.querySelectorAll('button, input, textarea, .file-drop').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        click('#tab-enc', () => this.switchTab('encrypt'));
        click('#tab-dec', () => this.switchTab('decrypt'));

        click('#btn-action', () => this.runProcess(this.state.tab === 'encrypt' ? 'enc' : 'dec'));
        click('#btn-reset', () => this.switchTab(this.state.tab));
        click('#btn-copy', () => this.copyResult());

        input('#inp-msg', (e) => this.state.msgInput = e.target.value);
        input('#inp-pass', (e) => this.state.password = e.target.value);

        change('#f-a', (e) => this.handleFile(e.target.files[0], 'layerA'));
        change('#f-b', (e) => this.handleFile(e.target.files[0], 'layerB'));
    }
})