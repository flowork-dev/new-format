({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        inputText: '',
        outputText: '',
        removedCount: 0,
        keptCount: 0,
        status: 'SYSTEM ONLINE'
    },

    sys: null,
    observer: null,
    appName: 'text-detox',

    // DEFINISI TEMA (Warna Biru diprioritaskan untuk Teks Input/Output)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(10, 11, 16, 0.9)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#e0f0ff',
            '--txt-dim': '#94a3b8',
            '--prm': '#2563eb', // Biru Utama
            '--scs': '#00ff9d',
            '--err': '#ff4d4d',
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

    async pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            const inp = this.sys.root.querySelector('#inp-text');
            if (inp) {
                inp.value = text;
                this.state.inputText = text;
                this.processDetox();
                this.sys.toast("TEXT IMPORTED", "success");
            }
        } catch (err) {
            this.sys.toast("CLIPBOARD ACCESS DENIED", "error");
        }
    },

    copyResult() {
        if (!this.state.outputText) return this.sys.toast("OUTPUT IS EMPTY", "error");
        navigator.clipboard.writeText(this.state.outputText).then(() => {
            this.sys.toast("CLEAN TEXT COPIED");
        });
    },

    processDetox() {
        const raw = this.state.inputText;
        if (!raw) {
            this.state.outputText = '';
            this.state.removedCount = 0;
            this.state.keptCount = 0;
            this.updateSurgicalUI('READY');
            return;
        }

        let cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, '');
        cleaned = cleaned
            .replace(/\*\*/g, '')
            .replace(/^["']|["']$/g, '')
            .replace(/Here is the.*/gi, '')
            .replace(/Certainly.*/gi, '')
            .replace(/Sure,.*/gi, '')
            .replace(/I can help.*/gi, '')
            .replace(/In conclusion,.*/gi, '')
            .replace(/Overall,.*/gi, '')
            .trim();

        const removed = raw.length - cleaned.length;
        this.state.outputText = cleaned;
        this.state.removedCount = removed;
        this.state.keptCount = cleaned.length;

        const statusMsg = removed > 0 ? `DETECTED ${removed} GHOST CHARS!` : 'TEXT IS CLEAN';
        this.updateSurgicalUI(statusMsg);
    },

    updateSurgicalUI(statusMsg) {
        const root = this.sys.root;
        const elOut = root.querySelector('#out-text');
        const elRemoved = root.querySelector('#stat-removed');
        const elKept = root.querySelector('#stat-kept');
        const elStatus = root.querySelector('#status-display');

        if (elOut) elOut.value = this.state.outputText;
        if (elRemoved) elRemoved.innerText = this.state.removedCount;
        if (elKept) elKept.innerText = this.state.keptCount;
        if (elStatus) {
            elStatus.innerText = statusMsg;
            elStatus.style.color = this.state.removedCount > 0 ? 'var(--err)' : 'var(--scs)';
        }
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

    render() {
        const { currentView, inputText, outputText, removedCount, keptCount, status } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMain();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@500;700&display=swap');

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
                    margin-bottom: 20px;
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

                .badge { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; border: 1px solid; text-transform: uppercase; }
                .badge-scs { background: rgba(0, 255, 157, 0.1); border-color: var(--scs); color: var(--scs); }

                /* TEKS AREA - WAJIB BIRU */
                .text-area-custom {
                    width: 100%; box-sizing: border-box;
                    background: var(--surface); border: 1px solid var(--brd);
                    border-radius: 16px; padding: 15px;
                    color: var(--prm) !important; /* HARGA MATI: Teks Wajib Biru */
                    font-family: 'JetBrains Mono', monospace; font-size: 14px;
                    resize: none; outline: none; transition: border-color 0.3s;
                }
                .text-area-custom:focus { border-color: var(--prm); box-shadow: 0 0 10px rgba(37, 99, 235, 0.1); }
                .text-area-custom::placeholder { color: var(--prm); opacity: 0.3; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="glass-panel fade-in" style="text-align: center; max-width: 600px; margin: auto;">
                <div class="badge badge-scs" style="margin-bottom: 20px;">
                    SECURE NODE • ANTI-AI TRACKING
                </div>
                <h1 class="font-hud" style="font-size: 42px; font-weight: 900; margin-bottom: 15px; line-height: 1;">
                    TEXT <span style="color: var(--scs);">DETOX</span>
                </h1>
                <p style="color: var(--txt-dim); margin-bottom: 30px; font-size: 14px; line-height: 1.6;">
                    Purify your text from hidden watermarks and AI fingerprints. <br>100% Client-side operation.
                </p>
                <button id="btn-get-started" class="btn" style="width: 100%;">START DETOX ENGINE</button>
            </div>
        `;
    },

    renderMain() {
        const { inputText, outputText, removedCount, keptCount, status } = this.state;
        return `
            <div class="glass-panel" style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--brd); padding-bottom: 15px;">
                    <div class="font-hud" style="font-weight: 900; font-size: 20px; letter-spacing: 1px;">DETOX_STATION</div>
                    <div id="status-display" class="font-hud" style="font-size: 10px; font-weight: 700; color: var(--scs);">${status}</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="font-hud" style="font-size: 11px; font-weight: 700; color: var(--txt-dim);">DIRTY INPUT</span>
                        <button id="btn-paste" style="background: transparent; border: none; color: var(--prm); font-size: 11px; cursor: pointer; font-weight: 700;">PASTE DATA</button>
                    </div>
                    <textarea id="inp-text" class="text-area-custom" style="height: 140px;" placeholder="Input AI artifacts here...">${inputText}</textarea>
                </div>

                <div style="margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="font-hud" style="font-size: 11px; font-weight: 700; color: var(--scs);">CLEAN OUTPUT</span>
                        <button id="btn-copy" style="background: transparent; border: none; color: var(--scs); font-size: 11px; cursor: pointer; font-weight: 700;">COPY CLEANED</button>
                    </div>
                    <textarea id="out-text" class="text-area-custom" style="height: 140px; border-color: rgba(0,255,157,0.1);" readonly>${outputText}</textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="glass-panel" style="padding: 15px; border-radius: 16px; margin-bottom: 0;">
                        <div style="font-size: 9px; color: var(--txt-dim); font-weight: 900; text-transform: uppercase;">Removed</div>
                        <div id="stat-removed" class="font-hud" style="font-size: 24px; font-weight: 900; color: var(--err);">${removedCount}</div>
                    </div>
                    <div class="glass-panel" style="padding: 15px; border-radius: 16px; margin-bottom: 0;">
                        <div style="font-size: 9px; color: var(--txt-dim); font-weight: 900; text-transform: uppercase;">Purity</div>
                        <div id="stat-kept" class="font-hud" style="font-size: 24px; font-weight: 900; color: var(--scs);">${keptCount}</div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, textarea, .glass-panel').forEach(el => {
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
                this.processDetox();
            };
        }

        const btnPaste = root.querySelector('#btn-paste');
        if (btnPaste) btnPaste.onclick = () => this.pasteText();

        const btnCopy = root.querySelector('#btn-copy');
        if (btnCopy) btnCopy.onclick = () => this.copyResult();
    }
})