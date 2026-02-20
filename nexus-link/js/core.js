//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\nexus-link\js\core.js total lines 213 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * NEXUS BIO - CORE ENGINE V3
 */

const AppCore = {
    data: {
        handle: '',
        name: 'ALEXANDER',
        bio: 'Digital Artist & Creative Developer.',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus',
        links: [{ title: 'PORTFOLIO', url: '#', icon: 'globe' }, { title: 'INSTAGRAM', url: '#', icon: 'instagram' }],
        theme: 'glass' // Default harus ada file-nya (glass.js)
    },

    async init() {
        if (window.NEXUS_MODE === "VIEWER") return; // Mode Viewer handled by middleware

        await this.loadPartial('view-lander', 'partials/lander.html');
        await this.loadPartial('view-app', 'partials/app.html');

        this.switchTab('lander');
    },

    async loadPartial(id, url) {
        try {
            const res = await fetch(url);
            if(!res.ok) throw new Error("Partial not found");
            document.getElementById(id).innerHTML = await res.text();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (e) { console.error(e); }
    },

    switchTab(tab) {
        document.getElementById('view-lander').classList.add('hidden-view');
        document.getElementById('view-app').classList.add('hidden-view');
        document.getElementById(`view-${tab}`).classList.remove('hidden-view');

        if (tab === 'app') {
            setTimeout(() => {
                this.bindInputs();
                this.renderThemeSelector();
                this.renderLinksInput();
                this.updatePreview();
            }, 50);
        }
    },

    bindInputs() {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
        setVal('input-handle', this.data.handle);
        setVal('input-name', this.data.name);
        setVal('input-bio', this.data.bio);
        const img = document.getElementById('avatar-preview');
        if(img) img.src = this.data.avatar;
    },

    renderThemeSelector() {
        const container = document.getElementById('theme-list');
        if (!container) return;
        container.innerHTML = '';

        const themes = window.NEXUS_THEMES || {};

        if(Object.keys(themes).length === 0) {
            container.innerHTML = '<div class="col-span-3 text-red-500 text-[10px]">No themes loaded. Check index.html</div>';
            return;
        }

        Object.values(themes).forEach(theme => {
            const isActive = this.data.theme === theme.id;
            const btn = document.createElement('div');
            btn.className = `cursor-pointer h-16 rounded-lg relative overflow-hidden transition-all duration-300 group border-2 ${isActive ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-white/5 hover:border-white/20'}`;
            btn.onclick = () => this.setTheme(theme.id);

            btn.innerHTML = `
                <div class="absolute inset-0 ${theme.previewColor || 'bg-zinc-800'} opacity-70 group-hover:opacity-100 transition"></div>
                <div class="absolute inset-0 flex items-center justify-center z-10">
                    <span class="text-[9px] font-bold text-white uppercase tracking-widest drop-shadow-md">${theme.name}</span>
                </div>
            `;
            container.appendChild(btn);
        });
    },

    setTheme(t) {
        this.data.theme = t;
        this.renderThemeSelector();
        this.updatePreview();
    },

    addLink() { this.data.links.push({ title: 'New Link', url: 'https://', icon: 'link' }); this.renderLinksInput(); this.updatePreview(); },
    removeLink(i) { this.data.links.splice(i, 1); this.renderLinksInput(); this.updatePreview(); },
    updateLink(i, k, v) { this.data.links[i][k] = v; this.updatePreview(); },

    renderLinksInput() {
        const container = document.getElementById('links-container');
        if(!container) return;
        container.innerHTML = '';

        this.data.links.forEach((link, index) => {
            const div = document.createElement('div');
            div.className = 'group bg-zinc-900/30 border border-white/5 rounded-lg p-3 hover:border-white/10 transition';
            div.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-zinc-500 text-xs"><i data-lucide="link" class="w-3 h-3"></i></div>
                    <input type="text" value="${link.title}" class="bg-transparent flex-1 text-xs font-bold text-white outline-none placeholder-zinc-600 uppercase" placeholder="TITLE" oninput="window.appCore.updateLink(${index}, 'title', this.value)">
                    <button onclick="window.appCore.removeLink(${index})" class="text-zinc-600 hover:text-red-400"><i data-lucide="x" class="w-3 h-3"></i></button>
                </div>
                <input type="text" value="${link.url}" class="w-full bg-black/20 rounded px-2 py-1.5 text-[10px] text-zinc-400 font-mono outline-none focus:text-indigo-400" placeholder="https://" oninput="window.appCore.updateLink(${index}, 'url', this.value)">
            `;
            container.appendChild(div);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    updatePreview() {
        const getVal = (id) => document.getElementById(id)?.value || '';
        this.data.handle = getVal('input-handle').toLowerCase().replace(/[^a-z0-9-]/g, '');
        this.data.name = getVal('input-name') || 'NAME';
        this.data.bio = getVal('input-bio') || 'Bio here...';

        const iframe = document.getElementById('preview-frame');
        if(!iframe) return;

        const theme = window.getTheme(this.data.theme);
        const css = theme.css(this.data);
        const body = this.generateHTMLBody();

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body::-webkit-scrollbar{display:none} ${css}</style></head><body>${body}</body></html>`);
        doc.close();
    },

    generateHTMLBody() {
        const { name, bio, avatar, links } = this.data;
        const linksHTML = links.map(l => `<a href="${l.url}" target="_blank" class="link-card">${l.title}</a>`).join('');
        return `<div class="container"><img src="${avatar}" class="avatar"><h1>${name}</h1><p>${bio}</p>${linksHTML}</div>`;
    },

    async handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;
        document.getElementById('avatar-loading').classList.remove('hidden');
        try {
            const base64 = await this.compressImage(file);
            this.data.avatar = base64;
            document.getElementById('avatar-preview').src = base64;
            this.updatePreview();
        } catch (e) { alert("Error upload."); }
        finally { document.getElementById('avatar-loading').classList.add('hidden'); }
    },

    compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > 300) { h *= 300 / w; w = 300; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    async deploy() {
        const btn = document.getElementById('btn-deploy');
        const originalText = btn.innerHTML;
        if(!this.data.handle || this.data.handle.length < 3) { alert("Handle woy isi!"); return; }

        try {
            btn.innerHTML = `UPLOADING...`;
            btn.disabled = true;

            const res = await fetch('/api/v1/nexus-bio/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle: this.data.handle, data: this.data })
            });

            const json = await res.json();
            if(res.ok && json.success) {
                const url = window.location.origin + '/bio/' + this.data.handle;
                document.getElementById('modal-content').innerHTML = `
                    <div class="bg-black/30 p-3 rounded border border-white/10 flex items-center justify-between gap-2">
                        <span class="text-indigo-400 font-mono text-xs truncate">${url}</span>
                    </div>
                    <a href="${url}" target="_blank" class="block w-full text-center py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs mt-2">OPEN LINK</a>
                `;
                document.getElementById('result-modal').classList.remove('opacity-0', 'pointer-events-none');
                document.getElementById('result-modal').classList.add('active');
            } else { throw new Error(json.error); }
        } catch(e) { alert("Error: " + e.message); }
        finally { btn.innerHTML = originalText; btn.disabled = false; }
    }
};

window.appCore = AppCore;
window.onload = () => AppCore.init();
