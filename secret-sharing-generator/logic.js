({
    state: {
        appName: 'shamir_secret_direct',
        mode: 'split', // 'split' | 'combine'

        // Data
        secret: '',
        totalShards: 3,
        threshold: 2,
        inputShards: '',
        generatedShards: [],
        reconstructedSecret: '',

        loading: false,
        depsLoaded: false
    },

    sys: null,
    observer: null,

    // DEFINISI TEMA (High Contrast Fixed)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.9)',
            '--surface-2': 'rgba(30, 41, 59, 0.95)',
            '--txt': '#f8fafc',
            '--txt-sec': '#94a3b8',
            '--prm': '#38bdf8',
            '--prm-txt': '#0f172a',
            '--danger': '#f43f5e',
            '--success': '#4ade80',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--input-bg': 'rgba(2, 6, 23, 0.6)',
            '--input-txt': '#ffffff', /* PASTI PUTIH */
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.9)',
            '--surface-2': 'rgba(241, 245, 249, 0.95)',
            '--txt': '#0f172a',
            '--txt-sec': '#64748b',
            '--prm': '#2563eb',
            '--prm-txt': '#ffffff',
            '--danger': '#ef4444',
            '--success': '#16a34a',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--input-bg': 'rgba(255, 255, 255, 0.8)',
            '--input-txt': '#000000', /* PASTI HITAM */
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    async mount(sys) {
        this.sys = sys;

        // Render Loading -> Load Deps -> Render App
        this.render();
        await this.loadDependencies();

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

        if(document.documentElement) {
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

    async loadDependencies() {
        const load = (url) => new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = url; s.onload = resolve; s.onerror = resolve; // Continue even if error to avoid stuck
            document.head.appendChild(s);
        });

        await Promise.all([
            load('https://cdn.jsdelivr.net/npm/secrets.js-grempe@2.0.0/secrets.min.js'),
            load('https://unpkg.com/lucide@latest')
        ]);
        this.state.depsLoaded = true;
        this.render();
        this.bindEvents();
    },

    setMode(mode) {
        this.state.mode = mode;
        // Reset output when switching
        this.state.generatedShards = [];
        this.state.reconstructedSecret = '';
        this.render();
        this.bindEvents();
    },

    // --- LOGIC ENGINE ---

    execute() {
        if(!window.secrets) return this.sys.alert("Library Crypto belum siap. Cek koneksi.", "Error");

        try {
            if(this.state.mode === 'split') {
                const secret = this.state.secret;
                const total = this.state.totalShards;
                const threshold = this.state.threshold;

                if(!secret) throw new Error("Secret cannot be empty");
                if(threshold > total) throw new Error("Threshold cannot be larger than Total shards");
                if(threshold < 2) throw new Error("Threshold must be at least 2");

                // Convert string to hex
                const secretHex = window.secrets.str2hex(secret);
                // Share
                const shards = window.secrets.share(secretHex, total, threshold);

                this.state.generatedShards = shards;
                this.sys.toast(`${shards.length} Shards Generated!`);
            } else {
                const input = this.state.inputShards;
                if(!input) throw new Error("Paste shards first");

                const shares = input.trim().split('\n').map(s => s.trim()).filter(s => s);
                if(shares.length < 2) throw new Error("Need at least 2 shards to reconstruct");

                try {
                    const hex = window.secrets.combine(shares);
                    const str = window.secrets.hex2str(hex);
                    this.state.reconstructedSecret = str;
                    this.sys.toast("Secret Reconstructed!");
                } catch(e) {
                    throw new Error("Invalid shards or threshold not met.");
                }
            }
            this.render();
            this.bindEvents();
        } catch(e) {
            this.sys.alert(e.message, "Operation Failed");
        }
    },

    async copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.sys.toast("Copied to clipboard");
        } catch (err) {
            this.sys.toast("Failed to copy");
        }
    },

    // --- RENDER ---

    render() {
        const content = !this.state.depsLoaded ? this.renderLoading() : this.renderMainApp();

        this.sys.root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;

                    /* GHOST SCROLL */
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                /* CENTER CONTENT FIX */
                .container {
                    max-width: 800px;
                    margin: auto; /* MAGIC CENTER */
                    width: 100%;
                    padding: 24px 20px; box-sizing: border-box;
                    display: flex; flex-direction: column;
                }

                .scroll-content { padding-bottom: 40px !important; }

                /* CARDS */
                .card {
                    background: var(--surface-2); border: 1px solid var(--brd);
                    border-radius: 24px; padding: 24px; margin-bottom: 20px;
                    box-shadow: var(--shadow);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                }

                /* TABS */
                .tabs {
                    display: flex; background: var(--surface-2); padding: 6px;
                    border-radius: 100px; border: 1px solid var(--brd);
                    margin-bottom: 24px; box-shadow: var(--shadow);
                }
                .tab-item {
                    flex: 1; text-align: center; padding: 12px;
                    border-radius: 100px; font-weight: 700; font-size: 14px;
                    cursor: pointer; color: var(--txt-sec); transition: 0.3s;
                }
                .tab-item.active { background: var(--prm); color: var(--prm-txt); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                /* INPUTS */
                .input-label { display: block; font-size: 11px; font-weight: 800; color: var(--txt-sec); margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase; }

                .input-field {
                    width: 100%; box-sizing: border-box;
                    background: var(--input-bg); border: 1px solid var(--brd);
                    color: var(--input-txt); border-radius: 16px; padding: 16px;
                    font-family: 'JetBrains Mono', monospace; font-size: 14px;
                    outline: none; margin-bottom: 16px; resize: none;
                }
                .input-field:focus { border-color: var(--prm); box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }

                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

                /* BTNS */
                .btn {
                    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 15px; border-radius: 16px;
                    transition: 0.2s; gap: 8px; width: 100%; padding: 18px;
                }
                .btn:active { transform: scale(0.98); }
                .btn-prm { background: var(--prm); color: var(--prm-txt); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                .btn-sec { background: transparent; border: 1px solid var(--brd); color: var(--txt); }

                .btn-icon {
                    background: var(--input-bg); border: 1px solid var(--brd); color: var(--txt);
                    border-radius: 8px; padding: 8px; cursor: pointer; display: flex;
                }
                .btn-icon:hover { background: var(--prm); color: var(--prm-txt); }

                /* RESULTS */
                .shard-item {
                    background: var(--bg-root); border: 1px solid var(--brd);
                    border-radius: 12px; padding: 12px; margin-bottom: 8px;
                    font-family: 'JetBrains Mono', monospace; font-size: 12px;
                    display: flex; align-items: center; gap: 10px;
                }
                .shard-idx { color: var(--prm); font-weight: bold; }
                .shard-val { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }

                .result-box {
                    background: rgba(74, 222, 128, 0.1); border: 1px solid var(--success);
                    color: var(--success); padding: 20px; border-radius: 16px;
                    text-align: center; word-break: break-all; font-family: 'JetBrains Mono', monospace;
                    margin-bottom: 16px; font-weight: 600;
                }

                /* ANIM */
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>

            <div class="app-root fade-in">
                ${content}
            </div>
        `;

        if(window.lucide) window.lucide.createIcons();
    },

    renderLoading() {
        return `
            <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <i data-lucide="loader-2" size="40" style="color:var(--prm); animation:spin 1s linear infinite;"></i>
                <h3 style="margin-top:20px; font-weight:600;">Loading Crypto Libs...</h3>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            </div>
        `;
    },

    renderMainApp() {
        const s = this.state;
        const isSplit = s.mode === 'split';

        return `
            <div class="container scroll-content">
                <div class="tabs">
                    <div class="tab-item ${isSplit?'active':''}" id="tab-split">SPLIT</div>
                    <div class="tab-item ${!isSplit?'active':''}" id="tab-combine">RECOVER</div>
                </div>

                <div class="fade-in">
                    <div class="card">
                        ${isSplit ? `
                            <div style="margin-bottom:20px;">
                                <label class="input-label">YOUR SECRET</label>
                                <textarea id="inp-secret" class="input-field" rows="4" placeholder="Enter sensitive data to split...">${s.secret}</textarea>
                            </div>
                            <div class="grid-2">
                                <div>
                                    <label class="input-label">TOTAL SHARDS</label>
                                    <input type="number" id="inp-total" class="input-field" value="${s.totalShards}" min="2">
                                </div>
                                <div>
                                    <label class="input-label">THRESHOLD</label>
                                    <input type="number" id="inp-thresh" class="input-field" value="${s.threshold}" min="2">
                                </div>
                            </div>
                            <p style="font-size:12px; color:var(--txt-sec); margin-top:-10px; margin-bottom:20px;">
                                Need <b>${s.threshold}</b> out of <b>${s.totalShards}</b> shards to recover.
                            </p>
                        ` : `
                            <div>
                                <label class="input-label">PASTE SHARDS (ONE PER LINE)</label>
                                <textarea id="inp-shards" class="input-field" rows="6" placeholder="801...&#10;802...">${s.inputShards}</textarea>
                            </div>
                        `}

                        <button id="btn-exec" class="btn btn-prm">
                            ${isSplit ? '<i data-lucide="scissors"></i> ENCRYPT & SPLIT' : '<i data-lucide="unlock"></i> RECONSTRUCT SECRET'}
                        </button>
                    </div>

                    ${(isSplit && s.generatedShards.length > 0) || (!isSplit && s.reconstructedSecret) ? `
                        <div class="card">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                                <label class="input-label" style="margin:0; color:var(--prm);">OUTPUT RESULT</label>
                                <button id="btn-clear" style="background:none; border:none; color:var(--danger); font-size:11px; font-weight:bold; cursor:pointer;">CLEAR</button>
                            </div>

                            ${isSplit ? `
                                <div>
                                    ${s.generatedShards.map((shard, i) => `
                                        <div class="shard-item">
                                            <span class="shard-idx">#${i+1}</span>
                                            <div class="shard-val">${shard}</div>
                                            <button class="btn-icon btn-copy" data-val="${shard}">
                                                <i data-lucide="copy" size="14"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div>
                                    <div class="result-box">${s.reconstructedSecret}</div>
                                    <button class="btn btn-sec btn-copy" data-val="${s.reconstructedSecret}">
                                        <i data-lucide="copy"></i> COPY SECRET
                                    </button>
                                </div>
                            `}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    bindEvents() {
        const r = this.sys.root;
        const $ = (sel) => r.querySelector(sel);
        const $$ = (sel) => r.querySelectorAll(sel);
        const stop = (e) => e.stopPropagation();

        // Global Event Blocker
        r.querySelectorAll('button, input, textarea, .tab-item').forEach(el => {
            el.addEventListener('mousedown', stop);
            el.addEventListener('touchstart', stop);
        });

        // Tabs
        if ($('#tab-split')) $('#tab-split').onclick = () => this.setMode('split');
        if ($('#tab-combine')) $('#tab-combine').onclick = () => this.setMode('combine');

        // Inputs
        if ($('#inp-secret')) $('#inp-secret').oninput = (e) => this.state.secret = e.target.value;
        if ($('#inp-shards')) $('#inp-shards').oninput = (e) => this.state.inputShards = e.target.value;
        if ($('#inp-total')) $('#inp-total').oninput = (e) => this.state.totalShards = parseInt(e.target.value);
        if ($('#inp-thresh')) $('#inp-thresh').oninput = (e) => this.state.threshold = parseInt(e.target.value);

        // Action
        if ($('#btn-exec')) $('#btn-exec').onclick = () => this.execute();
        if ($('#btn-clear')) $('#btn-clear').onclick = () => {
            this.state.generatedShards = [];
            this.state.reconstructedSecret = '';
            this.state.secret = '';
            this.state.inputShards = '';
            this.render();
            this.bindEvents();
        };

        // Copy
        $$('.btn-copy').forEach(btn => {
            btn.onclick = (e) => {
                stop(e);
                this.copyText(btn.getAttribute('data-val'));
            };
        });
    }
})