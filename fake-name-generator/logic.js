({
    state: {
        appName: 'fid_direct_noheader_v6',
        region: 'us',
        data: null,
        loading: false,
        showPass: false,

        // DATABASE GENERATOR
        db: {
            us: { flag: '🇺🇸', label: 'United States', m: ['James', 'John', 'Robert', 'Michael'], f: ['Mary', 'Patricia', 'Jennifer', 'Linda'], last: ['Smith', 'Johnson', 'Williams', 'Jones'], cities: ['New York', 'Los Angeles', 'Chicago'], streets: ['Maple Ave', 'Oak St', 'Main St'], zips: ['10001', '90210'] },
            id: { flag: '🇮🇩', label: 'Indonesia', m: ['Budi', 'Agus', 'Reza', 'Dimas'], f: ['Siti', 'Dewi', 'Putri', 'Ayu'], last: ['Santoso', 'Wijaya', 'Saputra', 'Hidayat'], cities: ['Jakarta', 'Surabaya', 'Bandung'], streets: ['Jl. Sudirman', 'Jl. Merdeka', 'Jl. Gajah Mada'], zips: ['10110', '40115'] },
            jp: { flag: '🇯🇵', label: 'Japan', m: ['Hiroshi', 'Kenji', 'Takeshi'], f: ['Sakura', 'Yui', 'Hina'], last: ['Sato', 'Suzuki', 'Takahashi'], cities: ['Tokyo', 'Osaka', 'Kyoto'], streets: ['Chuo-dori', 'Meiji-dori'], zips: ['100-0001', '530-0001'] },
            uk: { flag: '🇬🇧', label: 'United Kingdom', m: ['Oliver', 'George', 'Harry'], f: ['Amelia', 'Olivia', 'Isla'], last: ['Smith', 'Jones', 'Taylor'], cities: ['London', 'Manchester', 'Liverpool'], streets: ['Baker St', 'High St'], zips: ['SW1A 1AA', 'M1 1AA'] },
            de: { flag: '🇩🇪', label: 'Germany', m: ['Müller', 'Schmidt'], f: ['Maria', 'Anna'], last: ['Weber', 'Meyer'], cities: ['Berlin', 'Munich'], streets: ['Hauptstrasse', 'Bahnhofstrasse'], zips: ['10115', '80331'] }
        }
    },

    sys: null,
    observer: null,

    // TEMA (Cyberpunk & Blue Text Focus)
    themes: {
        dark: {
            // '--bg-root': 'transparent', // Baris lama
            '--bg-root': '#0d0221', // Deep Cyberpunk Purple
            // '--glass': 'rgba(15, 23, 42, 0.95)', // Baris lama
            '--glass': 'rgba(15, 5, 36, 0.9)',
            // '--surface': 'rgba(30, 41, 59, 0.7)', // Baris lama
            '--surface': 'rgba(20, 10, 50, 0.8)',
            // '--txt': '#f8fafc', // Baris lama
            '--txt': '#38bdf8', // Blue Electric
            // '--txt-dim': '#94a3b8', // Baris lama
            '--txt-dim': '#1e40af', // Blue Darker
            // '--prm': '#38bdf8', // Baris lama
            '--prm': '#00f3ff', // Cyan Neon
            // '--brd': 'rgba(255, 255, 255, 0.1)', // Baris lama
            '--brd': '#ff00ff', // Pink Neon Border
            '--shadow': '0 0 15px rgba(0, 243, 255, 0.3)'
        },
        light: {
            // '--bg-root': 'transparent', // Baris lama
            '--bg-root': '#0d0221', // Dipaksa cyberpunk gelap agar teks biru tetap kontras
            '--glass': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(241, 245, 249, 0.2)',
            // '--txt': '#0f172a', // Baris lama
            '--txt': '#2563eb', // Blue Royal
            // '--txt-dim': '#64748b', // Baris lama
            '--txt-dim': '#1d4ed8',
            '--prm': '#2563eb',
            '--brd': 'rgba(37, 99, 235, 0.4)',
            '--shadow': '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
        }
    },

    mount(sys) {
        this.sys = sys;
        this.generate();
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
        this.loadIcons();
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

    loadIcons() {
        if(window.lucide) { window.lucide.createIcons(); return; }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/lucide@latest';
        s.onload = () => window.lucide.createIcons();
        document.head.appendChild(s);
    },

    generate() {
        const { region, db } = this.state;
        const d = db[region] || db.us;
        const gender = Math.random() > 0.5 ? 'm' : 'f';
        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const first = rand(d[gender]);
        const last = rand(d.last);

        this.state.data = {
            name: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase()}${num(10,99)}@gmail.com`,
            phone: `+${num(1,99)} ${num(100,999)} ${num(1000,9999)}`,
            pass: `Sec${num(1000,9999)}!`,
            address: `${num(10,999)} ${rand(d.streets)}, ${rand(d.cities)}, ${rand(d.zips)}`,
            cc: `4532 ${num(1000,9999)} ${num(1000,9999)} ${num(1000,9999)}`,
            exp: `${num(1,12).toString().padStart(2,'0')}/${num(25,30)}`,
            cvv: num(100,999),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${first}${last}&backgroundColor=b6e3f4`
        };
        this.state.showPass = false;
        if(this.sys.root.innerHTML) this.render();
    },

    copy(text) {
        if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => this.sys.toast('Copied to clipboard'));
    },

    render() {
        const content = this.renderMainApp();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                ${content}
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap');

                .app-root {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    background: var(--bg-root);
                    color: var(--txt);
                    font-family: 'Inter', sans-serif;
                    overflow: hidden;
                    /* Background Cyberpunk Grid */
                    background-image:
                        linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }

                .main-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    padding-bottom: 150px !important;
                    width: 100%;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    display: flex; /* Tambahan untuk centering */
                    flex-direction: column;
                }
                .main-scroll::-webkit-scrollbar { display: none; }

                .responsive-container {
                    width: 100%;
                    max-width: 1020px;
                    margin: 0 auto;
                }

                .grid-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                @media (min-width: 768px) {
                    .grid-layout { grid-template-columns: 1.2fr 1fr; }
                }

                .card {
                    background: var(--surface);
                    border: 1px solid var(--brd);
                    border-radius: 16px;
                    padding: 20px;
                    box-shadow: var(--shadow);
                    backdrop-filter: blur(15px);
                    margin-bottom: 20px;
                }

                .content-header {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
                }
                .app-label { font-size: 14px; font-weight: 800; color: var(--prm); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }

                /* REGION SELECTOR (Warna Teks Biru saat Mengetik/Pilih) */
                .region-select {
                    background: rgba(0,0,0,0.5);
                    color: #38bdf8 !important; /* WAJIB BIRU */
                    border: 1px solid var(--prm); padding: 6px 10px;
                    border-radius: 8px; outline: none; font-size: 12px; font-weight: 800; cursor: pointer;
                    box-shadow: 0 0 5px var(--prm);
                }
                .region-select option { background: #0d0221; color: #38bdf8; }

                .profile-head { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
                .avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--brd); border: 2px solid var(--prm); }
                .name { font-size: 20px; font-weight: 700; color: var(--txt); }
                .region-badge { font-size: 12px; background: #2563eb; color: white; padding: 4px 8px; border-radius: 6px; display: inline-block; margin-top: 4px; }

                .data-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 0; border-bottom: 1px solid var(--brd);
                    cursor: pointer; transition: background 0.2s;
                }
                .data-row:hover { background: rgba(0, 243, 255, 0.1); padding-left: 8px; padding-right: 8px; border-radius: 8px; border-bottom-color: transparent; }
                .data-label { font-size: 12px; color: var(--txt-dim); font-weight: bold; }
                .data-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--txt); font-weight: 600; text-align: right; }
                .blur { filter: blur(4px); user-select: none; }

                .cc-card {
                    background: linear-gradient(135deg, #0f0524, #1e293b);
                    color: #38bdf8; border-radius: 16px; padding: 24px;
                    position: relative; overflow: hidden;
                    border: 1px solid #ff00ff;
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
                }
                .cc-num { font-family: 'JetBrains Mono', monospace; font-size: 22px; margin-bottom: 20px; letter-spacing: 2px; color: #38bdf8; }
                .cc-meta { display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; opacity: 0.8; color: #38bdf8; }

                .fab-container {
                    position: fixed;
                    bottom: 40px;
                    right: 40px;
                    z-index: 100;
                    transition: bottom 0.3s;
                }
                .btn-fab {
                    width: 60px; height: 60px; border-radius: 50%;
                    background: #2563eb; color: white;
                    border: none; box-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: transform 0.2s;
                }

                /* MOBILE ADJUSTMENTS - POSITION LOWER/CENTER */
                @media (max-width: 600px) {
                    .main-scroll {
                        padding-top: 80px; /* Geser ke bawah agar tidak ketutup header */
                        justify-content: flex-start;
                    }
                    .responsive-container {
                        margin-top: 20px; /* Memberikan ruang ekstra */
                    }
                    .fab-container {
                        bottom: 110px;
                        right: 25px;
                    }
                    .cc-num { font-size: 18px; }
                }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        this.bindEvents();
    },

    renderMainApp() {
        if (!this.state.data) return '<div class="main-scroll" style="color:var(--txt)">Loading...</div>';
        const d = this.state.data;
        const { region, db, showPass } = this.state;

        const options = Object.keys(db).map(k =>
            `<option value="${k}" ${region === k ? 'selected' : ''}>${db[k].flag} ${db[k].label}</option>`
        ).join('');

        return `
            <div class="main-scroll">
                <div class="responsive-container">

                    <div class="card" style="padding: 15px; border-color: var(--prm);">
                        <div class="content-header" style="margin:0;">
                            <div class="app-label"><i data-lucide="fingerprint"></i> ID GENERATOR</div>
                            <select id="region-sel" class="region-select">
                                ${options}
                            </select>
                        </div>
                    </div>

                    <div class="grid-layout">
                        <div class="card">
                            <div class="profile-head">
                                <img src="${d.avatar}" class="avatar">
                                <div>
                                    <div class="name cpy" data-val="${d.name}">${d.name}</div>
                                    <span class="region-badge">${db[region].label} Citizen</span>
                                </div>
                            </div>

                            <div class="data-row cpy" data-val="${d.email}">
                                <span class="data-label">Email</span>
                                <span class="data-value">${d.email}</span>
                            </div>

                            <div class="data-row" id="toggle-pass">
                                <span class="data-label">Password</span>
                                <span class="data-value ${showPass ? '' : 'blur'}">${d.pass}</span>
                            </div>

                            <div class="data-row cpy" data-val="${d.phone}">
                                <span class="data-label">Phone</span>
                                <span class="data-value">${d.phone}</span>
                            </div>

                            <div class="data-row cpy" data-val="${d.address}">
                                <span class="data-label">Address</span>
                                <span class="data-value" style="font-size:11px; max-width:60%;">${d.address}</span>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div class="cc-card">
                                <div style="width: 40px; height: 28px; background: #fbbf24; border-radius: 4px; margin-bottom: 20px; box-shadow: 0 0 10px #fbbf24;"></div>
                                <div class="cc-num cpy" data-val="${d.cc}">${d.cc}</div>
                                <div class="cc-meta">
                                    <div>
                                        <span>Holder</span>
                                        <strong style="display: block; font-size: 14px; margin-top: 4px;">${d.name.toUpperCase()}</strong>
                                    </div>
                                    <div style="text-align: right;">
                                        <span>Expires</span>
                                        <strong style="display: block; font-size: 14px; margin-top: 4px;">${d.exp}</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="card" style="padding: 15px;">
                                <div class="data-row cpy" data-val="${d.cvv}" style="border:none;">
                                    <span class="data-label">Security Code (CVV)</span>
                                    <span class="data-value">${d.cvv}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="fab-container">
                <button id="btn-regen" class="btn-fab">
                    <i data-lucide="refresh-cw"></i>
                </button>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        const addClick = (sel, fn) => {
            const el = root.querySelector(sel);
            if(el) {
                el.onclick = fn;
                el.addEventListener('mousedown', e => e.stopPropagation());
                el.addEventListener('touchstart', e => e.stopPropagation());
            }
        };

        const sel = root.querySelector('#region-sel');
        if(sel) {
            sel.onchange = (e) => {
                this.state.region = e.target.value;
                this.generate();
            };
            sel.addEventListener('mousedown', e => e.stopPropagation());
        }

        addClick('#btn-regen', () => {
            this.generate();
            this.render();
            this.loadIcons();
        });

        addClick('#toggle-pass', () => {
            this.state.showPass = !this.state.showPass;
            this.render();
            this.loadIcons();
        });

        root.querySelectorAll('.cpy').forEach(el => {
            el.onclick = () => this.copy(el.dataset.val || el.innerText);
            el.addEventListener('mousedown', e => e.stopPropagation());
        });

        if(window.lucide) window.lucide.createIcons();
    }
})