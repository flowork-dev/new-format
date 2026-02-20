({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        fileDataURL: null,
        intensity: 25,
        mode: 'pixel',
        isProcessing: false,
        resultImage: null
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
        const hasVisited = localStorage.getItem('app_visited_glitch_armor');
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

    handleFile(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.state.fileDataURL = e.target.result;
                this.state.resultImage = null;
                this.render();
            };
            reader.readAsDataURL(file);
        }
    },

    executePoison() {
        if(!this.state.fileDataURL) return;
        this.state.isProcessing = true;
        this.render();

        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const lvl = parseInt(this.state.intensity);

                for (let i = 0; i < data.length; i += 4) {
                    if(this.state.mode === 'pixel') {
                        const noise = (Math.random() - 0.5) * lvl;
                        data[i] += noise;
                        data[i+1] += noise;
                        data[i+2] += noise;
                    } else if (this.state.mode === 'chroma') {
                        if(i % (100 - lvl) === 0) {
                            data[i] = data[i+2]; // Swap R-B
                        }
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                this.state.resultImage = canvas.toDataURL('image/png');
                this.state.isProcessing = false;

                if(this.sys) this.sys.toast("Armor Injected Successfully!", "success");
                this.render();
            };
            img.src = this.state.fileDataURL;
        }, 300);
    },

    downloadResult() {
        if(!this.state.resultImage) return;
        const arr = this.state.resultImage.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], {type:mime});
        this.saveToDevice(blob, "armored_image.png", mime);
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
                    border-radius: 20px; padding: 30px;
                    box-shadow: var(--shadow);
                    width: 100%; max-width: 600px; margin-bottom: 20px;
                }

                .btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 14px 28px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.95); }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }

                /* BLUE TEXT REQUIREMENT */
                .cyber-input {
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid var(--prm);
                    color: var(--txt); /* Blue text */
                    font-family: monospace; font-size: 14px;
                    padding: 12px; border-radius: 8px;
                    width: 100%; outline: none;
                }

                .preview-box {
                    width: 100%; height: 250px; border: 2px dashed var(--prm);
                    border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    overflow: hidden; background: rgba(255,255,255,0.1); cursor: pointer;
                }
                .preview-box img { width: 100%; height: 100%; object-fit: contain; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div style="max-width: 800px; width: 100%; text-align: center;">
                <div class="glass-panel" style="background: transparent; border: none; box-shadow: none; margin: 0 auto;">
                    <h1 style="font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: var(--txt);">
                        GLITCH ARMOR
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        Anti-AI Image Defense. Inject invisible cryptographic noise into your photos to prevent unauthorized AI model training.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">DEPLOY ARMOR</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        const { fileDataURL, intensity, mode, isProcessing, resultImage } = this.state;

        let previewHtml = `<span style="color: var(--prm); font-weight: bold;">CLICK TO UPLOAD TARGET IMAGE</span>`;
        if (fileDataURL && !resultImage) previewHtml = `<img src="${fileDataURL}">`;
        if (resultImage) previewHtml = `<img src="${resultImage}">`;

        return `
            <div class="glass-panel">
                <input type="file" id="fileInput" accept="image/*" style="display: none;">
                <div id="uploadZone" class="preview-box" style="margin-bottom: 24px;">
                    ${previewHtml}
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 800; color: var(--txt); display: block; margin-bottom: 8px;">NOISE INTENSITY: ${intensity}</label>
                    <input type="range" id="intensitySlider" min="1" max="100" value="${intensity}" style="width: 100%; accent-color: var(--prm);">
                </div>

                <div style="margin-bottom: 24px;">
                    <label style="font-weight: 800; color: var(--txt); display: block; margin-bottom: 8px;">INJECTION ALGORITHM</label>
                    <select id="modeSelect" class="cyber-input">
                        <option value="pixel" ${mode === 'pixel' ? 'selected' : ''}>Pixel Perturbation (Recommended)</option>
                        <option value="chroma" ${mode === 'chroma' ? 'selected' : ''}>Chroma Swap (Aggressive)</option>
                    </select>
                </div>

                <div style="display: flex; gap: 12px; flex-direction: column; sm:flex-direction: row;">
                    <button id="btn-process" class="btn" style="flex: 1;" ${!fileDataURL || isProcessing ? 'disabled' : ''}>
                        ${isProcessing ? 'INJECTING NOISE...' : 'POISON IMAGE'}
                    </button>
                    ${resultImage ? `<button id="btn-download" class="btn" style="background: #1e3a8a;">DOWNLOAD SECURE IMAGE</button>` : ''}
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, select, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) startBtn.addEventListener('click', () => {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
            localStorage.setItem('app_visited_glitch_armor', 'true');
            this.render();
        });

        const uploadZone = root.querySelector('#uploadZone');
        const fileInput = root.querySelector('#fileInput');
        if(uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFile(e.target));
        }

        const slider = root.querySelector('#intensitySlider');
        if(slider) {
            slider.addEventListener('input', (e) => {
                this.state.intensity = e.target.value;
                // Update label without full re-render
                const label = e.target.previousElementSibling;
                if(label) label.innerText = `NOISE INTENSITY: ${this.state.intensity}`;
            });
        }

        const modeSelect = root.querySelector('#modeSelect');
        if(modeSelect) {
            modeSelect.addEventListener('change', (e) => this.state.mode = e.target.value);
        }

        const btnProcess = root.querySelector('#btn-process');
        if(btnProcess) btnProcess.addEventListener('click', () => this.executePoison());

        const btnDl = root.querySelector('#btn-download');
        if(btnDl) btnDl.addEventListener('click', () => this.downloadResult());
    }
})