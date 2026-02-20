({
    state: {
        isFirstVisit: true,
        view: 'home',
        pendingFiles: [],
        queue: [],
        isProcessing: false,
        options: { colors: 16, blur: 0 }
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            /* Background Cyberpunk: Deep Purple/Black dengan aksen */
            '--bg': '#050505',
            '--glass': '#1a1a2e', /* SOLID */
            '--glass-border': '#00f2ff', /* Cyan/Blue border */
            '--txt': '#00f2ff', /* Wajib Biru */
            '--txt-dim': '#0088ff', /* Wajib Biru Redup */
            '--prm': '#0066ff', /* Biru Solid */
            '--prm-hov': '#0052cc',
            '--btn-txt': '#050505', /* Text di dalam button tetap gelap agar kontras dengan button biru */
            '--btn-sec-bg': '#002244',
            '--btn-sec-txt': '#00f2ff',
            '--scs': '#00ff99',
            '--err': '#ff0055',
            '--card-bg': '#0f0f1b'
        },
        light: {
            /* Light Cyberpunk: Pastel Neon */
            '--bg': '#e0f2fe',
            '--glass': '#ffffff',
            '--glass-border': '#0066ff',
            '--txt': '#0044cc', /* Wajib Biru */
            '--txt-dim': '#0066ff',
            '--prm': '#0066ff',
            '--prm-hov': '#0044cc',
            '--btn-txt': '#ffffff',
            '--btn-sec-bg': '#cbd5e1',
            '--btn-sec-txt': '#0044cc',
            '--scs': '#059669',
            '--err': '#db2777',
            '--card-bg': '#ffffff'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_vf_v7');
        if (hasVisited) this.state.isFirstVisit = false;

        if (!window.ImageTracer) {
            const s = document.createElement('script');
            s.src = "https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.min.js";
            document.head.appendChild(s);
        }

        this.render();
        this.bindEvents();
    },

    unmount() {
        this.sys.root.innerHTML = '';
    },

    saveToDevice(blob, filename) {
        if (this.sys && this.sys.download) {
            this.sys.toast("Saving...", "info");
            this.sys.download(blob, filename, "image/svg+xml");
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
    },

    render() {
        const { view, pendingFiles, queue, isProcessing, options } = this.state;
        let content = '';
        let footerBtn = ''; // Mengganti floatBtn menjadi footerBtn (non-floating)

        // --- ICON HELPER ---
        const IconUpload = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
        const IconMagic = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/></svg>`;
        const IconSave = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

        if (view === 'home') {
            content = `
                <div class="center-box fade-in">
                    <div class="hero-graphic">
                        ${IconMagic}
                    </div>
                    <h1 class="hero-title">Vector Forge</h1>
                    <p class="hero-desc">Ubah gambar bitmap jadi SVG vektor tajam secara instan.</p>

                    <button id="btn-pick" class="btn-solid-blue">
                        ${IconUpload} <span>PILIH GAMBAR</span>
                    </button>

                    <div class="feature-pills" style="margin-top: 30px;">
                        <span><i class="mdi mdi-check-bold"></i> Auto-Trace</span>
                        <span><i class="mdi mdi-palette"></i> Color Quantization</span>
                    </div>
                </div>
            `;
        } else if (view === 'review') {
            content = `
                <div class="scroll-content fade-in">
                    <div class="section-header">
                        <h3>Siap Diproses</h3>
                        <span class="badge">${pendingFiles.length} item</span>
                    </div>
                    <div class="grid-preview">
                        ${pendingFiles.map(f => `
                            <div class="preview-card">
                                <img src="${f.preview}" class="preview-img" onerror="this.src='https://via.placeholder.com/150?text=Error'">
                            </div>
                        `).join('')}
                    </div>
                    <div class="info-box">
                        <i class="mdi mdi-information"></i>
                        <span>Proses dilakukan lokal di HP Anda.</span>
                    </div>
                    <button id="btn-clear" class="btn-text destructive">BATALKAN</button>
                </div>
            `;
            footerBtn = `
                <button id="btn-confirm-upload" class="btn-solid-blue full-width">
                    ${IconMagic} <span>MULAI VEKTORISASI</span>
                </button>
            `;
        } else if (view === 'dashboard') {
            const doneCount = queue.filter(i => i.status === 'done').length;
            const totalCount = queue.length;

            content = `
                <div class="scroll-content fade-in">
                    <div class="control-panel">
                        <div class="panel-header">PENGATURAN</div>
                        <div class="slider-group">
                            <div class="slider-label">
                                <span>Jumlah Warna</span>
                                <span class="val-badge">${options.colors}</span>
                            </div>
                            <input type="range" id="inp-col" min="2" max="64" step="2" value="${options.colors}">
                        </div>
                        <div class="slider-group">
                            <div class="slider-label">
                                <span>Blur (Halus)</span>
                                <span class="val-badge">${options.blur}px</span>
                            </div>
                            <input type="range" id="inp-blur" min="0" max="4" step="1" value="${options.blur}">
                        </div>
                    </div>

                    <div class="section-header">
                        <h3>Antrian</h3>
                        <span class="badge">${doneCount}/${totalCount}</span>
                    </div>

                    <div class="list-area">
                        ${queue.map(item => `
                            <div class="file-row">
                                <div class="row-thumb-wrapper">
                                    <img src="${item.preview}" class="row-thumb">
                                    ${item.status === 'done' ? '<div class="status-icon success"><i class="mdi mdi-check-bold"></i></div>' : ''}
                                    ${item.status === 'processing' ? '<div class="status-loader"></div>' : ''}
                                </div>
                                <div class="row-info">
                                    <div class="row-name">${item.name}</div>
                                    <div class="row-meta">
                                        ${item.status === 'done'
                                            ? `<span class="meta-tag success">SELESAI</span>`
                                            : item.status === 'processing'
                                                ? `<span class="meta-tag processing">MEMPROSES...</span>`
                                                : `<span class="meta-tag">MENUNGGU</span>`}
                                    </div>
                                </div>
                                ${item.status === 'done' ? `
                                    <button class="btn-icon-solid" data-action="save" data-id="${item.id}">
                                        ${IconSave}
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            if(doneCount > 0) {
                footerBtn = `
                    <div class="dock-actions-solid">
                        <button id="btn-home" class="btn-solid-sec">BARU</button>
                        <button id="btn-dl-all" class="btn-solid-blue">SIMPAN SEMUA</button>
                    </div>
                `;
            } else {
                 footerBtn = `
                    <button class="btn-solid-blue disabled full-width">
                        <span class="loader-dots"></span> MEMPROSES...
                    </button>
                `;
            }
        }

        this.sys.root.innerHTML = `
            <div class="app-root">
                <div class="mobile-spacer-header"></div>
                <div class="main-body">
                    ${content}
                </div>
                <div class="footer-bar">
                    ${footerBtn}
                </div>
                <div class="mobile-spacer-footer"></div>
            </div>
            <input type="file" id="f-in" multiple accept="image/*" style="display:none">

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');

                :root {
                    --radius-lg: 16px;
                    --radius-md: 12px;
                }

                .app-root {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    height: 100%;
                    background: var(--bg);
                    /* Background Cyberpunk Grid Effect */
                    background-image: linear-gradient(rgba(0, 102, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0, 102, 255, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                    color: var(--txt);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }

                /* Mobile Spacing 85px */
                @media (max-width: 768px) {
                    .mobile-spacer-header { height: 85px; flex-shrink: 0; }
                    .mobile-spacer-footer { height: 85px; flex-shrink: 0; }
                }

                .main-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

                /* TULISAN WARNA BIRU SAAT MENGETIK */
                input, textarea {
                    color: #00f2ff !important;
                    background: #001122;
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    padding: 8px;
                }

                /* HERO SECTION */
                .center-box {
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                    justify-content: center; text-align: center; padding: 24px;
                }
                .hero-graphic {
                    width: 80px; height: 80px;
                    background: var(--card-bg); border: 2px solid var(--glass-border);
                    border-radius: 20px; display: flex; align-items: center; justify-content: center;
                    margin-bottom: 24px; color: var(--txt);
                    box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);
                }
                .hero-graphic svg { width: 40px; height: 40px; }

                .hero-title {
                    font-size: 28px; font-weight: 800; margin: 0 0 12px 0;
                    color: var(--txt); letter-spacing: -0.5px;
                    text-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
                }
                .hero-desc {
                    font-size: 15px; line-height: 1.5; color: var(--txt-dim);
                    max-width: 280px; margin-bottom: 32px; font-weight: 500;
                }
                .feature-pills { display: flex; gap: 10px; font-size: 13px; color: var(--txt); font-weight: 700; }
                .feature-pills span { border: 1px solid var(--glass-border); padding: 8px 16px; border-radius: 50px; background: rgba(0, 102, 255, 0.1); }

                /* BUTTONS - SOLID BLUE, NO FLOAT */
                .btn-solid-blue {
                    background: var(--prm);
                    color: var(--btn-txt);
                    border: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    width: auto;
                    transition: 0.2s;
                    text-transform: uppercase;
                }
                .btn-solid-blue:active { transform: scale(0.98); background: var(--prm-hov); }
                .btn-solid-blue.full-width { width: 100%; }

                .btn-solid-sec {
                    background: var(--btn-sec-bg);
                    color: var(--btn-sec-txt);
                    border: 1px solid var(--glass-border);
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 800;
                    cursor: pointer;
                }

                /* FOOTER BAR (Ganti Floating Dock) */
                .footer-bar {
                    padding: 20px;
                    background: var(--bg);
                    border-top: 2px solid var(--glass-border);
                    z-index: 10;
                }
                .dock-actions-solid { display: flex; gap: 12px; }
                .dock-actions-solid button { flex: 1; }

                /* SCROLL CONTENT */
                .scroll-content { flex: 1; overflow-y: auto; padding: 20px; z-index: 1; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .section-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: var(--txt); }
                .badge { background: var(--prm); color: var(--btn-txt); padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }

                /* GRID PREVIEW */
                .grid-preview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
                .preview-card {
                    aspect-ratio: 1; border-radius: var(--radius-md); overflow: hidden;
                    background: #000; border: 2px solid var(--glass-border);
                }
                .preview-img { width: 100%; height: 100%; object-fit: cover; }

                .info-box {
                    background: var(--card-bg); border: 2px solid var(--glass-border); border-radius: var(--radius-md);
                    padding: 16px; display: flex; align-items: center; gap: 12px;
                    font-size: 13px; color: var(--txt); margin-bottom: 20px; font-weight: 500;
                }
                .btn-text.destructive {
                    color: var(--err); margin-top: 10px; width: 100%; padding: 12px;
                    border: 1px solid var(--err); background: transparent; border-radius: 12px;
                    font-weight: 700; cursor: pointer;
                }

                /* DASHBOARD CONTROLS */
                .control-panel {
                    background: var(--card-bg); border: 2px solid var(--glass-border);
                    padding: 20px; border-radius: var(--radius-lg); margin-bottom: 24px;
                }
                .panel-header { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--txt-dim); font-weight: 800; margin-bottom: 16px; }
                .slider-group { margin-bottom: 20px; }
                .slider-label { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; font-weight: 700; color: var(--txt); }
                .val-badge { color: var(--txt); background: var(--prm); padding: 2px 8px; border-radius: 6px; }

                input[type=range] {
                    width: 100%; height: 8px; border-radius: 4px; background: var(--btn-sec-bg);
                    appearance: none; outline: none;
                }
                input[type=range]::-webkit-slider-thumb {
                    appearance: none; width: 24px; height: 24px; border-radius: 50%;
                    background: var(--prm); border: 3px solid #fff; cursor: pointer;
                }

                /* LIST AREA */
                .list-area { display: flex; flex-direction: column; gap: 12px; }
                .file-row {
                    background: var(--card-bg); border: 2px solid var(--glass-border);
                    padding: 12px; border-radius: var(--radius-md);
                    display: flex; align-items: center; gap: 14px;
                }
                .row-thumb-wrapper { position: relative; width: 56px; height: 56px; }
                .row-thumb { width: 100%; height: 100%; border-radius: 10px; object-fit: cover; background: #000; border: 1px solid var(--glass-border); }

                .status-icon.success {
                    position: absolute; bottom: -6px; right: -6px; width: 24px; height: 24px;
                    border-radius: 50%; background: var(--scs); color: #000;
                    display: flex; align-items: center; justify-content: center; font-size: 14px;
                    border: 2px solid var(--card-bg);
                }
                .status-loader {
                    position: absolute; inset: 0; border-radius: 10px;
                    border: 3px solid var(--prm); border-top-color: transparent;
                    animation: spin 1s linear infinite;
                }

                .row-info { flex: 1; min-width: 0; }
                .row-name { font-weight: 700; font-size: 14px; margin-bottom: 6px; color: var(--txt); }
                .meta-tag { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: var(--btn-sec-bg); color: var(--txt); }
                .meta-tag.success { background: var(--scs); color: #000; }

                .btn-icon-solid {
                    width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--glass-border);
                    background: var(--btn-sec-bg); color: var(--txt);
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                }

                .btn-solid-blue.disabled {
                    background: #334455; color: #667788; pointer-events: none;
                }

                @keyframes spin { to { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        const picker = root.querySelector('#f-in');
        const safeClick = (sel, fn) => { const el = root.querySelector(sel); if(el) el.onclick = fn; };

        safeClick('#btn-pick', () => picker.click());
        safeClick('#btn-clear', () => { this.state.pendingFiles = []; this.state.view = 'home'; this.render(); this.bindEvents(); });
        safeClick('#btn-home', () => { this.state.queue = []; this.state.view = 'home'; this.render(); this.bindEvents(); });
        safeClick('#btn-dl-all', () => this.batchDownload());

        safeClick('#btn-confirm-upload', () => {
            this.state.queue = this.state.pendingFiles.map(f => ({
                id: Math.random().toString(36).substr(2, 9),
                preview: f.preview, name: f.name.replace(/\.[^/.]+$/, ""), status: 'idle', rawFile: f.file
            }));
            this.state.view = 'dashboard';
            this.render(); this.bindEvents(); this.processQueue();
        });

        root.querySelectorAll('.btn-icon-solid[data-action="save"]').forEach(btn => {
            btn.onclick = () => {
                const item = this.state.queue.find(i => i.id === btn.dataset.id);
                if (item && item.blob) this.saveToDevice(item.blob, item.name + '.svg');
            };
        });

        if (picker) picker.onchange = (e) => {
            if (e.target.files.length > 0) {
                this.state.pendingFiles = Array.from(e.target.files).map(f => ({
                    file: f, name: f.name, preview: URL.createObjectURL(f)
                }));
                this.state.view = 'review';
                this.render(); this.bindEvents();
            }
            picker.value = '';
        };

        const bindRange = (id, key) => {
            const el = root.querySelector(id);
            if(el) el.oninput = (e) => {
                this.state.options[key] = parseInt(e.target.value);
                this.render();
                this.bindEvents();
                const newEl = this.sys.root.querySelector(id);
                if(newEl) newEl.focus();
            };
        };
        bindRange('#inp-col', 'colors');
        bindRange('#inp-blur', 'blur');
    },

    processQueue() {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        const processNext = () => {
            const item = this.state.queue.find(i => i.status === 'idle');
            if (!item) { this.state.isProcessing = false; this.render(); this.bindEvents(); return; }

            item.status = 'processing';
            this.render(); this.bindEvents();

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const cvs = document.createElement('canvas');
                const scale = Math.min(1, 800 / img.width);
                cvs.width = img.width * scale; cvs.height = img.height * scale;
                cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);

                if(!window.ImageTracer) { this.sys.toast("Lib Missing", "error"); return; }

                ImageTracer.imageToSVG(cvs.toDataURL(), (svgStr) => {
                    const blob = new Blob([svgStr], {type: "image/svg+xml"});
                    item.blob = blob;
                    item.status = 'done';
                    setTimeout(processNext, 100);
                }, { numberofcolors: this.state.options.colors, blurradius: this.state.options.blur, viewbox: true });
            };
            img.onerror = () => {
                item.status = 'error';
                processNext();
            };
            img.src = item.preview;
        };
        processNext();
    },

    batchDownload() {
        const ready = this.state.queue.filter(i => i.status === 'done');
        if(!ready.length) return;
        this.sys.toast(`Saving ${ready.length} files...`, "info");
        let i = 0;
        const interval = setInterval(() => {
            if(i >= ready.length) { clearInterval(interval); return; }
            this.saveToDevice(ready[i].blob, ready[i].name + '.svg');
            i++;
        }, 1000);
    }
})