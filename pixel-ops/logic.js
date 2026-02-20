({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        files: [], // { original, compressed, status }
        maxSizeMB: 1,
        isProcessing: false,
        libLoaded: false
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
        const hasVisited = localStorage.getItem('app_visited_pixel_ops');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.loadLibrary();
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

    loadLibrary() {
        if (window.imageCompression) {
            this.state.libLoaded = true;
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js';
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

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async processFiles(fileList) {
        if(!window.imageCompression) return;
        this.state.isProcessing = true;
        this.render();

        const newFiles = Array.from(fileList).map(f => ({ original: f, compressed: null, status: 'pending' }));
        this.state.files.push(...newFiles);

        for (let item of newFiles) {
            try {
                let dynamicMax = this.state.maxSizeMB;
                if(item.original.size / 1024 / 1024 < dynamicMax) {
                    dynamicMax = (item.original.size / 1024 / 1024) * 0.9;
                }
                const options = { maxSizeMB: dynamicMax, maxWidthOrHeight: 1920, useWebWorker: true };
                item.compressed = await window.imageCompression(item.original, options);
                item.status = 'done';
            } catch (e) {
                console.error(e);
                item.status = 'error';
            }
        }

        this.state.isProcessing = false;
        if(this.sys) this.sys.toast("Compression Finished!", "success");
        this.render();
    },

    downloadFile(idx) {
        const item = this.state.files[idx];
        if(item && item.compressed) {
            this.saveToDevice(item.compressed, "opt_" + item.original.name, item.compressed.type);
        }
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
                    width: 100%; max-width: 700px; margin-bottom: 20px;
                }

                .btn {
                    background: var(--prm); color: #bfdbfe; border: none;
                    padding: 12px 24px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s; text-transform: uppercase;
                }
                .btn:active { transform: scale(0.95); }

                /* BLUE TEXT REQUIREMENT */
                .cyber-input {
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid var(--prm);
                    color: var(--txt); /* Blue text */
                    font-family: monospace; font-size: 14px;
                    padding: 12px; border-radius: 8px;
                    width: 100%; outline: none;
                }

                .drop-zone {
                    border: 2px dashed var(--prm); border-radius: 16px; padding: 40px 20px;
                    text-align: center; cursor: pointer; transition: all 0.3s;
                    background: rgba(255,255,255,0.1);
                }

                .file-card {
                    background: rgba(255,255,255,0.2); border: 1px solid var(--brd);
                    border-radius: 12px; padding: 16px; margin-bottom: 12px;
                    display: flex; justify-content: space-between; align-items: center;
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
                        PIXEL OPS
                    </h1>
                    <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; font-weight: bold;">
                        High-Performance Image Compression. Shrink image files securely within your browser using Web Workers.
                    </p>
                    <button id="start-app-btn" class="btn" style="padding: 18px 40px; font-size: 1.1rem;">LAUNCH ENGINE</button>
                </div>
            </div>
        `;
    },

    renderMainApp() {
        if (!this.state.libLoaded) return `<h2 style="color: var(--txt);">LOADING COMPRESSION ENGINE...</h2>`;

        const fileListHtml = this.state.files.map((f, i) => {
            if(f.status === 'pending') {
                return `<div class="file-card"><span style="color: var(--txt); font-weight: bold;">${f.original.name}</span><span style="color: var(--prm);">Processing...</span></div>`;
            }
            if(f.status === 'error') {
                return `<div class="file-card"><span style="color: var(--txt); font-weight: bold;">${f.original.name}</span><span style="color: var(--err);">Failed</span></div>`;
            }

            const diff = f.original.size - f.compressed.size;
            const savings = ((diff / f.original.size) * 100).toFixed(0);

            return `
                <div class="file-card">
                    <div>
                        <div style="font-weight: 800; color: var(--txt); font-size: 0.95rem; margin-bottom: 4px;">${f.original.name}</div>
                        <div style="font-size: 0.8rem; color: var(--txt-dim); font-family: monospace;">
                            ${this.formatSize(f.original.size)} ➔ ${this.formatSize(f.compressed.size)} (<span style="color: #1e3a8a; font-weight: bold;">-${savings}%</span>)
                        </div>
                    </div>
                    <button class="btn btn-dl-single" data-idx="${i}" style="padding: 8px 16px; font-size: 0.8rem;">SAVE</button>
                </div>
            `;
        }).join('');

        return `
            <div class="glass-panel">
                <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 24px;">
                    <div style="flex: 1;">
                        <label style="font-weight: 800; color: var(--txt); display: block; margin-bottom: 8px;">TARGET MAX SIZE (MB)</label>
                        <input type="number" id="maxSizeInput" class="cyber-input" value="${this.state.maxSizeMB}" step="0.1" min="0.1">
                    </div>
                </div>

                <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
                <div id="dropZone" class="drop-zone">
                    <h3 style="font-weight: 900; font-size: 1.2rem; color: var(--prm); margin-bottom: 8px;">DROP IMAGES HERE</h3>
                    <p style="font-family: monospace; font-size: 0.85rem; color: var(--txt-dim);">or click to browse local files</p>
                </div>

                ${this.state.files.length > 0 ? `
                    <div style="margin-top: 30px;">
                        <h4 style="font-weight: 800; color: var(--txt); margin-bottom: 16px; border-bottom: 1px solid var(--brd); padding-bottom: 8px;">PROCESSED FILES</h4>
                        ${fileListHtml}
                    </div>
                ` : ''}
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
            localStorage.setItem('app_visited_pixel_ops', 'true');
            this.render();
        });

        const maxSizeInput = root.querySelector('#maxSizeInput');
        if(maxSizeInput) {
            // Fix focus issue logic by not re-rendering the whole tree on input
            maxSizeInput.addEventListener('change', (e) => this.state.maxSizeMB = parseFloat(e.target.value));
        }

        const dropZone = root.querySelector('#dropZone');
        const fileInput = root.querySelector('#fileInput');
        if(dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#1e3a8a'; });
            dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--prm)'; });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--prm)';
                if(e.dataTransfer.files.length > 0) this.processFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', (e) => {
                if(e.target.files.length > 0) this.processFiles(e.target.files);
            });
        }

        root.querySelectorAll('.btn-dl-single').forEach(btn => {
            btn.addEventListener('click', () => this.downloadFile(parseInt(btn.getAttribute('data-idx'))));
        });
    }
})