({
    state: {
        isFirstVisit: true,
        currentView: 'main',
        currentMode: 'base64',
        rotShift: 13,
        matrixInterval: null,
        resizeHandler: null
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Cyberpunk Edition - Strictly Blue Text)
    themes: {
        dark: {
            // '--bg-root': '#0d1117', // Baris lama
            '--bg-root': '#0a0a12', // Deep Cyberpunk Space
            '--glass': 'rgba(10, 10, 18, 0.9)',
            // '--glass-border': '1px solid rgba(0, 255, 65, 0.2)', // Baris lama
            '--glass-border': '1px solid #0055ff', // Blue Neon Border
            // '--txt': '#f8fafc', // Baris lama
            '--txt': '#3b82f6', // WAJIB BIRU
            // '--txt-dim': '#008F11', // Baris lama
            '--txt-dim': '#1d4ed8', // Darker Blue
            // '--prm': '#00ff41', // Baris lama
            '--prm': '#2563eb', // Primary Blue
            '--scs': '#10b981',
            '--err': '#ef4444',
            // '--brd': 'rgba(0, 255, 65, 0.3)', // Baris lama
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.05)',
            '--shadow': '0 0 20px rgba(37, 99, 235, 0.2)'
        },
        light: {
            // Dipaksa Cyberpunk juga agar tulisan tetap biru terlihat
            '--bg-root': '#f1f5f9',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(37, 99, 235, 0.2)',
            '--txt': '#2563eb', // WAJIB BIRU
            '--txt-dim': '#1e40af',
            '--prm': '#3b82f6',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(37, 99, 235, 0.2)',
            '--surface': 'rgba(37, 99, 235, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(37, 99, 235, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_enigmaops');
        if (hasVisited) {
            this.state.isFirstVisit = false;
        } else {
            localStorage.setItem('app_visited_enigmaops', 'true');
        }

        this.render();

        if(window.lucide) window.lucide.createIcons();
        else {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => { if(window.lucide) window.lucide.createIcons(); };
            document.head.appendChild(s);
        }

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

        this.startMatrix();
        this.bindEvents();
    },

    unmount() {
        if (this.state.matrixInterval) clearInterval(this.state.matrixInterval);
        if (this.state.resizeHandler) window.removeEventListener('resize', this.state.resizeHandler);
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
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
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <canvas id="matrix-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.2; pointer-events: none;"></canvas>

                <div class="content-limit" style="position: relative; z-index: 1;">
                    <div class="glass-panel" style="width: 100%; display: flex; flex-direction: column; gap: 20px;">

                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--brd); padding-bottom: 15px;">
                            <h2 style="margin: 0; font-family: 'Share Tech Mono', monospace; font-size: 18px; color: var(--prm); display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="terminal"></i> TACTICAL DECRYPTION
                            </h2>
                            <span id="status-detection" style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: var(--txt-dim); padding: 4px 10px; background: var(--surface); border-radius: 4px; border: 1px solid var(--brd); transition: all 0.3s;">AUTO-DETECT: IDLE</span>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: var(--txt-dim); font-weight: bold; letter-spacing: 1px;">CIPHERTEXT INPUT</label>
                            <textarea id="inputCipher" placeholder="Paste your encrypted string here..." rows="4" style="width: 100%; background: var(--surface); color: #2563eb; border: 1px solid var(--brd); border-radius: 12px; padding: 15px; font-family: 'Share Tech Mono', monospace; font-size: 14px; resize: vertical; outline: none; transition: border-color 0.2s;"></textarea>

                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                <button class="btn btn-outline" id="btn-paste" style="padding: 6px 12px; font-size: 10px;"><i data-lucide="clipboard" style="width: 14px; height: 14px;"></i> PASTE</button>
                                <button class="btn btn-outline" id="btn-clear" style="padding: 6px 12px; font-size: 10px; color: var(--err); border-color: var(--err);"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> CLEAR</button>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 10px;" id="mode-selectors">
                            <button class="mode-btn active" data-mode="base64">BASE64</button>
                            <button class="mode-btn" data-mode="hex">HEX</button>
                            <button class="mode-btn" data-mode="binary">BINARY</button>
                            <button class="mode-btn" data-mode="morse">MORSE</button>
                            <button class="mode-btn" data-mode="url">URL</button>
                            <button class="mode-btn" data-mode="rot13">ROT13</button>
                        </div>

                        <div id="rot-control" style="display: none; flex-direction: column; gap: 10px; background: var(--surface); padding: 15px; border-radius: 12px; border: 1px solid var(--brd);">
                            <label style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: var(--txt-dim); display: flex; justify-content: space-between; font-weight: bold;">
                                <span>SHIFT VALUE (ROT)</span><span id="rot-val" style="color: var(--prm); font-size: 14px;">13</span>
                            </label>
                            <input type="range" id="input-rot" min="1" max="25" value="13" style="width: 100%; accent-color: var(--prm);">
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="font-family: 'Share Tech Mono', monospace; font-size: 12px; color: var(--txt-dim); font-weight: bold; letter-spacing: 1px;">DECRYPTED OUTPUT</label>
                            <div id="outputPlain" style="width: 100%; min-height: 120px; background: rgba(0,0,0,0.3); color: var(--txt); border: 1px solid var(--brd); border-radius: 12px; padding: 15px; font-family: 'Share Tech Mono', monospace; font-size: 14px; word-break: break-all; white-space: pre-wrap;"></div>

                            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 5px;">
                                <button class="btn btn-solid" id="btn-copy" style="padding: 10px 20px; font-size: 12px;"><i data-lucide="copy" style="width: 14px; height: 14px;"></i> COPY RESULT</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Share Tech Mono', monospace;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 70px; padding-bottom: 90px;
                    scrollbar-width: none; -ms-overflow-style: none;
                    position: relative;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 800px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); border-radius: 20px; padding: 25px;
                    box-shadow: var(--shadow);
                }

                .btn {
                    background: var(--prm); color: #fff; border: none;
                    padding: 8px 16px; border-radius: 8px; cursor: pointer;
                    font-weight: bold; font-family: 'Share Tech Mono', monospace; transition: all 0.2s;
                    display: flex; align-items: center; gap: 6px; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.95); }
                .btn-outline { background: transparent; border: 1px solid var(--prm); color: var(--prm); }
                .btn-outline:hover { background: var(--prm); color: #fff; }
                .btn-solid { background: var(--prm); color: #fff; }
                .btn-solid:hover { filter: brightness(1.2); box-shadow: 0 0 10px var(--prm); }

                .mode-btn {
                    background: transparent; color: var(--prm); border: 1px solid var(--brd);
                    padding: 10px 5px; border-radius: 8px; font-family: 'Share Tech Mono', monospace;
                    font-weight: bold; font-size: 11px; cursor: pointer; transition: all 0.2s;
                    text-align: center; letter-spacing: 1px;
                }
                .mode-btn:hover { border-color: var(--prm); }
                .mode-btn.active { background: var(--prm); color: #fff; border-color: var(--prm); box-shadow: 0 0 10px rgba(37, 99, 235, 0.4); }

                textarea:focus { border-color: var(--prm) !important; box-shadow: 0 0 10px rgba(37, 99, 235, 0.2); }

                /* TULISAN SAAT MENGETIK WAJIB BIRU */
                #inputCipher { color: #2563eb !important; }

                input[type=range] { -webkit-appearance: none; background: transparent; }
                input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: var(--bg-root); border-radius: 3px; border: 1px solid var(--brd); }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: var(--prm); cursor: pointer; margin-top: -7px; box-shadow: 0 0 10px var(--prm); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-text { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .animate-pulse-txt { animation: pulse-text 1s infinite; }

                /* === MOBILE ADJUSTMENTS === */
                @media (max-width: 600px) {
                    .app-root {
                        padding-top: 120px; /* TURUN BIAR NGAK KETUTUP HEADER */
                        justify-content: center;
                    }
                    .content-limit {
                        padding: 15px;
                        justify-content: center;
                    }
                    .glass-panel {
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                }
            </style>
        `;
    },

    startMatrix() {
        const canvas = this.sys.root.querySelector('#matrix-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        this.state.resizeHandler = () => {
            resizeCanvas();
            columns = canvas.width / fontSize;
            drops.length = Math.floor(columns);
            for(let j=0; j<drops.length; j++) { if(!drops[j]) drops[j] = 1; }
        };

        window.addEventListener('resize', this.state.resizeHandler);

        canvas.width = this.sys.root.offsetWidth || window.innerWidth;
        canvas.height = this.sys.root.offsetHeight || window.innerHeight;

        const letters = '01';
        const fontSize = 14;
        let columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(10, 10, 18, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const prmColor = '#1e40af';
            ctx.fillStyle = prmColor;
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = letters[Math.floor(Math.random() * letters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };

        this.state.matrixInterval = setInterval(drawMatrix, 50);
    },

    crackCode() {
        const input = this.sys.root.querySelector('#inputCipher').value;
        const outEl = this.sys.root.querySelector('#outputPlain');
        if(!input) {
            outEl.innerText = '';
            return;
        }

        const MORSE_CODE = { '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9', '/': ' ' };

        let output = "";
        try {
            switch(this.state.currentMode) {
                case 'base64':
                    output = atob(input);
                    break;
                case 'hex':
                    output = input.replace(/\\s/g, '').match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
                    break;
                case 'binary':
                    output = input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
                    break;
                case 'morse':
                    output = input.split(' ').map(code => MORSE_CODE[code] || '').join('');
                    break;
                case 'url':
                    output = decodeURIComponent(input);
                    break;
                case 'rot13':
                    const rot = this.state.rotShift;
                    output = input.replace(/[a-zA-Z]/g, function(c) {
                        const base = c <= 'Z' ? 65 : 97;
                        return String.fromCharCode((c.charCodeAt(0) - base + rot) % 26 + base);
                    });
                    break;
            }
            if(output === "") output = "ERROR: EMPTY RESULT. CHECK FORMAT.";
        } catch(e) {
            output = "ERROR: DECRYPTION FAILED. INVALID FORMAT.";
        }

        outEl.innerText = output;

        if(output.startsWith("ERROR")) {
            outEl.style.color = "var(--err)";
        } else {
            outEl.style.color = "var(--txt)";
        }
    },

    autoDetect() {
        const inputEl = this.sys.root.querySelector('#inputCipher');
        const val = inputEl.value.trim();
        const statusEl = this.sys.root.querySelector('#status-detection');

        if(!val) {
            statusEl.innerText = 'AUTO-DETECT: IDLE';
            statusEl.classList.remove('animate-pulse-txt');
            statusEl.style.color = 'var(--txt-dim)';
            statusEl.style.borderColor = 'var(--brd)';
            return;
        }

        let detected = '';
        if (/^[01\\s]+$/.test(val)) detected = 'binary';
        else if (/^[0-9A-Fa-f\\s]+$/.test(val) && val.length > 2) detected = 'hex';
        else if (/^[.\\-\\/\\s]+$/.test(val)) detected = 'morse';
        else if (val.includes('%')) detected = 'url';
        else if (val.endsWith('=') || /^[A-Za-z0-9+/]+={0,2}$/.test(val)) detected = 'base64';

        if(detected && detected !== this.state.currentMode) {
            statusEl.innerText = `DETECTED: ${detected.toUpperCase()}`;
            statusEl.classList.add('animate-pulse-txt');
            statusEl.style.color = 'var(--txt)';
            statusEl.style.borderColor = 'var(--prm)';
            this.setMode(detected);
        } else if (!detected) {
            statusEl.innerText = `AUTO-DETECT: UNKNOWN`;
            statusEl.classList.remove('animate-pulse-txt');
            statusEl.style.color = 'var(--txt-dim)';
            statusEl.style.borderColor = 'var(--brd)';
        }
    },

    setMode(mode) {
        this.state.currentMode = mode;
        const root = this.sys.root;

        root.querySelectorAll('.mode-btn').forEach(b => {
            b.classList.remove('active');
        });

        const activeBtn = root.querySelector(`.mode-btn[data-mode="${mode}"]`);
        if(activeBtn) activeBtn.classList.add('active');

        const rotControl = root.querySelector('#rot-control');
        if(rotControl) {
            rotControl.style.display = (mode === 'rot13') ? 'flex' : 'none';
        }

        if(root.querySelector('#inputCipher').value) {
            this.crackCode();
        }
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, textarea, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});
        });

        const inputCipher = root.querySelector('#inputCipher');
        inputCipher.addEventListener('input', () => {
            this.autoDetect();
            this.crackCode();
        });

        root.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.getAttribute('data-mode');
                this.setMode(mode);
            };
        });

        const rotSlider = root.querySelector('#input-rot');
        if(rotSlider) {
            rotSlider.addEventListener('input', (e) => {
                this.state.rotShift = parseInt(e.target.value);
                root.querySelector('#rot-val').innerText = this.state.rotShift;
                this.crackCode();
            });
        }

        root.querySelector('#btn-clear').onclick = () => {
            inputCipher.value = '';
            root.querySelector('#outputPlain').innerText = '';
            this.autoDetect();
            if(this.sys && typeof this.sys.toast === 'function') this.sys.toast("Buffer cleared.", "info");
        };

        root.querySelector('#btn-paste').onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                inputCipher.value = text;
                this.autoDetect();
                this.crackCode();
                if(this.sys && typeof this.sys.toast === 'function') this.sys.toast("Ciphertext pasted.", "success");
            } catch(err) {
                if(this.sys && typeof this.sys.toast === 'function') this.sys.toast("Clipboard access denied.", "error");
            }
        };

        root.querySelector('#btn-copy').onclick = () => {
            const text = root.querySelector('#outputPlain').innerText;
            if(text && !text.startsWith("ERROR")) {
                navigator.clipboard.writeText(text);
                if(this.sys && typeof this.sys.toast === 'function') this.sys.toast("Decrypted data copied.", "success");
            } else {
                if(this.sys && typeof this.sys.toast === 'function') this.sys.toast("No valid data.", "error");
            }
        };
    }
})