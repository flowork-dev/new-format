({
    state: {
        isFirstVisit: true,
        docType: 'somasi',
        myName: '',
        targetName: '',
        amount: '',
        date: '',
        debounceTimer: null,
        activeTab: 'form'
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            // '--bg-root': '#050505',
            '--bg-root': '#0d001a', // Cyberpunk Deep Purple
            '--glass': 'rgba(15, 0, 30, 0.85)',
            '--glass-border': '1px solid #00f5ff', // Neon Blue Border
            // '--txt': '#e0e0e0',
            '--txt': '#00f5ff', // Blue (Neon Cyan)
            // '--txt-dim': '#888',
            '--txt-dim': '#0088ff', // Dim Blue
            '--prm': '#00f5ff',
            '--scs': '#10b981',
            '--err': '#ff00ff', // Cyberpunk Pink/Magenta
            '--brd': '#330066',
            '--surface': 'rgba(20, 0, 40, 0.9)',
            '--shadow': '0 0 20px rgba(0, 245, 255, 0.3)',
            '--tab-bg': '#1a0033',
            '--tab-active': '#00f5ff'
        },
        light: {
            // '--bg-root': '#f1f5f9',
            '--bg-root': '#e0f2ff', // Cyberpunk Light Blue/Cyan
            '--glass': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': '1px solid #0284c7',
            // '--txt': '#0f172a',
            '--txt': '#0284c7', // Strong Blue
            // '--txt-dim': '#64748b',
            '--txt-dim': '#3b82f6', // Medium Blue
            '--prm': '#0284c7',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(2, 132, 199, 0.2)',
            '--surface': 'rgba(255, 255, 255, 0.5)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '--tab-bg': '#bfdbfe',
            '--tab-active': '#fff'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_legalstrike');
        if (hasVisited) this.state.isFirstVisit = false;
        else localStorage.setItem('app_visited_legalstrike', 'true');

        if(!window.html2pdf) {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            document.head.appendChild(s);
        }

        if(window.lucide) window.lucide.createIcons();
        else {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => { if(window.lucide) window.lucide.createIcons(); };
            document.head.appendChild(s);
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
            this.sys.toast("Saving document to device...", "info");
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
        const { activeTab } = this.state;

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">

                <div class="mobile-tabs">
                    <button class="tab-item ${activeTab === 'form' ? 'active' : ''}" data-tab="form">
                        <i data-lucide="pen-tool" style="width:16px;"></i> FORM
                    </button>
                    <button class="tab-item ${activeTab === 'preview' ? 'active' : ''}" data-tab="preview">
                        <i data-lucide="eye" style="width:16px;"></i> PREVIEW
                    </button>
                </div>

                <div class="content-limit">
                    <div class="layout-grid">

                        <div class="panel-left ${activeTab === 'form' ? 'mobile-show' : 'mobile-hide'}">

                            <div class="glass-panel" style="margin-bottom: 20px;">
                                <h3 class="panel-title" style="color: var(--prm);">
                                    <i data-lucide="target" style="width:16px; height:16px;"></i> DOCUMENT TYPE
                                </h3>
                                <div class="type-grid">
                                    <button class="type-btn active" data-type="somasi" id="btn-somasi" style="--btn-color: var(--err);">
                                        <div class="type-btn-title" style="color: var(--err);">SOMASI / CEASE & DESIST</div>
                                        <div class="type-btn-sub">Penagihan Utang / Peringatan</div>
                                    </button>
                                    <button class="type-btn" data-type="nda" id="btn-nda" style="--btn-color: var(--prm);">
                                        <div class="type-btn-title" style="color: var(--prm);">N.D.A</div>
                                        <div class="type-btn-sub">Perjanjian Kerahasiaan</div>
                                    </button>
                                </div>
                            </div>

                            <div class="glass-panel">
                                <h3 class="panel-title" style="color: var(--txt);">
                                    <i data-lucide="file-text" style="width:16px; height:16px;"></i> CASE PARAMETERS
                                </h3>
                                <div class="input-stack">
                                    <div class="input-group">
                                        <label>YOUR NAME / COMPANY (SENDER)</label>
                                        <input type="text" id="in-myname" placeholder="Nama Lengkap / Perusahaan Anda" value="${this.state.myName}">
                                    </div>
                                    <div class="input-group">
                                        <label>TARGET NAME (RECIPIENT)</label>
                                        <input type="text" id="in-target" placeholder="Nama Orang / Perusahaan Target" value="${this.state.targetName}">
                                    </div>
                                    <div class="input-group" id="field-amount">
                                        <label>DISPUTE VALUE / PENALTY (RP)</label>
                                        <input type="number" id="in-amount" placeholder="Contoh: 50000000" style="font-family:monospace;" value="${this.state.amount}">
                                    </div>
                                    <div class="input-group" id="field-date">
                                        <label>DATE OF INCIDENT</label>
                                        <input type="date" id="in-date" value="${this.state.date}">
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div class="panel-right ${activeTab === 'preview' ? 'mobile-show' : 'mobile-hide'}">
                            <div class="preview-container">

                                <div class="preview-header glass-panel">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="width:8px; height:8px; background:var(--err); border-radius:50%;" class="animate-pulse"></div>
                                        <span style="color:var(--txt-dim); font-size:12px; font-family:monospace; letter-spacing:2px;">LIVE PREVIEW</span>
                                    </div>
                                    <button id="btn-export" class="btn-export shadow-lg">
                                        <i data-lucide="file-down" style="width:16px; height:16px;"></i> PDF
                                    </button>
                                </div>

                                <div class="paper-wrapper">
                                    <div id="legal-paper" class="legal-paper shadow-2xl">
                                        <div class="watermark-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                        </div>

                                        <div class="doc-content">
                                            <h1 id="out-title" contenteditable="true" class="doc-title outline-none hover-edit">SURAT SOMASI / PERINGATAN</h1>

                                            <div id="out-body" contenteditable="true" class="doc-body outline-none hover-edit focus-edit" title="Click to edit text manually">
[Silakan isi parameter di sebelah kiri. Dokumen akan dibuat secara otomatis di sini...]
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div class="disclaimer-box">
                                    <i data-lucide="alert-triangle" style="color:var(--err); margin-top:2px; flex-shrink:0;"></i>
                                    <p>
                                        <strong style="color: var(--err);">LEGAL DISCLAIMER:</strong><br>
                                        Flowork is not a law firm. Use this document as an initial draft or a negotiation tool (shock therapy).
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;
                    /* padding-top: 10px; padding-bottom: 90px; */
                    padding-top: 10px; padding-bottom: 90px; /* Default */
                    scrollbar-width: thin; scrollbar-color: var(--brd) transparent;
                }
                .app-root::-webkit-scrollbar { width: 8px; }
                .app-root::-webkit-scrollbar-thumb { background: var(--brd); border-radius: 4px; }

                .content-limit {
                    width: 100%; max-width: 100%;
                    padding: 10px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column;
                }

                .layout-grid {
                    display: grid; grid-template-columns: 1fr; gap: 20px;
                }

                .mobile-tabs {
                    display: none;
                    width: 95%; max-width: 500px; margin: 0 auto 15px auto;
                    background: var(--tab-bg); border-radius: 50px; padding: 4px;
                    border: 1px solid var(--brd); box-shadow: var(--shadow);
                }
                .tab-item {
                    flex: 1; border: none; background: transparent; color: var(--txt-dim);
                    padding: 12px; border-radius: 40px; font-weight: 700; font-size: 13px;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer; transition: 0.3s;
                }
                .tab-item.active {
                    background: var(--surface); color: var(--prm);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid var(--brd);
                }

                @media (min-width: 1024px) {
                    .content-limit { max-width: 1400px; padding: 20px; }
                    .layout-grid { grid-template-columns: 350px 1fr; }
                    .panel-left, .panel-right { display: block !important; }
                    .mobile-tabs { display: none !important; }
                }

                @media (max-width: 1023px) {
                    /* Refactor Mobile Gaps */
                    .app-root {
                        padding-top: 85px !important;
                        padding-bottom: 85px !important;
                    }
                    .content-limit {
                        margin-top: 80px !important; /* Form & Preview bawahin lagi 80px */
                    }
                    .mobile-tabs { display: flex; }
                    .mobile-hide { display: none; }
                    .mobile-show { display: block; animation: fadeIn 0.3s; }
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); border-radius: 12px; padding: 20px;
                    box-shadow: var(--shadow); position: relative;
                }

                .panel-title {
                    font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: bold;
                    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px;
                    display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--brd); padding-bottom: 10px;
                    /* color dikontrol inline di HTML atau var(--txt) */
                }

                .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .type-btn {
                    background: transparent; border: 1px solid var(--brd); padding: 12px; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s; text-align: left;
                }
                .type-btn:hover { border-color: var(--btn-color); background: rgba(255,255,255,0.05); }
                .type-btn.active { border-color: var(--btn-color); background: rgba(255,255,255,0.02); box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
                .type-btn-title { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: bold; margin-bottom: 4px; }
                .type-btn-sub { font-size: 9px; color: var(--txt-dim); }

                .input-stack { display: flex; flex-direction: column; gap: 15px; }
                .input-group label { display: block; font-size: 10px; font-weight: bold; color: var(--txt-dim); margin-bottom: 6px; letter-spacing: 1px; }
                .input-group input {
                    width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--brd);
                    background: var(--bg-root);
                    /* color: var(--txt); */
                    color: #0088ff !important; /* Tulisan wajib warna biru saat mengetik */
                    font-size: 14px; font-weight: bold; outline: none; transition: 0.2s;
                    box-sizing: border-box;
                }
                .input-group input:focus { border-color: var(--prm); box-shadow: 0 0 10px rgba(0, 245, 255, 0.2); color: #00f5ff !important; }

                .preview-container { display: flex; flex-direction: column; gap: 10px; }
                @media (min-width: 1024px) { .preview-container { position: sticky; top: 20px; } }

                .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-radius: 8px; }

                .btn-export {
                    background: var(--prm); color: #000; border: none; padding: 8px 16px; border-radius: 6px;
                    font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 1px;
                    cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;
                }
                .btn-export:hover { background: #fff; color: #000; }

                .paper-wrapper {
                    background: var(--surface); padding: 0;
                    border-radius: 8px; border: 1px solid var(--brd);
                    overflow-x: hidden;
                }

                .legal-paper {
                    background: #fff; color: #000; font-family: 'Times New Roman', serif;
                    width: 100%; max-width: none;
                    min-height: 80vh; margin: 0; padding: 40px 25px;
                    position: relative; box-sizing: border-box;
                }

                @media (min-width: 768px) {
                    .legal-paper { padding: 60px; }
                }

                .watermark-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.03; pointer-events: none; }
                .watermark-icon svg { width: 80%; height: auto; max-width: 400px; }

                .doc-content { position: relative; z-index: 10; }
                .doc-title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 30px; white-space: pre-wrap; color: #000; }
                .doc-body { font-size: 14px; line-height: 1.6; text-align: justify; white-space: pre-wrap; border: 1px solid transparent; padding: 5px; outline: none; color: #000; }

                .hover-edit:hover { background: #f8f9fa; border: 1px dashed #ccc; cursor: text; }
                .focus-edit:focus { background: #fffbeb; border: 1px solid #fcd34d; }

                .disclaimer-box {
                    background: rgba(0, 136, 255, 0.1); border: 1px solid rgba(0, 245, 255, 0.3); padding: 12px; border-radius: 8px;
                    display: flex; gap: 10px; align-items: flex-start;
                }
                .disclaimer-box p { font-size: 10px; color: var(--txt-dim); line-height: 1.4; margin: 0; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            </style>
        `;

        if(this.state.docType === 'nda') {
             const btnNda = this.sys.root.querySelector('#btn-nda');
             const btnSomasi = this.sys.root.querySelector('#btn-somasi');
             const fieldDate = this.sys.root.querySelector('#field-date');
             if(btnNda) btnNda.classList.add('active');
             if(btnSomasi) btnSomasi.classList.remove('active');
             if(fieldDate) fieldDate.style.display = 'none';
        }

        if(this.state.myName || this.state.targetName) this.generateLocalDoc();

        this.bindEvents();
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, textarea, .glass-panel, .legal-paper').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});
        });

        root.querySelectorAll('.tab-item').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                this.state.activeTab = tab;
                this.render();
            };
        });

        root.querySelectorAll('.type-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.getAttribute('data-type');
                this.state.docType = type;
                root.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const fieldAmt = root.querySelector('#field-amount');
                const fieldDate = root.querySelector('#field-date');
                if(fieldAmt) fieldAmt.style.display = 'block';
                if(fieldDate) fieldDate.style.display = (type === 'somasi') ? 'block' : 'none';
                this.handleInput();
            };
        });

        const inputs = ['#in-myname', '#in-target', '#in-amount', '#in-date'];
        inputs.forEach(id => {
            const el = root.querySelector(id);
            if(el) {
                el.addEventListener('input', (e) => {
                    if(id === '#in-myname') this.state.myName = e.target.value;
                    if(id === '#in-target') this.state.targetName = e.target.value;
                    if(id === '#in-amount') this.state.amount = e.target.value;
                    if(id === '#in-date') this.state.date = e.target.value;
                    this.handleInput();
                });
            }
        });

        const btnExport = root.querySelector('#btn-export');
        if(btnExport) btnExport.onclick = () => {
            if(!window.html2pdf) return this.sys.toast("PDF Engine not loaded yet", "error");

            const element = root.querySelector('#legal-paper');
            const opt = {
                margin: [0.5, 0.5],
                filename: `LEGAL-STRIKE-${this.state.docType.toUpperCase()}-${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            this.sys.toast("Generating PDF...", "info");

            html2pdf().set(opt).from(element).output('blob').then((blob) => {
                this.saveToDevice(blob, opt.filename, 'application/pdf');
            });
        };
    },

    handleInput() {
        clearTimeout(this.state.debounceTimer);
        this.state.debounceTimer = setTimeout(() => {
            this.generateLocalDoc();
        }, 500);
    },

    generateLocalDoc() {
        const root = this.sys.root;
        const { docType, myName, targetName, amount, date } = this.state;

        const bodyEl = root.querySelector('#out-body');
        const titleEl = root.querySelector('#out-title');
        if(!bodyEl || !titleEl) return;

        if(!myName && !targetName) return;

        bodyEl.style.opacity = '0.5';

        setTimeout(() => {
            let title = "";
            let body = "";

            const sender = myName || "[NAMA ANDA/PERUSAHAAN]";
            const target = targetName || "[NAMA TARGET/PERUSAHAAN]";
            const val = amount ? "Rp " + Number(amount).toLocaleString('id-ID') : "[NILAI SENGKETA/DENDA]";
            const incidentDate = date ? new Date(date).toLocaleDateString('id-ID', {year: 'numeric', month: 'long', day: 'numeric'}) : "[TANGGAL KEJADIAN]";
            const today = new Date().toLocaleDateString('id-ID', {year: 'numeric', month: 'long', day: 'numeric'});

            if (docType === 'somasi') {
                title = "SURAT SOMASI / PERINGATAN";
                body = `Tanggal: <b>${today}</b>\n\nKepada Yth.,\n<b>${target}</b>\ndi Tempat\n\n<b>PERIHAL: SOMASI DAN PERINGATAN TERAKHIR</b>\n\nDengan hormat,\n\nSaya yang bertanda tangan di bawah ini, <b>${sender}</b>, melalui surat ini menyampaikan somasi dan peringatan keras kepada Saudara/i terkait dengan kelalaian (wanprestasi) atas kewajiban pembayaran sebesar <b>${val}</b> yang timbul dari kejadian/kesepakatan pada tanggal <b>${incidentDate}</b>.\n\nMengingat upaya penyelesaian secara kekeluargaan sebelumnya tidak mendapatkan itikad baik dari pihak Saudara/i, maka melalui surat ini kami memberikan <b>PERINGATAN TERAKHIR</b> agar Saudara/i segera menyelesaikan kewajiban pembayaran sebesar <b>${val}</b> selambat-lambatnya <b>7 (tujuh) hari kalender</b> sejak surat ini diterbitkan.\n\nApabila sampai dengan batas waktu tersebut Saudara/i tetap tidak menunjukkan itikad baik, maka kami tidak segan-segan untuk menempuh jalur hukum, baik gugatan perdata atas dasar Wanprestasi/Perbuatan Melawan Hukum, maupun pelaporan pidana jika ditemukan unsur penipuan/penggelapan.\n\nDemikian surat somasi ini disampaikan agar menjadi perhatian serius.\n\nHormat saya,\n\n\n\n<b>${sender}</b>`;
            } else if (docType === 'nda') {
                title = "PERJANJIAN KERAHASIAAN\n(NON-DISCLOSURE AGREEMENT)";
                body = `Perjanjian Kerahasiaan ini (selanjutnya disebut "Perjanjian") dibuat dan ditandatangani pada tanggal <b>${today}</b>, oleh dan antara:\n\n1. <b>${sender}</b> (selanjutnya disebut "Pihak Pengungkap"), dan\n2. <b>${target}</b> (selanjutnya disebut "Pihak Penerima").\n\n<b>1. DEFINISI INFORMASI RAHASIA</b>\n"Informasi Rahasia" berarti segala informasi teknis maupun non-teknis yang diberikan oleh Pihak Pengungkap, termasuk namun tidak terbatas pada rahasia dagang, model bisnis, data keuangan, dan kekayaan intelektual yang memiliki valuasi kurang lebih sebesar <b>${val}</b>.\n\n<b>2. KEWAJIBAN PIHAK PENERIMA</b>\nPihak Penerima wajib menjaga dan memelihara kerahasiaan Informasi Rahasia semata-mata untuk kepentingan Pihak Pengungkap. Pihak Penerima dilarang, tanpa persetujuan tertulis sebelumnya, menggunakan untuk kepentingan pribadi, menerbitkan, menyalin, atau mengungkapkan Informasi Rahasia tersebut kepada pihak ketiga mana pun.\n\n<b>3. SANKSI PELANGGARAN</b>\nApabila terjadi pelanggaran atas Perjanjian ini, Pihak Penerima sepakat bahwa Pihak Pengungkap berhak menuntut ganti rugi materiil maupun imateriil hingga jumlah maksimal sebesar <b>${val}</b>, di samping upaya hukum pidana maupun perdata lainnya sesuai peraturan perundang-undangan yang berlaku di Indonesia.\n\nDemikian Perjanjian ini dibuat dalam keadaan sadar dan tanpa paksaan dari pihak mana pun.\n\n\n<b>${sender}</b>                                     <b>${target}</b>\n(Pihak Pengungkap)                            (Pihak Penerima)`;
            }

            titleEl.innerText = title;
            bodyEl.innerHTML = body;

            bodyEl.style.opacity = '1';
        }, 300);
    }
})