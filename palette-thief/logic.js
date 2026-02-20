({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        url: '',
        colors: [],
        isLoading: false
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Wajib sinkron dengan OS)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8', /* Bright Cyan/Blue for elegant lines */
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb', /* Deep Blue */
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_palette_thief');
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

    // --- PROTOKOL DOWNLOAD HYBRID (ANTI GAGAL) ---
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

    async scanUrl() {
        if(!this.state.url) {
            if(this.sys && this.sys.toast) this.sys.toast("Please enter a URL first!", "error");
            return;
        }

        this.state.isLoading = true;
        this.state.colors = [];
        this.render();

        try {
            const res = await fetch('/api/v1/palette-thief/process', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ url: this.state.url })
            });
            const result = await res.json();

            if(result.success) {
                this.state.colors = result.data.colors || [];
            } else {
                throw new Error(result.error || "Extraction failed");
            }
        } catch (e) {
            if(this.sys && this.sys.toast) this.sys.toast("Failed to extract: " + e.message, "error");
        } finally {
            this.state.isLoading = false;
            this.render();
        }
    },

    copyColor(hex) {
        navigator.clipboard.writeText(hex).then(() => {
            if(this.sys && this.sys.toast) this.sys.toast("COPIED: " + hex, "success");
        });
    },

    downloadJSON() {
        if(this.state.colors.length === 0) return;
        const blob = new Blob([JSON.stringify(this.state.colors, null, 2)], {type: "application/json"});
        this.saveToDevice(blob, "palette_" + Date.now() + ".json", "application/json");
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
                    padding-top: 85px; padding-bottom: 85px; /* Safe Zones Wajib */

                    /* Hide Scrollbar */
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
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 24px; padding: 30px;
                    box-shadow: var(--shadow);
                }

                /* TRANSPARENT ELEGANT CARD WAJIB */
                .card-transparent {
                    background: transparent;
                    border: 2px solid var(--prm);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 0 25px rgba(37, 99, 235, 0.15);
                    width: 100%;
                    position: relative;
                }

                .card-transparent-light {
                    background: transparent;
                    border: 1px solid var(--prm);
                    border-radius: 12px;
                    padding: 16px;
                }

                /* BUTTON BIRU WAJIB */
                .btn {
                    background: #2563eb; color: #ffffff; border: none;
                    padding: 14px 28px; border-radius: 12px; cursor: pointer;
                    font-weight: 700; transition: transform 0.2s, background 0.2s;
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .btn:hover { background: #1d4ed8; }
                .btn:active { transform: scale(0.95); }

                /* FORMS */
                .cyber-input {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--brd);
                    color: var(--txt);
                    font-family: monospace;
                    padding: 16px 20px;
                    border-radius: 12px;
                    width: 100%;
                    outline: none;
                    transition: border-color 0.3s, box-shadow 0.3s;
                }
                .cyber-input:focus {
                    border-color: var(--prm);
                    box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
                }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* COLOR SWATCH */
                .swatch-card {
                    background: transparent;
                    border: 1px solid var(--brd);
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .swatch-card:hover {
                    transform: scale(1.05);
                    border-color: var(--prm);
                    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.2);
                }

                /* UTILS */
                .text-prm { color: var(--prm); }
                .grid-responsive {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 16px;
                }
                .badge {
                    background: rgba(37, 99, 235, 0.1);
                    color: var(--prm);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    border: 1px solid var(--prm);
                    display: inline-block;
                    margin-bottom: 16px;
                }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div style="max-width: 800px; width: 100%;">
                <div class="badge">VISUAL INTELLIGENCE V2</div>

                <h1 style="font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 24px;">
                    GOOD ARTISTS COPY.<br>
                    <span class="text-prm">GREAT ARTISTS STEAL.</span>
                </h1>

                <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; max-width: 600px; line-height: 1.6;">
                    Don't waste time on trial and error. Extract design DNA from favorite websites (Apple, Stripe, Awwwards) and steal their color palette in seconds.
                </p>

                <div class="card-transparent" style="margin-bottom: 30px;">
                    <h3 style="font-weight: 800; margin-bottom: 20px; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                        <span class="text-prm">▶</span> How to Extract Colors
                    </h3>

                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div style="display: flex; gap: 16px;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--prm); color: var(--prm); display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                            <div>
                                <div style="font-weight: bold; margin-bottom: 4px;">Input Target URL</div>
                                <div style="font-size: 0.85rem; color: var(--txt-dim);">Enter the website link you want to extract colors from.</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--prm); color: var(--prm); display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                            <div>
                                <div style="font-weight: bold; margin-bottom: 4px;">Scanning Engine</div>
                                <div style="font-size: 0.85rem; color: var(--txt-dim);">The bot will dissect the target's CSS/HTML code to find Hex codes.</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--prm); color: var(--prm); display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                            <div>
                                <div style="font-weight: bold; margin-bottom: 4px;">One-Click Copy</div>
                                <div style="font-size: 0.85rem; color: var(--txt-dim);">Click the generated colors to copy the Hex code to clipboard.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div class="card-transparent-light">
                        <h4 style="font-weight: bold; font-size: 0.9rem; margin-bottom: 8px;" class="text-prm">Creative Block Killer</h4>
                        <p style="font-size: 0.75rem; color: var(--txt-dim); line-height: 1.5;">Confused about choosing colors? Observe, Imitate, Modify is the ninja way. Instant competitor research.</p>
                    </div>
                    <div class="card-transparent-light">
                        <h4 style="font-weight: bold; font-size: 0.9rem; margin-bottom: 8px;" class="text-prm">Dev Friendly</h4>
                        <p style="font-size: 0.75rem; color: var(--txt-dim); line-height: 1.5;">Export palette results to JSON format so it's ready for the Developer team in coding projects.</p>
                    </div>
                </div>

                <div class="card-transparent-light" style="border-left: 4px solid var(--prm); margin-bottom: 40px;">
                    <h3 style="font-weight: bold; font-size: 0.9rem; margin-bottom: 4px;">CSS Extraction Engine</h3>
                    <p style="font-size: 0.75rem; color: var(--txt-dim);">Parses computed style and inline style from target websites in real-time.</p>
                </div>

                <button id="start-app-btn" class="btn" style="width: 100%; padding: 18px; font-size: 1.1rem;">LAUNCH EXTRACTOR</button>
            </div>
        `;
    },

    renderMainApp() {
        const { url, colors, isLoading } = this.state;

        let contentHtml = '';

        if (isLoading) {
            contentHtml = `
                <div style="padding: 60px 20px; text-align: center;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid rgba(37, 99, 235, 0.2); border-top-color: var(--prm); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                    <h3 style="font-weight: bold; font-size: 1.2rem; color: var(--prm); letter-spacing: 2px;">EXTRACTING VISUAL DATA...</h3>
                    <p style="color: var(--txt-dim); font-family: monospace; font-size: 0.85rem; margin-top: 10px;">Bypassing CORS... Parsing CSS...</p>
                </div>
            `;
        } else if (colors.length > 0) {
            const gridItems = colors.map(hex => `
                <div class="swatch-card" data-hex="${hex}">
                    <div style="height: 100px; width: 100%; background-color: ${hex};"></div>
                    <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--brd);">
                        <span style="font-family: monospace; font-size: 12px; font-weight: bold; color: var(--txt);">${hex}</span>
                        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${hex}; border: 1px solid var(--brd);"></div>
                    </div>
                </div>
            `).join('');

            contentHtml = `
                <div class="fade-in">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 10px;">
                        <div style="font-family: monospace; font-size: 0.9rem; color: var(--txt-dim);">
                            FOUND: <span style="color: var(--prm); font-weight: bold; font-size: 1.1rem;">${colors.length}</span> COLORS
                        </div>
                        <button id="dlBtn" style="background: transparent; border: none; color: var(--prm); cursor: pointer; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">
                            <span>EXPORT JSON</span>
                        </button>
                    </div>
                    <div class="grid-responsive">
                        ${gridItems}
                    </div>
                </div>
            `;
        }

        return `
            <div style="width: 100%; max-width: 900px;">
                <div class="card-transparent" style="margin-bottom: 40px; padding: 30px;">
                    <h3 style="font-weight: 800; font-size: 1.2rem; margin-bottom: 24px; text-align: center; letter-spacing: 2px;">
                        <span class="text-prm">●</span> TARGET ACQUISITION
                    </h3>

                    <div style="display: flex; gap: 16px; flex-direction: column; sm:flex-direction: row;">
                        <input
                            type="text"
                            id="urlInput"
                            class="cyber-input"
                            placeholder="https://FLOWORK.CLOUD"
                            value="${url}"
                        >
                        <button id="scanBtn" class="btn" style="padding: 16px 32px; min-width: 180px;">
                            SCAN URL
                        </button>
                    </div>

                    <p style="text-align: center; font-size: 0.75rem; color: var(--txt-dim); font-family: monospace; margin-top: 16px;">
                        *Engine will extract HEX codes from HTML/CSS source code.
                    </p>
                </div>

                ${contentHtml}
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        // Prevent click-through
        root.querySelectorAll('button, input, .glass-panel, .card-transparent, .card-transparent-light, .swatch-card').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        // Launch Button
        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.isFirstVisit = false;
                this.state.currentView = 'main';
                localStorage.setItem('app_visited_palette_thief', 'true');
                this.render();
            });
        }

        // App View Interactions
        const urlInput = root.querySelector('#urlInput');
        if (urlInput) {
            urlInput.addEventListener('input', (e) => this.state.url = e.target.value);
            urlInput.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') this.scanUrl();
            });
        }

        const scanBtn = root.querySelector('#scanBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.scanUrl());
        }

        const colorCards = root.querySelectorAll('.swatch-card');
        colorCards.forEach(card => {
            card.addEventListener('click', () => {
                const hex = card.getAttribute('data-hex');
                if (hex) this.copyColor(hex);
            });
        });

        const dlBtn = root.querySelector('#dlBtn');
        if (dlBtn) {
            dlBtn.addEventListener('click', () => this.downloadJSON());
        }
    }
})