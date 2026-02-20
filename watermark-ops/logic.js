({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        files: [],
        wmText: 'COPYRIGHT 2026',
        opacity: 50
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': '#06b6d4',
            '--glass-border': '1px solid #2563eb',
            '--txt': '#1e3a8a',
            '--txt-dim': '#1d4ed8',
            '--prm': '#2563eb',
            '--scs': '#2563eb',
            '--err': '#1e3a8a',
            '--brd': '#3b82f6',
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
            '--err': '#1e3a8a',
            '--brd': '#3b82f6',
            '--shadow': '0 4px 15px rgba(37, 99, 235, 0.3)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_watermark_ops');
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

    handleFiles(fileList) {
        this.state.files = Array.from(fileList);
        this.render();
    },

    processWatermark() {
        if(this.state.files.length === 0) {
            if(this.sys) this.sys.toast("Upload images first!", "error");
            return;
        }

        if(this.sys) this.sys.toast("Processing Watermarks...", "info");

        this.state.files.forEach((file, index) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw Base Image
                ctx.drawImage(img, 0, 0);

                // Set Styling required
                ctx.globalAlpha = this.state.opacity / 100;
                ctx.fillStyle = '#1e3a8a'; // Force Blue text as per requirements

                // Responsive Font Size
                const fontSize = Math.floor(img.width * 0.05);
                ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Diagonal Tile Logic
                ctx.translate(canvas.width/2, canvas.height/2);
                ctx.rotate(-Math.PI / 4); // Rotate 45deg
                ctx.fillText(this.state.wmText, 0, 0);

                canvas.toBlob((blob) => {
                    this.saveToDevice(blob, `WM_${file.name}`, file.type);
                }, file.type, 0.95);
            };
            img.src = URL.createObjectURL(file);
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

                .glass-panel {
                    background: var(--glass);
                    border: var(--glass-border);
                    border-radius: 16px; padding: 30px;
                    box-shadow: var(--shadow);
                    width: 100%; max-width: 700px; margin-bottom: 20px;
                }

                .btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 16px 32px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.95); }

                /* BLUE TEXT REQUIREMENT */
                .cyber-input {
                    background: rgba(37, 99, 235, 0.1);
                    border: 2px solid var(--prm);
                    color: var(--txt); /* Blue text Wajib */
                    font-family: monospace; font-size: 14px; font-weight: bold;
                    padding: 16px; border-radius: 12px;
                    width: 100%; outline: none;
                }
                .cyber-input::placeholder { color: rgba(30, 58, 138, 0.5); }

                .drop-zone {
                    border: 2px dashed var(--prm);
                    border-radius: 16px; padding: 40px 20px;
                    text-align: center; cursor: pointer;
                    background: rgba(37, 99, 235, 0.1);
                    margin-bottom: 24px;
                }

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
                        ASSET GUARD
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        Anti-Theft Protocol. Bulk watermark 100+ product photos instantly inside your browser without server uploads.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">LAUNCH GESTURE</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        return `
            <div class="glass-panel">
                <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
                <div id="dropZone" class="drop-zone">
                    <h3 style="font-weight: 900; font-size: 1.5rem; color: var(--prm); margin-bottom: 10px;">
                        ${this.state.files.length > 0 ? `[ ${this.state.files.length} IMAGES SELECTED ]` : 'UPLOAD TARGET PHOTOS'}
                    </h3>
                    <p style="font-family: monospace; font-size: 0.85rem; color: var(--txt-dim);">Click or Drop Multiple Files Here</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 800; color: var(--txt); display: block; margin-bottom: 8px;">WATERMARK TEXT</label>
                    <input type="text" id="wmTextInput" class="cyber-input" value="${this.state.wmText}">
                </div>

                <div style="margin-bottom: 30px;">
                    <label style="font-weight: 800; color: var(--txt); display: block; margin-bottom: 8px;">OPACITY: ${this.state.opacity}%</label>
                    <input type="range" id="opacitySlider" min="10" max="100" value="${this.state.opacity}" style="width: 100%; accent-color: var(--prm);">
                </div>

                <button id="btn-process" class="btn" style="width: 100%; padding: 18px; font-size: 1.1rem;">
                    APPLY WATERMARK TO ALL
                </button>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) startBtn.addEventListener('click', () => {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
            localStorage.setItem('app_visited_watermark_ops', 'true');
            this.render();
        });

        const dropZone = root.querySelector('#dropZone');
        const fileInput = root.querySelector('#fileInput');
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if(e.target.files.length > 0) this.handleFiles(e.target.files);
            });
        }

        const wmTextInput = root.querySelector('#wmTextInput');
        if(wmTextInput) {
            wmTextInput.addEventListener('input', (e) => this.state.wmText = e.target.value);
        }

        const opacitySlider = root.querySelector('#opacitySlider');
        if(opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.state.opacity = e.target.value;
                const label = e.target.previousElementSibling;
                if(label) label.innerText = `OPACITY: ${this.state.opacity}%`;
            });
        }

        const btnProcess = root.querySelector('#btn-process');
        if(btnProcess) btnProcess.addEventListener('click', () => this.processWatermark());
    }
})