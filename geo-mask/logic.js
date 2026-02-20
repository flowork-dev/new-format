({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        piexifLoaded: false,
        fileDataURL: null,
        fileName: '',
        originalExifObj: null,
        lat: '',
        lng: '',
        exifStatus: 'WAITING FOR TARGET...'
    },
    sys: null,
    observer: null,

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#38bdf8', /* Dominan Biru */
            '--txt-dim': '#0284c7',
            '--prm': '#2563eb',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#1d4ed8', /* Dominan Biru */
            '--txt-dim': '#3b82f6',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(37, 99, 235, 0.3)',
            '--surface': 'rgba(37, 99, 235, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_geo_mask');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.loadPiexif();
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

    loadPiexif() {
        if (window.piexif) {
            this.state.piexifLoaded = true;
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/piexifjs/1.0.6/piexif.js';
        script.onload = () => { this.state.piexifLoaded = true; this.render(); };
        document.head.appendChild(script);
    },

    // --- PROTOKOL DOWNLOAD HYBRID (ANTI GAGAL) ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving to device storage...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    handleFile(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
                if(this.sys) this.sys.toast("Only JPG/JPEG files supported!", "error");
                return;
            }

            this.state.fileName = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.state.fileDataURL = e.target.result;
                try {
                    const exifObj = piexif.load(this.state.fileDataURL);
                    this.state.originalExifObj = exifObj;
                    if (exifObj['GPS'] && Object.keys(exifObj['GPS']).length > 0) {
                        this.state.exifStatus = "WARNING: REAL GPS DATA FOUND!";
                    } else {
                        this.state.exifStatus = "CLEAN: NO GPS DATA YET.";
                    }
                } catch (err) {
                    this.state.originalExifObj = { "0th":{}, "Exif":{}, "GPS":{}, "1st":{}, "thumbnail":null };
                    this.state.exifStatus = "NO EXIF. READY TO INJECT.";
                }
                this.render();
            };
            reader.readAsDataURL(file);
        }
    },

    decimalToDMS(decimal) {
        const absDecimal = Math.abs(decimal);
        const degrees = Math.floor(absDecimal);
        const minutesFloat = (absDecimal - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const seconds = Math.round((minutesFloat - minutes) * 60 * 100);
        return [[degrees, 1], [minutes, 1], [seconds, 100]];
    },

    injectExif() {
        if(!this.state.fileDataURL) {
            if(this.sys) this.sys.toast("Upload a target image first.", "error");
            return;
        }

        const lat = parseFloat(this.state.lat);
        const lng = parseFloat(this.state.lng);

        if (isNaN(lat) || isNaN(lng)) {
            if(this.sys) this.sys.toast("Please enter valid coordinates.", "error");
            return;
        }

        try {
            const gps = {};
            gps[piexif.GPSIFD.GPSLatitudeRef] = lat < 0 ? 'S' : 'N';
            gps[piexif.GPSIFD.GPSLatitude] = this.decimalToDMS(lat);
            gps[piexif.GPSIFD.GPSLongitudeRef] = lng < 0 ? 'W' : 'E';
            gps[piexif.GPSIFD.GPSLongitude] = this.decimalToDMS(lng);

            const newExifObj = this.state.originalExifObj;
            newExifObj['GPS'] = gps;
            const exifBytes = piexif.dump(newExifObj);
            const newImageData = piexif.insert(exifBytes, this.state.fileDataURL);

            // Convert Base64 DataURL to Blob for Hybrid Compatibility
            const arr = newImageData.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while(n--){ u8arr[n] = bstr.charCodeAt(n); }
            const blob = new Blob([u8arr], {type:mime});

            this.saveToDevice(blob, "SPOOFED_" + this.state.fileName, mime);

            if(this.sys) this.sys.toast("SUCCESS! LOCATION INJECTED.", "success");
        } catch (e) {
            if(this.sys) this.sys.toast("Error injecting Exif.", "error");
            console.error(e);
        }
    },

    setLoc(lat, lng) {
        this.state.lat = lat;
        this.state.lng = lng;
        this.render();
    },

    render() {
        const { currentView } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMainApp();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 85px; padding-bottom: 85px;
                    scrollbar-width: none; -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }

                .content-limit {
                    width: 100%; max-width: 1020px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                }

                .card-transparent {
                    background: transparent;
                    border: 2px solid var(--prm);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 0 25px rgba(37, 99, 235, 0.15);
                    width: 100%;
                }

                .btn {
                    background: #2563eb; color: #ffffff; border: none;
                    padding: 14px 28px; border-radius: 12px; cursor: pointer;
                    font-weight: 700; transition: transform 0.2s;
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.95); }

                /* INPUT BLUE TEXT RULE */
                .cyber-input {
                    background: rgba(37, 99, 235, 0.05);
                    border: 1px solid var(--prm);
                    color: #38bdf8; /* Blue Text Wajib */
                    font-family: monospace;
                    padding: 16px 20px;
                    border-radius: 12px;
                    width: 100%;
                    outline: none;
                    transition: all 0.3s;
                }
                .cyber-input::placeholder { color: rgba(56, 189, 248, 0.5); }
                .cyber-input:focus { box-shadow: 0 0 10px rgba(37, 99, 235, 0.4); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .drop-zone {
                    border: 2px dashed var(--prm);
                    border-radius: 16px;
                    padding: 40px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                }
                .drop-zone:hover { background: rgba(37, 99, 235, 0.1); }
            </style>
        `;
        this.bindEvents();
    },

    renderLander() {
        return `
            <div style="max-width: 800px; width: 100%; text-align: center;">
                <div style="background: rgba(37, 99, 235, 0.1); color: var(--prm); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid var(--prm); display: inline-block; margin-bottom: 24px;">GEO MASK V2.0</div>

                <h1 style="font-size: 2.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 24px; color: var(--prm);">
                    SPOOF LOCATION.<br>
                    CREATE DIGITAL ALIBI.
                </h1>

                <p style="font-size: 1.1rem; color: var(--txt-dim); margin-bottom: 40px; line-height: 1.6;">
                    Privacy isn't about hiding, it's about controlling disinformation. Erase original GPS coordinates from your photos and inject fake ones (Paris, Bali) into EXIF metadata directly from your browser.
                </p>

                <button id="start-app-btn" class="btn" style="width: 100%; max-width: 300px; padding: 18px; font-size: 1.1rem;">LAUNCH ENGINE</button>
            </div>
        `;
    },

    renderMainApp() {
        if (!this.state.piexifLoaded) {
            return `<h2 style="color: var(--prm); text-align: center;">LOADING ENGINE...</h2>`;
        }

        let mainArea = '';
        if (!this.state.fileDataURL) {
            mainArea = `
                <div class="drop-zone card-transparent">
                    <input type="file" id="fileInput" accept="image/jpeg, image/jpg" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10;">
                    <div style="color: var(--prm); font-size: 40px; margin-bottom: 10px;">➔</div>
                    <h3 style="font-weight: 900; font-size: 1.5rem; color: var(--prm);">UPLOAD TARGET</h3>
                    <p style="font-family: monospace; font-size: 0.85rem; color: var(--txt-dim); margin-top: 8px;">Format: JPG/JPEG Only</p>
                </div>
            `;
        } else {
            mainArea = `
                <div class="card-transparent" style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
                    <img src="${this.state.fileDataURL}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px; border: 1px solid var(--prm);">
                    <div style="flex: 1; overflow: hidden;">
                        <p style="font-weight: bold; color: var(--prm); font-size: 1.1rem; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${this.state.fileName}</p>
                        <p style="font-family: monospace; font-size: 0.75rem; color: #ef4444; margin-top: 4px;">${this.state.exifStatus}</p>
                    </div>
                    <button id="btn-reset" style="background: transparent; border: 1px solid var(--err); color: var(--err); border-radius: 8px; padding: 8px; cursor: pointer;">RESET</button>
                </div>

                <div class="card-transparent" style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div>
                            <label style="font-size: 0.75rem; font-weight: bold; color: var(--prm); display: block; margin-bottom: 8px;">LATITUDE (DECIMAL)</label>
                            <input type="number" id="lat-input" class="cyber-input" value="${this.state.lat}" placeholder="-6.2088" step="any">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; font-weight: bold; color: var(--prm); display: block; margin-bottom: 8px;">LONGITUDE (DECIMAL)</label>
                            <input type="number" id="lng-input" class="cyber-input" value="${this.state.lng}" placeholder="106.8456" step="any">
                        </div>
                    </div>

                    <label style="font-size: 0.75rem; font-weight: bold; color: var(--txt-dim); display: block; margin-bottom: 12px;">QUICK JUMP PRESETS</label>
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;">
                        <button class="preset-btn btn" style="font-size: 0.75rem; padding: 8px 16px; white-space: nowrap; opacity: 1;" data-lat="48.8584" data-lng="2.2945">🇫🇷 Paris</button>
                        <button class="preset-btn btn" style="font-size: 0.75rem; padding: 8px 16px; white-space: nowrap; opacity: 1;" data-lat="35.6586" data-lng="139.7454">🇯🇵 Tokyo</button>
                        <button class="preset-btn btn" style="font-size: 0.75rem; padding: 8px 16px; white-space: nowrap; opacity: 1;" data-lat="40.7580" data-lng="-73.9855">🇺🇸 NY</button>
                        <button class="preset-btn btn" style="font-size: 0.75rem; padding: 8px 16px; white-space: nowrap; opacity: 1;" data-lat="-8.4095" data-lng="115.1889">🇮🇩 Bali</button>
                    </div>
                </div>

                <button id="btn-inject" class="btn" style="width: 100%; padding: 18px; font-size: 1.1rem; box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);">
                    INJECT FAKE LOCATION
                </button>
            `;
        }

        return `<div style="width: 100%; max-width: 600px;">${mainArea}</div>`;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, .card-transparent').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const startBtn = root.querySelector('#start-app-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.state.isFirstVisit = false;
                this.state.currentView = 'main';
                localStorage.setItem('app_visited_geo_mask', 'true');
                this.render();
            });
        }

        const fileInput = root.querySelector('#fileInput');
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFile(e.target));

        const btnReset = root.querySelector('#btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                this.state.fileDataURL = null;
                this.state.fileName = '';
                this.state.originalExifObj = null;
                this.render();
            });
        }

        const latInput = root.querySelector('#lat-input');
        const lngInput = root.querySelector('#lng-input');
        if (latInput) latInput.addEventListener('input', (e) => this.state.lat = e.target.value);
        if (lngInput) lngInput.addEventListener('input', (e) => this.state.lng = e.target.value);

        root.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setLoc(btn.getAttribute('data-lat'), btn.getAttribute('data-lng'));
            });
        });

        const btnInject = root.querySelector('#btn-inject');
        if (btnInject) btnInject.addEventListener('click', () => this.injectExif());
    }
})