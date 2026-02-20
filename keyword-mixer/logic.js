({
    state: {
        isFirstVisit: true,
        currentView: 'lander', // 'lander' or 'main'
        mode: 'mixer', // 'mixer' or 'density'
        colA: 'Jual\nBeli\nPromo',
        colB: 'Sepatu\nTas\nBaju',
        colC: 'Jakarta\nMurah\nOnline',
        matchBroad: true,
        matchPhrase: false,
        matchExact: false,
        generatedResult: '',
        densityText: '',
        densityKeywords: '',
        densityAnalysis: []
    },

    sys: null,
    observer: null,
    appName: 'keyword-mixer',

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.9)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8', // Biru Neon
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
            '--prm': '#2563eb', // Biru Tegas (Visible in Light)
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
        this.observer = new MutationObserver((mList) => {
            mList.forEach((m) => {
                if (m.attributeName === 'data-theme') this.onThemeChange(document.documentElement.getAttribute('data-theme'));
            });
        });
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        for (const [key, value] of Object.entries(theme)) this.sys.root.style.setProperty(key, value);
    },

    // --- CORE LOGIC ---
    processMixer() {
        const arrA = this.state.colA.split('\n').filter(x => x.trim());
        const arrB = this.state.colB.split('\n').filter(x => x.trim());
        const arrC = this.state.colC.split('\n').filter(x => x.trim());

        let results = [];
        if (arrA.length && arrB.length) {
            arrA.forEach(a => {
                arrB.forEach(b => {
                    if (arrC.length) {
                        arrC.forEach(c => results.push(`${a} ${b} ${c}`));
                    } else {
                        results.push(`${a} ${b}`);
                    }
                });
            });
        }

        let final = [];
        results.forEach(r => {
            const clean = r.trim();
            if (this.state.matchBroad) final.push(clean);
            if (this.state.matchPhrase) final.push(`"${clean}"`);
            if (this.state.matchExact) final.push(`[${clean}]`);
        });

        this.state.generatedResult = final.join('\n');
        this.updateSurgicalUI();
    },

    processDensity() {
        const text = this.state.densityText.toLowerCase();
        const words = text.match(/\b\w+\b/g) || [];
        const totalWords = words.length;
        const targets = this.state.densityKeywords.toLowerCase().split('\n').filter(k => k.trim());

        let analysis = [];
        if (targets.length > 0) {
            targets.forEach(k => {
                const kTrim = k.trim();
                const escapedK = kTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const count = (text.match(new RegExp(`\\b${escapedK}\\b`, 'gi')) || []).length;
                analysis.push({
                    word: kTrim,
                    count: count,
                    percent: totalWords ? ((count / totalWords) * 100).toFixed(2) : 0
                });
            });
        } else {
            const freq = {};
            words.forEach(w => freq[w] = (freq[w] || 0) + 1);
            analysis = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([word, count]) => ({
                    word,
                    count,
                    percent: totalWords ? ((count / totalWords) * 100).toFixed(2) : 0
                }));
        }

        this.state.densityAnalysis = analysis;
        this.updateSurgicalUI();
    },

    updateSurgicalUI() {
        const root = this.sys.root;
        // Mixer Updates
        const outMixer = root.querySelector('#out-mixer');
        if (outMixer) outMixer.value = this.state.generatedResult;

        const countDisplay = root.querySelector('#mixer-count');
        if (countDisplay) countDisplay.innerText = this.state.generatedResult ? this.state.generatedResult.split('\n').length : 0;

        // Density Updates
        const listDensity = root.querySelector('#density-list');
        if (listDensity) {
            if (this.state.densityAnalysis.length === 0) {
                listDensity.innerHTML = `<div style="text-align:center; color:var(--txt-dim); font-size:12px; padding:20px;">No analysis data.</div>`;
            } else {
                listDensity.innerHTML = this.state.densityAnalysis.map(item => `
                    <div class="analysis-item">
                        <span class="word">${item.word}</span>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="color:var(--prm); font-weight:bold;">${item.count}x</span>
                            <span class="percent-badge" style="background:${parseFloat(item.percent) > 3 ? 'var(--err)' : 'var(--scs)'}22; color:${parseFloat(item.percent) > 3 ? 'var(--err)' : 'var(--scs)'};">
                                ${item.percent}%
                            </span>
                        </div>
                    </div>
                `).join('');
            }
        }
    },

    render() {
        const content = this.state.currentView === 'lander' ? this.renderLander() : this.renderMain();
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono&display=swap');
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: scroll; padding-top: 70px; padding-bottom: 90px;
                    scrollbar-width: none;
                }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 20px; box-sizing: border-box; }

                .glass-panel {
                    background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); border-radius: 24px; padding: 25px; box-shadow: var(--shadow);
                    width: 100%; box-sizing: border-box; margin-bottom: 20px;
                }

                .tab-nav { display: flex; gap: 10px; margin-bottom: 20px; }
                .tab-btn {
                    flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--brd);
                    background: var(--surface); color: var(--txt-dim); cursor: pointer;
                    font-weight: 700; text-transform: uppercase; font-size: 11px; transition: all 0.2s;
                }
                .tab-btn.active { background: var(--prm); color: #fff; border-color: var(--prm); box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); }

                .btn {
                    background: var(--prm); color: #fff; border: none; padding: 14px 28px;
                    border-radius: 12px; cursor: pointer; font-weight: 700; text-transform: uppercase;
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
                }
                .btn:active { transform: scale(0.95); }

                .input-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
                @media (max-width: 600px) { .input-grid { grid-template-columns: 1fr; } }

                .textarea-box {
                    width: 100%; box-sizing: border-box; background: var(--surface); border: 1px solid var(--brd);
                    border-radius: 16px; padding: 12px; color: var(--prm) !important; /* WAJIB BIRU */
                    font-family: 'JetBrains Mono', monospace; font-size: 13px; resize: none; outline: none;
                }
                .textarea-box:focus { border-color: var(--prm); }

                .match-options { display: flex; gap: 15px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
                .opt-chip {
                    padding: 8px 16px; border-radius: 30px; border: 1px solid var(--brd);
                    font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s; color: var(--txt-dim);
                }
                .opt-chip.active { border-color: var(--prm); color: var(--prm); background: rgba(37, 99, 235, 0.1); }

                .analysis-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px; border-bottom: 1px solid var(--brd); font-family: 'JetBrains Mono', monospace; font-size: 12px;
                }
                .analysis-item .word { text-transform: uppercase; font-weight: bold; }
                .percent-badge { padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
        this.updateSurgicalUI();
    },

    renderLander() {
        return `
            <div class="glass-panel fade-in" style="text-align: center; max-width: 600px; margin: auto;">
                <div style="width:60px; height:60px; background:var(--prm); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 0 20px var(--prm);">
                    <i class="material-icons" style="color:white; font-size:32px;">shuffle</i>
                </div>
                <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 10px; letter-spacing: -1px;">KEYWORD <span style="color:var(--prm);">MIXER</span></h1>
                <p style="color: var(--txt-dim); margin-bottom: 30px; font-size: 14px; line-height: 1.6;">
                    Generate thousands of SEO combinations or analyze keyword density in seconds. <br>Built for Google Ads & Content Strategy.
                </p>
                <button id="btn-start" class="btn" style="width: 100%;">INITIALIZE SYSTEM</button>
            </div>
        `;
    },

    renderMain() {
        const { mode, colA, colB, colC, densityText, densityKeywords } = this.state;
        return `
            <div class="tab-nav">
                <button class="tab-btn ${mode === 'mixer' ? 'active' : ''}" data-mode="mixer">Mixer Engine</button>
                <button class="tab-btn ${mode === 'density' ? 'active' : ''}" data-mode="density">Density Audit</button>
            </div>

            ${mode === 'mixer' ? `
                <div class="glass-panel">
                    <div class="input-grid">
                        <div>
                            <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">COL A (ACTION)</div>
                            <textarea id="col-a" class="textarea-box" style="height:120px;">${colA}</textarea>
                        </div>
                        <div>
                            <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">COL B (ENTITY)</div>
                            <textarea id="col-b" class="textarea-box" style="height:120px;">${colB}</textarea>
                        </div>
                        <div>
                            <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">COL C (MODIFIER)</div>
                            <textarea id="col-c" class="textarea-box" style="height:120px;">${colC}</textarea>
                        </div>
                    </div>

                    <div class="match-options">
                        <div class="opt-chip ${this.state.matchBroad ? 'active' : ''}" data-opt="matchBroad">BROAD</div>
                        <div class="opt-chip ${this.state.matchPhrase ? 'active' : ''}" data-opt="matchPhrase">"PHRASE"</div>
                        <div class="opt-chip ${this.state.matchExact ? 'active' : ''}" data-opt="matchExact">[EXACT]</div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; align-items:center;">
                            <span style="font-size:10px; font-weight:900; color:var(--scs);">OUTPUT RESULT (<span id="mixer-count">0</span>)</span>
                            <button id="btn-copy-mixer" style="background:transparent; border:none; color:var(--prm); font-size:10px; font-weight:900; cursor:pointer;">COPY ALL</button>
                        </div>
                        <textarea id="out-mixer" class="textarea-box" style="height:150px; background:rgba(0,0,0,0.1);" readonly></textarea>
                    </div>

                    <button id="btn-reset" class="btn" style="width:100%; background:var(--surface); color:var(--err); border:1px solid var(--err); box-shadow:none;">RESET ALL</button>
                </div>
            ` : `
                <div class="glass-panel">
                    <div style="margin-bottom:20px;">
                        <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">TARGET CONTENT</div>
                        <textarea id="density-text" class="textarea-box" style="height:150px;" placeholder="Paste article content here...">${densityText}</textarea>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                        <div>
                            <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">TARGET KEYWORDS</div>
                            <textarea id="density-keywords" class="textarea-box" style="height:150px;" placeholder="Keywords per line...">${densityKeywords}</textarea>
                        </div>
                        <div>
                            <div style="font-size:10px; font-weight:900; margin-bottom:8px; color:var(--txt-dim);">ANALYSIS REPORT</div>
                            <div id="density-list" class="textarea-box" style="height:150px; overflow-y:auto; padding:0;"></div>
                        </div>
                    </div>
                </div>
            `}
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, textarea, .opt-chip').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#btn-start');
        if (startBtn) startBtn.onclick = () => {
            localStorage.setItem('app_visited_' + this.appName, 'true');
            this.state.currentView = 'main';
            this.render();
        };

        // Tab Switching
        root.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                this.state.mode = btn.dataset.mode;
                this.render();
            };
        });

        // Mixer Events
        ['col-a', 'col-b', 'col-c'].forEach(id => {
            const el = root.querySelector('#' + id);
            if (el) el.oninput = (e) => {
                const key = id === 'col-a' ? 'colA' : id === 'col-b' ? 'colB' : 'colC';
                this.state[key] = e.target.value;
                this.processMixer();
            };
        });

        root.querySelectorAll('.opt-chip').forEach(chip => {
            chip.onclick = () => {
                this.state[chip.dataset.opt] = !this.state[chip.dataset.opt];
                this.render(); // Re-render to update chip active state
                this.processMixer();
            };
        });

        const copyMixer = root.querySelector('#btn-copy-mixer');
        if (copyMixer) copyMixer.onclick = () => {
            if (!this.state.generatedResult) return this.sys.toast("Result is empty", "error");
            navigator.clipboard.writeText(this.state.generatedResult);
            this.sys.toast("Copied to clipboard");
        };

        const resetBtn = root.querySelector('#btn-reset');
        if (resetBtn) resetBtn.onclick = () => {
            this.state.colA = ''; this.state.colB = ''; this.state.colC = '';
            this.state.generatedResult = '';
            this.render();
        };

        // Density Events
        const dText = root.querySelector('#density-text');
        if (dText) dText.oninput = (e) => {
            this.state.densityText = e.target.value;
            this.processDensity();
        };

        const dKeys = root.querySelector('#density-keywords');
        if (dKeys) dKeys.oninput = (e) => {
            this.state.densityKeywords = e.target.value;
            this.processDensity();
        };
    }
})