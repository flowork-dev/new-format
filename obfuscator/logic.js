({
    state: {
        inputCode: '',
        outputCode: '',
        level: 'medium',
        isProcessing: false,
        isGenerated: false
    },
    sys: null,
    observer: null,
    appName: 'obfuscator',

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.85)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#2563eb', // Solid Blue
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 10px 40px -10px rgba(0, 0, 0, 0.5)' // Shadow halus
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.05)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.05)',
            '--surface': 'rgba(0, 0, 0, 0.02)',
            '--shadow': '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
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
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving to storage...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    async runProcess() {
        if (!this.state.inputCode) return this.sys.toast("Please input your code!", "error");

        this.state.isProcessing = true;
        this.render();

        const formData = new FormData();
        formData.append('code', this.state.inputCode);
        formData.append('level', this.state.level);

        try {
            const req = await fetch('/api/v1/obfuscator/process', { method: 'POST', body: formData });
            if (req.status !== 200) throw new Error("API Error");
            const res = await req.json();

            if (res.success) {
                this.state.outputCode = res.result;
                this.state.isGenerated = true;
                this.sys.toast("Logic Cloaked!", "success");
            } else { throw new Error(res.error); }
        } catch (e) {
            // Fallback Engine
            setTimeout(() => {
                const encoded = btoa(unescape(encodeURIComponent(this.state.inputCode)));
                this.state.outputCode = "/* FLOWORK_CLOAK */\n(function(){var _x='" + encoded + "';eval(decodeURIComponent(escape(atob(_x))))})();";
                this.state.isGenerated = true;
                this.state.isProcessing = false;
                this.render();
                this.sys.toast("Generated locally.", "info");
            }, 500);
            return;
        }

        this.state.isProcessing = false;
        this.render();
    },

    render() {
        const { inputCode, outputCode, level, isProcessing, isGenerated } = this.state;

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    <div class="glass-panel">
                        <div class="header-row">
                            <div>
                                <h2 style="font-size: 18px; font-weight: 800; margin: 0;">JS CLOAKER</h2>
                                <span class="label-tag">${isGenerated ? 'ENCRYPTED RESULT' : 'INPUT SOURCE'}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button id="btn-back" class="btn-sm" style="display: ${isGenerated ? 'block' : 'none'};">← EDIT</button>
                                <button id="btn-reset" class="btn-sm" style="color: var(--err); border-color: var(--err);">RESET</button>
                            </div>
                        </div>

                        <div class="view-container">
                            ${!isGenerated ? `
                                <div class="editor-box fade-in">
                                    <div class="header-row">
                                        <span class="label-tag">Paste JavaScript</span>
                                        <button id="btn-paste" class="btn-sm">PASTE</button>
                                    </div>
                                    <textarea id="input-area" placeholder="// Code goes here..."></textarea>

                                    <div class="label-tag">Intensity</div>
                                    <select id="level-select">
                                        <option value="low" ${level === 'low' ? 'selected' : ''}>Low (Fast)</option>
                                        <option value="medium" ${level === 'medium' ? 'selected' : ''}>Medium (Recommended)</option>
                                        <option value="high" ${level === 'high' ? 'selected' : ''}>High (Anti-Debug)</option>
                                    </select>

                                    <button id="process-trigger" class="btn" ${isProcessing ? 'disabled' : ''}>
                                        ${isProcessing ? 'CLOAKING...' : 'LOCK CODE 🔒'}
                                    </button>
                                </div>
                            ` : `
                                <div class="editor-box fade-in">
                                    <div class="header-row">
                                        <span class="label-tag" style="color: var(--scs);">CLOAKED LOGIC</span>
                                        <div style="display: flex; gap: 8px;">
                                            <button id="btn-copy" class="btn-sm">COPY</button>
                                            <button id="btn-save" class="btn-sm">SAVE</button>
                                        </div>
                                    </div>
                                    <textarea id="output-area" readonly style="color: var(--scs);"></textarea>
                                    <p style="font-size: 9px; color: var(--txt-dim); text-align: center;">
                                        Obfuscation complete. Character count: ${outputCode.length}
                                    </p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; padding-top: 70px; padding-bottom: 90px;
                    scrollbar-width: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 600px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    border: var(--glass-border);
                    border-radius: 28px; padding: 25px;
                    box-shadow: var(--shadow);
                }

                .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .editor-box { display: flex; flex-direction: column; gap: 12px; }
                .label-tag { font-size: 8px; font-weight: 800; letter-spacing: 1px; color: var(--prm); text-transform: uppercase; }

                textarea {
                    width: 100%; height: 200px; /* TINGGI DIPOTONG SETENGAH */
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid var(--brd);
                    border-radius: 16px; padding: 15px;
                    color: var(--txt); font-family: 'JetBrains Mono', monospace;
                    font-size: 11px; outline: none; resize: none;
                    box-sizing: border-box;
                }

                .btn {
                    background: var(--prm); color: #fff; border: none;
                    padding: 14px; border-radius: 14px; cursor: pointer;
                    font-weight: 700; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.97); }

                .btn-sm {
                    padding: 6px 12px; font-size: 9px; border-radius: 8px;
                    background: var(--surface); color: var(--txt); border: 1px solid var(--brd);
                    font-weight: 700; cursor: pointer;
                }

                select {
                    width: 100%; padding: 12px; border-radius: 12px;
                    background: var(--surface); border: 1px solid var(--brd);
                    color: var(--txt); outline: none; font-size: 12px;
                }

                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        // Value Injection
        const inArea = this.sys.root.querySelector('#input-area');
        const outArea = this.sys.root.querySelector('#output-area');
        if (inArea) inArea.value = inputCode;
        if (outArea) outArea.value = outputCode;

        this.bindEvents();
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, textarea, select, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const inArea = root.querySelector('#input-area');
        if (inArea) inArea.oninput = (e) => { this.state.inputCode = e.target.value; };

        const trigger = root.querySelector('#process-trigger');
        if (trigger) trigger.onclick = () => this.runProcess();

        const btnBack = root.querySelector('#btn-back');
        if (btnBack) btnBack.onclick = () => { this.state.isGenerated = false; this.render(); };

        const btnReset = root.querySelector('#btn-reset');
        if (btnReset) btnReset.onclick = () => {
            this.state.inputCode = ''; this.state.outputCode = '';
            this.state.isGenerated = false; this.render();
        };

        const btnPaste = root.querySelector('#btn-paste');
        if (btnPaste) btnPaste.onclick = async () => {
            const txt = await navigator.clipboard.readText();
            this.state.inputCode = txt;
            this.render();
        };

        const btnCopy = root.querySelector('#btn-copy');
        if (btnCopy) btnCopy.onclick = () => {
            navigator.clipboard.writeText(this.state.outputCode);
            this.sys.toast("Copied!");
        };

        const btnSave = root.querySelector('#btn-save');
        if (btnSave) btnSave.onclick = () => {
            const blob = new Blob([this.state.outputCode], { type: "text/javascript" });
            this.saveToDevice(blob, "cloaked.js", "text/javascript");
        };

        const lvlSel = root.querySelector('#level-select');
        if (lvlSel) lvlSel.onchange = (e) => { this.state.level = e.target.value; };
    }
})