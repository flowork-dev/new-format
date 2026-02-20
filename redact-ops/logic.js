({
    state: {
        appName: 'redact-ops',
        currentView: 'lander',

        imgObj: null,
        imgSrc: null,
        imgMeta: { w: 0, h: 0 },

        boxes: [],
        history: [],
        selectedId: null,
        activeTool: 'pixelate',

        zoom: 1,
        pan: { x: 0, y: 0 },
        isDragging: false,
        isResizing: false,
        isDrawing: false,
        dragStart: { x: 0, y: 0 },

        themes: {
            dark: {
                '--bg-root': 'transparent',
                '--surface-1': '#1e1f22',
                '--surface-2': '#2b2d31',
                '--txt-high': '#ffffff',
                '--txt-med': '#b5bac1',
                '--prm': '#5865F2',
                '--prm-con': '#404eed',
                '--brd': 'rgba(255, 255, 255, 0.15)',
                '--shadow': '0 4px 20px rgba(0,0,0,0.3)'
            },
            light: {
                '--bg-root': 'transparent',
                '--surface-1': '#ffffff',
                '--surface-2': '#f0f2f5',
                '--txt-high': '#060607',
                '--txt-med': '#4e5058',
                '--prm': '#5865F2',
                '--prm-con': '#e0e2fc',
                '--brd': 'rgba(0, 0, 0, 0.1)',
                '--shadow': '0 4px 20px rgba(0,0,0,0.1)'
            }
        }
    },

    sys: null,
    observer: null,
    resizeObserver: null,

    mount(sys) {
        this.sys = sys;
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

        // Auto-Resize Handler
        this.resizeObserver = new ResizeObserver(() => {
            if (this.state.currentView === 'editor' && this.state.imgObj) {
                // Opsional: re-center saat resize
            }
        });
        this.resizeObserver.observe(this.sys.root);

        this.bindGlobalEvents();
    },

    unmount() {
        if (this.observer) this.observer.disconnect();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.state.themes[t] || this.state.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    // --- LOGIC ---

    handleFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.sys.toast('File harus gambar!', 'error');
            return;
        }

        this.sys.toast('Memuat...', 'info');
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.state.imgObj = img;
                this.state.imgSrc = img.src;
                this.state.imgMeta = { w: img.width, h: img.height };
                this.state.boxes = [];
                this.state.pan = { x: 0, y: 0 }; // Reset Pan
                this.state.currentView = 'editor';

                // 1. Render dulu biar container ada
                this.render();

                // 2. Hitung Zoom Fit
                setTimeout(() => {
                    const stage = this.sys.root.querySelector('#editor-stage');
                    if(stage) {
                        const { width, height } = stage.getBoundingClientRect();
                        const scaleW = (width - 40) / img.width;
                        const scaleH = (height - 40) / img.height;
                        this.state.zoom = Math.min(scaleW, scaleH, 1); // Fit to screen
                        this.renderEditorOverlay(); // Update visual
                    }
                }, 100);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    undo() {
        if (this.state.boxes.length > 0) {
            this.state.boxes.pop();
            this.renderEditorOverlay();
        }
    },

    exportImage() {
        this.sys.toast('Processing...', 'info');
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const { imgObj, boxes, imgMeta } = this.state;

            canvas.width = imgMeta.w;
            canvas.height = imgMeta.h;
            ctx.drawImage(imgObj, 0, 0);

            boxes.forEach(box => {
                const { x, y, w, h, type } = box;
                ctx.save();
                ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

                if (type === 'pixelate') {
                    const size = Math.max(10, w * 0.05);
                    const wS = Math.max(1, w/size), hS = Math.max(1, h/size);
                    const tC = document.createElement('canvas');
                    tC.width = wS; tC.height = hS;
                    tC.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, wS, hS);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(tC, 0, 0, wS, hS, x, y, w, h);
                    ctx.imageSmoothingEnabled = true;
                } else if (type === 'blur') {
                    ctx.filter = 'blur(20px)'; ctx.drawImage(canvas, 0, 0); ctx.filter = 'none';
                } else if (type === 'blackout') {
                    ctx.fillStyle = '#000'; ctx.fill();
                } else if (type === 'text') {
                    ctx.fillStyle = 'red'; ctx.font = 'bold 40px sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('CENSORED', x + w/2, y + h/2);
                }
                ctx.restore();
            });

            const link = document.createElement('a');
            link.download = `redacted_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
            this.sys.toast('Saved!', 'success');
        }, 50);
    },

    // --- UI ---

    render() {
        const { currentView } = this.state;
        const html = currentView === 'lander' ? this.renderLander() : this.renderEditor();

        // FIX: Layout pakai Flex Column & Height 100% (bukan 100dvh)
        this.sys.root.innerHTML = `
            <div class="app-root">
                ${html}
            </div>
            <style>
                .app-root {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    background: var(--bg-root);
                    color: var(--txt-high);
                    font-family: sans-serif;
                    overflow: hidden; position: relative;
                }

                /* COMMON */
                .flex-center { display: flex; align-items: center; justify-content: center; height: 100%; }
                .fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

                /* LANDER */
                .lander-card {
                    background: var(--surface-1); border: 1px solid var(--brd);
                    border-radius: 20px; padding: 40px; text-align: center;
                    max-width: 400px; width: 90%; box-shadow: var(--shadow);
                }
                .btn-main {
                    background: var(--prm); color: #fff; border: none;
                    padding: 12px 24px; border-radius: 50px; font-weight: bold;
                    cursor: pointer; width: 100%; margin-top: 20px;
                }

                /* EDITOR LAYOUT */
                #editor-stage {
                    flex: 1; /* Ambil sisa space */
                    position: relative;
                    overflow: hidden;
                    background-image: radial-gradient(var(--brd) 1px, transparent 1px);
                    background-size: 20px 20px;
                    display: flex; align-items: center; justify-content: center; /* CSS Centering */
                }

                #img-wrapper {
                    position: relative;
                    /* Transform handle by JS */
                    transform-origin: center center;
                    box-shadow: 0 0 50px rgba(0,0,0,0.5);
                }

                #base-image {
                    display: block; max-width: none; pointer-events: none;
                }

                /* TOOLBAR (Floating) */
                .toolbar-container {
                    position: absolute; bottom: 30px; left: 0; width: 100%;
                    display: flex; justify-content: center; z-index: 1000; pointer-events: none;
                }
                .toolbar {
                    background: var(--surface-1); border: 1px solid var(--brd);
                    padding: 8px; border-radius: 100px;
                    display: flex; gap: 8px; pointer-events: auto;
                    box-shadow: var(--shadow);
                }
                .t-btn {
                    width: 48px; height: 48px; border-radius: 50%;
                    border: none; background: transparent;
                    color: var(--txt-med); cursor: pointer;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    font-size: 9px; font-weight: bold;
                }
                .t-btn svg { width: 20px; height: 20px; margin-bottom: 2px; }
                .t-btn.active { background: var(--prm-con); color: var(--prm); }
                .t-btn:hover { background: var(--surface-2); }

                /* HEADER */
                .top-bar {
                    position: absolute; top: 0; left: 0; width: 100%;
                    padding: 15px; display: flex; justify-content: space-between;
                    z-index: 1000; pointer-events: none;
                }
                .back-btn {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: var(--surface-1); border: 1px solid var(--brd);
                    color: var(--txt-high); cursor: pointer; pointer-events: auto;
                    display: flex; align-items: center; justify-content: center;
                }

                /* OVERLAYS */
                .redaction-box {
                    position: absolute; cursor: grab;
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.5);
                }
                .redaction-box.selected { border: 2px solid var(--prm); z-index: 10; }
                .redaction-box.pixelate { background: rgba(0,0,0,0.2); backdrop-filter: grayscale(1); }
                .redaction-box.blur { backdrop-filter: blur(10px); }
                .redaction-box.blackout { background: #000; }
                .resize-handle {
                    position: absolute; bottom: -8px; right: -8px; width: 16px; height: 16px;
                    background: var(--prm); border: 2px solid #fff; border-radius: 50%;
                }
            </style>
        `;

        if (currentView === 'editor') {
            this.renderEditorOverlay();
            this.bindEditorEvents();
        } else {
            this.bindLanderEvents();
        }
    },

    renderLander() {
        return `
            <div class="flex-center">
                <div class="lander-card fade-in">
                    <h1 style="margin:0 0 10px;">Redact Ops</h1>
                    <p style="color:var(--txt-med); margin-bottom:20px;">Secure Image Censorship</p>
                    <button id="btn-up" class="btn-main">Open Image</button>
                    <input type="file" id="f-inp" hidden accept="image/*">
                </div>
            </div>
        `;
    },

    renderEditor() {
        return `
            <div class="top-bar">
                <button id="btn-back" class="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div style="background:var(--surface-1); padding:5px 12px; border-radius:20px; font-weight:bold; border:1px solid var(--brd);">
                    ${Math.round(this.state.zoom * 100)}%
                </div>
            </div>

            <div id="editor-stage">
                <div id="img-wrapper">
                    <img id="base-image" src="${this.state.imgSrc}">
                    <div id="overlay-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                </div>
            </div>

            <div class="toolbar-container fade-in">
                <div class="toolbar">
                    <button class="t-btn ${this.state.activeTool==='pan'?'active':''}" data-tool="pan">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M15 19l-3 3-3-3M9 9h6v6H9z"/></svg>
                        <span>Pan</span>
                    </button>
                    <button class="t-btn ${this.state.activeTool==='pixelate'?'active':''}" data-tool="pixelate">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8v8H8z"/></svg>
                        <span>Pixel</span>
                    </button>
                    <button class="t-btn ${this.state.activeTool==='blur'?'active':''}" data-tool="blur">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>Blur</span>
                    </button>
                    <button class="t-btn ${this.state.activeTool==='blackout'?'active':''}" data-tool="blackout">
                        <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        <span>Block</span>
                    </button>
                    <div style="width:1px; background:var(--brd); margin:0 5px;"></div>
                    <button id="btn-undo" class="t-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
                        <span>Undo</span>
                    </button>
                    <button id="btn-save" class="t-btn" style="color:var(--prm)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderEditorOverlay() {
        const wrap = this.sys.root.querySelector('#img-wrapper');
        const overlay = this.sys.root.querySelector('#overlay-layer');
        if(wrap) {
            // Apply Zoom & Pan
            wrap.style.transform = `translate(${this.state.pan.x}px, ${this.state.pan.y}px) scale(${this.state.zoom})`;
        }
        if(overlay) {
            overlay.innerHTML = this.state.boxes.map(b => `
                <div class="redaction-box ${b.type} ${this.state.selectedId===b.id?'selected':''}"
                     style="left:${b.x}px; top:${b.y}px; width:${b.w}px; height:${b.h}px;"
                     data-id="${b.id}">
                     ${this.state.selectedId===b.id ? '<div class="resize-handle" data-id="'+b.id+'"></div>' : ''}
                </div>
            `).join('');
        }
    },

    bindLanderEvents() {
        const btn = this.sys.root.querySelector('#btn-up');
        const inp = this.sys.root.querySelector('#f-inp');
        if(btn) btn.onclick = () => inp.click();
        if(inp) inp.onchange = (e) => this.handleFileSelect(e.target.files[0]);
    },

    bindEditorEvents() {
        this.sys.root.querySelectorAll('.t-btn[data-tool]').forEach(b => {
            b.onclick = () => {
                this.state.activeTool = b.dataset.tool;
                this.state.selectedId = null;
                this.render();
            };
        });
        this.sys.root.querySelector('#btn-back').onclick = () => {
            this.state.currentView='lander'; this.render();
        };
        this.sys.root.querySelector('#btn-undo').onclick = () => this.undo();
        this.sys.root.querySelector('#btn-save').onclick = () => this.exportImage();

        // Canvas Interaction
        const stage = this.sys.root.querySelector('#editor-stage');
        const wrapper = this.sys.root.querySelector('#img-wrapper');

        const getCoords = (e) => {
            const rect = wrapper.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (cx - rect.left) / this.state.zoom,
                y: (cy - rect.top) / this.state.zoom,
                absX: cx, absY: cy
            };
        };

        const onDown = (e) => {
            if(e.target.closest('.toolbar') || e.target.closest('.top-bar')) return;
            e.preventDefault();
            const c = getCoords(e);

            if(this.state.activeTool === 'pan') {
                this.state.isDragging = true;
                this.state.dragStart = { x: c.absX, y: c.absY, px: this.state.pan.x, py: this.state.pan.y };
            } else {
                // Drawing / Selecting
                if(e.target.classList.contains('redaction-box')) {
                    // Select existing (Not implemented full drag move for simplicity, just re-select)
                    this.state.selectedId = parseInt(e.target.dataset.id);
                    this.renderEditorOverlay();
                } else {
                    // Start Drawing
                    this.state.isDrawing = true;
                    this.state.newBox = { x: c.x, y: c.y };
                    this.state.selectedId = null;
                }
            }
        };

        const onMove = (e) => {
            if(this.state.activeTool === 'pan' && this.state.isDragging) {
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = cx - this.state.dragStart.x;
                const dy = cy - this.state.dragStart.y;
                this.state.pan.x = this.state.dragStart.px + dx;
                this.state.pan.y = this.state.dragStart.py + dy;
                this.renderEditorOverlay();
            } else if (this.state.isDrawing) {
                const c = getCoords(e);
                const w = c.x - this.state.newBox.x;
                const h = c.y - this.state.newBox.y;

                // Temp Draw
                let box = this.state.boxes[this.state.boxes.length - 1];
                if(!box || !box.isTemp) {
                    box = { id: Date.now(), type: this.state.activeTool, x: this.state.newBox.x, y: this.state.newBox.y, w:0, h:0, isTemp: true };
                    this.state.boxes.push(box);
                }
                box.w = w; box.h = h;
                // Normalize negative width/height
                if(w < 0) { box.x = c.x; box.w = Math.abs(w); }
                if(h < 0) { box.y = c.y; box.h = Math.abs(h); }

                this.renderEditorOverlay();
            }
        };

        const onUp = () => {
            this.state.isDragging = false;
            if(this.state.isDrawing) {
                this.state.isDrawing = false;
                const box = this.state.boxes[this.state.boxes.length - 1];
                if(box) {
                    if(box.w < 5 || box.h < 5) this.state.boxes.pop(); // Too small
                    else delete box.isTemp;
                }
                this.renderEditorOverlay();
            }
        };

        stage.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        stage.addEventListener('touchstart', onDown);
        window.addEventListener('touchmove', onMove);
        window.addEventListener('touchend', onUp);

        // Zoom Wheel
        stage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const d = e.deltaY > 0 ? 0.9 : 1.1;
            this.state.zoom = Math.max(0.1, Math.min(5, this.state.zoom * d));
            this.renderEditorOverlay();
        });
    },

    bindGlobalEvents() {
        this.handleResize = () => {
            // Auto recenter logic could go here
        };
        window.addEventListener('resize', this.handleResize);
    }
})