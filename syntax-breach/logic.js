({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        mode: 'json', // json, csv, base64, url
        inputVal: '',
        outputVal: ''
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': '#06b6d4', /* Card Background Wajib */
            '--glass-border': '1px solid rgba(37, 99, 235, 0.3)',
            '--txt': '#1e3a8a', /* Deep Blue Text */
            '--txt-dim': '#1d4ed8', /* Blue Text */
            '--prm': '#2563eb', /* Solid Blue Button */
            '--scs': '#2563eb',
            '--err': '#dc2626',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.1)',
            '--shadow': '0 4px 15px rgba(37, 99, 235, 0.2)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': '#06b6d4', /* Card Background Wajib */
            '--glass-border': '1px solid rgba(37, 99, 235, 0.3)',
            '--txt': '#1e3a8a', /* Deep Blue Text */
            '--txt-dim': '#1d4ed8', /* Blue Text */
            '--prm': '#2563eb', /* Solid Blue Button */
            '--scs': '#2563eb',
            '--err': '#dc2626',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.1)',
            '--shadow': '0 4px 15px rgba(37, 99, 235, 0.2)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_syntax_breach');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.render();

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'data-theme') this.onThemeChange(document.documentElement.getAttribute('data-theme'));
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

    // --- PROTOKOL DOWNLOAD HYBRID ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving to device storage...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    processData() {
        if(!this.state.inputVal) {
            this.state.outputVal = '';
            return;
        }
        try {
            if(this.state.mode === 'json') {
                this.state.outputVal = JSON.stringify(JSON.parse(this.state.inputVal), null, 2);
            } else if(this.state.mode === 'base64') {
                try { this.state.outputVal = atob(this.state.inputVal); }
                catch { this.state.outputVal = btoa(this.state.inputVal); }
            } else if(this.state.mode === 'url') {
                try { this.state.outputVal = decodeURIComponent(this.state.inputVal); }
                catch { this.state.outputVal = encodeURIComponent(this.state.inputVal); }
            } else if(this.state.mode === 'csv') {
                const json = JSON.parse(this.state.inputVal);
                const arr = Array.isArray(json) ? json : [json];
                if(arr.length === 0) { this.state.outputVal = ''; return; }
                const keys = Object.keys(arr[0]);
                const csv = [keys.join(',')];
                arr.forEach(row => csv.push(keys.map(k => {
                    const val = row[k] === null || row[k] === undefined ? '' : row[k];
                    return JSON.stringify(val);
                }).join(',')));
                this.state.outputVal = csv.join('\n');
            }
        } catch(e) {
            this.state.outputVal = "ERROR: INVALID INPUT FORMAT FOR " + this.state.mode.toUpperCase();
        }

        const outBox = this.sys.root.querySelector('#outBox');
        if(outBox) outBox.value = this.state.outputVal;
    },

    downloadCSV() {
        if (this.state.mode !== 'csv' || !this.state.outputVal || this.state.outputVal.startsWith('ERROR')) {
            if(this.sys) this.sys.toast("Nothing to download or invalid format.", "error");
            return;
        }
        const blob = new Blob([this.state.outputVal], { type: "text/csv;charset=utf-8" });
        this.saveToDevice(blob, "syntax_export.csv", "text/csv");
    },

    copyOutput() {
        if(!this.state.outputVal) return;
        navigator.clipboard.writeText(this.state.outputVal).then(() => {
            if(this.sys) this.sys.toast("Copied to clipboard!", "success");
        });
    },

    render() {
        const { currentView } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMainApp();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 85px; padding-bottom: 85px;
                    scrollbar-width: none; -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 1020px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                }

                .glass-panel {
                    background: var(--glass);
                    border: var(--glass-border);
                    border-radius: 16px; padding: 24px;
                    box-shadow: var(--shadow);
                    width: 100%; margin-bottom: 20px;
                }

                .btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 12px 24px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.95); }

                /* BLUE TEXT REQUIREMENT */
                .cyber-textarea {
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid var(--prm);
                    color: var(--txt); /* Blue text */
                    font-family: monospace; font-size: 14px;
                    padding: 16px; border-radius: 12px;
                    width: 100%; height: 200px;
                    outline: none; resize: none;
                }
                .cyber-textarea::placeholder { color: #1e3a8a; opacity: 0.6; }

                .mode-btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.85rem;
                }
                .mode-btn.active { box-shadow: inset 0 0 0 3px #1e3a8a; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div style="max-width: 800px; width: 100%; text-align: center;">
                <div class="glass-panel" style="background: transparent; border: none; box-shadow: none;">
                    <h1 style="font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: var(--txt);">
                        SYNTAX BREACH
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        Universal Data Converter. Transform JSON, CSV, Base64, and URL Encoding instantly directly in your browser.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">LAUNCH CONVERTER</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        return `
            <div style="width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 20px;">

                <div class="glass-panel" style="padding: 16px; display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none;">
                    <button class="mode-btn ${this.state.mode === 'json' ? 'active' : ''}" data-mode="json">JSON FORMAT</button>
                    <button class="mode-btn ${this.state.mode === 'csv' ? 'active' : ''}" data-mode="csv">JSON > CSV</button>
                    <button class="mode-btn ${this.state.mode === 'base64' ? 'active' : ''}" data-mode="base64">BASE64</button>
                    <button class="mode-btn ${this.state.mode === 'url' ? 'active' : ''}" data-mode="url">URL ENCODE</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }">
                    <div class="glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 800; color: var(--txt);">INPUT DATA</span>
                            <button id="btn-clear" style="background: transparent; color: var(--prm); font-weight: bold; border: none; cursor: pointer;">CLEAR</button>
                        </div>
                        <textarea id="inBox" class="cyber-textarea" placeholder="Paste your raw data here...">${this.state.inputVal}</textarea>
                    </div>

                    <div class="glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 800; color: var(--txt);">OUTPUT RESULT</span>
                            <div style="display: flex; gap: 10px;">
                                ${this.state.mode === 'csv' ? `<button id="btn-dl" style="background: transparent; color: var(--prm); font-weight: bold; border: none; cursor: pointer;">SAVE CSV</button>` : ''}
                                <button id="btn-copy" style="background: transparent; color: var(--prm); font-weight: bold; border: none; cursor: pointer;">COPY</button>
                            </div>
                        </div>
                        <textarea id="outBox" class="cyber-textarea" readonly placeholder="Result will appear here...">${this.state.outputVal}</textarea>
                    </div>
                </div>

            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, textarea, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.isFirstVisit = false;
                this.state.currentView = 'main';
                localStorage.setItem('app_visited_syntax_breach', 'true');
                this.render();
            });
        }

        root.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.mode = btn.getAttribute('data-mode');
                this.processData();
                this.render();
            });
        });

        const inBox = root.querySelector('#inBox');
        if (inBox) {
            inBox.addEventListener('input', (e) => {
                this.state.inputVal = e.target.value;
                this.processData();
            });
        }

        const btnClear = root.querySelector('#btn-clear');
        if(btnClear) btnClear.addEventListener('click', () => {
            this.state.inputVal = '';
            this.state.outputVal = '';
            this.render();
        });

        const btnCopy = root.querySelector('#btn-copy');
        if(btnCopy) btnCopy.addEventListener('click', () => this.copyOutput());

        const btnDl = root.querySelector('#btn-dl');
        if(btnDl) btnDl.addEventListener('click', () => this.downloadCSV());
    }
})