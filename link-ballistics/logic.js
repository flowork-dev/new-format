({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        numbers: [''],
        message: '',
        generatedLink: ''
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#38bdf8', /* Dominan Biru */
            '--txt-dim': '#0284c7',
            '--prm': '#2563eb',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#1d4ed8', /* Dominan Biru */
            '--txt-dim': '#3b82f6',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_link_ballistics');
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

    addNumber() {
        this.state.numbers.push('');
        this.render();
    },

    removeNumber(idx) {
        this.state.numbers.splice(idx, 1);
        this.render();
    },

    generateLink() {
        const validNums = this.state.numbers
            .map(n => n.replace(/\\D/g, ''))
            .filter(n => n.length > 6)
            .map(n => {
                if(n.startsWith('0')) return '62' + n.substring(1);
                if(n.startsWith('8')) return '62' + n;
                return n;
            });

        if (validNums.length === 0) {
            if(this.sys) this.sys.toast("Insert at least 1 valid number!", "error");
            return;
        }

        const payload = { n: validNums, m: this.state.message };
        const encoded = btoa(JSON.stringify(payload));
        this.state.generatedLink = `https://flowork.cloud/w/?d=${encoded}`;

        if(this.sys) this.sys.toast("Link Generated Successfully!", "success");
        this.render();
    },

    copyLink() {
        if (!this.state.generatedLink) {
            if(this.sys) this.sys.toast("Generate a link first!", "error");
            return;
        }
        navigator.clipboard.writeText(this.state.generatedLink).then(() => {
            if(this.sys) this.sys.toast("Link Copied to Clipboard!", "success");
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

                .card-transparent {
                    background: transparent;
                    border: 2px solid var(--prm);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 0 25px rgba(37, 99, 235, 0.15);
                    width: 100%;
                }

                .btn {
                    background: #2563eb; color: #ffffff; border: none;
                    padding: 14px 28px; border-radius: 12px; cursor: pointer;
                    font-weight: 700; transition: transform 0.2s;
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.95); }
                .btn-icon { padding: 10px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: var(--err); border: 1px solid var(--err); font-weight: bold; cursor: pointer; }

                /* INPUT BLUE TEXT RULE */
                .cyber-input {
                    background: rgba(37, 99, 235, 0.05);
                    border: 1px solid var(--prm);
                    color: #38bdf8; /* Blue Text Wajib */
                    font-family: monospace;
                    padding: 12px 16px;
                    border-radius: 12px;
                    width: 100%;
                    outline: none;
                    transition: all 0.3s;
                }
                .cyber-input::placeholder { color: rgba(56, 189, 248, 0.4); }
                .cyber-input:focus { box-shadow: 0 0 10px rgba(37, 99, 235, 0.4); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div style="max-width: 800px; width: 100%; text-align: center;">
                <div style="background: rgba(37, 99, 235, 0.1); color: var(--prm); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid var(--prm); display: inline-block; margin-bottom: 24px;">LINK BALLISTICS V2.0</div>

                <h1 style="font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: var(--prm);">
                    DISTRIBUTE TRAFFIC.<br>
                    FAIRLY & SECURELY.
                </h1>

                <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; line-height: 1.6;">
                    Have many Customer Service reps but chats pile up on one person? Distribute customer traffic automatically and evenly (Round Robin/Random). Stateless architecture, 100% secure link.
                </p>

                <button id="start-app-btn" class="btn" style="width: 100%; max-width: 300px; padding: 18px; font-size: 1.1rem;">LAUNCH GENERATOR</button>
            </div>
        `;
    },

    renderMainApp() {
        const numInputs = this.state.numbers.map((num, i) => `
            <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;" class="fade-in">
                <div style="width: 40px; height: 46px; border: 1px solid var(--prm); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--prm); font-weight: bold; font-family: monospace;">${i+1}</div>
                <input type="tel" class="cyber-input num-input" data-idx="${i}" value="${num}" placeholder="628xxxxx...">
                <button class="btn-icon remove-num-btn" data-idx="${i}">X</button>
            </div>
        `).join('');

        let resultBox = '';
        if (this.state.generatedLink) {
            resultBox = `
                <div class="fade-in" style="margin-top: 24px; padding: 16px; border: 1px dashed var(--scs); border-radius: 12px; background: rgba(16, 185, 129, 0.05);">
                    <label style="font-size: 0.75rem; font-weight: bold; color: var(--scs); display: block; margin-bottom: 8px;">GENERATED LINK (BASE64 ENCODED)</label>
                    <input type="text" class="cyber-input" style="color: var(--scs); border-color: var(--scs);" value="${this.state.generatedLink}" readonly>
                    <div style="display: flex; gap: 10px; margin-top: 12px;">
                        <button id="btn-copy" class="btn" style="flex: 1; padding: 12px;">COPY LINK</button>
                    </div>
                </div>
            `;
        }

        return `
            <div style="width: 100%; max-width: 600px;">
                <div class="card-transparent" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <label style="font-size: 0.85rem; font-weight: bold; color: var(--prm); letter-spacing: 1px;">NUMBER LIST</label>
                        <button id="btn-add" class="btn" style="padding: 8px 16px; font-size: 0.8rem;">+ ADD NUM</button>
                    </div>

                    <div style="max-height: 250px; overflow-y: auto; scrollbar-width: none; padding-right: 4px;">
                        ${numInputs}
                        ${this.state.numbers.length === 0 ? '<p style="text-align: center; color: var(--txt-dim); font-size: 0.85rem; margin-top: 10px;">List is empty. Add a number.</p>' : ''}
                    </div>
                </div>

                <div class="card-transparent" style="margin-bottom: 20px;">
                    <label style="font-size: 0.85rem; font-weight: bold; color: var(--prm); letter-spacing: 1px; display: block; margin-bottom: 12px;">MESSAGE TEMPLATE (OPTIONAL)</label>
                    <textarea id="msg-input" class="cyber-input" rows="3" placeholder="Hello, I want to order...">${this.state.message}</textarea>
                </div>

                <button id="btn-generate" class="btn" style="width: 100%; padding: 18px; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);">
                    GENERATE ROTATOR LINK
                </button>

                ${resultBox}
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, textarea, .card-transparent').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.isFirstVisit = false;
                this.state.currentView = 'main';
                localStorage.setItem('app_visited_link_ballistics', 'true');
                this.render();
            });
        }

        const btnAdd = root.querySelector('#btn-add');
        if (btnAdd) btnAdd.addEventListener('click', () => this.addNumber());

        root.querySelectorAll('.remove-num-btn').forEach(btn => {
            btn.addEventListener('click', () => this.removeNumber(parseInt(btn.getAttribute('data-idx'))));
        });

        // Store value without re-rendering to prevent losing focus
        root.querySelectorAll('.num-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.state.numbers[e.target.getAttribute('data-idx')] = e.target.value;
            });
        });

        const msgInput = root.querySelector('#msg-input');
        if (msgInput) {
            msgInput.addEventListener('input', (e) => this.state.message = e.target.value);
        }

        const btnGenerate = root.querySelector('#btn-generate');
        if (btnGenerate) btnGenerate.addEventListener('click', () => this.generateLink());

        const btnCopy = root.querySelector('#btn-copy');
        if (btnCopy) btnCopy.addEventListener('click', () => this.copyLink());
    }
})