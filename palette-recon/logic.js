({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        selectedImage: null,
        palette: [],
        status: 'READY FOR SCAN',
        detail: null
    },

    sys: null,
    observer: null,
    appName: 'palette-recon',

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.9)',
            '--glass-border': '1px solid rgba(245, 158, 11, 0.2)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.05)',
            '--surface': 'rgba(255, 255, 255, 0.03)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        if (localStorage.getItem('app_visited_' + this.appName)) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.render();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver(() => this.onThemeChange(document.documentElement.getAttribute('data-theme')));
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        for (const [key, value] of Object.entries(theme)) this.sys.root.style.setProperty(key, value);
    },

    handleFile(file) {
        if (!file) return;
        this.state.status = "ANALYZING...";
        this.render();
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => this.deepScan(img, e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    deepScan(img, dataUrl) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
        else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const colorMap = {};
        for (let i = 0; i < data.length; i += 40) {
            const r = Math.round(data[i]/10)*10, g = Math.round(data[i+1]/10)*10, b = Math.round(data[i+2]/10)*10, a = data[i+3];
            if (a < 128) continue;
            const key = `${r},${g},${b}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
        }
        const sorted = Object.keys(colorMap).map(k => {
            const [r, g, b] = k.split(',').map(Number);
            return { r, g, b, count: colorMap[k], hex: `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase()}` };
        }).sort((a, b) => b.count - a.count).slice(0, 20);

        this.state.selectedImage = dataUrl;
        this.state.palette = sorted;
        this.state.status = "SCAN COMPLETE";
        this.state.detail = sorted[0];
        this.render();
    },

    render() {
        const content = this.state.currentView === 'lander' ? this.renderLander() : this.renderMain();
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@600;700&display=swap');
                .app-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-root); color: var(--txt); font-family: 'Rajdhani', sans-serif; overflow-y: scroll; padding-top: 70px; padding-bottom: 90px; scrollbar-width: none; }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                .glass-panel { background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: var(--glass-border); border-radius: 24px; padding: 25px; box-shadow: var(--shadow); margin-bottom: 20px; }
                .file-zone { border: 2px dashed var(--brd); border-radius: 20px; padding: 40px; text-align: center; cursor: pointer; position: relative; }
                .btn { background: var(--prm); color: #fff; border: none; padding: 14px 28px; border-radius: 12px; cursor: pointer; font-weight: 800; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; gap: 10px; }
                .color-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 10px; margin-top: 20px; }
                .chip { aspect-ratio: 1; border-radius: 8px; cursor: pointer; border: 1px solid var(--brd); transition: transform 0.1s; }
                .chip:hover { transform: scale(1.2); z-index: 5; border: 2px solid #fff; }
                .txt-blue { color: var(--prm) !important; font-family: 'Share Tech Mono', monospace; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="glass-panel" style="text-align:center; max-width:600px; margin:auto;">
                <h1 style="font-size:32px; margin-bottom:15px;">PALETTE_<span style="color:#f59e0b;">RECON</span></h1>
                <p style="color:var(--txt-dim); font-size:14px; margin-bottom:30px;">Deep Scan Engine for extracting dominant color palettes from any image. Unlock hex codes and visual intelligence instantly.</p>
                <button id="btn-start" class="btn" style="width:100%;">INITIALIZE SCANNER</button>
            </div>
        `;
    },

    renderMain() {
        const { selectedImage, palette, status, detail } = this.state;
        return `
            <div class="glass-panel">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px; border-bottom:1px solid var(--brd); padding-bottom:10px;">
                    <div style="font-weight:900; letter-spacing:1px;">INTEL_RECON</div>
                    <div class="txt-blue" style="font-size:10px;">${status}</div>
                </div>

                <div class="file-zone">
                    <input type="file" id="file-input" style="position:absolute; inset:0; opacity:0; cursor:pointer;">
                    ${selectedImage ? `<img src="${selectedImage}" style="max-height:200px; border-radius:12px; margin:auto;">` : `
                        <i class="material-icons" style="font-size:48px; color:var(--txt-dim);">image_search</i>
                        <div style="font-size:12px; color:var(--txt-dim); margin-top:10px;">DROP IMAGE FOR SCAN</div>
                    `}
                </div>

                ${palette.length ? `
                    <div class="color-grid">
                        ${palette.map(c => `<div class="chip" style="background:${c.hex}" data-hex="${c.hex}"></div>`).join('')}
                    </div>
                    <div class="glass-panel" style="margin-top:20px; background:rgba(0,0,0,0.2);">
                        <div style="display:flex; gap:20px; align-items:center;">
                            <div style="width:60px; height:60px; border-radius:12px; background:${detail.hex}; border:1px solid var(--brd);"></div>
                            <div>
                                <div class="txt-blue" style="font-size:18px; margin-bottom:5px;">${detail.hex}</div>
                                <div style="font-size:10px; color:var(--txt-dim);">RGB(${detail.r}, ${detail.g}, ${detail.b})</div>
                            </div>
                            <button id="btn-copy-hex" class="btn" style="margin-left:auto; font-size:10px; padding:10px 20px;">Copy Hex</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        root.querySelectorAll('button, input, .chip').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });
        const btnStart = root.querySelector('#btn-start');
        if (btnStart) btnStart.onclick = () => {
            localStorage.setItem('app_visited_' + this.appName, 'true');
            this.state.currentView = 'main';
            this.render();
        };
        const fileIn = root.querySelector('#file-input');
        if (fileIn) fileIn.onchange = (e) => this.handleFile(e.target.files[0]);
        root.querySelectorAll('.chip').forEach(el => {
            el.onclick = () => {
                this.state.detail = this.state.palette.find(c => c.hex === el.dataset.hex);
                this.render();
            };
        });
        const copyBtn = root.querySelector('#btn-copy-hex');
        if (copyBtn) copyBtn.onclick = () => {
            navigator.clipboard.writeText(this.state.detail.hex);
            this.sys.toast("HEX COPIED");
        };
    }
})