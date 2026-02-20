({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        password: '',
        length: 16,
        options: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true
        },
        entropyScore: 0,
        history: [],
        showHistory: false
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Tactical Matrix Green)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(10, 15, 10, 0.95)',
            '--glass-border': '1px solid rgba(0, 255, 157, 0.2)',
            '--txt': '#e0f0ff',
            '--txt-dim': '#5c7a68',
            '--prm': '#00ff9d', // Matrix Green
            '--scs': '#00ff9d',
            '--err': '#ff4d4d',
            '--wrn': '#ffcc00',
            '--brd': 'rgba(0, 255, 157, 0.1)',
            '--surface': 'rgba(0, 20, 10, 0.6)',
            '--shadow': '0 10px 30px -5px rgba(0, 0, 0, 0.9)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#059669',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--wrn': '#f59e0b',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_pass_forge');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }

        // Initial Generate
        this.generatePassword();

        this.render();
        this.loadDependencies();

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

    loadDependencies() {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        this.sys.root.appendChild(fontLink);

        const gFont = document.createElement('link');
        gFont.rel = 'stylesheet';
        gFont.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;600;800&display=swap';
        this.sys.root.appendChild(gFont);
    },

    // --- HELPER FUNCTION (WAJIB ADA) ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving secure file...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    // --- CORE LOGIC ---

    generatePassword() {
        const { length, options } = this.state;
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
        };

        let chars = '';
        if (options.uppercase) chars += charset.uppercase;
        if (options.lowercase) chars += charset.lowercase;
        if (options.numbers) chars += charset.numbers;
        if (options.symbols) chars += charset.symbols;

        if (chars === '') {
            this.state.password = 'SELECT_OPTION_REQUIRED';
            this.state.entropyScore = 0;
            return;
        }

        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }

        this.state.password = password;
        this.calculateEntropy(password, chars.length);

        // Add to temp history
        if(this.state.currentView === 'main' && password !== 'SELECT_OPTION_REQUIRED') {
            this.state.history.unshift(password);
            if(this.state.history.length > 5) this.state.history.pop();
        }
    },

    calculateEntropy(password, poolSize) {
        // Entropy = length * log2(poolSize)
        const entropy = password.length * Math.log2(poolSize);
        this.state.entropyScore = Math.floor(entropy);
    },

    getStrengthLabel() {
        const score = this.state.entropyScore;
        if (score < 35) return { label: 'WEAK', color: 'var(--err)', width: '25%' };
        if (score < 59) return { label: 'MODERATE', color: 'var(--wrn)', width: '50%' };
        if (score < 90) return { label: 'STRONG', color: 'var(--prm)', width: '75%' };
        return { label: 'TACTICAL', color: '#00ccff', width: '100%' };
    },

    copyToClipboard() {
        const text = this.state.password;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.sys.toast("SECURE KEY COPIED", "success");
            });
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                this.sys.toast("SECURE KEY COPIED", "success");
            } catch (err) {
                this.sys.toast("Copy failed", "error");
            }
            document.body.removeChild(textArea);
        }
    },

    exportKey() {
        const content = `--- PASS FORGE SECURE KEY ---\n\nKEY: ${this.state.password}\nENTROPY: ${this.state.entropyScore} bits\nGENERATED: ${new Date().toLocaleString()}\n\n-----------------------------`;
        const blob = new Blob([content], { type: 'text/plain' });
        this.saveToDevice(blob, `SECURE_KEY_${Date.now()}.txt`, 'text/plain');
    },

    // --- ACTIONS ---

    enterApp() {
        this.state.isFirstVisit = false;
        this.state.currentView = 'main';
        localStorage.setItem('app_visited_pass_forge', 'true');
        this.render();
    },

    updateLength(val) {
        this.state.length = parseInt(val);
        const el = this.sys.root.querySelector('#len-val');
        if(el) el.innerText = val;
        this.generatePassword();
        this.updateDisplay();
    },

    toggleOption(key) {
        // Prevent disabling all options
        const activeCount = Object.values(this.state.options).filter(Boolean).length;
        if (activeCount === 1 && this.state.options[key]) {
            this.sys.toast("At least one option required", "error");
            return;
        }

        this.state.options[key] = !this.state.options[key];
        this.generatePassword();
        this.updateDisplay();

        // Update checkbox UI
        const btn = this.sys.root.querySelector(`#btn-opt-${key}`);
        if(btn) {
            btn.className = `opt-btn ${this.state.options[key] ? 'active' : ''}`;
            const icon = btn.querySelector('i');
            icon.className = this.state.options[key] ? 'fa-regular fa-square-check' : 'fa-regular fa-square';
        }
    },

    // Optimized rendering: Only update changed parts
    updateDisplay() {
        const root = this.sys.root;
        const passEl = root.querySelector('#password-display');
        const meterBar = root.querySelector('#meter-bar');
        const meterText = root.querySelector('#meter-text');

        if(passEl) passEl.value = this.state.password;

        const strength = this.getStrengthLabel();
        if(meterBar) {
            meterBar.style.width = strength.width;
            meterBar.style.backgroundColor = strength.color;
            meterBar.style.boxShadow = `0 0 10px ${strength.color}`;
        }
        if(meterText) {
            meterText.innerText = `${strength.label} (${this.state.entropyScore} bits)`;
            meterText.style.color = strength.color;
        }
    },

    // --- RENDERERS ---

    renderLander() {
        return `
            <div class="glass-panel fade-in lander-container">
                <div class="lander-icon">
                    <i class="fa-solid fa-key"></i>
                </div>
                <h1 class="orbitron-title">
                    PASS <span style="color: var(--prm);">FORGE</span>
                </h1>
                <p class="lander-desc">
                    Generate high-entropy credentials using military-grade randomization algorithms. Secure. Offline. Unbreakable.
                </p>
                <button id="btn-enter" class="btn btn-block btn-glow" style="margin-top: 40px;">
                    INITIALIZE FORGE
                </button>
                <div class="disclaimer">
                    <i class="fa-solid fa-shield-halved"></i> LOCAL ENCRYPTION ONLY
                </div>
            </div>
        `;
    },

    renderMainApp() {
        const strength = this.getStrengthLabel();

        return `
            <div class="fade-in main-layout">

                <div class="glass-panel display-panel">
                    <div class="label-tiny">GENERATED KEY</div>
                    <div class="input-wrapper">
                        <input id="password-display" type="text" readonly value="${this.state.password}">
                        <button id="btn-refresh" class="btn-icon">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>

                    <div class="strength-meter">
                        <div class="meter-bg">
                            <div id="meter-bar" style="width: ${strength.width}; background: ${strength.color}; box-shadow: 0 0 10px ${strength.color};"></div>
                        </div>
                        <div id="meter-text" class="meter-label" style="color: ${strength.color}">${strength.label} (${this.state.entropyScore} bits)</div>
                    </div>

                    <div class="action-grid">
                        <button id="btn-copy" class="btn btn-primary">
                            <i class="fa-solid fa-copy"></i> COPY KEY
                        </button>
                        <button id="btn-save" class="btn btn-secondary">
                            <i class="fa-solid fa-file-export"></i> SAVE .TXT
                        </button>
                    </div>
                </div>

                <div class="glass-panel control-panel">
                    <div class="slider-section">
                        <div class="flex-between">
                            <label class="label-tiny">LENGTH</label>
                            <span id="len-val" class="val-display">${this.state.length}</span>
                        </div>
                        <input id="range-len" type="range" min="8" max="64" value="${this.state.length}" class="slider">
                    </div>

                    <div class="options-grid">
                        ${this.renderOptionBtn('uppercase', 'ABC', 'Uppercase')}
                        ${this.renderOptionBtn('lowercase', 'abc', 'Lowercase')}
                        ${this.renderOptionBtn('numbers', '123', 'Numbers')}
                        ${this.renderOptionBtn('symbols', '#@&', 'Symbols')}
                    </div>
                </div>

                <div class="info-text">
                    <i class="fa-solid fa-lock"></i> floworok.cloud
                </div>
            </div>
        `;
    },

    renderOptionBtn(key, badge, label) {
        const isActive = this.state.options[key];
        return `
            <button id="btn-opt-${key}" class="opt-btn ${isActive ? 'active' : ''}" data-key="${key}">
                <div class="opt-left">
                    <i class="${isActive ? 'fa-regular fa-square-check' : 'fa-regular fa-square'}"></i>
                    <span>${label}</span>
                </div>
                <span class="badge">${badge}</span>
            </button>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        // Lander
        const btnEnter = root.querySelector('#btn-enter');
        if(btnEnter) btnEnter.onclick = () => this.enterApp();

        // Main Actions
        const btnRefresh = root.querySelector('#btn-refresh');
        if(btnRefresh) btnRefresh.onclick = () => {
            this.generatePassword();
            this.updateDisplay();
            // Animation effect
            const icon = btnRefresh.querySelector('i');
            icon.style.transition = 'transform 0.3s';
            icon.style.transform = 'rotate(180deg)';
            setTimeout(() => icon.style.transform = 'rotate(0deg)', 300);
        };

        const btnCopy = root.querySelector('#btn-copy');
        if(btnCopy) btnCopy.onclick = () => this.copyToClipboard();

        const btnSave = root.querySelector('#btn-save');
        if(btnSave) btnSave.onclick = () => this.exportKey();

        // Slider
        const rangeLen = root.querySelector('#range-len');
        if(rangeLen) rangeLen.oninput = (e) => this.updateLength(e.target.value);

        // Options
        root.querySelectorAll('.opt-btn').forEach(btn => {
            btn.onclick = (e) => {
                // Handle bubbling if clicked on child
                const key = e.currentTarget.dataset.key;
                this.toggleOption(key);
            }
        });

        // Prevent click propagation
        root.querySelectorAll('button, input, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
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
                /* CORE LAYOUT */
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Inter', sans-serif;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 50px; padding-bottom: 90px;
                    scrollbar-width: none; -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit {
                    width: 100%; max-width: 600px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column;
                }

                /* GLASS PANEL */
                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 16px; padding: 25px;
                    box-shadow: var(--shadow);
                    margin-bottom: 20px;
                }

                /* BUTTONS */
                .btn {
                    border: none; padding: 14px 24px; border-radius: 8px; cursor: pointer;
                    font-weight: 800; transition: all 0.2s;
                    font-family: 'Share Tech Mono', monospace; letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .btn-block { width: 100%; display: block; }
                .btn:active { transform: scale(0.98); }
                .btn-primary { background: var(--prm); color: #000; box-shadow: 0 0 15px rgba(0,255,157,0.3); }
                .btn-secondary { background: rgba(255,255,255,0.1); color: var(--txt); border: 1px solid var(--brd); }
                .btn-glow:hover { box-shadow: 0 0 25px var(--prm); }

                .btn-icon {
                    background: transparent; border: none; color: var(--prm);
                    font-size: 18px; cursor: pointer; padding: 10px;
                }

                /* LANDER */
                .lander-container { text-align: center; margin-top: 10vh; border: 1px solid var(--prm); position: relative; overflow: hidden; }
                .lander-container::before {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
                    background: var(--prm); animation: scan 3s infinite linear;
                }
                .lander-icon {
                    width: 100px; height: 100px; margin: 0 auto 30px;
                    background: rgba(0, 255, 157, 0.05); border: 2px solid var(--prm);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-size: 40px; color: var(--prm);
                    box-shadow: 0 0 30px rgba(0,255,157,0.2);
                }
                .orbitron-title { font-family: 'Share Tech Mono'; font-weight: 700; font-size: 2.5rem; margin: 0 0 10px; color: var(--txt); letter-spacing: -2px; }
                .lander-desc { color: var(--txt-dim); font-size: 0.9rem; max-width: 400px; margin: 0 auto 30px; line-height: 1.6; }
                .disclaimer { margin-top: 20px; font-size: 10px; color: var(--txt-dim); font-family: 'Share Tech Mono'; letter-spacing: 2px; }

                /* MAIN APP */
                .label-tiny { font-size: 10px; font-weight: 800; color: var(--txt-dim); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: block; }

                .display-panel { text-align: center; border-bottom: 4px solid var(--prm); }
                .input-wrapper {
                    position: relative; display: flex; align-items: center; background: rgba(0,0,0,0.3);
                    border-radius: 8px; border: 1px solid var(--brd); margin-bottom: 15px;
                }
                #password-display {
                    flex: 1; background: transparent; border: none; padding: 15px;
                    color: var(--prm); font-family: 'Share Tech Mono'; font-size: 18px;
                    outline: none; width: 100%; letter-spacing: 1px;
                }

                .strength-meter { margin-bottom: 20px; }
                .meter-bg { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 5px; }
                #meter-bar { height: 100%; transition: width 0.3s, background-color 0.3s; }
                .meter-label { font-size: 10px; font-weight: 800; text-align: right; text-transform: uppercase; font-family: 'Share Tech Mono'; }

                .action-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }

                /* CONTROLS */
                .slider-section { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed var(--brd); }
                .flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .val-display { font-family: 'Share Tech Mono'; color: var(--prm); font-size: 18px; font-weight: bold; }

                .slider {
                    -webkit-appearance: none; width: 100%; height: 6px; background: rgba(255,255,255,0.1);
                    border-radius: 3px; outline: none;
                }
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none; width: 20px; height: 20px; background: var(--prm);
                    border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px var(--prm);
                }

                .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .opt-btn {
                    background: rgba(255,255,255,0.03); border: 1px solid var(--brd); color: var(--txt-dim);
                    padding: 12px; border-radius: 8px; cursor: pointer; display: flex;
                    justify-content: space-between; align-items: center; transition: 0.2s;
                }
                .opt-btn.active { border-color: var(--prm); color: var(--txt); background: rgba(0, 255, 157, 0.05); }
                .opt-left { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; }
                .badge { font-size: 9px; font-family: 'Share Tech Mono'; opacity: 0.5; }

                .info-text { text-align: center; font-size: 10px; color: var(--txt-dim); margin-top: 10px; opacity: 0.6; }

                /* ANIMATION */
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scan { 0% { top: 0; opacity: 0.5; } 50% { top: 100%; opacity: 0; } 100% { top: 0; opacity: 0; } }
            </style>
        `;
        this.bindEvents();
    }
})