({
    state: {
        isFirstVisit: true,
        currentView: 'lander', // 'lander' or 'main'
        inputText: '',
        outputText: '',
        statInput: 0,
        statOutput: 0,
        statRemoved: 0,
        // Options
        optLower: false,
        optKeepBlanks: false,
        optSort: false
    },

    sys: null,
    observer: null,
    appName: 'dedupe-list',

    // DEFINISI TEMA (Warna Biru diprioritaskan untuk Teks Input/Output)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.9)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#2563eb', // Biru Utama (Tombol & Teks Input)
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.05)',
            '--surface': 'rgba(255, 255, 255, 0.03)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb', // Biru Tetap Terlihat di Terang
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

    // --- LOGIC ENGINE ---
    async pasteData() {
        try {
            const text = await navigator.clipboard.readText();
            const inp = this.sys.root.querySelector('#inp-text');
            if (inp) {
                inp.value = text;
                this.state.inputText = text;
                this.processDedupe();
                this.sys.toast("LIST IMPORTED", "success");
            }
        } catch (err) {
            this.sys.toast("CLIPBOARD ACCESS DENIED", "error");
        }
    },

    copyResult() {
        if (!this.state.outputText) return this.sys.toast("OUTPUT IS EMPTY", "error");
        navigator.clipboard.writeText(this.state.outputText).then(() => {
            this.sys.toast("CLEAN LIST COPIED");
        });
    },

    processDedupe() {
        const raw = this.state.inputText;
        if (!raw) {
            this.state.outputText = '';
            this.state.statInput = 0;
            this.state.statOutput = 0;
            this.state.statRemoved = 0;
            this.updateSurgicalUI();
            return;
        }

        let lines = raw.split(/\r?\n/);
        const originalCount = lines.length;

        let uniqueLines = new Set();

        lines.forEach(line => {
            let processed = line;

            if (!this.state.optKeepBlanks) {
                processed = processed.trim();
                if (!processed) return;
            } else {
                processed = processed.trimEnd();
            }

            if (this.state.optLower) {
                processed = processed.toLowerCase();
            }

            uniqueLines.add(processed);
        });

        let finalArray = Array.from(uniqueLines);

        if (this.state.optSort) {
            finalArray.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        }

        const result = finalArray.join('\n');
        this.state.outputText = result;
        this.state.statInput = originalCount;
        this.state.statOutput = finalArray.length;
        this.state.statRemoved = originalCount - finalArray.length;

        this.updateSurgicalUI();
    },

    updateSurgicalUI() {
        const root = this.sys.root;
        const elOut = root.querySelector('#out-text');
        const elInCount = root.querySelector('#stat-in');
        const elOutCount = root.querySelector('#stat-out');
        const elRemCount = root.querySelector('#stat-rem');

        if (elOut) elOut.value = this.state.outputText;
        if (elInCount) elInCount.innerText = this.state.statInput;
        if (elOutCount) elOutCount.innerText = this.state.statOutput;
        if (elRemCount) elRemCount.innerText = this.state.statRemoved;
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

    render() {
        const { currentView, inputText, outputText, statInput, statOutput, statRemoved, optLower, optKeepBlanks, optSort } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMain();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@500;700;900&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'JetBrains Mono', monospace;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 70px; padding-bottom: 90px;
                    scrollbar-width: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 1020px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column;
                }

                .font-hud { font-family: 'Rajdhani', sans-serif; }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 24px; padding: 25px;
                    box-shadow: var(--shadow);
                    width: 100%; box-sizing: border-box;
                }

                .btn {
                    background: var(--prm); color: #fff; border: none;
                    padding: 14px 28px; border-radius: 12px; cursor: pointer;
                    font-weight: 700; transition: all 0.2s;
                    text-transform: uppercase; letter-spacing: 1px;
                    display: inline-flex; items-center justify-content: center; gap: 8px;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
                }
                .btn:active { transform: scale(0.95); }

                .text-area-custom {
                    width: 100%; box-sizing: border-box;
                    background: var(--surface); border: 1px solid var(--brd);
                    border-radius: 16px; padding: 15px;
                    color: var(--prm) !important; /* WAJIB BIRU */
                    font-family: 'JetBrains Mono', monospace; font-size: 13px;
                    resize: none; outline: none; transition: border-color 0.3s;
                    line-height: 1.5;
                }
                .text-area-custom:focus { border-color: var(--prm); }
                .text-area-custom::placeholder { color: var(--prm); opacity: 0.3; }

                /* Checkbox styling */
                .opt-row { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
                .opt-row input { cursor: pointer; accent-color: var(--prm); width: 18px; height: 18px; }
                .opt-label { font-size: 12px; font-weight: 700; color: var(--txt-dim); text-transform: uppercase; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="glass-panel fade-in" style="text-align: center; max-width: 600px; margin: auto;">
                <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto mb-6 border border-blue-500/20">
                    <i class="material-icons" style="font-size: 32px;">list_alt</i>
                </div>
                <h1 class="font-hud" style="font-size: 42px; font-weight: 900; margin-bottom: 15px; line-height: 1;">
                    DEDUPE <span style="color: var(--prm);">LIST</span>
                </h1>
                <p style="color: var(--txt-dim); margin-bottom: 30px; font-size: 14px; line-height: 1.6;">
                    Purify your data. Instantly remove duplicate lines, sort alphabetically, and clean whitespaces from thousands of entries in milliseconds.
                </p>
                <button id="btn-get-started" class="btn" style="width: 100%;">ACCESS WORKSPACE</button>
            </div>
        `;
    },

    renderMain() {
        const { inputText, outputText, statInput, statOutput, statRemoved, optLower, optKeepBlanks, optSort } = this.state;
        return `
            <div class="glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--brd); padding-bottom: 15px;">
                    <div class="font-hud" style="font-weight: 900; font-size: 20px; letter-spacing: 2px;">LIST_CLEANER_V2</div>
                    <div class="font-hud" style="font-size: 10px; font-weight: 700; color: var(--scs);">ENGINE ONLINE</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="font-hud" style="font-size: 11px; font-weight: 700; color: var(--txt-dim);">DIRTY DATA</span>
                        <button id="btn-paste" style="background: transparent; border: none; color: var(--prm); font-size: 11px; cursor: pointer; font-weight: 900;">PASTE FROM CLIPBOARD</button>
                    </div>
                    <textarea id="inp-text" class="text-area-custom" style="height: 160px;" placeholder="Paste your messy list here...">${inputText}</textarea>
                </div>

                <div class="glass-panel" style="padding: 15px; border-radius: 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    <label class="opt-row">
                        <input type="checkbox" id="opt-lower" ${optLower ? 'checked' : ''}>
                        <span class="opt-label">Lowercase</span>
                    </label>
                    <label class="opt-row">
                        <input type="checkbox" id="opt-blanks" ${optKeepBlanks ? 'checked' : ''}>
                        <span class="opt-label">Keep Blanks</span>
                    </label>
                    <label class="opt-row">
                        <input type="checkbox" id="opt-sort" ${optSort ? 'checked' : ''}>
                        <span class="opt-label">Sort A-Z</span>
                    </label>
                </div>

                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="font-hud" style="font-size: 11px; font-weight: 700; color: var(--scs);">CLEAN RESULT</span>
                        <button id="btn-copy" style="background: transparent; border: none; color: var(--scs); font-size: 11px; cursor: pointer; font-weight: 900;">COPY RESULT</button>
                    </div>
                    <textarea id="out-text" class="text-area-custom" style="height: 160px; border-color: rgba(16, 185, 129, 0.1);" readonly>${outputText}</textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div class="glass-panel" style="padding: 12px; border-radius: 16px; text-align: center; margin-bottom: 0;">
                        <div style="font-size: 8px; color: var(--txt-dim); font-weight: 900; text-transform: uppercase;">Total Lines</div>
                        <div id="stat-in" class="font-hud" style="font-size: 18px; font-weight: 900;">${statInput}</div>
                    </div>
                    <div class="glass-panel" style="padding: 12px; border-radius: 16px; text-align: center; margin-bottom: 0;">
                        <div style="font-size: 8px; color: var(--txt-dim); font-weight: 900; text-transform: uppercase;">Removed</div>
                        <div id="stat-rem" class="font-hud" style="font-size: 18px; font-weight: 900; color: var(--err);">${statRemoved}</div>
                    </div>
                    <div class="glass-panel" style="padding: 12px; border-radius: 16px; text-align: center; margin-bottom: 0;">
                        <div style="font-size: 8px; color: var(--txt-dim); font-weight: 900; text-transform: uppercase;">Final Unique</div>
                        <div id="stat-out" class="font-hud" style="font-size: 18px; font-weight: 900; color: var(--scs);">${statOutput}</div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, textarea, label').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const btnStart = root.querySelector('#btn-get-started');
        if (btnStart) btnStart.onclick = () => {
            localStorage.setItem('app_visited_' + this.appName, 'true');
            this.state.currentView = 'main';
            this.render();
        };

        const inpText = root.querySelector('#inp-text');
        if (inpText) {
            inpText.oninput = (e) => {
                this.state.inputText = e.target.value;
                this.processDedupe();
            };
        }

        const btnPaste = root.querySelector('#btn-paste');
        if (btnPaste) btnPaste.onclick = () => this.pasteData();

        const btnCopy = root.querySelector('#btn-copy');
        if (btnCopy) btnCopy.onclick = () => this.copyResult();

        // Checkbox events
        ['#opt-lower', '#opt-blanks', '#opt-sort'].forEach(id => {
            const el = root.querySelector(id);
            if (el) {
                el.onchange = (e) => {
                    const key = id === '#opt-lower' ? 'optLower' : id === '#opt-blanks' ? 'optKeepBlanks' : 'optSort';
                    this.state[key] = e.target.checked;
                    this.processDedupe();
                };
            }
        });
    }
})