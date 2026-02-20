({
    state: {
        appName: 'optic_master_pro',
        activeTab: 'gen',

        qrData: { type: 'url', val: 'https://flowork.cloud', ssid:'', pass:'', enc:'WPA' },
        style: { c1: '#38bdf8', bg: '#050110', logo: null },

        scanResult: null,
        isCameraOpen: false,
        html5QrCode: null,
        isScanningFile: false,
        scanStatus: '',

        libsLoaded: false,
        qrInstance: null,
    },

    sys: null,
    observer: null,

    // THEME CYBERPUNK - Dominan Biru, No White/Dark Text
    themes: {
        dark: {
            '--bg-root': '#050110',
            '--glass': 'rgba(10, 20, 50, 0.9)',
            '--glass-border': '1px solid #1e40af',
            '--txt': '#38bdf8', // Biru terang
            '--txt-dim': '#1e40af', // Biru redup
            '--prm': '#0ea5e9', // Biru primary
            '--scs': '#00d2ff',
            '--err': '#3b82f6',
            '--brd': '#1e3a8a',
            '--surface': 'rgba(30, 58, 138, 0.2)',
            '--shadow': '0 0 15px rgba(56, 189, 248, 0.3)',
            '--input-bg': '#020617'
        },
        light: {
            // Dipaksa tetap nuansa biru agar tetap terbaca di mode apapun
            '--bg-root': '#e0f2fe',
            '--glass': 'rgba(186, 230, 253, 0.9)',
            '--glass-border': '1px solid #38bdf8',
            '--txt': '#0369a1',
            '--txt-dim': '#075985',
            '--prm': '#0284c7',
            '--scs': '#0ea5e9',
            '--err': '#2563eb',
            '--brd': '#7dd3fc',
            '--surface': 'rgba(255, 255, 255, 0.3)',
            '--shadow': '0 4px 6px -1px rgba(3, 105, 161, 0.2)',
            '--input-bg': '#f0f9ff'
        }
    },

    async mount(sys) {
        this.sys = sys;
        this.render();
        await this.loadDependencies();

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

        setTimeout(() => this.updatePreview(), 500);
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.stopCamera();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    async loadDependencies() {
        const load = (url) => new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = url; s.onload = resolve; document.head.appendChild(s);
        });

        try {
            await Promise.all([
                load('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js'),
                load('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'),
                load('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js')
            ]);
            this.state.libsLoaded = true;
            this.render();
            this.updatePreview();
        } catch (e) {
            if(this.sys.alert) this.sys.alert("Library failed.", "Error");
        }
    },

    updatePreview() {
        const r = this.sys.root;
        const tgt = r.querySelector('#preview-target');
        if(!tgt || !this.state.libsLoaded) return;

        let data = this.state.qrData.val;
        if(this.state.qrData.type === 'wifi') {
            data = `WIFI:T:${this.state.qrData.enc};S:${this.state.qrData.ssid};P:${this.state.qrData.pass};;`;
        }

        if(!this.state.qrInstance) {
            this.state.qrInstance = new QRCodeStyling({
                width: 300, height: 300, type: "svg",
                qrOptions: { errorCorrectionLevel: 'M' },
                dotsOptions: { color: this.state.style.c1, type: "extra-rounded" },
                backgroundOptions: { color: "#ffffff" },
                imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.4 }
            });
        }

        this.state.qrInstance.update({
            data: data,
            image: this.state.style.logo,
            dotsOptions: { color: this.state.style.c1 }
        });

        tgt.innerHTML = '';
        this.state.qrInstance.append(tgt);
    },

    async handleDownload() {
        if(!this.state.qrInstance) return;
        try {
            const blob = await this.state.qrInstance.getRawData('png');
            if(blob) this.saveToDevice(blob, `qr-${Date.now()}.png`, 'image/png');
        } catch(e) {
            if(this.sys.toast) this.sys.toast("Error generating", "error");
        }
    },

    handleLogoUpload(file) {
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.style.logo = e.target.result;
            this.updatePreview();
        };
        reader.readAsDataURL(file);
    },

    async startCamera() {
        const s = this.state;
        s.isCameraOpen = true;
        this.render();

        setTimeout(async () => {
            try {
                this.state.html5QrCode = new Html5Qrcode("reader");
                const config = { fps: 15, qrbox: { width: 250, height: 250 } };
                const onSuccess = (txt) => { s.scanResult = txt; this.stopCamera(); if(this.sys.toast) this.sys.toast("Detected!"); };
                try { await this.state.html5QrCode.start({ facingMode: "environment" }, config, onSuccess, () => {}); }
                catch (e) { await this.state.html5QrCode.start({ facingMode: "user" }, config, onSuccess, () => {}); }
            } catch (err) {
                this.stopCamera();
            }
        }, 300);
    },

    async stopCamera() {
        if (this.state.html5QrCode && this.state.isCameraOpen) {
            try { await this.state.html5QrCode.stop(); this.state.html5QrCode = null; } catch (e) {}
        }
        this.state.isCameraOpen = false;
        this.render();
    },

    async handleScanFile(file) {
        if(!file) return;
        this.state.isScanningFile = true;
        this.state.scanStatus = 'Initializing...';
        this.render();
        await new Promise(r => setTimeout(r, 100));

        try {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            const MAX_DIM = 1000;
            let w = img.width, h = img.height;
            if (w > h && w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; }
            else if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; }
            canvas.width = w; canvas.height = h;

            const tryScan = async (label) => {
                this.state.scanStatus = label;
                this.render();
                await new Promise(r => setTimeout(r, 50));
                const imgData = ctx.getImageData(0,0,w,h);
                if (window.jsQR) {
                    const code = jsQR(imgData.data, w, h, { inversionAttempts: "attemptBoth" });
                    if(code) return code.data;
                }
                if ('BarcodeDetector' in window) {
                    try {
                        const detector = new BarcodeDetector({ formats: ['qr_code'] });
                        const barcodes = await detector.detect(canvas);
                        if (barcodes.length > 0) return barcodes[0].rawValue;
                    } catch(e) {}
                }
                return null;
            };

            ctx.drawImage(img, 0, 0, w, h);
            let res = await tryScan("Scanning Full Image...");
            if(res) { this.finishScan(res); return; }

            ctx.filter = 'contrast(200%) grayscale(100%)';
            ctx.drawImage(img, 0, 0, w, h);
            ctx.filter = 'none';
            res = await tryScan("Enhancing Contrast...");
            if(res) { this.finishScan(res); return; }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0,0,w,h);
            const sx = img.width * 0.2;
            const sy = img.height * 0.2;
            const sw = img.width * 0.6;
            const sh = img.height * 0.6;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
            res = await tryScan("Zooming In (Smart Crop)...");
            if(res) { this.finishScan(res); return; }

            ctx.filter = 'contrast(250%) grayscale(100%)';
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
            ctx.filter = 'none';
            res = await tryScan("Zoom + Enhance...");
            if(res) { this.finishScan(res); return; }

            ctx.filter = 'invert(100%)';
            ctx.drawImage(img, 0, 0, w, h);
            ctx.filter = 'none';
            res = await tryScan("Checking Dark Mode...");
            if(res) { this.finishScan(res); return; }

            throw new Error("QR Not Found");
        } catch(err) {
            if(this.sys.alert) this.sys.alert("QR Code not detected even after Auto-Zoom.", "Scan Failed");
        } finally {
            this.state.isScanningFile = false;
            this.render();
        }
    },

    finishScan(result) {
        this.state.scanResult = result;
        if(this.sys.toast) this.sys.toast("QR Found!", "success");
        this.render();
    },

    render() {
        const { activeTab } = this.state;
        const isGen = activeTab === 'gen';

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    <div class="nav-container">
                         <div class="tabs">
                            <div class="tab-item ${isGen?'active':''}" id="tab-gen">GENERATOR</div>
                            <div class="tab-item ${!isGen?'active':''}" id="tab-scan">SCANNER</div>
                        </div>
                    </div>
                    ${isGen ? this.renderGen() : this.renderScan()}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;
                    box-sizing: border-box;
                    scrollbar-width: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                /* FIX MOBILE GAP 85px & SCROLL MENTOK */
                @media (max-width: 768px) {
                    .app-root {
                        padding-top: 85px !important;
                        padding-bottom: 120px !important; /* Tambahan agar bisa scroll melewati footer */
                    }
                }

                .content-limit {
                    width: 100%; max-width: 1020px; margin: 0 auto;
                    padding: 0 15px; box-sizing: border-box;
                    display: flex; flex-direction: column;
                    justify-content: flex-start; gap: 15px;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 24px; padding: 20px;
                    box-shadow: var(--shadow);
                }

                .nav-container { display: flex; justify-content: center; width: 100%; }
                .tabs {
                    display: flex; width: 100%; max-width: 360px;
                    background: var(--glass); border: var(--glass-border);
                    padding: 5px; border-radius: 100px;
                }
                .tab-item {
                    flex: 1; text-align: center; padding: 10px; border-radius: 100px;
                    font-weight: 800; font-size: 11px; cursor: pointer; color: var(--txt-dim);
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 1px;
                }
                /* Active Tab Color dipastikan Biru Terang */
                .tab-item.active { background: #38bdf8; color: #082f49; box-shadow: 0 0 15px #38bdf8; }

                .gen-layout { display: flex; flex-direction: column-reverse; gap: 12px; }
                @media (min-width: 768px) {
                    .gen-layout { flex-direction: row; align-items: flex-start; gap: 20px; }
                    .gen-col-form { flex: 1; }
                    .gen-col-prev { width: 340px; flex-shrink: 0; position: sticky; top: 10px; }
                }

                .input-group { margin-bottom: 12px; }
                .label { display: block; font-size: 10px; font-weight: 800; color: var(--txt-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }

                /* FIX: Tulisan Mengetik Wajib Biru */
                .inp {
                    width: 100%; background: var(--input-bg); border: var(--glass-border);
                    color: #38bdf8 !important; /* Biru Neon saat mengetik */
                    border-radius: 14px; padding: 14px;
                    font-family: 'Courier New', monospace; font-size: 13px; outline: none;
                    box-sizing: border-box; transition: 0.2s;
                }
                .inp:focus { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
                select.inp { appearance: none; cursor: pointer; }

                .preview-box {
                    background: #fff; border-radius: 20px; padding: 15px;
                    display: flex; align-items: center; justify-content: center;
                    width: 100%; aspect-ratio: 1/1; max-height: 350px;
                    margin-bottom: 12px; box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
                }

                .btn {
                    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 12px; border-radius: 14px; transition: 0.3s;
                    gap: 10px; width: 100%; padding: 14px; text-transform: uppercase; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.96); }
                .btn-prm { background: #38bdf8; color: #082f49; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4); }
                .btn-prm:hover { background: #0ea5e9; box-shadow: 0 0 20px rgba(56, 189, 248, 0.6); }
                .btn-sec { background: transparent; border: 1px solid #1e40af; color: #38bdf8; }

                .scan-window {
                    position: relative; width: 100%; max-width: 350px; aspect-ratio: 1;
                    margin: 0 auto 15px auto; background: #000; border-radius: 24px;
                    overflow: hidden; border: 2px solid #1e40af;
                    box-shadow: 0 0 20px rgba(30, 64, 175, 0.3);
                }
                #reader { width: 100%; height: 100%; }
                #reader video { object-fit: cover; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Agar scroll aman saat di paling bawah */
                .content-limit::after { content: ""; display: block; height: 1px; width: 100%; }
            </style>
        `;
        this.bindEvents();
    },

    renderGen() {
        const s = this.state;
        return `
            <div class="gen-layout fade-in">
                <div class="gen-col-form glass-panel">
                    <div class="input-group">
                        <label class="label">Content Type</label>
                        <select id="qr-type" class="inp">
                            <option value="url" ${s.qrData.type==='url'?'selected':''}>URL / Website</option>
                            <option value="text" ${s.qrData.type==='text'?'selected':''}>Plain Text</option>
                            <option value="wifi" ${s.qrData.type==='wifi'?'selected':''}>WiFi Hotspot</option>
                        </select>
                    </div>
                    ${s.qrData.type === 'wifi' ? `
                        <div class="input-group"><label class="label">Network SSID</label><input id="qr-ssid" class="inp" value="${s.qrData.ssid}" placeholder="WiFi Name"></div>
                        <div class="input-group"><label class="label">Password</label><input id="qr-pass" class="inp" value="${s.qrData.pass}" placeholder="WiFi Password"></div>
                    ` : `
                        <div class="input-group"><label class="label">Data Content</label><input id="qr-val" class="inp" value="${s.qrData.val}" placeholder="https://..."></div>
                    `}
                    <div style="display:flex; gap:12px;">
                        <div class="input-group" style="flex:1;">
                            <label class="label">Color</label>
                            <input type="color" id="qr-color" class="inp" style="height:48px; padding:4px;" value="${s.style?.c1 || '#38bdf8'}">
                        </div>
                        <div class="input-group" style="flex:2;">
                            <label class="label">Logo</label>
                            <input type="file" id="qr-logo" class="inp" style="padding:11px; font-size:11px;" accept="image/*">
                        </div>
                    </div>
                </div>
                <div class="gen-col-prev">
                    <div class="glass-panel" style="padding:15px;">
                        <div class="preview-box"><div id="preview-target"></div></div>
                        <button id="btn-dl" class="btn btn-prm">Download PNG</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderScan() {
        const s = this.state;
        return `
            <div class="glass-panel fade-in" style="text-align:center;">
                <div class="scan-window">
                    ${s.isScanningFile ? `
                    <div style="position:absolute; inset:0; background:rgba(2, 6, 23, 0.9); z-index:20; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <div style="width:40px; height:40px; border:4px solid #38bdf8; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);"></div>
                        <div style="margin-top:15px; font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:1px;">${s.scanStatus}</div>
                    </div>` : ''}
                    <div id="reader"></div>
                    ${!s.isCameraOpen ? `
                        <div id="scan-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(10, 20, 50, 0.6); cursor:pointer;">
                            <div style="font-size:40px; margin-bottom:12px; filter: drop-shadow(0 0 10px #38bdf8);">📷</div>
                            <div style="font-weight:800; font-size:12px; color:#38bdf8; letter-spacing:1px;">TAP TO UPLOAD IMAGE</div>
                        </div>
                    `:''}
                </div>
                <input type="file" id="inp-scan" accept="image/*" hidden>
                <div style="display:flex; gap:12px; max-width:400px; margin:0 auto;">
                     <button id="btn-cam" class="btn ${s.isCameraOpen?'btn-sec':'btn-prm'}">
                        ${s.isCameraOpen ? 'STOP CAMERA' : 'START CAMERA'}
                    </button>
                </div>
                ${s.scanResult ? `
                    <div style="margin-top:20px; text-align:left; background:var(--input-bg); padding:15px; border-radius:16px; border:1px solid #1e40af; box-shadow: 0 0 10px rgba(30, 64, 175, 0.2);">
                        <label class="label" style="color:#38bdf8">Result Detected</label>
                        <div style="font-family:'Courier New'; font-size:13px; word-break:break-all; margin-bottom:15px; line-height:1.5; color:#7dd3fc;">${s.scanResult}</div>
                        <button id="btn-copy" class="btn btn-sec" style="font-size:11px; padding:10px;">COPY TO CLIPBOARD</button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents() {
        const r = this.sys.root;
        const $ = (sel) => r.querySelector(sel);
        r.querySelectorAll('button, input, select, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        if ($('#tab-gen')) $('#tab-gen').onclick = () => { this.stopCamera(); this.state.activeTab = 'gen'; this.render(); this.bindEvents(); this.updatePreview(); };
        if ($('#tab-scan')) $('#tab-scan').onclick = () => { this.state.activeTab = 'scan'; this.render(); this.bindEvents(); };

        if (this.state.activeTab === 'gen') {
            if($('#qr-type')) $('#qr-type').onchange = (e) => { this.state.qrData.type = e.target.value; this.render(); this.bindEvents(); this.updatePreview(); };
            if($('#qr-val')) $('#qr-val').oninput = (e) => { this.state.qrData.val = e.target.value; this.updatePreview(); };
            if($('#qr-ssid')) $('#qr-ssid').oninput = (e) => { this.state.qrData.ssid = e.target.value; this.updatePreview(); };
            if($('#qr-pass')) $('#qr-pass').oninput = (e) => { this.state.qrData.pass = e.target.value; this.updatePreview(); };
            if($('#qr-color')) $('#qr-color').oninput = (e) => { this.state.style.c1 = e.target.value; this.updatePreview(); };
            if($('#qr-logo')) $('#qr-logo').onchange = (e) => this.handleLogoUpload(e.target.files[0]);
            if($('#btn-dl')) $('#btn-dl').onclick = () => this.handleDownload();
        } else {
            if($('#scan-overlay')) $('#scan-overlay').onclick = () => $('#inp-scan').click();
            $('#inp-scan').onchange = (e) => { if(e.target.files.length > 0) this.handleScanFile(e.target.files[0]); };
            $('#btn-cam').onclick = () => this.state.isCameraOpen ? this.stopCamera() : this.startCamera();
            if($('#btn-copy')) $('#btn-copy').onclick = () => { navigator.clipboard.writeText(this.state.scanResult); if(this.sys.toast) this.sys.toast("Copied!"); };
        }
    }
})