({
    state: {
        appName: 'pdf_forge_ghost_scroll',
        mode: 'merge', // 'merge' | 'split'
        files: [],
        splitRange: '',
        processing: false,
        depsLoaded: false,
        loadingPercent: 0
    },

    sys: null,
    observer: null,

    // DEFINISI TEMA
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.9)',
            '--surface-2': 'rgba(30, 41, 59, 0.95)',
            '--txt': '#f8fafc',
            '--txt-sec': '#94a3b8',
            '--prm': '#38bdf8',
            '--prm-txt': '#0f172a',
            '--danger': '#f43f5e',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--input-bg': 'rgba(2, 6, 23, 0.6)',
            '--input-txt': '#ffffff',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        }
    },

    async mount(sys) {
        this.sys = sys;

        // Langsung Render Loading -> Load Deps -> Render App
        this.render();
        await this.loadDependencies();

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

        if(document.documentElement) {
            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        }

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

    async loadDependencies() {
        const load = (url) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = url; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });

        try {
            await Promise.all([
                load('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'),
                load('https://unpkg.com/downloadjs@1.4.7/download.min.js')
            ]);
            this.state.depsLoaded = true;
            this.render();
            this.bindEvents();
        } catch (e) {
            this.sys.alert("Gagal memuat PDF Engine. Cek koneksi internet.", "Error");
        }
    },

    setMode(mode) {
        this.state.mode = mode;
        this.state.files = [];
        this.render();
        this.bindEvents();
    },

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(f => f.type === 'application/pdf');
        if (newFiles.length === 0) return this.sys.toast('Hanya file PDF yang diizinkan.');

        if (this.state.mode === 'split') {
            this.state.files = [newFiles[0]];
        } else {
            this.state.files = [...this.state.files, ...newFiles];
        }
        this.render();
        this.bindEvents();
    },

    removeFile(idx) {
        this.state.files.splice(idx, 1);
        this.render();
        this.bindEvents();
    },

    async execute() {
        if(this.state.files.length === 0) return this.sys.alert("Upload file PDF dulu.", "Missing Files");
        if(this.state.mode === 'merge' && this.state.files.length < 2) return this.sys.alert("Butuh minimal 2 file untuk merge.", "Info");
        if(this.state.mode === 'split' && !this.state.splitRange) return this.sys.alert("Masukkan range halaman (Contoh: 1-5).", "Info");

        this.state.processing = true;
        this.render();

        setTimeout(async () => {
            try {
                const { PDFDocument } = window.PDFLib;

                if (this.state.mode === 'merge') {
                    const mergedPdf = await PDFDocument.create();
                    for (const file of this.state.files) {
                        const ab = await file.arrayBuffer();
                        const pdf = await PDFDocument.load(ab);
                        if (pdf.isEncrypted) throw new Error(`File ${file.name} terenkripsi.`);

                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    }
                    const pdfBytes = await mergedPdf.save();
                    window.download(pdfBytes, "merged_flowork.pdf", "application/pdf");
                    this.sys.toast("Berhasil Merge!");
                } else {
                    const file = this.state.files[0];
                    const ab = await file.arrayBuffer();
                    const srcDoc = await PDFDocument.load(ab);
                    if (srcDoc.isEncrypted) throw new Error("File terenkripsi.");

                    const totalPages = srcDoc.getPageCount();
                    const indices = this.parsePageRange(this.state.splitRange, totalPages);
                    if (indices.length === 0) throw new Error(`Range tidak valid (Max: ${totalPages})`);

                    const newDoc = await PDFDocument.create();
                    const copiedPages = await newDoc.copyPages(srcDoc, indices);
                    copiedPages.forEach((page) => newDoc.addPage(page));

                    const pdfBytes = await newDoc.save();
                    window.download(pdfBytes, `split_${file.name}`, "application/pdf");
                    this.sys.toast("Berhasil Split!");
                }
            } catch (e) {
                this.sys.alert(e.message, "Gagal");
            } finally {
                this.state.processing = false;
                this.render();
                this.bindEvents();
            }
        }, 100);
    },

    parsePageRange(input, maxPage) {
        const pages = new Set();
        const parts = input.split(',').map(p => p.trim());
        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(num => parseInt(num));
                if (!isNaN(start) && !isNaN(end)) {
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let i = min; i <= max; i++) {
                        if (i >= 1 && i <= maxPage) pages.add(i - 1);
                    }
                }
            } else {
                const num = parseInt(part);
                if (!isNaN(num) && num >= 1 && num <= maxPage) pages.add(num - 1);
            }
        });
        return Array.from(pages).sort((a, b) => a - b);
    },

    render() {
        const content = !this.state.depsLoaded ? this.renderLoading() : this.renderMainApp();

        this.sys.root.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;

                    /* GHOST SCROLL (Scrollable but invisible) */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none;  /* IE 10+ */
                }
                .app-root::-webkit-scrollbar {
                    display: none; /* Chrome/Safari */
                }

                .container {
                    max-width: 800px;
                    margin: auto; /* CENTER VERTICAL & HORIZONTAL */
                    width: 100%;
                    padding: 24px 20px; box-sizing: border-box;
                    display: flex; flex-direction: column;
                }

                .scroll-content { padding-bottom: 20px !important; }

                /* CARDS */
                .card {
                    background: var(--surface-2); border: 1px solid var(--brd);
                    border-radius: 24px; padding: 24px; margin-bottom: 20px;
                    box-shadow: var(--shadow);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                }

                /* TABS */
                .tabs {
                    display: flex; background: var(--surface-2); padding: 6px;
                    border-radius: 100px; border: 1px solid var(--brd);
                    margin-bottom: 24px; box-shadow: var(--shadow);
                }
                .tab-item {
                    flex: 1; text-align: center; padding: 12px;
                    border-radius: 100px; font-weight: 700; font-size: 14px;
                    cursor: pointer; color: var(--txt-sec); transition: 0.3s;
                }
                .tab-item.active { background: var(--prm); color: var(--prm-txt); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                /* UPLOAD */
                .upload-box {
                    border: 2px dashed var(--brd); border-radius: 20px;
                    padding: 40px; text-align: center; cursor: pointer;
                    transition: 0.2s; background: rgba(0,0,0,0.02);
                }
                .upload-box:hover { border-color: var(--prm); background: rgba(56, 189, 248, 0.05); }

                /* FILES */
                .file-list { margin-top: 20px; }
                .file-item {
                    display: flex; justify-content: space-between; align-items: center;
                    background: var(--bg-root); border: 1px solid var(--brd);
                    padding: 12px 16px; border-radius: 12px; margin-bottom: 8px;
                    font-size: 14px;
                }
                .del-btn { color: var(--danger); cursor: pointer; padding: 6px; border-radius: 8px; }
                .del-btn:hover { background: rgba(244, 63, 94, 0.1); }

                /* INPUTS & BTNS */
                .input-field {
                    width: 100%; box-sizing: border-box;
                    background: var(--input-bg); border: 1px solid var(--brd);
                    color: var(--input-txt); border-radius: 16px; padding: 16px;
                    font-family: 'JetBrains Mono', monospace; font-size: 14px;
                    outline: none; margin-bottom: 16px;
                }
                .input-field:focus { border-color: var(--prm); }

                .btn {
                    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 16px; border-radius: 16px;
                    transition: 0.2s; gap: 8px; width: 100%; padding: 18px;
                }
                .btn:active { transform: scale(0.98); }
                .btn-prm { background: var(--prm); color: var(--prm-txt); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

                /* ANIM */
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>

            <div class="app-root fade-in">
                ${content}
            </div>
        `;

        if(window.lucide) window.lucide.createIcons();
    },

    renderLoading() {
        return `
            <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <i data-lucide="loader-2" size="40" style="color:var(--prm); animation:spin 1s linear infinite;"></i>
                <h3 style="margin-top:20px; font-weight:600;">Loading Engine...</h3>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            </div>
        `;
    },

    renderMainApp() {
        const s = this.state;
        const isMerge = s.mode === 'merge';

        return `
            <div class="container scroll-content">
                <div class="tabs">
                    <div class="tab-item ${isMerge?'active':''}" id="tab-merge">MERGE</div>
                    <div class="tab-item ${!isMerge?'active':''}" id="tab-split">SPLIT</div>
                </div>

                <div class="fade-in">
                    <div class="card">
                        <div class="upload-box" id="drop-zone">
                            <i data-lucide="upload-cloud" size="32" color="var(--prm)"></i>
                            <h4 style="margin:10px 0 5px 0;">Upload PDF</h4>
                            <p style="margin:0; font-size:12px; color:var(--txt-sec);">${isMerge ? 'Pilih beberapa file' : 'Pilih satu file'}</p>
                            <input type="file" id="inp-file" multiple accept="application/pdf" hidden>
                        </div>

                        ${s.files.length > 0 ? `
                            <div class="file-list">
                                <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12px; font-weight:bold; color:var(--txt-sec);">
                                    <span>QUEUE (${s.files.length})</span>
                                    <span id="btn-clear" style="color:var(--danger); cursor:pointer;">CLEAR ALL</span>
                                </div>
                                ${s.files.map((f, i) => `
                                    <div class="file-item">
                                        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                                            <i data-lucide="file-text" size="16" color="var(--prm)"></i>
                                            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${f.name}</span>
                                        </div>
                                        <i data-lucide="x" class="del-btn" size="16" data-idx="${i}"></i>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <div class="card">
                        <h4 style="margin:0 0 15px 0;">${isMerge ? 'Merge Config' : 'Split Config'}</h4>

                        ${!isMerge ? `
                            <p style="font-size:12px; color:var(--txt-sec); margin-bottom:8px;">Halaman (Contoh: 1, 3-5, 8)</p>
                            <input type="text" id="inp-range" class="input-field" placeholder="Masukkan nomor halaman..." value="${s.splitRange}">
                        ` : `
                            <p style="font-size:13px; color:var(--txt-sec);">File akan digabungkan sesuai urutan di atas.</p>
                        `}

                        <button id="btn-exec" class="btn btn-prm">
                            ${s.processing ? '<i data-lucide="loader-2" style="animation:spin 1s linear infinite"></i> PROCESSING...' : (isMerge ? '<i data-lucide="layers"></i> MERGE FILES' : '<i data-lucide="scissors"></i> EXTRACT PAGES')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const r = this.sys.root;
        const $ = (sel) => r.querySelector(sel);
        const $$ = (sel) => r.querySelectorAll(sel);
        const stop = (e) => e.stopPropagation();

        r.querySelectorAll('button, input, .upload-box, .tab-item, .del-btn').forEach(el => {
            el.addEventListener('mousedown', stop);
            el.addEventListener('touchstart', stop);
        });

        if ($('#tab-merge')) $('#tab-merge').onclick = () => this.setMode('merge');
        if ($('#tab-split')) $('#tab-split').onclick = () => this.setMode('split');

        if ($('#drop-zone')) $('#drop-zone').onclick = () => $('#inp-file').click();
        if ($('#inp-file')) $('#inp-file').onchange = (e) => this.handleFiles(e.target.files);

        if ($('#btn-clear')) $('#btn-clear').onclick = () => { this.state.files = []; this.render(); this.bindEvents(); };

        $$('.del-btn').forEach(btn => {
            btn.onclick = (e) => {
                stop(e);
                this.removeFile(parseInt(btn.getAttribute('data-idx')));
            };
        });

        if ($('#inp-range')) $('#inp-range').oninput = (e) => this.state.splitRange = e.target.value;
        if ($('#btn-exec')) $('#btn-exec').onclick = () => !this.state.processing && this.execute();
    }
})