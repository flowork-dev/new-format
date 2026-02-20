({
    state: {
        appName: 'flash_v16_alive_ui',
        activeTab: 'editor', // 'editor' | 'preview'
        loading: false,

        // Data
        imageData: null,
        links: [{ label: 'BELI VIA WHATSAPP', url: '', id: 1 }],
        formData: {
            name: '',
            orig: '',
            promo: '',
            msg: '',
            time: ''
        },

        themes: {
            dark: {
                '--bg': '#0d0221', // Cyberpunk Deep Purple
                '--surface': '#160a2c',
                '--surface-variant': '#1b143d',
                '--primary': '#00f3ff', // Neon Cyan
                '--on-primary': '#0d0221',
                '--outline': 'rgba(0, 243, 255, 0.2)',
                '--txt': '#2563eb', // WAJIB BIRU
                '--txt-dim': '#3b82f6', // Biru medium
                '--font': "'Plus Jakarta Sans', sans-serif",
                '--radius': '20px',
                '--shadow': '0 8px 30px rgba(0,0,0,0.5)',
                '--shadow-sm': '0 4px 10px rgba(0,0,0,0.3)',
                '--glow': '0 0 15px rgba(0, 243, 255, 0.4)'
            },
            light: {
                '--bg': '#0d0221',
                '--surface': '#160a2c',
                '--surface-variant': '#1b143d',
                '--primary': '#2563eb',
                '--on-primary': '#FFFFFF',
                '--outline': 'rgba(37, 99, 235, 0.2)',
                '--txt': '#2563eb', // WAJIB BIRU
                '--txt-dim': '#3b82f6',
                '--font': "'Plus Jakarta Sans', sans-serif",
                '--radius': '20px',
                '--shadow': '0 10px 40px rgba(0,0,0,0.2)',
                '--shadow-sm': '0 4px 12px rgba(0,0,0,0.1)',
                '--glow': '0 0 15px rgba(37, 99, 235, 0.4)'
            }
        }
    },

    sys: null,
    observer: null,

    mount(sys) {
        this.sys = sys;
        this.loadIcons();

        if(!this.state.formData.time) {
            const now = new Date();
            now.setHours(now.getHours() + 24);
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            this.state.formData.time = now.toISOString().slice(0, 16);
        }

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
        if (document.documentElement) this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.state.themes[t] || this.state.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    loadIcons() {
        if (typeof lucide === 'undefined') {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => lucide.createIcons();
            document.head.appendChild(s);
        } else {
            setTimeout(() => lucide.createIcons(), 50);
        }
    },

    getMockupHTML(idPrefix) {
        return `
            <div class="phone-mock">
                <div class="notch"></div>
                <div class="screen-scroll">
                    <div class="p-hero">
                        <img id="${idPrefix}-img" style="display:none">
                        <div id="${idPrefix}-ph" class="ph-placeholder">
                            <i data-lucide="image" size="48"></i>
                        </div>
                    </div>
                    <div class="p-body">
                        <div class="p-timer">🔥 FLASH SALE BERAKHIR SEGERA</div>
                        <div id="${idPrefix}-title" class="p-title">Nama Produk</div>
                        <div class="p-price-box">
                            <span id="${idPrefix}-promo" class="p-now">Rp 0</span>
                            <span id="${idPrefix}-orig" class="p-old">Rp 0</span>
                        </div>
                        <div id="${idPrefix}-msg" class="p-msg" style="display:none"></div>
                        <div id="${idPrefix}-btns" class="p-btns"></div>
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        const { activeTab, loading } = this.state;
        const isEditor = activeTab === 'editor';

        this.sys.root.innerHTML = `
            <div class="app-layout">
                <div class="cyber-grid"></div>

                <div class="android-tabs">
                    <button class="tab-btn ${isEditor ? 'active' : ''}" id="tab-editor">
                        <i data-lucide="edit-3" size="18"></i> EDITOR
                    </button>
                    <button class="tab-btn ${!isEditor ? 'active' : ''}" id="tab-preview">
                        <i data-lucide="smartphone" size="18"></i> PREVIEW
                    </button>
                    <div class="tab-indicator ${!isEditor ? 'right' : ''}"></div>
                </div>

                <div class="split-view">
                    <div class="editor-area custom-scroll ${!isEditor ? 'mob-hidden' : ''}">

                        <div class="md-card">
                            <div class="md-card-label">Product Image</div>
                            <div class="upload-zone" id="drop-zone">
                                <img id="editor-thumb" class="thumb-prev hidden">
                                <div class="upload-content">
                                    <i data-lucide="image-plus" size="32"></i>
                                    <span>Upload Gambar</span>
                                </div>
                                <input type="file" id="inp-file" accept="image/*" hidden>
                            </div>
                        </div>

                        <div class="md-card">
                            <div class="md-card-label">Informasi Produk</div>

                            <div class="inp-field">
                                <input type="text" id="inp-name" placeholder=" " value="${this.state.formData.name}">
                                <label>Nama Produk</label>
                            </div>

                            <div class="inp-row">
                                <div class="inp-field">
                                    <input type="number" id="inp-orig" placeholder=" " value="${this.state.formData.orig}">
                                    <label>Harga Coret</label>
                                </div>
                                <div class="inp-field highlight">
                                    <input type="number" id="inp-promo" placeholder=" " value="${this.state.formData.promo}">
                                    <label>Harga Promo</label>
                                </div>
                            </div>

                            <div class="inp-field">
                                <input type="datetime-local" id="inp-time" value="${this.state.formData.time}">
                                <label style="top:-10px; font-size:11px; color:var(--primary);">Waktu Berakhir</label>
                            </div>
                        </div>

                        <div class="md-card">
                            <div class="md-card-label">Tombol Aksi</div>

                            <div class="inp-field">
                                <input type="text" id="inp-msg" placeholder=" " value="${this.state.formData.msg}">
                                <label>Pesan Urgensi (Opsional)</label>
                            </div>

                            <div class="links-header">
                                <span>Daftar Tombol</span>
                                <button id="btn-add-link" class="btn-text">+ Tambah</button>
                            </div>
                            <div id="link-list" class="link-stack"></div>
                        </div>

                        <button id="btn-deploy" class="md-btn-static ${loading ? 'processing' : ''}">
                            ${loading ? '<i data-lucide="loader-2" class="spin"></i>' : '<i data-lucide="rocket"></i>'}
                            <span>PUBLISH HALAMAN</span>
                        </button>

                        <div class="scroll-spacer"></div>
                    </div>

                    <div class="preview-area ${isEditor ? 'mob-hidden' : ''}">
                        <div class="mockup-wrapper">
                            ${this.getMockupHTML('main')}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');

                .app-layout {
                    position: absolute; inset: 0;
                    background: var(--bg); color: var(--txt);
                    font-family: var(--font);
                    display: flex; flex-direction: column;
                    overflow: hidden;
                }

                .cyber-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                    z-index: 0; pointer-events: none;
                }

                .android-tabs {
                    display: flex; position: relative; height: 56px;
                    background: var(--surface);
                    box-shadow: var(--shadow-sm); z-index: 20;
                }
                .tab-btn {
                    flex: 1; border: none; background: transparent;
                    color: var(--txt-dim); font-size: 13px; font-weight: 700;
                    letter-spacing: 0.5px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: 0.2s;
                }
                .tab-btn.active { color: var(--primary); }
                .tab-indicator {
                    position: absolute; bottom: 0; left: 0; width: 50%; height: 3px;
                    background: var(--primary); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border-radius: 100px;
                }
                .tab-indicator.right { transform: translateX(100%); }

                .split-view { flex: 1; display: flex; position: relative; overflow: hidden; z-index: 1; }
                .editor-area {
                    flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px;
                    max-width: 600px; margin: 0 auto; width: 100%;
                }
                .preview-area {
                    flex: 1; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px);
                    display: flex; align-items: center; justify-content: center;
                    overflow: hidden;
                }

                @media (max-width: 899px) {
                    .mob-hidden { display: none !important; }

                    /* PENYESUAIAN HEADER SPACE: 85PX */
                    .android-tabs {
                        /* margin-top: 120px !important; // Baris lama (Zombie) */
                        margin-top: 85px !important;
                        background: var(--surface);
                    }

                    .editor-area {
                        padding-top: 10px;
                        justify-content: flex-start;
                    }

                    .preview-area {
                        /* padding-top: 120px; // Baris lama (Zombie) */
                        padding-top: 85px;
                    }

                    /* Tambahan agar bisa scroll sampai bawah banget */
                    .scroll-spacer {
                        height: 180px;
                        width: 100%;
                    }
                }

                @media (min-width: 900px) {
                    .android-tabs { display: none; }
                    .editor-area { border-right: 1px solid var(--outline); max-width: 480px; }
                    .preview-area { display: flex !important; }
                    .scroll-spacer { height: 40px; }
                }

                .md-card {
                    background: var(--surface); border-radius: var(--radius);
                    padding: 24px; box-shadow: var(--shadow);
                    border: 1px solid var(--outline);
                    transition: transform 0.2s;
                }
                .md-card:hover { transform: translateY(-2px); border-color: var(--primary); }
                .md-card-label { font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; }

                .inp-field {
                    position: relative; margin-bottom: 20px;
                    background: var(--surface-variant);
                    border-radius: 14px;
                    border: 2px solid transparent;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .inp-field input {
                    width: 100%; padding: 28px 16px 10px; background: transparent; border: none;
                    color: #2563eb !important; /* WAJIB BIRU SAAT MENGETIK */
                    font-size: 15px; font-weight: 700; outline: none;
                    font-family: inherit; box-sizing: border-box; z-index: 2; position: relative;
                }
                .inp-field label {
                    position: absolute; left: 16px; top: 19px; font-size: 15px; color: var(--txt-dim);
                    pointer-events: none; transition: 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); z-index: 1;
                }

                .inp-field input:focus ~ label,
                .inp-field input:not(:placeholder-shown) ~ label {
                    top: 8px; font-size: 11px; color: var(--primary); font-weight: 700; letter-spacing: 0.5px;
                }

                .inp-field:focus-within {
                    border-color: var(--primary);
                    background: var(--surface);
                    box-shadow: var(--glow);
                }

                .inp-field.highlight input { color: #2563eb !important; font-size: 18px; }
                .inp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

                .upload-zone {
                    height: 200px; border: 2px dashed var(--primary); border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; position: relative; overflow: hidden; background: rgba(0,0,0,0.1);
                    transition: 0.3s;
                }
                .upload-zone:hover { border-color: var(--primary); background: rgba(0, 243, 255, 0.05); }
                .upload-content { display: flex; flex-direction: column; align-items: center; color: var(--txt-dim); gap: 10px; font-weight: 600; }
                .thumb-prev { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 2; }
                .hidden { display: none; }

                .links-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .btn-text { background: rgba(37, 99, 235, 0.1); border: none; color: var(--primary); font-weight: 700; cursor: pointer; padding: 6px 12px; border-radius: 100px; font-size: 12px; transition: 0.2s; }

                .link-item { display: flex; gap: 10px; margin-bottom: 12px; animation: slideIn 0.3s; }
                .mini-inp { background: var(--surface-variant); border: 2px solid transparent; padding: 12px; color: #2563eb !important; border-radius: 12px; font-size: 13px; outline: none; flex:1; transition: 0.2s; font-weight: 700; }
                .mini-inp:focus { border-color: var(--primary); background: var(--surface); box-shadow: var(--shadow-sm); }
                .btn-del { width: 44px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }

                /* TOMBOL PUBLISH HALAMAN 56PX */
                .md-btn-static {
                    position: relative;
                    width: 100%; height: 56px; border-radius: 14px;
                    background: var(--primary); color: var(--on-primary);
                    border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center; gap: 12px;
                    cursor: pointer; transition: all 0.3s;
                    font-weight: 800; font-size: 14px; letter-spacing: 1px;
                    margin-top: 10px; flex-shrink: 0;
                }
                .md-btn-static:hover { transform: translateY(-4px); box-shadow: var(--glow); }
                .md-btn-static:active { transform: scale(0.98); }
                .md-btn-static.processing { opacity: 0.8; pointer-events: none; filter: grayscale(1); }

                .mockup-wrapper { transform: scale(0.85); transform-origin: center; transition: 0.3s; }
                .phone-mock {
                    width: 340px; height: 680px; background: white; border-radius: 45px;
                    border: 10px solid #1f1f1f; position: relative; overflow: hidden;
                    box-shadow: 0 40px 80px rgba(0,0,0,0.6); color: #111;
                    display: flex; flex-direction: column;
                }
                .notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 140px; height: 28px; background: #1f1f1f; border-radius: 0 0 18px 18px; z-index: 20; }
                .screen-scroll { flex: 1; overflow-y: auto; background: #fff; }

                .p-hero { height: 300px; background: #f3f4f6; position: relative; display:flex; align-items:center; justify-content:center; }
                .p-hero img { width: 100%; height: 100%; object-fit: cover; display:block; }
                .ph-placeholder { color: #d1d5db; }

                .p-body { padding: 24px; }
                .p-timer { background:#fee2e2; color:#ef4444; font-size: 11px; font-weight: 800; padding: 8px 14px; border-radius: 100px; display: inline-block; margin-bottom: 16px; letter-spacing: 0.5px; }
                .p-title { font-size: 26px; font-weight: 900; margin-bottom: 10px; color: #111; }

                .p-price-box { display: flex; align-items: baseline; gap: 10px; margin-bottom: 24px; }
                .p-now { font-size: 28px; font-weight: 800; color: #f59e0b; }
                .p-old { font-size: 16px; text-decoration: line-through; opacity: 0.4; }

                .p-msg { background: #eff6ff; padding: 16px; font-size: 14px; border-left: 4px solid #3b82f6; margin-bottom: 30px; border-radius: 8px; color: #1e3a8a; }

                .p-btns { display: flex; flex-direction: column; gap: 12px; }
                .p-btn-item { padding: 16px; color: white; text-align: center; border-radius: 16px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: 0.2s; cursor: pointer; }

                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            </style>
        `;

        this.bindEvents();
        this.restoreState();
    },

    bindEvents() {
        const root = this.sys.root;
        const $ = (s) => root.querySelector(s);

        const switchTab = (t) => {
            this.state.activeTab = t;
            this.render();
        };

        if($('#tab-editor')) $('#tab-editor').onclick = () => switchTab('editor');
        if($('#tab-preview')) $('#tab-preview').onclick = () => switchTab('preview');

        const drop = $('#drop-zone');
        const fileInp = $('#inp-file');
        if (drop && fileInp) {
            drop.onclick = () => fileInp.click();
            fileInp.onchange = (e) => {
                const f = e.target.files[0];
                if (f) {
                    const r = new FileReader();
                    r.onload = (ev) => {
                        this.state.imageData = ev.target.result;
                        const thumb = root.querySelector('#editor-thumb');
                        if (thumb) { thumb.src = ev.target.result; thumb.classList.remove('hidden'); }
                        this.updateMockupImages();
                    };
                    r.readAsDataURL(f);
                }
            };
        }

        const updateText = (id, val) => {
            const el = root.querySelector(`#main-${id}`);
            if(el) el.innerText = val;
        };

        const bindInput = (id, key) => {
            const el = $(id);
            if(!el) return;
            el.oninput = (e) => {
                this.state.formData[key] = e.target.value;
                if(key === 'name') updateText('title', e.target.value || 'Nama Produk');
                if(key === 'msg') {
                    updateText('msg', e.target.value);
                    const msgEl = root.querySelector('#main-msg');
                    if(msgEl) msgEl.style.display = e.target.value ? 'block' : 'none';
                }
                if(key === 'orig' || key === 'promo') this.updatePrice();
            };
        };

        bindInput('#inp-name', 'name');
        bindInput('#inp-orig', 'orig');
        bindInput('#inp-promo', 'promo');
        bindInput('#inp-msg', 'msg');
        bindInput('#inp-time', 'time');

        if ($('#btn-add-link')) $('#btn-add-link').onclick = () => {
            this.state.links.push({ label: '', url: '', id: Date.now() });
            this.renderLinks();
        };

        if ($('#btn-deploy')) $('#btn-deploy').onclick = () => this.deploy();
    },

    restoreState() {
        if (this.state.imageData) {
            const thumb = this.sys.root.querySelector('#editor-thumb');
            if (thumb) {
                thumb.src = this.state.imageData;
                thumb.classList.remove('hidden');
            }
            this.updateMockupImages();
        }
        this.renderLinks();
        this.updatePrice();
        const msgEl = this.sys.root.querySelector('#main-msg');
        const titleEl = this.sys.root.querySelector('#main-title');

        if(msgEl && this.state.formData.msg) {
            msgEl.innerText = this.state.formData.msg;
            msgEl.style.display = 'block';
        }
        if(titleEl && this.state.formData.name) titleEl.innerText = this.state.formData.name;
    },

    updateMockupImages() {
        const img = this.sys.root.querySelector(`#main-img`);
        const ph = this.sys.root.querySelector(`#main-ph`);
        if (this.state.imageData && img) {
            img.src = this.state.imageData;
            img.style.display = 'block';
            if (ph) ph.style.display = 'none';
        }
    },

    updatePrice() {
        const root = this.sys.root;
        const fmt = (n) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(n);
        const orig = this.state.formData.orig ? fmt(this.state.formData.orig) : 'Rp 0';
        const promo = this.state.formData.promo ? fmt(this.state.formData.promo) : 'Rp 0';

        const pPromo = root.querySelector('#main-promo');
        const pOrig = root.querySelector('#main-orig');
        if(pPromo) pPromo.innerText = promo;
        if(pOrig) pOrig.innerText = orig;
    },

    renderLinks() {
        const list = this.sys.root.querySelector('#link-list');
        const prevList = this.sys.root.querySelector('#main-btns');
        if(!list || !prevList) return;

        list.innerHTML = '';
        prevList.innerHTML = '';

        this.state.links.forEach((l, i) => {
            const row = document.createElement('div');
            row.className = 'link-item';
            row.innerHTML = `
                <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                    <input type="text" class="mini-inp l-lbl" placeholder="Label Tombol" value="${l.label}">
                    <input type="text" class="mini-inp l-url" placeholder="Link Tujuan (https://...)" value="${l.url}">
                </div>
                <button class="btn-del"><i data-lucide="trash-2" size="18"></i></button>
            `;

            const lbl = row.querySelector('.l-lbl');
            const url = row.querySelector('.l-url');

            const sync = () => {
                this.state.links[i].label = lbl.value;
                this.state.links[i].url = url.value;
                this.renderLinksPreviewOnly();
            };
            lbl.oninput = sync;
            url.oninput = sync;

            row.querySelector('.btn-del').onclick = () => {
                this.state.links.splice(i, 1);
                this.renderLinks();
            };

            row.querySelectorAll('input').forEach(el => {
                el.addEventListener('mousedown', e => e.stopPropagation());
                el.addEventListener('touchstart', e => e.stopPropagation());
            });

            list.appendChild(row);
        });

        this.renderLinksPreviewOnly();
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderLinksPreviewOnly() {
        const container = this.sys.root.querySelector('#main-btns');
        if (!container) return;
        container.innerHTML = '';

        this.state.links.forEach(l => {
            const b = document.createElement('div');
            b.className = 'p-btn-item';
            b.innerText = l.label || 'BELI SEKARANG';

            const u = l.url.toLowerCase();
            if(u.includes('wa.me') || u.includes('whatsapp')) b.style.background = '#25D366';
            else if(u.includes('shopee')) b.style.background = '#ee4d2d';
            else if(u.includes('tokopedia')) b.style.background = '#03ac0e';
            else b.style.background = '#2563eb';

            container.appendChild(b);
        });
    },

    async deploy() {
        const name = this.state.formData.name;
        const time = this.state.formData.time;

        if(!this.state.imageData) return this.sys.toast("Upload gambar produk dulu!", "error");
        if(!name) return this.sys.toast("Nama produk wajib diisi", "error");
        if(!time) return this.sys.toast("Atur waktu flash sale", "error");
        if(this.state.links.length === 0) return this.sys.toast("Minimal ada 1 tombol", "error");

        this.state.loading = true;
        this.render();
        setTimeout(() => this.bindEvents(), 0);

        try {
            const payload = {
                productName: name,
                originalPrice: parseInt(this.state.formData.orig)||0,
                promoPrice: parseInt(this.state.formData.promo)||0,
                endTime: new Date(time).getTime(),
                links: this.state.links,
                message: this.state.formData.msg,
                image: this.state.imageData
            };

            const req = await fetch('/api/v1/flash-hype/process', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload)
            });
            const res = await req.json();

            if(res.success) {
                const url = `${window.location.origin}/promo/${res.id}`;
                const copy = await this.sys.confirm(`Halaman Siap!\n\n${url}\n\nSalin Link?`, "SUKSES");
                if(copy) {
                    navigator.clipboard.writeText(url);
                    this.sys.toast("Link tersalin!");
                }
            } else {
                throw new Error(res.error);
            }
        } catch(e) {
            this.sys.toast(e.message, "error");
        } finally {
            this.state.loading = false;
            this.render();
            this.bindEvents();
            this.restoreState();
        }
    }
})