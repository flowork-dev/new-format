({
    state: {
        isFirstVisit: true,
        view: 'home',
        pendingFiles: [],
        queue: [],
        isProcessing: false,
        options: { quality: 0.8 }
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg': '#0d0221',
            '--glass': '#16213e',
            '--glass-border': '#00d9ff',
            '--txt': '#00d9ff',
            '--txt-dim': '#005f73',
            '--prm': '#00d9ff', /* Diubah ke Cyan/Biru Neon */
            '--prm-hov': '#00b4d8',
            '--btn-txt': '#000080', /* Biru Navy untuk kontras */
            '--btn-sec-bg': '#0f3460',
            '--btn-sec-txt': '#00d9ff',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--card-bg': '#1a1a2e'
        },
        light: {
            '--bg': '#e0f2fe',
            '--glass': '#bae6fd',
            '--glass-border': '#3b82f6',
            '--txt': '#0000FF',
            '--txt-dim': '#1e40af',
            '--prm': '#3b82f6',
            '--prm-hov': '#2563eb',
            '--btn-txt': '#ffffff',
            '--btn-sec-bg': '#e2e8f0',
            '--btn-sec-txt': '#0000FF',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--card-bg': '#f0f9ff'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_fs_v7');
        if (hasVisited) this.state.isFirstVisit = false;
        this.render();
        this.bindEvents();
    },

    unmount() {
        this.sys.root.innerHTML = '';
    },

    saveToDevice(blob, filename) {
        if (this.sys && this.sys.download) {
            this.sys.toast("Saving...", "info");
            this.sys.download(blob, filename, "image/webp");
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
    },

    render() {
        const { view, pendingFiles, queue, isProcessing, options } = this.state;
        let content = '';
        let floatBtn = '';

        // ICONS
        const IconConvert = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" y1="5" x2="22" y2="5"/><line x1="19" y1="2" x2="19" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
        const IconUpload = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
        const IconDownload = `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;

        if (view === 'home') {
            content = `
                <div class="center-box fade-in">
                    <div class="hero-icon">
                        ${IconConvert}
                    </div>
                    <h1 class="title">Format Shifter</h1>
                    <p class="desc">Kompres & Ubah format gambar ke WebP tanpa pecah.</p>
                    <div class="stats-row">
                        <div class="stat-item">
                            <span class="stat-val">WebP</span>
                            <span class="stat-lbl">TARGET</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-val">90%</span>
                            <span class="stat-lbl">HEMAT</span>
                        </div>
                    </div>
                </div>
            `;
            floatBtn = `
                <button id="btn-pick" class="btn-float grad">
                    ${IconUpload} <span>PILIH GAMBAR</span>
                </button>
            `;
        }
        else if (view === 'review') {
            content = `
                <div class="scroll-content fade-in">
                    <div class="header-level">
                        <h3>Terpilih (${pendingFiles.length})</h3>
                        <button id="btn-clear" class="btn-mini">HAPUS</button>
                    </div>
                    <div class="grid-wrap">
                        ${pendingFiles.map(f => `
                            <div class="thumb-card">
                                <img src="${f.preview}" class="thumb-img">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            floatBtn = `
                <button id="btn-confirm-upload" class="btn-float grad">
                    KONVERSI ${pendingFiles.length} FILE
                </button>
            `;
        }
        else if (view === 'dashboard') {
            const doneCount = queue.filter(i => i.status === 'done').length;
            const progressVal = Math.round(options.quality * 100);

            content = `
                <div class="scroll-content fade-in">
                    <div class="settings-card">
                        <div class="setting-row">
                            <div class="setting-info">
                                <div class="setting-title">Kualitas Kompresi</div>
                                <div class="setting-desc">Makin rendah = File makin kecil</div>
                            </div>
                            <div class="setting-val">${progressVal}%</div>
                        </div>
                        <input type="range" id="inp-quality" min="10" max="100" step="5" value="${progressVal}" class="slider-grad">
                    </div>

                    <div class="list-container">
                        ${queue.map(item => `
                            <div class="list-item">
                                <img src="${item.preview}" class="item-img">
                                <div class="item-body">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-status">
                                        ${item.status === 'done'
                                            ? `<span class="tag-success">SELESAI • ${item.newSize}</span>`
                                            : item.status === 'processing'
                                                ? `<span class="tag-proc">MENGKOMPRES...</span>`
                                                : 'MENUNGGU'}
                                    </div>
                                </div>
                                ${item.status === 'done' ? `
                                    <button class="btn-dl" data-action="save" data-id="${item.id}">
                                        ${IconDownload}
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            if(doneCount > 0) {
                floatBtn = `
                    <div class="dock-split">
                        <button id="btn-home" class="btn-float sec">BARU</button>
                        <button id="btn-dl-all" class="btn-float grad">SIMPAN SEMUA</button>
                    </div>
                `;
            } else {
                 floatBtn = `
                    <button class="btn-float disabled">MEMPROSES...</button>
                `;
            }
        }

        this.sys.root.innerHTML = `
            <div class="app-root">
                ${content}
                <div class="float-dock">${floatBtn}</div>
            </div>
            <input type="file" id="f-in" multiple accept="image/*" style="display:none">

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');

                .app-root {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    height: 100%; background: var(--bg); color: var(--txt);
                    display: flex; flex-direction: column; overflow: hidden; position: relative;
                }

                @media (max-width: 768px) {
                    .app-root {
                        padding-top: 85px;
                        padding-bottom: 105px; /* Ditambah 20px dari request sebelumnya (85+20) */
                    }
                }

                input, textarea, [contenteditable="true"] {
                    color: #00d9ff !important;
                }

                .center-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; z-index: 1; }
                .hero-icon {
                    width: 80px; height: 80px; margin-bottom: 24px;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--prm); background: var(--card-bg); border: 2px solid var(--glass-border);
                    border-radius: 20px;
                    box-shadow: 0 0 15px rgba(0, 217, 255, 0.3);
                }
                .hero-icon svg { width: 40px; height: 40px; }

                .title { font-size: 28px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px; color: var(--txt); }
                .desc { font-size: 15px; color: var(--txt-dim); margin-bottom: 40px; line-height: 1.5; max-width: 260px; font-weight: 500;}

                .stats-row { display: flex; gap: 20px; align-items: center; background: var(--card-bg); border: 2px solid var(--glass-border); padding: 12px 24px; border-radius: 20px; }
                .stat-item { display: flex; flex-direction: column; }
                .stat-val { font-weight: 800; font-size: 18px; color: var(--prm); }
                .stat-lbl { font-size: 10px; color: var(--txt-dim); text-transform: uppercase; font-weight: 800; }
                .stat-divider { width: 2px; height: 30px; background: var(--glass-border); }

                .scroll-content { flex: 1; overflow-y: auto; padding: 20px; padding-bottom: 180px; z-index: 1; }
                .header-level { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header-level h3 { margin: 0; font-size: 18px; font-weight: 800; color: var(--txt); }
                .btn-mini { background: var(--glass-border); border: none; color: var(--txt); padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; border: 1px solid var(--prm); }

                .grid-wrap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .thumb-card { aspect-ratio: 1; border-radius: 16px; overflow: hidden; background: #000; border: 2px solid var(--glass-border); }
                .thumb-img { width: 100%; height: 100%; object-fit: cover; }

                .settings-card {
                    background: var(--card-bg); padding: 20px; border-radius: 20px;
                    border: 2px solid var(--glass-border); margin-bottom: 24px;
                }
                .setting-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
                .setting-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: var(--txt); }
                .setting-desc { font-size: 11px; color: var(--txt-dim); font-weight: 500; }
                .setting-val { font-family: monospace; font-weight: 700; color: var(--txt); background: var(--glass-border); padding: 4px 8px; border-radius: 6px; }

                .slider-grad {
                    width: 100%; height: 8px; border-radius: 4px; background: var(--glass-border);
                    appearance: none; outline: none;
                }
                .slider-grad::-webkit-slider-thumb {
                    appearance: none; width: 24px; height: 24px; border-radius: 50%;
                    background: var(--prm); border: 4px solid var(--bg); cursor: pointer;
                    box-shadow: 0 0 10px var(--prm);
                }

                .list-container { display: flex; flex-direction: column; gap: 12px; }
                .list-item {
                    display: flex; align-items: center; gap: 12px; background: var(--card-bg);
                    padding: 12px; border-radius: 16px; border: 2px solid var(--glass-border);
                }
                .item-img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; background: #000; border: 1px solid var(--glass-border); }
                .item-body { flex: 1; min-width: 0; }
                .item-name { font-weight: 700; font-size: 13px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--txt); }
                .item-status { font-size: 11px; font-weight: 700; color: var(--txt-dim); }

                .tag-success { color: var(--scs); }
                .tag-proc { color: var(--prm); }

                .btn-dl {
                    width: 44px; height: 44px; border-radius: 12px; background: var(--glass-border); border: 1px solid var(--prm);
                    color: var(--txt); display: flex; align-items: center; justify-content: center; cursor: pointer;
                }

                .float-dock {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    padding: 24px;
                    background: var(--bg);
                    border-top: 2px solid var(--glass-border);
                    z-index: 10; display: flex; justify-content: center;
                    /* transition: padding-bottom 0.2s; */
                }

                @media (max-width: 768px) {
                    .float-dock {
                        /* padding-bottom: 45px; */
                        padding-bottom: 65px; /* Dinaikkan 20px dari versi sebelumnya */
                    }
                }

                .dock-split { display: flex; width: 100%; gap: 12px; max-width: 400px; }

                .btn-float {
                    border: 2px solid var(--prm); padding: 18px; border-radius: 16px; font-weight: 800;
                    font-size: 14px; width: 100%; max-width: 400px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: transform 0.2s, box-shadow 0.2s;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    margin-bottom: 20px; /* Tambahan margin bottom 20px agar tombol naik */
                }
                .btn-float.grad {
                    /* background: var(--glass); */
                    background: var(--prm); /* Tombol jadi warna biru penuh */
                    /* color: var(--txt); */
                    color: var(--btn-txt); /* Warna biru navy untuk kontras */
                    box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
                }
                .btn-float.grad:active { background: #00b4d8; transform: scale(0.98); }

                .btn-float.sec {
                    background: var(--btn-sec-bg);
                    color: var(--btn-sec-txt);
                    flex: 0.5;
                }

                .btn-float.disabled { border-color: var(--txt-dim); color: var(--txt-dim); pointer-events: none; }

                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
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

        root.querySelectorAll('.btn-dl[data-action="save"]').forEach(btn => {
            btn.onclick = () => {
                const item = this.state.queue.find(i => i.id === btn.dataset.id);
                if (item && item.blob) this.saveToDevice(item.blob, item.name + '.webp');
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

        const inpQual = root.querySelector('#inp-quality');
        if (inpQual) inpQual.oninput = (e) => {
            this.state.options.quality = parseInt(e.target.value) / 100;
            const valDisplay = root.querySelector('.setting-val');
            if(valDisplay) valDisplay.innerText = `${e.target.value}%`;
        };
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
                cvs.width = img.width; cvs.height = img.height;
                cvs.getContext('2d').drawImage(img, 0, 0);
                cvs.toBlob(blob => {
                    item.blob = blob;
                    item.status = 'done';
                    item.newSize = (blob.size/1024).toFixed(1) + ' KB';
                    setTimeout(processNext, 50);
                }, 'image/webp', this.state.options.quality);
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
            this.saveToDevice(ready[i].blob, ready[i].name + '.webp');
            i++;
        }, 1000);
    }
})