({
    state: {
        appName: 'ghost-pixel',
        currentView: 'lander', // 'lander' | 'app'
        mode: 'encode', // 'encode' | 'decode'

        // Data
        imgObj: null,
        imgSrc: null,
        message: '',
        password: '',
        decodedMessage: '',

        // Stats
        capacity: 0,
        usage: 0,
        isProcessing: false,

        themes: {
            dark: {
                '--bg': 'transparent',
                '--surface': '#1e1f22',
                '--surface-dim': '#2b2d31',
                '--txt': '#ffffff',
                '--txt-dim': '#949ba4',
                '--prm': '#2cc069', // Matrix Green
                '--prm-dim': 'rgba(44, 192, 105, 0.2)',
                '--err': '#fa5c5c',
                '--brd': 'rgba(255,255,255,0.1)'
            },
            light: {
                '--bg': 'transparent',
                '--surface': '#ffffff',
                '--surface-dim': '#f0f2f5',
                '--txt': '#111827',
                '--txt-dim': '#6b7280',
                '--prm': '#10b981',
                '--prm-dim': 'rgba(16, 185, 129, 0.1)',
                '--err': '#ef4444',
                '--brd': 'rgba(0,0,0,0.1)'
            }
        }
    },

    sys: null,
    canvas: null,
    ctx: null,

    mount(sys) {
        this.sys = sys;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.applyTheme(theme);

        // Observer Theme
        const observer = new MutationObserver(ms => {
            ms.forEach(m => {
                if (m.attributeName === 'data-theme') this.applyTheme(document.documentElement.getAttribute('data-theme'));
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        this.render();
        this.bindEvents();
    },

    applyTheme(name) {
        const theme = this.state.themes[name] || this.state.themes['dark'];
        for (const [k, v] of Object.entries(theme)) this.sys.root.style.setProperty(k, v);
    },

    // --- STEGANOGRAPHY CORE ---

    handleFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.state.imgObj = img;
                this.state.imgSrc = img.src;
                this.state.currentView = 'app';

                // Set Canvas Size
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);

                // Calc Capacity (3 bits per pixel / 8 bits per char)
                // We use 3 channels (RGB)
                const totalBits = (img.width * img.height) * 3;
                this.state.capacity = Math.floor(totalBits / 8) - 100; // Reserve header space

                this.render();
                this.bindEvents();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    strToBin(str) {
        let bin = "";
        for (let i = 0; i < str.length; i++) {
            bin += str[i].charCodeAt(0).toString(2).padStart(8, "0");
        }
        return bin;
    },

    binToStr(bin) {
        let str = "";
        for (let i = 0; i < bin.length; i += 8) {
            str += String.fromCharCode(parseInt(bin.substr(i, 8), 2));
        }
        return str;
    },

    encode() {
        if (!this.state.message) return this.sys.toast('Message cannot be empty', 'error');

        this.state.isProcessing = true;
        this.render();

        setTimeout(() => {
            try {
                let text = this.state.message;
                // Simple XOR Encryption if pass exists
                if (this.state.password) {
                    text = this.xorCipher(text, this.state.password);
                    text = "ENC::" + text; // Marker
                } else {
                    text = "TXT::" + text; // Plain marker
                }

                const binary = this.strToBin(text + "::END"); // End delimiter
                const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const data = imgData.data;

                if (binary.length > (data.length * 0.75)) throw new Error("Message too long for this image");

                let cursor = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (cursor >= binary.length) break;

                    // Modifikasi RGB channels (skip Alpha)
                    for (let j = 0; j < 3; j++) {
                        if (cursor < binary.length) {
                            // Replace LSB
                            data[i + j] = (data[i + j] & ~1) | parseInt(binary[cursor]);
                            cursor++;
                        }
                    }
                }

                this.ctx.putImageData(imgData, 0, 0);

                // Download
                const link = document.createElement('a');
                link.download = `ghost_${Date.now()}.png`; // Must be PNG
                link.href = this.canvas.toDataURL('image/png');
                link.click();

                this.sys.toast('Image Encoded & Downloaded!', 'success');
            } catch (e) {
                this.sys.toast(e.message, 'error');
            } finally {
                this.state.isProcessing = false;
                this.render();
                this.bindEvents();
            }
        }, 100);
    },

    decode() {
        this.state.isProcessing = true;
        this.render();

        setTimeout(() => {
            try {
                const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                const data = imgData.data;
                let binary = "";

                // Extract Bits
                for (let i = 0; i < data.length; i += 4) {
                    for (let j = 0; j < 3; j++) {
                        binary += (data[i + j] & 1).toString();
                    }
                }

                let rawText = "";
                let foundEnd = false;

                // Convert chunks to text stream
                for (let i = 0; i < binary.length; i += 8) {
                    const charCode = parseInt(binary.substr(i, 8), 2);
                    if (isNaN(charCode)) break;
                    const char = String.fromCharCode(charCode);
                    rawText += char;

                    if (rawText.endsWith("::END")) {
                        rawText = rawText.substring(0, rawText.length - 5);
                        foundEnd = true;
                        break;
                    }
                    // Limit scan to avoid hanging on random noise
                    if (rawText.length > 50000) break;
                }

                if (!foundEnd) throw new Error("No hidden message detected.");

                // Parse Result
                if (rawText.startsWith("ENC::")) {
                    const cipher = rawText.substring(5);
                    if (!this.state.password) {
                        this.state.decodedMessage = "🔒 Encrypted Message. Enter password to decrypt.";
                    } else {
                        this.state.decodedMessage = this.xorCipher(cipher, this.state.password);
                    }
                } else if (rawText.startsWith("TXT::")) {
                    this.state.decodedMessage = rawText.substring(5);
                } else {
                    this.state.decodedMessage = rawText; // Legacy/Raw
                }

            } catch (e) {
                this.state.decodedMessage = "❌ Failed: " + e.message;
            } finally {
                this.state.isProcessing = false;
                this.render();
                this.bindEvents();
            }
        }, 100);
    },

    xorCipher(text, pass) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
        }
        return result;
    },

    // --- UI ---

    render() {
        const { currentView } = this.state;
        const html = currentView === 'lander' ? this.renderLander() : this.renderApp();

        this.sys.root.innerHTML = `
            <div class="ghost-root">
                ${html}
            </div>
            <style>
                .ghost-root {
                    width: 100%; height: 100%;
                    background: var(--bg); color: var(--txt);
                    font-family: 'Inter', sans-serif;
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }
                .flex-center { display: flex; align-items: center; justify-content: center; height: 100%; }

                /* BUTTONS */
                .btn {
                    padding: 12px 20px; border-radius: 12px;
                    border: none; font-weight: 600; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; justify-content: center;
                    transition: 0.2s; width: 100%;
                }
                .btn-prm { background: var(--prm); color: #000; }
                .btn-prm:hover { opacity: 0.9; transform: translateY(-1px); }

                .btn-sec { background: var(--surface-dim); color: var(--txt); }
                .btn-sec:hover { background: var(--brd); }

                /* INPUTS */
                .inp {
                    width: 100%; background: var(--surface-dim);
                    border: 1px solid var(--brd);
                    padding: 12px; border-radius: 10px;
                    color: var(--txt); outline: none; margin-bottom: 12px;
                }
                .inp:focus { border-color: var(--prm); }
                textarea.inp { resize: none; height: 120px; }

                /* TAB SYSTEM */
                .tabs { display: flex; background: var(--surface-dim); padding: 4px; border-radius: 12px; margin-bottom: 20px; }
                .tab { flex: 1; padding: 8px; text-align: center; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--txt-dim); }
                .tab.active { background: var(--surface); color: var(--txt); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

                .card {
                    background: var(--surface); border: 1px solid var(--brd);
                    border-radius: 20px; padding: 24px;
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
                }
            </style>
        `;

        if(currentView === 'lander') this.bindLander();
        else this.bindEvents();
    },

    renderLander() {
        return `
            <div class="flex-center fade-in">
                <div class="card" style="width: 320px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: var(--prm-dim); color: var(--prm); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12l10-10 10 10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                    </div>
                    <h2 style="margin: 0 0 8px 0;">Ghost Pixel</h2>
                    <p style="color: var(--txt-dim); font-size: 14px; margin-bottom: 24px;">
                        Sembunyikan pesan rahasia di dalam foto (Steganography). Aman & Tak Terlihat.
                    </p>
                    <button id="btn-open" class="btn btn-prm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Buka Gambar
                    </button>
                    <input type="file" id="file-inp" hidden accept="image/*">
                </div>
            </div>
        `;
    },

    renderApp() {
        const { mode, imgSrc, capacity, usage, isProcessing, decodedMessage } = this.state;
        const isEnc = mode === 'encode';

        return `
            <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
                <div style="padding: 16px; display: flex; align-items: center; border-bottom: 1px solid var(--brd);">
                    <button id="btn-back" class="btn btn-sec" style="width: auto; padding: 8px 12px; margin-right: 12px;">←</button>
                    <div style="font-weight: 600;">Ghost Pixel Workspace</div>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto;">

                        <div style="background: var(--surface-dim); border-radius: 16px; overflow: hidden; margin-bottom: 20px; border: 1px solid var(--brd); max-height: 300px; display: flex; justify-content: center;">
                            <img src="${imgSrc}" style="max-width: 100%; object-fit: contain;">
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 20px; font-size: 12px; color: var(--txt-dim);">
                            <div style="flex: 1; background: var(--surface); padding: 10px; border-radius: 8px; border: 1px solid var(--brd);">
                                📏 Size: ${this.canvas.width} x ${this.canvas.height} px
                            </div>
                            <div style="flex: 1; background: var(--surface); padding: 10px; border-radius: 8px; border: 1px solid var(--brd);">
                                📦 Capacity: ~${(capacity/1024).toFixed(1)} KB
                            </div>
                        </div>

                        <div class="tabs">
                            <div class="tab ${isEnc ? 'active' : ''}" data-mode="encode">ENCODE (Hide)</div>
                            <div class="tab ${!isEnc ? 'active' : ''}" data-mode="decode">DECODE (Read)</div>
                        </div>

                        <div class="card fade-in">
                            ${isEnc ? `
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Secret Message</label>
                                <textarea id="inp-msg" class="inp" placeholder="Ketik pesan rahasia di sini...">${this.state.message}</textarea>

                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Password (Optional)</label>
                                <input id="inp-pass" type="password" class="inp" placeholder="Kunci enkripsi..." value="${this.state.password}">

                                <button id="btn-run" class="btn btn-prm">
                                    ${isProcessing ? 'Encoding...' : '🔒 Hide & Download Image'}
                                </button>
                            ` : `
                                <label style="display: block; margin-bottom: 8px; font-size: 13px; font-weight: 500;">Decryption Key (If needed)</label>
                                <input id="inp-pass-dec" type="password" class="inp" placeholder="Masukkan password pengirim..." value="${this.state.password}">

                                <button id="btn-run" class="btn btn-prm" style="margin-bottom: 20px;">
                                    ${isProcessing ? 'Scanning...' : '🔓 Reveal Message'}
                                </button>

                                ${decodedMessage ? `
                                    <div style="background: var(--surface-dim); padding: 16px; border-radius: 12px; border: 1px dashed var(--prm);">
                                        <div style="font-size: 11px; text-transform: uppercase; color: var(--txt-dim); margin-bottom: 8px;">Decoded Result</div>
                                        <div style="font-family: monospace; white-space: pre-wrap; word-break: break-all;">${decodedMessage}</div>
                                    </div>
                                ` : ''}
                            `}
                        </div>

                    </div>
                </div>
            </div>
        `;
    },

    bindLander() {
        const btn = this.sys.root.querySelector('#btn-open');
        const inp = this.sys.root.querySelector('#file-inp');
        if(btn) btn.onclick = () => inp.click();
        if(inp) inp.onchange = (e) => this.handleFile(e.target.files[0]);
    },

    bindEvents() {
        const root = this.sys.root;
        const $ = (s) => root.querySelector(s);
        const $$ = (s) => root.querySelectorAll(s);

        // Tabs
        $$('.tab').forEach(t => {
            t.onclick = () => {
                this.state.mode = t.dataset.mode;
                this.state.decodedMessage = ''; // Reset output
                this.render();
            };
        });

        // Back
        if($('#btn-back')) $('#btn-back').onclick = () => {
            this.state.currentView = 'lander';
            this.state.imgObj = null;
            this.state.message = '';
            this.render();
        };

        // Inputs
        if($('#inp-msg')) $('#inp-msg').oninput = (e) => this.state.message = e.target.value;
        if($('#inp-pass')) $('#inp-pass').oninput = (e) => this.state.password = e.target.value;
        if($('#inp-pass-dec')) $('#inp-pass-dec').oninput = (e) => this.state.password = e.target.value;

        // Action
        if($('#btn-run')) $('#btn-run').onclick = () => {
            if(this.state.mode === 'encode') this.encode();
            else this.decode();
        };
    }
})