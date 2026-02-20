({
    // ✅ PATH UTAMA (Pastikan ini benar)
    ROOT_PATH: 'https://flowork.cloud/store/nexus-link/themes/',

    state: {
        isMobilePreview: false,
        profile: {
            handle: '',
            name: 'ALEXANDER',
            bio: 'Digital Artist & Creative Developer.',
            avatar: null,
            links: [
                { title: 'PORTFOLIO', url: '#', icon: 'globe' },
                { title: 'INSTAGRAM', url: '#', icon: 'instagram' }
            ],
            theme: 'glass'
        },
        assets: {}
    },
    sys: null,
    shadowPreview: null,

    themes: {
        default: {
            id: 'default',
            name: 'SYSTEM DEFAULT',
            previewColor: '#0000ff',
            css: () => `:host { background: #050110; color: #3b82f6; display: flex; align-items: center; justify-content: center; height: 100%; font-family: monospace; }`
        }
    },

    themeFiles: [
        'brutal', 'crimson', 'emerald', 'glass', 'luxury',
        'neon', 'polar', 'terminal', 'vapor'
    ],

    mount(sys) {
        this.sys = sys;
        this.ensureDependencies();
        this.loadState();

        window.registerTheme = (theme) => {
            if(!theme || !theme.id) return;
            this.themes[theme.id] = theme;
            this.renderThemeSelector();
            // Force update preview saat tema baru masuk
            if(this.state.profile.theme === theme.id) {
                setTimeout(() => this.updatePreview(), 50);
            }
        };

        this.renderApp();
        setTimeout(() => this.loadExternalThemes(), 100);
    },

    unmount() {
        this.saveState();
        delete window.registerTheme;
        this.sys.root.innerHTML = '';
    },

    ensureDependencies() {
        if (!document.querySelector('script[src*="tailwindcss"]')) {
            const s = document.createElement('script'); s.src = "https://cdn.tailwindcss.com"; document.head.appendChild(s);
        }
        if(!window.lucide) {
            const s = document.createElement('script'); s.src = "https://unpkg.com/lucide@latest"; s.onload = () => window.lucide?.createIcons(); document.head.appendChild(s);
        }
    },

    loadExternalThemes() {
        const grid = this.sys.root.querySelector('#theme-grid');
        /* Jika ada baris kode yang tidak terpakai, berikan komentar - text-zinc-500 diganti blue */
        if(grid) grid.innerHTML = `<div class="col-span-2 text-center py-4 text-xs text-blue-500 italic animate-pulse" id="loading-msg">Loading themes...</div>`;

        this.themeFiles.forEach(name => {
            const script = document.createElement('script');
            script.src = `${this.ROOT_PATH}${name}.js?v=${Date.now()}`;
            script.onerror = () => {
                if(this.ROOT_PATH.includes('/store/')) {
                   // Fallback path attempt
                   const alt = document.createElement('script');
                   alt.src = `/apps-cloud/nexus-link/themes/${name}.js`;
                   alt.onload = script.onload;
                   document.head.appendChild(alt);
                }
            };
            document.head.appendChild(script);
        });
    },

    renderApp() {
        const root = this.sys.root;
        const viewClass = this.state.isMobilePreview ? 'show-preview' : 'show-editor';
        const p = this.state.profile;

        // BACKGROUND CYBERPUNK: #050110 (Deep Void) & #0d0221 (Cyber Purple Dark)
        // TEXT COLOR: Semua text-white/zinc-200 diubah ke text-blue-400 atau text-blue-300
        root.innerHTML = `
            <div class="flex h-full w-full bg-[#050110] text-blue-300 overflow-hidden font-sans ${viewClass}">

                <div id="editor-panel" class="w-full md:w-[450px] flex flex-col border-r border-blue-500/20 bg-[#0d0221] z-20 shrink-0 h-full transition-transform duration-300">
                    <div class="h-14 border-b border-blue-500/20 flex items-center justify-between px-4 bg-[#0d0221]/95 backdrop-blur shrink-0">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-blue-100 shadow-lg shadow-blue-500/20"><i data-lucide="layout" class="w-4 h-4"></i></div>
                            <span class="font-bold text-sm tracking-tight text-blue-400">Nexus<span class="text-blue-600">Builder</span></span>
                        </div>
                        <div class="flex md:hidden bg-blue-900/40 p-0.5 rounded-lg border border-blue-500/30">
                            <button id="tab-edit" class="px-3 py-1.5 rounded text-[10px] font-bold transition ${!this.state.isMobilePreview ? 'bg-blue-600 text-blue-50' : 'text-blue-500'}">EDIT</button>
                            <button id="tab-view" class="px-3 py-1.5 rounded text-[10px] font-bold transition ${this.state.isMobilePreview ? 'bg-blue-600 text-blue-50' : 'text-blue-500'}">VIEW</button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                        <section class="space-y-4">
                            <div class="flex gap-4">
                                <div class="relative group cursor-pointer w-20 h-20 shrink-0" id="avatar-trigger">
                                    <img id="avatar-preview" src="${p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus'}" class="w-full h-full rounded-2xl object-cover border border-blue-500/20 bg-blue-950 group-hover:border-blue-400 transition shadow-lg">
                                    <div class="absolute inset-0 bg-blue-900/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"><i data-lucide="camera" class="text-blue-300 w-5 h-5"></i></div>
                                </div>
                                <div class="flex-1 space-y-2">
                                    <label class="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider">Handle</label>
                                    <div class="flex items-center bg-blue-950/50 border border-blue-500/20 rounded-xl px-3 h-10 focus-within:border-blue-500/50 transition">
                                        <span class="text-blue-700 text-xs font-mono select-none">/bio/</span>
                                        <input type="text" id="inp-handle" class="bg-transparent w-full px-1 text-sm font-bold outline-none placeholder-blue-900 text-blue-400" value="${p.handle}" placeholder="username">
                                    </div>
                                </div>
                                <input type="file" id="file-avatar" accept="image/*" class="hidden">
                            </div>
                            <div class="space-y-3">
                                <div><label class="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider mb-1 block">Display Name</label><input type="text" id="inp-name" class="w-full bg-blue-950/50 border border-blue-500/20 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500/50 transition text-blue-400" value="${p.name}" placeholder="Display Name"></div>
                                <div><label class="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider mb-1 block">Bio Description</label><textarea id="inp-bio" class="w-full bg-blue-950/50 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300 outline-none focus:border-blue-500/50 transition resize-none h-20 placeholder-blue-900" placeholder="Write something...">${p.bio}</textarea></div>
                            </div>
                        </section>

                        <hr class="border-blue-500/10">

                        <section>
                            <div class="flex justify-between items-center mb-3">
                                <label class="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2"><i data-lucide="palette" class="w-3 h-3"></i> Theme Engine (<span id="theme-count">0</span>)</label>
                            </div>
                            <div id="theme-grid" class="grid grid-cols-2 gap-2 min-h-[60px]"></div>
                        </section>

                        <hr class="border-blue-500/10">

                        <section>
                            <div class="flex justify-between items-center mb-3">
                                <label class="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2"><i data-lucide="link" class="w-3 h-3"></i> Links Manager</label>
                                <button id="btn-add-link" class="text-[10px] bg-blue-900/30 hover:bg-blue-600 hover:text-blue-50 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 border border-blue-500/20 text-blue-400"><i data-lucide="plus" class="w-3 h-3"></i> ADD LINK</button>
                            </div>
                            <div id="links-container" class="space-y-3 pb-8"></div>
                        </section>
                    </div>

                    <div class="p-4 border-t border-blue-500/20 bg-[#0d0221] shrink-0 sticky bottom-0">
                        <button id="btn-publish" class="w-full bg-blue-600 text-blue-50 hover:bg-blue-500 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 text-sm active:scale-[0.98] border border-blue-400/30"><i data-lucide="rocket" class="w-4 h-4"></i><span class="tracking-widest">PUBLISH SITE</span></button>
                    </div>
                </div>

                <div id="preview-panel" class="flex-1 bg-[#02010a] relative flex items-center justify-center ${this.state.isMobilePreview ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'}">
                    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#1e40af 1px, transparent 1px); background-size: 24px 24px;"></div>

                    <div class="relative z-10 w-full h-full md:w-[360px] md:h-[720px] md:border-[10px] md:border-[#1a1a2e] md:rounded-[40px] bg-blue-950/20 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border-blue-500/10">
                        <div class="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 h-[24px] w-[120px] bg-[#1a1a2e] rounded-b-[16px] z-50 justify-center items-end pb-1.5 border-b border-blue-500/20"><div class="w-12 h-1 bg-blue-500/20 rounded-full"></div></div>

                        <div id="preview-stage" class="w-full h-full overflow-hidden relative"></div>

                        <button id="close-preview" class="absolute top-4 right-4 bg-blue-900/80 text-blue-100 p-2 rounded-full md:hidden z-50 backdrop-blur border border-blue-400/30"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                </div>
            </div>
            <style>
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 10px; }
                ::-webkit-scrollbar { display: none; }

                /* FIX: GAP 85px Header & Footer di Mobile */
                @media (max-width: 768px) {
                    .show-editor #preview-panel { display: none; }
                    .show-editor #editor-panel { display: flex; }
                    .show-preview #editor-panel { display: none; }
                    .show-preview #preview-panel { display: flex; }

                    #preview-stage {
                        padding-top: 85px !important;
                        padding-bottom: 85px !important;
                        height: calc(100% - 170px) !important;
                        margin-top: 85px;
                    }
                }

                /* Input text color wajib biru */
                input, textarea {
                    color: #60a5fa !important;
                }
                input::placeholder, textarea::placeholder {
                    color: #1e3a8a !important;
                }
            </style>
        `;

        this.initShadowPreview();
        this.bindEvents();
        this.renderLinks();
        this.renderThemeSelector();
        if(window.lucide) window.lucide.createIcons();
    },

    initShadowPreview() {
        const host = this.sys.root.querySelector('#preview-stage');
        if(!host) return;
        if(!host.shadowRoot) {
            this.shadowPreview = host.attachShadow({ mode: 'open' });
        }
        this.updatePreview();
    },

    bindEvents() {
        const root = this.sys.root;
        const set = (k, v) => { this.state.profile[k] = v; this.updatePreview(); };

        root.querySelector('#tab-edit').onclick = () => { this.state.isMobilePreview = false; this.renderApp(); };
        root.querySelector('#tab-view').onclick = () => { this.state.isMobilePreview = true; this.renderApp(); };
        const closePrev = root.querySelector('#close-preview');
        if(closePrev) closePrev.onclick = () => { this.state.isMobilePreview = false; this.renderApp(); };

        root.querySelector('#inp-handle').oninput = (e) => set('handle', e.target.value);
        root.querySelector('#inp-name').oninput = (e) => set('name', e.target.value);
        root.querySelector('#inp-bio').oninput = (e) => set('bio', e.target.value);

        root.querySelector('#avatar-trigger').onclick = () => root.querySelector('#file-avatar').click();
        root.querySelector('#file-avatar').onchange = (e) => {
            const f = e.target.files[0];
            if(f) {
                const r = new FileReader();
                r.onload = (ev) => {
                    this.state.profile.avatar = ev.target.result;
                    root.querySelector('#avatar-preview').src = ev.target.result;
                    this.updatePreview();
                };
                r.readAsDataURL(f);
            }
        };

        root.querySelector('#btn-add-link').onclick = () => {
            this.state.profile.links.push({ title: 'New Link', url: '#' });
            this.renderLinks(); this.updatePreview();
        };

        root.querySelector('#btn-publish').onclick = () => this.deploy();
    },

    renderThemeSelector() {
        const grid = this.sys.root.querySelector('#theme-grid');
        const countLabel = this.sys.root.querySelector('#theme-count');
        if(!grid) return;

        const themesToShow = Object.values(this.themes).filter(t => t.id !== 'default');

        if(countLabel) countLabel.innerText = themesToShow.length;
        if(themesToShow.length > 0 && grid.querySelector('#loading-msg')) grid.innerHTML = '';

        themesToShow.forEach(t => {
            if(grid.querySelector(`[data-id="${t.id}"]`)) return;

            const active = this.state.profile.theme === t.id;
            const el = document.createElement('div');
            el.setAttribute('data-id', t.id);
            el.className = `cursor-pointer h-14 rounded-xl border relative overflow-hidden transition-all duration-200 group ${active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-500/10 hover:border-blue-500/30'}`;

            let bgStyle = t.previewColor.includes('gradient') ? `background: ${t.previewColor}` : `background-color: ${t.previewColor.split(' ')[0]}`;

            el.innerHTML = `
                <div class="absolute inset-0 transition transform group-hover:scale-110 duration-500" style="${bgStyle}"></div>
                <div class="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-[1px]">
                    <span class="text-[10px] font-bold text-blue-200 uppercase tracking-wider drop-shadow-md">${t.name}</span>
                </div>
                ${active ? '<div class="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>' : ''}
            `;
            el.onclick = () => {
                this.state.profile.theme = t.id;
                grid.innerHTML = '';
                this.renderThemeSelector();
                this.updatePreview();
            };
            grid.appendChild(el);
        });
    },

    renderLinks() {
        const con = this.sys.root.querySelector('#links-container');
        if(!con) return;
        con.innerHTML = '';
        this.state.profile.links.forEach((l, i) => {
            const el = document.createElement('div');
            el.className = 'group bg-blue-950/20 p-3 rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-all';
            el.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-6 h-6 rounded bg-blue-900/20 flex items-center justify-center text-blue-500"><i data-lucide="link" class="w-3 h-3"></i></div>
                    <input type="text" class="bg-transparent text-xs font-bold text-blue-400 flex-1 outline-none uppercase placeholder-blue-900 l-title" value="${l.title}" placeholder="TITLE">
                    <button class="text-blue-800 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition btn-del"><i data-lucide="x" class="w-3 h-3"></i></button>
                </div>
                <input type="text" class="w-full bg-blue-950/40 text-[10px] text-blue-600 px-3 py-2 rounded-lg font-mono outline-none focus:text-blue-400 focus:bg-blue-900/40 transition l-url" value="${l.url}" placeholder="https://">
            `;
            el.querySelector('.l-title').oninput = (e) => { this.state.profile.links[i].title = e.target.value; this.updatePreview(); };
            el.querySelector('.l-url').oninput = (e) => { this.state.profile.links[i].url = e.target.value; this.updatePreview(); };
            el.querySelector('.btn-del').onclick = () => { this.state.profile.links.splice(i, 1); this.renderLinks(); this.updatePreview(); };
            con.appendChild(el);
        });
        if(window.lucide) window.lucide.createIcons();
    },

    updatePreview() {
        if(!this.shadowPreview) return;
        const p = this.state.profile;
        let theme = this.themes[p.theme] || this.themes['default'];

        let css = '';
        try {
            let rawCss = theme.css(p);

            css = rawCss
                .replace(/body\s*{/g, ':host {')
                .replace(/body\s*:/g, ':host:')
                .replace(/body\s/g, ':host ')
                .replace(/100vh/g, '100%')
                .replace(/min-height:\s*100%/g, 'min-height: 100%; height: 100%;');

        } catch(e) {}

        const linksHtml = p.links.map(l => `<a href="${l.url}" target="_blank" class="link-card">${l.title}</a>`).join('');
        const avatarSrc = p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus';

        this.shadowPreview.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    min-height: 100%;
                    height: 100%;
                    margin: 0; padding: 0;
                    box-sizing: border-box;
                    overflow-y: auto;
                    position: relative;
                }
                * { box-sizing: border-box; }

                ${css}
            </style>

            <div class="container">
                <img src="${avatarSrc}" class="avatar" alt="Avatar">
                <h1>${p.name || 'Your Name'}</h1>
                <p>${p.bio || 'Welcome to my page.'}</p>
                <div class="links-wrapper">${linksHtml}</div>
            </div>
        `;
    },

    async deploy() {
        const btn = this.sys.root.querySelector('#btn-publish');
        if(!this.state.profile.handle || this.state.profile.handle.length < 3) { alert("Handle min 3 chars!"); return; }
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `UPLOADING...`; btn.disabled = true;
        try {
            const payload = { handle: this.state.profile.handle.toLowerCase().replace(/[^a-z0-9_]/g, ''), data: this.state.profile };
            const res = await fetch('/api/v1/nexus-bio/publish', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if(res.ok && json.success) alert(`SUCCESS! Bio active at: /bio/${payload.handle}`);
            else throw new Error(json.error || "Upload failed");
        } catch (e) { alert("Error: " + e.message); }
        finally { btn.innerHTML = originalHtml; btn.disabled = false; }
    },

    loadState() {
        try {
            const s = localStorage.getItem('nexus_v3_state');
            if(s) { const parsed = JSON.parse(s); this.state.profile = { ...this.state.profile, ...parsed.profile }; }
        } catch(e) {}
    },
    saveState() { localStorage.setItem('nexus_v3_state', JSON.stringify({ profile: this.state.profile })); }
})