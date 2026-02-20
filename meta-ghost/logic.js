({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        fileDataURL: null,
        fileName: '',
        exifFound: false,
        libLoaded: false
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
            '--err': '#1e3a8a', /* Overridden to dark blue as requested to avoid red if possible, though error usually red */
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
        const hasVisited = localStorage.getItem('app_visited_meta_ghost');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.loadExifReader();
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

    loadExifReader() {
        if (window.ExifReader) { this.state.libLoaded = true; return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/exifreader@4.12.0/dist/exif-reader.min.js';
        script.onload = () => { this.state.libLoaded = true; this.render(); };
        document.head.appendChild(script);
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

    async handleFile(file) {
        this.state.fileName = file.name;
        this.state.fileDataURL = URL.createObjectURL(file);

        if (window.ExifReader) {
            try {
                const tags = await window.ExifReader.load(file);
                if (tags && (tags['GPSLatitude'] || tags['Make'] || tags['DateTimeOriginal'])) {
                    this.state.exifFound = true;
                } else {
                    this.state.exifFound = false;
                }
            } catch (e) {
                this.state.exifFound = false;
            }
        }
        this.render();
    },

    stripMetadata() {
        if(!this.state.fileDataURL) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Canvas inherently strips EXIF metadata when converted to blob
            canvas.toBlob((blob) => {
                this.saveToDevice(blob, "CLEANED_" + this.state.fileName, "image/jpeg");
                if(this.sys) this.sys.toast("Metadata stripped securely!", "success");
            }, "image/jpeg", 0.95);
        };
        img.src = this.state.fileDataURL;
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
                    width: 100%; max-width: 600px; margin-bottom: 20px; text-align: center;
                }

                .btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 16px 32px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.95); }

                .drop-zone {
                    border: 2px dashed var(--prm);
                    border-radius: 16px; padding: 40px 20px;
                    text-align: center; cursor: pointer;
                    background: rgba(37, 99, 235, 0.1);
                    margin-bottom: 20px;
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
                        META GHOST
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        EXIF Metadata is a digital snitch. Scan, analyze, and strip hidden GPS coordinates and camera data from your photos instantly.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">ENTER FORENSICS</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        if(!this.state.libLoaded) return `<h2 style="color: var(--txt);">LOADING FORENSIC ENGINE...</h2>`;

        let contentHtml = '';
        if (!this.state.fileDataURL) {
            contentHtml = `
                <input type="file" id="fileInput" accept="image/jpeg, image/png, image/webp" style="display: none;">
                <div id="dropZone" class="drop-zone">
                    <h3 style="font-weight: 900; font-size: 1.5rem; color: var(--prm); margin-bottom: 10px;">UPLOAD EVIDENCE</h3>
                    <p style="font-family: monospace; font-size: 0.85rem; color: var(--txt-dim);">JPG, PNG, WEBP Supported</p>
                </div>
            `;
        } else {
            contentHtml = `
                <div style="margin-bottom: 24px;">
                    <img src="${this.state.fileDataURL}" style="max-height: 250px; border-radius: 12px; border: 2px solid var(--prm); margin: 0 auto 20px;">
                    <h3 style="font-weight: 900; font-size: 1.2rem; color: var(--txt);">${this.state.fileName}</h3>
                    <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(37, 99, 235, 0.1); border: 1px solid var(--prm);">
                        <span style="font-weight: 800; display: block; font-size: 1.1rem; color: ${this.state.exifFound ? 'var(--txt)' : 'var(--prm)'};">
                            ${this.state.exifFound ? 'WARNING: METADATA FOUND' : 'CLEAN: NO THREATS DETECTED'}
                        </span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="btn-reset" class="btn" style="flex: 1; background: transparent; border: 2px solid var(--prm); color: var(--prm);">RESET</button>
                    <button id="btn-strip" class="btn" style="flex: 2;">NUKE METADATA & SAVE</button>
                </div>
            `;
        }

        return `<div class="glass-panel">${contentHtml}</div>`;
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
            localStorage.setItem('app_visited_meta_ghost', 'true');
            this.render();
        });

        const dropZone = root.querySelector('#dropZone');
        const fileInput = root.querySelector('#fileInput');
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if(e.target.files.length > 0) this.handleFile(e.target.files[0]);
            });
        }

        const btnReset = root.querySelector('#btn-reset');
        if (btnReset) btnReset.addEventListener('click', () => {
            this.state.fileDataURL = null;
            this.state.fileName = '';
            this.state.exifFound = false;
            this.render();
        });

        const btnStrip = root.querySelector('#btn-strip');
        if (btnStrip) btnStrip.addEventListener('click', () => this.stripMetadata());
    }
})