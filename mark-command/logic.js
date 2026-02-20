({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        markdown: '# PROJECT TITLE\n\nDescribe your awesome logic here.\n\n## FEATURES\n- Fast\n- Secure\n- Blue',
        htmlPreview: '<h1>PROJECT TITLE</h1><p>Describe your awesome logic here.</p><h2>FEATURES</h2><ul><li>Fast</li><li>Secure</li><li>Blue</li></ul>',
        libLoaded: false
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': '#06b6d4', /* Cyan Card Background Wajib */
            '--glass-border': '1px solid #2563eb',
            '--txt': '#1e3a8a', /* Deep Blue */
            '--txt-dim': '#1d4ed8', /* Blue Text */
            '--prm': '#2563eb', /* Solid Blue */
            '--scs': '#2563eb',
            '--err': '#ef4444',
            '--brd': '#3b82f6',
            '--surface': '#3b82f6',
            '--shadow': '0 4px 15px rgba(37, 99, 235, 0.3)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': '#06b6d4',
            '--glass-border': '1px solid #2563eb',
            '--txt': '#1e3a8a',
            '--txt-dim': '#1d4ed8',
            '--prm': '#2563eb',
            '--scs': '#2563eb',
            '--err': '#ef4444',
            '--brd': '#3b82f6',
            '--surface': '#3b82f6',
            '--shadow': '0 4px 15px rgba(37, 99, 235, 0.3)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_mark_command');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.loadParser();
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

    loadParser() {
        if (window.marked) {
            this.state.libLoaded = true;
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        script.onload = () => {
            this.state.libLoaded = true;
            this.updatePreview();
            this.render();
        };
        document.head.appendChild(script);
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

    updatePreview() {
        if(window.marked) {
            this.state.htmlPreview = window.marked.parse(this.state.markdown);
        }
    },

    downloadMD() {
        const blob = new Blob([this.state.markdown], { type: "text/markdown;charset=utf-8" });
        this.saveToDevice(blob, "README.md", "text/markdown");
    },

    insertTemplate(type) {
        if (type === 'api') {
            this.state.markdown = "## API ENDPOINTS\n\n### `GET /users`\nFetch all users.\n\n**Response**\n```json\n[\n  { \"id\": 1, \"name\": \"Blue User\" }\n]\n```";
        } else {
            this.state.markdown = "# PROJECT TITLE\n\nDescribe your awesome logic here.";
        }
        this.updatePreview();
        this.render();
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
                    background: rgba(37, 99, 235, 0.1);
                    border: 2px solid var(--prm);
                    color: var(--txt); /* Blue text */
                    font-family: monospace; font-size: 14px;
                    padding: 16px; border-radius: 12px;
                    width: 100%; height: 400px;
                    outline: none; resize: none;
                }
                .cyber-textarea::placeholder { color: #1e3a8a; opacity: 0.6; }

                .preview-box {
                    background: rgba(37, 99, 235, 0.05);
                    border: 2px dashed var(--prm);
                    border-radius: 12px; padding: 16px;
                    height: 400px; overflow-y: auto;
                    color: var(--txt);
                }

                .preview-box h1, .preview-box h2 { font-weight: 900; margin-bottom: 10px; color: var(--txt); border-bottom: 1px solid var(--brd); padding-bottom: 5px; }
                .preview-box p { margin-bottom: 10px; line-height: 1.6; }
                .preview-box ul { list-style: disc inside; margin-left: 20px; margin-bottom: 10px; }
                .preview-box pre { background: var(--prm); color: #bfdbfe; padding: 10px; border-radius: 8px; overflow-x: auto; }

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
                        MARK COMMAND
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        README Architect. Documentation is the face of your code. Write beautiful Markdown directly in your browser.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">LAUNCH EDITOR</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        return `
            <div style="width: 100%; display: flex; flex-direction: column; gap: 20px;">

                <div class="glass-panel" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; gap: 10px;">
                        <button class="btn tpl-btn" data-type="basic" style="padding: 8px 16px; font-size: 0.8rem;">BASIC TPL</button>
                        <button class="btn tpl-btn" data-type="api" style="padding: 8px 16px; font-size: 0.8rem;">API DOCS</button>
                    </div>
                    <button id="btn-dl" class="btn" style="padding: 8px 16px; font-size: 0.8rem;">DOWNLOAD .MD</button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }">
                    <div class="glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 800; color: var(--txt);">MARKDOWN SOURCE</span>
                        </div>
                        <textarea id="md-input" class="cyber-textarea" placeholder="Start typing...">${this.state.markdown}</textarea>
                    </div>

                    <div class="glass-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span style="font-weight: 800; color: var(--txt);">LIVE PREVIEW</span>
                        </div>
                        <div class="preview-box">
                            ${this.state.libLoaded ? this.state.htmlPreview : '<span style="color: var(--txt);">Loading parser...</span>'}
                        </div>
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
                localStorage.setItem('app_visited_mark_command', 'true');
                this.render();
            });
        }

        const mdInput = root.querySelector('#md-input');
        if (mdInput) {
            mdInput.addEventListener('input', (e) => {
                this.state.markdown = e.target.value;
                this.updatePreview();
                const previewBox = root.querySelector('.preview-box');
                if (previewBox) previewBox.innerHTML = this.state.htmlPreview;
            });
        }

        root.querySelectorAll('.tpl-btn').forEach(btn => {
            btn.addEventListener('click', () => this.insertTemplate(btn.getAttribute('data-type')));
        });

        const btnDl = root.querySelector('#btn-dl');
        if(btnDl) btnDl.addEventListener('click', () => this.downloadMD());
    }
})