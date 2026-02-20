({
    state: {
        appName: 'anti-spy',
        mode: 'encrypt', // 'encrypt' or 'decrypt' (Tab active)

        // Data Inputs
        publicText: '',
        secretText: '',
        suspectText: '',
        password: '',

        // Results
        resultEncrypted: '',
        resultDecrypted: ''
    },

    sys: null,
    observer: null,

    // MATERIAL DESIGN THEMES + CYBERPUNK INFLUENCE
    themes: {
        dark: {
            '--md-sys-color-background': '#0a0a0f', // Cyberpunk Deep Dark
            '--md-sys-color-surface': '#12121e',
            '--md-sys-color-surface-variant': '#1a1a2e',
            '--md-sys-color-primary': '#00d2ff', // Neon Blue
            '--md-sys-color-on-primary': '#050505',
            '--md-sys-color-secondary-container': '#1a1a2e',
            '--md-sys-color-on-surface': '#00d2ff', // Wajib Biru
            '--md-sys-color-outline': '#0055ff',
            '--md-font-family': "'Roboto', 'Inter', sans-serif",
            '--md-elevation-1': '0px 0px 15px rgba(0, 210, 255, 0.3)', // Glow effect
            '--radius-m': '12px',
            '--radius-l': '24px',
        },
        light: {
            // Tetap dibuat biru & cyberpunk walau mode light agar konsisten request
            '--md-sys-color-background': '#f0faff',
            '--md-sys-color-surface': '#ffffff',
            '--md-sys-color-surface-variant': '#e0f0ff',
            '--md-sys-color-primary': '#0077ff', // Blue
            '--md-sys-color-on-primary': '#ffffff',
            '--md-sys-color-secondary-container': '#d0e8ff',
            '--md-sys-color-on-surface': '#0055ff', // Wajib Biru
            '--md-sys-color-outline': '#0077ff',
            '--md-font-family': "'Roboto', 'Inter', sans-serif",
            '--md-elevation-1': '0px 2px 8px rgba(0, 85, 255, 0.2)',
            '--radius-m': '12px',
            '--radius-l': '24px',
        },
        hacker: {
            '--md-sys-color-background': '#050505',
            '--md-sys-color-surface': '#000000',
            '--md-sys-color-surface-variant': '#001122',
            '--md-sys-color-primary': '#00eeff',
            '--md-sys-color-on-primary': '#000000',
            '--md-sys-color-secondary-container': '#002244',
            '--md-sys-color-on-surface': '#00eeff', // Biru Neon
            '--md-sys-color-outline': '#00eeff',
            '--md-font-family': "'Courier New', monospace",
            '--md-elevation-1': '0px 0px 20px #00eeff',
            '--radius-m': '0px',
            '--radius-l': '0px',
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
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    },

    xorMsg(txt, pass) {
        if (!pass) return txt;
        let res = '';
        for (let i = 0; i < txt.length; i++) {
            res += String.fromCharCode(txt.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
        }
        return res;
    },

    doEncrypt() {
        const pub = this.state.publicText || ' ';
        let sec = this.state.secretText;
        const pass = this.state.password;

        if (!sec) return this.sys.toast('Secret message is required!');
        if (pass) sec = this.xorMsg(sec, pass);

        const zP = '\u200C', zO = '\u200D';
        let bin = '';
        for (let i = 0; i < sec.length; i++) bin += sec.charCodeAt(i).toString(2).padStart(8, '0');
        let hid = '';
        for (let i = 0; i < bin.length; i++) hid += (bin[i] === '1') ? zO : zP;

        if (pub.length > 0) this.state.resultEncrypted = pub[0] + hid + pub.slice(1);
        else this.state.resultEncrypted = hid;

        this.sys.toast('Encrypted successfully!');
        this.render();
    },

    doDecrypt() {
        const txt = this.state.suspectText;
        const pass = this.state.password;
        const zP = '\u200C', zO = '\u200D';

        if (!txt) return this.sys.toast('Paste suspicious text first!');

        let bin = '';
        for (let i = 0; i < txt.length; i++) {
            if (txt[i] === zO) bin += '1';
            else if (txt[i] === zP) bin += '0';
        }

        if (bin.length > 0 && bin.length % 8 === 0) {
            let dec = '';
            for (let i = 0; i < bin.length; i += 8) {
                dec += String.fromCharCode(parseInt(bin.slice(i, i+8), 2));
            }
            if (pass) dec = this.xorMsg(dec, pass);
            this.state.resultDecrypted = dec;
            this.sys.toast('Message Decoded!');
        } else {
            this.state.resultDecrypted = '';
            this.sys.toast('No hidden message found.');
        }
        this.render();
    },

    copyToClipboard(text) {
        if (!text) return;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => this.sys.toast('Copied to clipboard!'));
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try { document.execCommand('copy'); this.sys.toast('Copied!'); } catch (err) {}
            document.body.removeChild(textArea);
        }
    },

    render() {
        const { mode, publicText, secretText, suspectText, password, resultEncrypted, resultDecrypted } = this.state;
        const isEnc = mode === 'encrypt';
        const result = isEnc ? resultEncrypted : resultDecrypted;

        this.sys.root.innerHTML = `
            <div class="md-layout">
                <header class="md-app-bar">
                    <div class="md-title">AntiSpy</div>
                    <div class="md-actions">
                        <span class="md-icon">security</span>
                    </div>
                </header>

                <div class="md-main-container">
                    <div class="md-tabs">
                        <button id="tab-enc" class="md-tab ${isEnc ? 'active' : ''}">Encrypt</button>
                        <button id="tab-dec" class="md-tab ${!isEnc ? 'active' : ''}">Decrypt</button>
                        <div class="md-indicator ${!isEnc ? 'right' : ''}"></div>
                    </div>

                    <div class="md-content">
                        ${isEnc ? `
                            <div class="md-input-group fade-in">
                                <label class="md-label">Cover Text (Public)</label>
                                <div class="md-field">
                                    <textarea id="inp-pub" class="md-input" rows="2" placeholder="e.g. Hello World">${publicText}</textarea>
                                </div>
                                <div class="md-helper">This text will be visible to everyone.</div>
                            </div>

                            <div class="md-input-group fade-in">
                                <label class="md-label">Secret Message</label>
                                <div class="md-field">
                                    <textarea id="inp-sec" class="md-input" rows="3" placeholder="e.g. Meet at 9PM">${secretText}</textarea>
                                </div>
                            </div>
                        ` : `
                            <div class="md-input-group fade-in">
                                <label class="md-label">Suspicious Text</label>
                                <div class="md-field">
                                    <textarea id="inp-sus" class="md-input" rows="5" placeholder="Paste text here...">${suspectText}</textarea>
                                </div>
                            </div>
                        `}

                        <div class="md-input-group fade-in">
                            <label class="md-label">Encryption Key (Optional)</label>
                            <div class="md-field">
                                <input id="inp-pass" type="password" class="md-input" placeholder="Password" value="${password}">
                                <span class="md-icon-input">key</span>
                            </div>
                        </div>

                        <div class="md-actions-area fade-in">
                            <button id="btn-run" class="md-btn-filled">
                                ${isEnc ? 'ENCRYPT & HIDE' : 'DECRYPT & READ'}
                            </button>
                        </div>

                        ${result ? `
                            <div class="md-card slide-up">
                                <div class="md-card-header">
                                    <span>Result</span>
                                    <button id="btn-copy" class="md-icon-btn">content_copy</button>
                                </div>
                                <div class="md-card-body">
                                    ${result}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <style>
                /* --- CYBERPUNK LAYOUT --- */
                .md-layout {
                    position: absolute; inset: 0;
                    display: flex; flex-direction: column;
                    background-color: var(--md-sys-color-background);
                    /* Background effect cyberpunk */
                    background-image: linear-gradient(rgba(0, 210, 255, 0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0, 210, 255, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                    color: var(--md-sys-color-on-surface);
                    font-family: var(--md-font-family);
                    overflow: hidden;
                }

                /* Container untuk handle posisi center di mobile agar tidak kena header app */
                .md-main-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    max-width: 600px;
                    margin: 0 auto;
                    width: 100%;
                    overflow-y: auto;
                    transition: all 0.3s;
                }

                /* Mobile Adjustment: Kasih padding top gede biar ke bawah / center */
                @media (max-width: 768px) {
                    .md-main-container {
                        padding-top: 60px; /* Jarak dari header bawaan app */
                        justify-content: center; /* Push ke tengah jika konten sedikit */
                    }
                }

                /* --- APP BAR --- */
                .md-app-bar {
                    height: 64px; display: flex; align-items: center; justify-content: space-between;
                    padding: 0 16px; background: rgba(10, 10, 15, 0.8);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--md-sys-color-primary);
                    flex-shrink: 0;
                    z-index: 10;
                }
                .md-title {
                    font-size: 22px; font-weight: bold;
                    color: var(--md-sys-color-primary);
                    text-shadow: 0 0 10px var(--md-sys-color-primary);
                }
                .md-icon { font-family: 'Material Icons', sans-serif; font-size: 24px; color: var(--md-sys-color-primary); }

                /* --- TABS --- */
                .md-tabs {
                    display: flex; position: relative; height: 48px;
                    border-bottom: 1px solid var(--md-sys-color-outline);
                    flex-shrink: 0;
                    background: var(--md-sys-color-surface);
                }
                .md-tab {
                    flex: 1; background: transparent; border: none;
                    font-family: inherit; font-size: 14px; font-weight: bold;
                    text-transform: uppercase; letter-spacing: 0.1em;
                    color: var(--md-sys-color-on-surface); opacity: 0.5;
                    cursor: pointer; z-index: 1;
                }
                .md-tab.active { opacity: 1; color: var(--md-sys-color-primary); }
                .md-indicator {
                    position: absolute; bottom: 0; left: 0; width: 50%; height: 3px;
                    background-color: var(--md-sys-color-primary);
                    box-shadow: 0 0 10px var(--md-sys-color-primary);
                    transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                .md-indicator.right { transform: translateX(100%); }

                /* --- CONTENT --- */
                .md-content {
                    padding: 24px 16px;
                    display: flex; flex-direction: column; gap: 24px;
                    padding-bottom: 100px;
                }

                /* --- INPUTS --- */
                .md-input-group { display: flex; flex-direction: column; gap: 8px; }
                .md-label { font-size: 12px; font-weight: bold; color: var(--md-sys-color-primary); text-transform: uppercase; }
                .md-field { position: relative; }
                .md-input {
                    width: 100%; box-sizing: border-box;
                    background: var(--md-sys-color-surface-variant);
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: var(--radius-m);
                    padding: 16px;
                    color: var(--md-sys-color-primary) !important; /* Wajib Biru saat ngetik */
                    font-family: inherit; font-size: 16px;
                    outline: none; transition: all 0.2s;
                    -webkit-appearance: none;
                }
                .md-input::placeholder { color: var(--md-sys-color-primary); opacity: 0.4; }
                .md-input:focus {
                    border-color: var(--md-sys-color-primary);
                    box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
                }
                .md-icon-input {
                    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
                    font-family: 'Material Icons'; color: var(--md-sys-color-primary); opacity: 0.7;
                }
                .md-helper { font-size: 11px; color: var(--md-sys-color-primary); opacity: 0.6; }

                /* --- BUTTONS --- */
                .md-btn-filled {
                    width: 100%; padding: 18px; border: 1px solid var(--md-sys-color-primary);
                    background-color: rgba(0, 210, 255, 0.1);
                    color: var(--md-sys-color-primary);
                    border-radius: 4px; /* Hard corner feel for cyberpunk */
                    font-size: 16px; font-weight: bold; letter-spacing: 2px;
                    text-transform: uppercase; cursor: pointer;
                    box-shadow: inset 0 0 10px rgba(0, 210, 255, 0.2);
                    transition: all 0.2s;
                }
                .md-btn-filled:active { transform: scale(0.98); background-color: var(--md-sys-color-primary); color: #000; }

                .md-icon-btn {
                    background: transparent; border: none; color: var(--md-sys-color-primary);
                    font-family: 'Material Icons'; font-size: 20px; cursor: pointer;
                }

                /* --- RESULT CARD --- */
                .md-card {
                    background-color: rgba(0, 210, 255, 0.05);
                    border: 1px solid var(--md-sys-color-primary);
                    color: var(--md-sys-color-primary);
                    border-radius: var(--radius-m);
                    overflow: hidden;
                }
                .md-card-header {
                    padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid var(--md-sys-color-outline);
                    font-size: 12px; font-weight: bold; text-transform: uppercase;
                }
                .md-card-body {
                    padding: 16px; font-family: 'Courier New', monospace; font-size: 14px;
                    word-break: break-all; line-height: 1.5; color: var(--md-sys-color-primary);
                }

                /* --- ANIMATIONS --- */
                .fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
                .slide-up { animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                @keyframes fadeIn { to { opacity: 1; } }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @font-face {
                    font-family: 'Material Icons';
                    font-style: normal;
                    font-weight: 400;
                    src: local('Material Icons'), local('MaterialIcons-Regular'), url(https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2) format('woff2');
                }
            </style>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const root = this.sys.root;
        const addClick = (id, fn) => { const el = root.querySelector(id); if (el) el.onclick = fn; };
        const getVal = (id) => { const el = root.querySelector(id); return el ? el.value : ''; };

        root.querySelectorAll('button, input, textarea').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        addClick('#tab-enc', () => this.setState({ mode: 'encrypt', resultEncrypted: '', resultDecrypted: '' }));
        addClick('#tab-dec', () => this.setState({ mode: 'decrypt', resultEncrypted: '', resultDecrypted: '' }));

        addClick('#btn-run', () => {
            if (this.state.mode === 'encrypt') {
                this.state.publicText = getVal('#inp-pub');
                this.state.secretText = getVal('#inp-sec');
            } else {
                this.state.suspectText = getVal('#inp-sus');
            }
            this.state.password = getVal('#inp-pass');

            if (this.state.mode === 'encrypt') this.doEncrypt();
            else this.doDecrypt();
        });

        addClick('#btn-copy', () => {
            const txt = this.state.mode === 'encrypt' ? this.state.resultEncrypted : this.state.resultDecrypted;
            this.copyToClipboard(txt);
        });
    }
})