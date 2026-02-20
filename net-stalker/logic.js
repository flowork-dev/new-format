({
    state: {
        isFirstVisit: true,
        target: '',
        isScanning: false,
        scanResult: null,
        error: null,
        history: [],
        activeTab: 'overview' // overview, headers, dns
    },

    sys: null,
    observer: null,

    // DEFINISI TEMA (Sesuai Standar OS)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(10, 15, 20, 0.85)',
            '--glass-border': '1px solid rgba(0, 255, 65, 0.2)', // Matrix Hint
            '--txt': '#e0e0e0',
            '--txt-dim': '#94a3b8',
            '--prm': '#00ff41', // Hacker Green
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            '--font-mono': "'Fira Code', 'Courier New', monospace"
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '--font-mono': "'Courier New', monospace"
        }
    },

    mount(sys) {
        this.sys = sys;
        this.loadHistory();

        const hasVisited = localStorage.getItem('app_visited_netstalker');
        if (hasVisited) {
            this.state.isFirstVisit = false;
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

    // --- HELPER FUNCTION (WAJIB ADA - PROTOKOL SAVE) ---
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

    // --- LOGIC ---

    loadHistory() {
        const saved = localStorage.getItem('netstalker_history');
        if (saved) {
            try { this.state.history = JSON.parse(saved); } catch(e) {}
        }
    },

    saveHistory(target) {
        if (!this.state.history.includes(target)) {
            this.state.history.unshift(target);
            if (this.state.history.length > 5) this.state.history.pop();
            localStorage.setItem('netstalker_history', JSON.stringify(this.state.history));
        }
    },

    async startScan() {
        let target = this.state.target.trim();
        if (!target) return this.sys.toast ? this.sys.toast('Target required', 'error') : alert('Target required');

        // Clean target
        target = target.replace(/^https?:\/\//, '').replace(/\/$/, '');
        this.state.target = target;

        this.state.isScanning = true;
        this.state.scanResult = null;
        this.state.error = null;
        this.render(); // Re-render to show loading

        try {
            // [MOCK] Simulation for UI testing since backend might not be ready
            await new Promise(r => setTimeout(r, 1500));
            const mockData = {
                target: target,
                ip: '104.21.55.' + Math.floor(Math.random() * 255),
                server: 'Cloudflare',
                poweredBy: 'Next.js',
                score: Math.floor(Math.random() * 40) + 60,
                headers: {
                    'server': 'cloudflare',
                    'content-type': 'text/html; charset=utf-8',
                    'x-frame-options': 'DENY',
                    'x-powered-by': 'Next.js'
                }
            };

            this.state.scanResult = mockData;
            this.saveHistory(target);
            this.state.activeTab = 'overview';

        } catch (e) {
            this.state.error = e.message;
        } finally {
            this.state.isScanning = false;
            this.render();
            // Re-bind events after render update
            this.bindEvents();
        }
    },

    useHistory(val) {
        this.state.target = val;
        this.startScan();
    },

    setTab(tab) {
        this.state.activeTab = tab;
        this.render();
        this.bindEvents();
    },

    // --- RENDERERS ---

    render() {
        const { target, isScanning, scanResult, error, history, activeTab } = this.state;

        // Dashboard Content Logic
        let dashboardContent = '';
        if (scanResult) {
            if (activeTab === 'overview') {
                dashboardContent = `
                    <div class="dashboard-grid fade-in">
                        <div class="score-card">
                            <div class="score-val">${scanResult.score || 0}</div>
                            <div class="score-label">Security Score</div>
                        </div>
                        <div class="glass-panel info-panel">
                            <div class="data-row"><span class="key">Target</span> <span class="val highlight">${scanResult.target}</span></div>
                            <div class="data-row"><span class="key">IP Address</span> <span class="val">${scanResult.ip}</span></div>
                            <div class="data-row"><span class="key">Server</span> <span class="val">${scanResult.server}</span></div>
                            <div class="data-row"><span class="key">Tech Stack</span> <span class="val">${scanResult.poweredBy}</span></div>
                        </div>
                    </div>
                `;
            } else if (activeTab === 'headers') {
                const headers = scanResult.headers || {};
                const list = Object.entries(headers).map(([k, v]) =>
                    `<div class="data-row"><span class="key">${k}</span> <span class="val mono">${v}</span></div>`
                ).join('');
                dashboardContent = `<div class="glass-panel fade-in">${list}</div>`;
            } else if (activeTab === 'dns') {
                dashboardContent = `
                    <div class="glass-panel fade-in">
                        <div class="data-row"><span class="key">A Record</span> <span class="val mono">${scanResult.ip}</span></div>
                        <div class="data-row"><span class="key">MX Record</span> <span class="val mono">mail.protection.outlook.com</span></div>
                        <div class="data-row"><span class="key">TXT Record</span> <span class="val mono">v=spf1 include:_spf.google.com ~all</span></div>
                    </div>
                `;
            }
        }

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">

                    <div class="header-section">
                        <div class="brand">
                            <span class="icon">📡</span>
                            <h1>NET STALKER</h1>
                        </div>
                        <div class="status-indicator ${isScanning ? 'blink' : ''}">
                            ${isScanning ? 'SCANNING...' : 'SYSTEM READY'}
                        </div>
                    </div>

                    <div class="search-container glass-panel">
                        <div class="search-box">
                            <input type="text" id="inp-target" placeholder="domain.com or IP" value="${target}" ${isScanning ? 'disabled' : ''}>
                            <button id="btn-scan" class="btn" ${isScanning ? 'disabled' : ''}>
                                ${isScanning ? 'ABORT' : 'SCAN'}
                            </button>
                        </div>

                        ${history.length > 0 ? `
                            <div class="history-pills">
                                ${history.map(h => `<span class="pill">${h}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>

                    ${error ? `
                        <div class="glass-panel error-panel fade-in">
                            <strong>SYSTEM ERROR:</strong> ${error}
                        </div>
                    ` : ''}

                    ${scanResult ? `
                        <div class="tabs-container">
                            <div class="tabs">
                                <div class="tab ${activeTab === 'overview' ? 'active' : ''}" id="tab-overview">OVERVIEW</div>
                                <div class="tab ${activeTab === 'headers' ? 'active' : ''}" id="tab-headers">HEADERS</div>
                                <div class="tab ${activeTab === 'dns' ? 'active' : ''}" id="tab-dns">DNS</div>
                            </div>
                        </div>
                        ${dashboardContent}

                        <div style="margin-top: 20px; text-align: center;">
                             <button id="btn-export" class="btn secondary">Save Report</button>
                        </div>
                    ` : ''}

                    <div class="footer-info">
                        NetStalker v2.0 | Flowork Cyber Intelligence
                    </div>

                </div>
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Inter', sans-serif;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 50px; padding-bottom: 50px;
                    scrollbar-width: none; -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 800px; margin: auto;
                    padding: 20px; box-sizing: border-box;
                    display: flex; flex-direction: column;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 16px; padding: 25px;
                    box-shadow: var(--shadow);
                    margin-bottom: 20px;
                }

                .btn {
                    background: var(--prm); color: #000; border: none;
                    padding: 12px 24px; border-radius: 8px; cursor: pointer;
                    font-weight: 800; letter-spacing: 1px; transition: 0.2s;
                    text-transform: uppercase;
                    flex-shrink: 0; /* Mencegah tombol kegencet */
                }
                .btn:active { transform: scale(0.95); }
                .btn.secondary { background: transparent; border: 1px solid var(--prm); color: var(--prm); }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }

                /* HEADER */
                .header-section {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 30px;
                }
                .brand { display: flex; align-items: center; gap: 15px; }
                .brand h1 { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 2px; color: var(--prm); text-shadow: 0 0 10px var(--prm-dim); }
                .brand .icon { font-size: 28px; }

                .status-indicator {
                    font-family: var(--font-mono); font-size: 12px;
                    background: var(--surface); color: var(--prm);
                    padding: 6px 12px; border: 1px solid var(--prm);
                    border-radius: 6px;
                }
                .blink { animation: blinker 1s linear infinite; background: var(--prm); color: #000; }
                @keyframes blinker { 50% { opacity: 0.5; } }

                /* SEARCH */
                .search-box { display: flex; gap: 10px; margin-bottom: 15px; }

                #inp-target {
                    flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--brd);
                    padding: 15px; color: var(--txt); font-family: var(--font-mono);
                    font-size: 16px; border-radius: 8px; outline: none;
                }
                #inp-target:focus { border-color: var(--prm); box-shadow: 0 0 15px var(--prm-dim); }

                /* MOBILE RESPONSIVE FIX (Bagian ini yang memperbaiki tampilan mobile) */
                @media (max-width: 600px) {
                    .search-box {
                        flex-direction: column; /* Jadi atas-bawah */
                    }
                    .search-box .btn {
                        width: 100%; /* Tombol jadi full width */
                    }
                    .header-section {
                        flex-direction: column; align-items: flex-start; gap: 10px;
                    }
                    .brand h1 { font-size: 22px; }
                }

                .history-pills { display: flex; gap: 8px; flex-wrap: wrap; }
                .pill {
                    background: rgba(255,255,255,0.05); border: 1px solid var(--brd);
                    padding: 4px 12px; border-radius: 20px; font-size: 11px;
                    cursor: pointer; color: var(--txt-dim); transition: 0.2s;
                }
                .pill:hover { border-color: var(--prm); color: var(--prm); }

                /* DASHBOARD */
                .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                .score-card {
                    text-align: center; padding: 30px; border: var(--glass-border);
                    background: linear-gradient(180deg, var(--prm-dim) 0%, transparent 100%);
                    border-radius: 16px; margin-bottom: 20px;
                }
                .score-val { font-size: 64px; font-weight: 900; color: var(--prm); line-height: 1; text-shadow: 0 0 20px var(--prm-dim); }
                .score-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; margin-top: 10px; }

                /* DATA LISTS */
                .data-row {
                    display: flex; justify-content: space-between; padding: 12px 0;
                    border-bottom: 1px solid var(--brd); font-size: 14px; align-items: center;
                }
                .data-row:last-child { border: none; }
                .key { color: var(--txt-dim); font-weight: 500; }
                .val { color: var(--txt); text-align: right; word-break: break-all; max-width: 60%; }
                .val.highlight { color: var(--prm); font-weight: bold; }
                .val.mono { font-family: var(--font-mono); font-size: 12px; }

                /* TABS */
                .tabs-container { margin-bottom: 20px; }
                .tabs { display: flex; border-bottom: 1px solid var(--brd); gap: 20px; }
                .tab {
                    padding: 10px 0; cursor: pointer; color: var(--txt-dim);
                    border-bottom: 2px solid transparent; font-weight: 600; font-size: 13px; letter-spacing: 1px;
                }
                .tab.active { color: var(--prm); border-color: var(--prm); }

                .error-panel { border-color: var(--err); color: var(--err); background: rgba(220, 38, 38, 0.1); }

                .footer-info { text-align: center; font-size: 11px; color: var(--txt-dim); margin-top: 30px; opacity: 0.4; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const root = this.sys.root;
        const addClick = (id, fn) => { const el = root.querySelector(id); if(el) el.onclick = fn; };

        // Prevent click-through
        root.querySelectorAll('button, input, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        // Input Binding
        const inp = root.querySelector('#inp-target');
        if (inp) {
            inp.oninput = (e) => this.state.target = e.target.value;
            inp.onkeydown = (e) => { if(e.key === 'Enter') this.startScan(); };
        }

        addClick('#btn-scan', () => this.startScan());

        // Tab Navigation
        addClick('#tab-overview', () => this.setTab('overview'));
        addClick('#tab-headers', () => this.setTab('headers'));
        addClick('#tab-dns', () => this.setTab('dns'));

        // Export / Save Report
        addClick('#btn-export', () => {
             const report = JSON.stringify(this.state.scanResult, null, 2);
             const blob = new Blob([report], {type: "application/json"});
             this.saveToDevice(blob, `scan_report_${this.state.target}.json`, "application/json");
        });

        // History Chips
        root.querySelectorAll('.pill').forEach(pill => {
            pill.onclick = () => this.useHistory(pill.innerText);
        });
    }
})