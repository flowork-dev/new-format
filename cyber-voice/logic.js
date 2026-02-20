({
    state: {
        isFirstVisit: true,
        currentView: 'main',
        activeModal: null,
        presets: { pitch: 0.75, bass: 10, robot: 0.79, noise: 0, scale: 1.0, posX: 0, posY: 0, speed: 1.0, watermark: true },
        format: 'youtube', // Default YouTube (16:9)
        resolution: 1
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Wajib sinkron dengan OS)
    themes: {
        dark: {
            '--bg-root': '#0f172a',
            '--glass': 'rgba(15, 23, 42, 0.85)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8',
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': '#f1f5f9',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_cybervoice');
        if (!hasVisited) localStorage.setItem('app_visited_cybervoice', 'true');

        this.render();

        this.blobStore.init();
        this.engine.init(this);
        this.visuals.init(this);
        this.registerThemes();

        if(window.lucide) window.lucide.createIcons();
        else {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => { if(window.lucide) window.lucide.createIcons(); };
            document.head.appendChild(s);
        }

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
        setTimeout(() => this.engine.updateCanvasSize(), 300);
    },

    unmount() {
        this.engine.stop();
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    // --- PROTOKOL DOWNLOAD HYBRID ---
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

    render() {
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">

                <div id="canvas-stage-area" class="canvas-stage-area">
                    <div id="canvas-stage" style="transform-origin: center; transition: transform 0.1s ease-out; position:relative;">
                        <div id="canvas-wrapper" class="glass-panel" style="padding:0; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#050505; border: 1px solid var(--prm); box-shadow: 0 0 50px rgba(0,0,0,0.8);">
                            <div id="canvas-placeholder" style="position:absolute; color:var(--txt-dim); font-family:monospace; font-size:12px; font-weight:bold; letter-spacing:2px; display:flex; flex-direction:column; align-items:center; opacity:0.6; pointer-events:none;">
                                <i data-lucide="monitor" style="width:40px; height:40px; margin-bottom:10px;"></i> SYSTEM STANDBY...
                            </div>
                            <canvas id="main-canvas" style="z-index:10; width:100%; height:100%; object-fit:contain; display:block; pointer-events:none;"></canvas>

                            <div id="render-progress" style="position:absolute; bottom:15px; left:15px; right:15px; z-index:30; display:none; background:rgba(0,0,0,0.8); padding:10px; border-radius:8px; border:1px solid var(--prm);">
                                <div style="font-size:10px; color:var(--prm); font-family:monospace; display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;">
                                    <span class="animate-pulse">RENDERING PROTOCOL...</span>
                                    <span id="progress-text">0%</span>
                                </div>
                                <div style="width:100%; height:6px; background:var(--surface); border-radius:3px; overflow:hidden;">
                                    <div id="progress-bar" style="height:100%; background:var(--prm); width:0%; transition: width 0.2s;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="zoom-controls non-draggable">
                    <button id="btn-zoom-reset" class="glass-panel" style="padding:10px; border-radius:50%; cursor:pointer; color:var(--prm); border:var(--glass-border); display:flex; justify-content:center; align-items:center; width:45px; height:45px;" title="Reset View">
                        <i data-lucide="maximize"></i>
                    </button>
                    <div id="zoom-label" class="glass-panel" style="padding:5px 0; border-radius:12px; font-size:10px; font-weight:bold; text-align:center; font-family:monospace;">100%</div>
                </div>

                <div class="floating-dock glass-panel non-draggable">
                    <button class="tool-btn" data-modal="inject">
                        <div class="icon-wrap"><i data-lucide="folder-input"></i></div><span>SOURCES</span>
                    </button>
                    <button class="tool-btn" data-modal="tuner">
                        <div class="icon-wrap"><i data-lucide="sliders"></i></div><span>TUNER</span>
                    </button>
                    <button class="tool-btn" data-modal="visual">
                        <div class="icon-wrap"><i data-lucide="move"></i></div><span>VISUALS</span>
                    </button>
                    <button class="tool-btn" data-modal="format">
                        <div class="icon-wrap"><i data-lucide="monitor-smartphone"></i></div><span>FORMAT</span>
                    </button>

                    <div style="width: 1px; height: 36px; background: var(--brd); flex-shrink: 0; margin: 0 10px;"></div>

                    <button class="btn btn-outline" id="btn-preview" style="flex-shrink: 0; white-space: nowrap;"><i data-lucide="eye"></i> TEST</button>
                    <button class="btn btn-solid" id="btn-render" style="flex-shrink: 0; white-space: nowrap;"><i data-lucide="aperture"></i> RENDER</button>
                </div>

                <div id="modal-overlay" class="modal-overlay non-draggable" style="display:none;">
                    <div id="modal-inject" class="glass-panel modal-box" style="display:none;">
                        <button class="modal-close"><i data-lucide="x" style="pointer-events:none;"></i></button>
                        <div class="modal-title"><i data-lucide="folder-input"></i> INJECT SOURCES</div>
                        <div class="file-box">
                            <i data-lucide="music" style="color:var(--prm);"></i>
                            <div style="flex:1; overflow:hidden;">
                                <div style="font-size:10px; color:var(--txt-dim); font-family:monospace;">AUDIO FILE</div>
                                <div id="lbl-audio" style="font-size:12px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Select File...</div>
                            </div>
                            <input type="file" id="file-audio" accept="audio/*">
                        </div>
                        <button id="btn-mic" class="btn btn-outline" style="width:100%; justify-content:center; margin-bottom:15px; font-family:monospace;">
                            <i data-lucide="mic"></i> <span id="mic-text">ACTIVATE MICROPHONE</span>
                        </button>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <div class="file-box" style="flex-direction:column; text-align:center; padding:15px;">
                                <i data-lucide="user" style="color:var(--scs); margin-bottom:5px;"></i>
                                <span style="font-size:10px; font-family:monospace;">MASK IMAGE</span>
                                <input type="file" id="file-img" accept="image/*">
                            </div>
                            <div class="file-box" style="flex-direction:column; text-align:center; padding:15px;">
                                <i data-lucide="film" style="color:var(--err); margin-bottom:5px;"></i>
                                <span style="font-size:10px; font-family:monospace;">BG MEDIA</span>
                                <input type="file" id="file-bg" accept="image/*,video/*">
                            </div>
                        </div>
                    </div>

                    <div id="modal-tuner" class="glass-panel modal-box" style="display:none;">
                        <button class="modal-close"><i data-lucide="x" style="pointer-events:none;"></i></button>
                        <div class="modal-title"><i data-lucide="sliders"></i> VOCAL TUNER</div>
                        <div class="input-group">
                            <label><span>PITCH SHIFT</span><span id="set-pitch-val">0.75</span></label>
                            <input type="range" id="set-pitch" min="0.5" max="0.9" step="0.01" value="0.75">
                        </div>
                        <div class="input-group">
                            <label><span style="color:var(--scs);">BASS BOOST</span><span id="set-bass-val" style="color:var(--scs);">10</span></label>
                            <input type="range" id="set-bass" min="0" max="40" step="1" value="10">
                        </div>
                        <div class="input-group">
                            <label><span style="color:var(--err);">ROBOT DELAY</span><span id="set-robot-val" style="color:var(--err);">0.79</span></label>
                            <input type="range" id="set-robot" min="0" max="0.95" step="0.01" value="0.79">
                        </div>
                        <div class="input-group">
                            <label><span style="color:var(--txt-dim);">SIGNAL NOISE</span><span id="set-noise-val">0</span></label>
                            <input type="range" id="set-noise" min="0" max="0.2" step="0.01" value="0">
                        </div>

                        <div class="input-group" style="margin-top:25px; border-top:1px solid var(--brd); padding-top:20px;">
                            <button id="btn-reset-tuner" class="btn btn-outline" style="width:100%; justify-content:center; border-color:var(--err); color:var(--err);">
                                <i data-lucide="rotate-ccw"></i> RESET DEFAULT
                            </button>
                        </div>
                    </div>

                    <div id="modal-visual" class="glass-panel modal-box" style="display:none;">
                        <button class="modal-close"><i data-lucide="x" style="pointer-events:none;"></i></button>
                        <div class="modal-title"><i data-lucide="move"></i> VISUAL PROTOCOLS</div>
                        <div class="input-group">
                            <label>SELECT PROTOCOL</label>
                            <select id="sel-theme" style="font-family:monospace; font-weight:bold; font-size:12px;"></select>
                        </div>
                        <div class="input-group" style="margin-top:20px;">
                            <label>SYSTEM WATERMARK</label>
                            <button id="btn-watermark" class="btn" style="width:100%; justify-content:center; background:var(--surface); border:1px solid var(--brd); color:var(--scs);">ON</button>
                        </div>

                        <div class="input-group" style="margin-top:25px; border-top:1px solid var(--brd); padding-top:20px;">
                            <button id="btn-reset-visual" class="btn btn-outline" style="width:100%; justify-content:center; border-color:var(--err); color:var(--err);">
                                <i data-lucide="rotate-ccw"></i> RESET DEFAULT
                            </button>
                        </div>
                    </div>

                    <div id="modal-format" class="glass-panel modal-box" style="display:none;">
                        <button class="modal-close"><i data-lucide="x" style="pointer-events:none;"></i></button>
                        <div class="modal-title"><i data-lucide="monitor-smartphone"></i> OUTPUT FORMAT</div>

                        <label style="font-size:10px; font-family:monospace; color:var(--txt-dim); margin-bottom:10px; display:block;">ASPECT RATIO</label>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
                            <button class="btn fmt-btn" data-val="youtube" style="justify-content:center; flex-direction:column; background:var(--surface); border:1px solid var(--prm); padding:15px;"><i data-lucide="monitor"></i> YOUTUBE (16:9)</button>
                            <button class="btn fmt-btn" data-val="tiktok" style="justify-content:center; flex-direction:column; background:var(--surface); border:1px solid var(--brd); padding:15px;"><i data-lucide="smartphone"></i> TIKTOK (9:16)</button>
                        </div>

                        <label style="font-size:10px; font-family:monospace; color:var(--txt-dim); margin-bottom:10px; display:block;">RESOLUTION</label>
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                            <button class="btn res-btn" data-val="1" style="justify-content:center; background:var(--surface); border:1px solid var(--prm); font-size:10px;">720p</button>
                            <button class="btn res-btn" data-val="1.5" style="justify-content:center; background:var(--surface); border:1px solid var(--brd); font-size:10px;">1080p</button>
                            <button class="btn res-btn" data-val="3" style="justify-content:center; background:var(--surface); border:1px solid var(--brd); font-size:10px;">4K</button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .app-root {
                    position: relative; width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow: hidden; /* Lock scroll, use pan/zoom */
                }

                .canvas-stage-area {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    display: flex; justify-content: center; align-items: center;
                    overflow: hidden; cursor: grab; z-index: 1;
                    background-image: radial-gradient(var(--surface) 1px, transparent 0);
                    background-size: 30px 30px;
                }
                .canvas-stage-area:active { cursor: grabbing; }

                .glass-panel {
                    background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); box-shadow: var(--shadow);
                }

                /* DOCK MELAYANG DI BAWAH - SCROLLABLE KANAN KIRI */
                .floating-dock {
                    position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
                    width: 95%; max-width: 800px; z-index: 50;
                    border-radius: 24px; padding: 15px 20px;
                    display: flex; align-items: center; gap: 15px;
                    overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
                }
                .floating-dock::-webkit-scrollbar { display: none; }

                .zoom-controls {
                    position: fixed; right: 20px; bottom: 140px; z-index: 50;
                    display: flex; flex-direction: column; gap: 10px;
                }

                @media (max-width: 768px) {
                    .floating-dock { bottom: 60px; }
                    .zoom-controls { bottom: 160px; }
                }

                .btn {
                    padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: monospace;
                    transition: all 0.2s; display:flex; align-items:center; gap:8px; border:none; outline:none; font-size:12px;
                }
                .btn:active { transform: scale(0.95); }
                .btn-outline { background: transparent; border: 1px solid var(--prm); color: var(--prm); }
                .btn-outline:hover { background: var(--prm); color: #fff; }
                .btn-solid { background: var(--prm); color: #fff; }
                .btn-solid:hover { filter: brightness(1.2); box-shadow: 0 0 10px var(--prm); }

                .tool-btn {
                    background: transparent; border: none; color: var(--txt-dim); display: flex; flex-direction: column;
                    align-items: center; gap: 6px; cursor: pointer; padding: 5px 10px; font-size: 10px; font-weight: bold; font-family:monospace; letter-spacing: 1px; transition: 0.2s; border-radius: 12px; flex-shrink: 0;
                }
                .icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: var(--surface); border: 1px solid var(--brd); display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .tool-btn:hover .icon-wrap { border-color: var(--prm); color: var(--prm); background: rgba(56, 189, 248, 0.1); box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
                .tool-btn:hover span { color: var(--prm); }

                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; }
                .modal-box { width: 90%; max-width: 400px; border-radius: 20px; padding: 25px; position: relative; animation: slideUp 0.3s ease-out; }

                .modal-close { position: absolute; top: 20px; right: 20px; background: transparent; border: none; color: var(--txt-dim); cursor: pointer; border-radius: 50%; padding:5px; transition: 0.2s;}
                .modal-close:hover { color: var(--err); background: rgba(239, 68, 68, 0.1); }
                .modal-title { font-size: 16px; font-weight: bold; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; color: var(--prm); border-bottom: 1px solid var(--brd); padding-bottom: 15px; font-family:monospace; letter-spacing: 1px;}

                .input-group { margin-bottom: 20px; }
                .input-group label { display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: var(--txt-dim); margin-bottom: 8px; font-weight:bold; letter-spacing:1px;}
                input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--surface); border: 1px solid var(--brd); border-radius: 2px; outline: none; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--prm); cursor: pointer; box-shadow: 0 0 10px var(--prm); }

                .file-box { background: var(--surface); border: 1px solid var(--brd); border-radius: 12px; padding: 12px 15px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 15px; margin-bottom: 15px; cursor:pointer; transition:0.2s;}
                .file-box input[type=file] { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; z-index: 10; }
                .file-box:hover { border-color: var(--prm); }
                select { width: 100%; background: var(--surface); color: var(--prm); border: 1px solid var(--brd); padding: 12px; border-radius: 12px; outline: none; cursor:pointer; }
                select option { background: var(--glass); color: var(--txt); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        // --- 1. PREVENT CLICK-THROUGH ON UI ELEMENTS ---
        root.querySelectorAll('.non-draggable, button, input, select, .modal-box').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});
            el.addEventListener('wheel', e => e.stopPropagation(), {passive: false});
        });

        // --- 2. ZOOM & PAN SYSTEM (STAGE AREA) ---
        const stageArea = root.querySelector('#canvas-stage-area');
        const stage = root.querySelector('#canvas-stage');
        const zoomLabel = root.querySelector('#zoom-label');

        let zoom = 1.0;
        let pan = { x: 0, y: 0 };
        let isDragging = false;
        let startPan = { x: 0, y: 0 };
        let lastDist = 0;

        const updateTransform = () => {
            stage.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
            if(zoomLabel) zoomLabel.innerText = Math.round(zoom * 100) + '%';
        };

        stageArea.addEventListener('mousedown', (e) => {
            isDragging = true;
            startPan = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        });
        stageArea.addEventListener('mousemove', (e) => {
            if(!isDragging) return;
            e.preventDefault();
            pan = { x: e.clientX - startPan.x, y: e.clientY - startPan.y };
            updateTransform();
        });
        stageArea.addEventListener('mouseup', () => isDragging = false);
        stageArea.addEventListener('mouseleave', () => isDragging = false);

        stageArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            zoom = Math.min(Math.max(0.2, zoom - e.deltaY * 0.001), 3.0);
            updateTransform();
        });

        stageArea.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            } else if (e.touches.length === 1) {
                isDragging = true;
                startPan = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
            }
        }, {passive: false});

        stageArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 2) {
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                zoom = Math.min(Math.max(0.2, zoom + (dist - lastDist) * 0.005), 3.0);
                lastDist = dist;
                updateTransform();
            } else if (isDragging && e.touches.length === 1) {
                pan = { x: e.touches[0].clientX - startPan.x, y: e.touches[0].clientY - startPan.y };
                updateTransform();
            }
        }, {passive: false});

        stageArea.addEventListener('touchend', () => isDragging = false);

        root.querySelector('#btn-zoom-reset').onclick = () => {
            zoom = 1.0; pan = { x: 0, y: 0 };
            updateTransform();
        };

        // --- 3. MODAL LOGIC (PERBAIKAN CLOSE BUTTON) ---
        const overlay = root.querySelector('#modal-overlay');
        const boxes = root.querySelectorAll('.modal-box');

        root.querySelectorAll('.tool-btn').forEach(btn => {
            btn.onclick = () => {
                const target = btn.getAttribute('data-modal');
                boxes.forEach(b => b.style.display = 'none');
                root.querySelector('#modal-' + target).style.display = 'block';
                overlay.style.display = 'flex';
                if(target === 'visual') this.visuals.refreshDropdown(root.querySelector('#sel-theme'));
            };
        });

        // Event listener yang kuat: akan close kalau klik tombol .modal-close atau klik background luarnya (overlay)
        root.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
        });

        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) overlay.style.display = 'none';
        });

        // --- 4. SLIDER BINDINGS ---
        const bindSlider = (id, key) => {
            const el = root.querySelector(id);
            if(el) {
                el.value = this.state.presets[key];
                el.oninput = (e) => {
                    this.state.presets[key] = parseFloat(e.target.value);
                    const label = root.querySelector(`${id}-val`);
                    if(label) label.innerText = e.target.value;
                    this.engine.updateParams();
                };
            }
        };
        bindSlider('#set-pitch', 'pitch');
        bindSlider('#set-bass', 'bass');
        bindSlider('#set-robot', 'robot');
        bindSlider('#set-noise', 'noise');

        // --- 5. FILE INPUTS ---
        root.querySelector('#file-audio').onchange = (e) => {
            if(e.target.files[0]) {
                root.querySelector('#lbl-audio').innerText = e.target.files[0].name;
                this.engine.loadAudioFile(e.target.files[0]);
                this.blobStore.save('audio', e.target.files[0]);
            }
        };
        root.querySelector('#file-img').onchange = (e) => {
            if(e.target.files[0]) {
                this.engine.handleImage(e.target.files[0]);
                this.blobStore.save('image', e.target.files[0]);
            }
        };
        root.querySelector('#file-bg').onchange = (e) => {
            if(e.target.files[0]) {
                this.engine.handleBg(e.target.files[0]);
                this.blobStore.save('bg', e.target.files[0]);
            }
        };

        // --- 6. THEME, WATERMARK, & RESET ---
        root.querySelector('#sel-theme').onchange = (e) => {
            this.visuals.activeThemeId = e.target.value;
            if(!this.engine.isPlaying) this.engine.renderOneShot();
        };

        const wmBtn = root.querySelector('#btn-watermark');
        wmBtn.onclick = () => {
            this.state.presets.watermark = !this.state.presets.watermark;
            wmBtn.innerText = this.state.presets.watermark ? 'ON' : 'OFF';
            wmBtn.style.color = this.state.presets.watermark ? 'var(--scs)' : 'var(--err)';
            if(!this.engine.isPlaying) this.engine.renderOneShot();
        };

        // Tombol Reset Visual Default
        root.querySelector('#btn-reset-visual').onclick = () => {
            this.state.presets.watermark = true;
            this.visuals.activeThemeId = 'hacker';
            wmBtn.innerText = 'ON';
            wmBtn.style.color = 'var(--scs)';
            root.querySelector('#sel-theme').value = 'hacker';
            if(!this.engine.isPlaying) this.engine.renderOneShot();
            if(this.sys && typeof this.sys.toast === 'function') {
                this.sys.toast("Visual protocols reset to default", "success");
            }
        };

        // Tombol Reset Tuner Default
        root.querySelector('#btn-reset-tuner').onclick = () => {
            const defPitch = 0.75;
            const defBass = 10;
            const defRobot = 0.79;
            const defNoise = 0;

            this.state.presets.pitch = defPitch;
            this.state.presets.bass = defBass;
            this.state.presets.robot = defRobot;
            this.state.presets.noise = defNoise;

            const updateS = (id, val) => {
                const el = root.querySelector(id);
                const lbl = root.querySelector(`${id}-val`);
                if(el) el.value = val;
                if(lbl) lbl.innerText = val;
            };

            updateS('#set-pitch', defPitch);
            updateS('#set-bass', defBass);
            updateS('#set-robot', defRobot);
            updateS('#set-noise', defNoise);

            this.engine.updateParams();

            if(this.sys && typeof this.sys.toast === 'function') {
                this.sys.toast("Vocal tuner reset to default", "success");
            }
        };

        // --- 7. BUTTON CONTROLS ---
        const micBtn = root.querySelector('#btn-mic');
        micBtn.onclick = () => this.engine.toggleMic(micBtn);

        const btnPrev = root.querySelector('#btn-preview');
        const btnRend = root.querySelector('#btn-render');
        btnPrev.onclick = () => this.engine.togglePreview(btnPrev, btnRend);
        btnRend.onclick = () => this.engine.startRender(btnPrev, btnRend);

        // --- 8. FORMAT CONTROLS ---
        root.querySelectorAll('.fmt-btn').forEach(btn => {
            btn.onclick = () => {
                this.state.format = btn.getAttribute('data-val');
                root.querySelectorAll('.fmt-btn').forEach(b => b.style.borderColor = 'var(--brd)');
                btn.style.borderColor = 'var(--prm)';
                this.engine.updateCanvasSize();

                zoom = 1.0; pan = { x: 0, y: 0 }; updateTransform();
            };
        });
        root.querySelectorAll('.res-btn').forEach(btn => {
            btn.onclick = () => {
                this.state.resolution = parseFloat(btn.getAttribute('data-val'));
                root.querySelectorAll('.res-btn').forEach(b => b.style.borderColor = 'var(--brd)');
                btn.style.borderColor = 'var(--prm)';
                this.engine.updateCanvasSize();
            };
        });

        // --- 9. AUTO RESTORE FILES ---
        setTimeout(async () => {
            const aud = await this.blobStore.get('audio');
            if(aud) { root.querySelector('#lbl-audio').innerText = aud.name; this.engine.loadAudioFile(aud); }
            const img = await this.blobStore.get('image');
            if(img) this.engine.handleImage(img);
            const bg = await this.blobStore.get('bg');
            if(bg) this.engine.handleBg(bg);
        }, 1000);
    },

    // --- LOCAL CACHE SYSTEM ---
    blobStore: {
        db: null,
        async init() {
            return new Promise(res => {
                const req = indexedDB.open('CyberVoiceOS', 1);
                req.onupgradeneeded = e => { if(!e.target.result.objectStoreNames.contains('files')) e.target.result.createObjectStore('files'); };
                req.onsuccess = e => { this.db = e.target.result; res(); };
                req.onerror = () => res();
            });
        },
        save(k, f) { if(this.db) this.db.transaction('files','readwrite').objectStore('files').put(f, k); },
        get(k) { return new Promise(res => { if(!this.db) return res(null); const r = this.db.transaction('files').objectStore('files').get(k); r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); }); }
    },

    // --- AUDIO & RECORDER ENGINE ---
    engine: {
        app: null, ctx: null, src: null, noiseSrc: null, analyser: null, dest: null,
        mediaRecorder: null, recordedChunks: [],
        micRecorder: null, micChunks: [], isMicRecording: false,
        nodes: { bass: null, robotDelay: null, robotFeedback: null, noiseGain: null },
        audioFile: null, userImage: null, bgAsset: null, bgType: 'none',
        isPlaying: false, isRecording: false, animationId: null, timerInt: null,

        init(app) { this.app = app; },

        loadAudioFile(file) {
            this.audioFile = file;
            this.checkReady();
        },

        handleImage(file) {
            const r = new FileReader();
            r.onload = (e) => {
                this.userImage = new Image(); this.userImage.src = e.target.result;
                this.userImage.onload = () => { this.checkReady(); if(!this.isPlaying) this.renderOneShot(); };
            };
            r.readAsDataURL(file);
        },

        handleBg(file) {
            const isVideo = file.type.startsWith('video');
            const url = URL.createObjectURL(file);
            if (isVideo) {
                if(this.bgAsset && this.bgType === 'video') this.bgAsset.pause();
                this.bgAsset = document.createElement('video');
                this.bgAsset.src = url; this.bgAsset.loop = true; this.bgAsset.muted = true; this.bgAsset.play();
                this.bgType = 'video';
            } else {
                this.bgAsset = new Image(); this.bgAsset.src = url; this.bgType = 'image';
                this.bgAsset.onload = () => { if(!this.isPlaying) this.renderOneShot(); };
            }
        },

        async toggleMic(btn) {
            if(this.isMicRecording) {
                this.micRecorder.stop(); this.isMicRecording = false;
                btn.style.borderColor = 'var(--brd)'; btn.style.color = 'var(--prm)';
                btn.innerHTML = `<i data-lucide="mic"></i> <span>ACTIVATE MICROPHONE</span>`;
                if(window.lucide) window.lucide.createIcons();
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.micRecorder = new MediaRecorder(stream); this.micChunks = [];
                    this.micRecorder.ondataavailable = e => this.micChunks.push(e.data);
                    this.micRecorder.onstop = () => {
                        const blob = new Blob(this.micChunks, { type: 'audio/webm' });
                        const file = new File([blob], "mic_recording.webm", { type: "audio/webm" });
                        this.app.sys.root.querySelector('#lbl-audio').innerText = "Mic Recording";
                        this.loadAudioFile(file);
                        stream.getTracks().forEach(track => track.stop());
                    };
                    this.micRecorder.start(); this.isMicRecording = true;
                    btn.style.borderColor = 'var(--err)'; btn.style.color = 'var(--err)';
                    btn.innerHTML = `<i data-lucide="square"></i> <span>STOP RECORDING</span>`;
                    if(window.lucide) window.lucide.createIcons();
                } catch(e) { if(this.app.sys) this.app.sys.toast("Mic Error: " + e.message, "error"); }
            }
        },

        checkReady() {
            const isReady = this.audioFile && this.userImage;
            if(isReady) {
                this.updateCanvasSize();
                if(!this.isPlaying) this.renderOneShot();
            }
        },

        updateCanvasSize() {
            const cvs = this.app.sys.root.querySelector('#main-canvas');
            const wrp = this.app.sys.root.querySelector('#canvas-wrapper');
            const plc = this.app.sys.root.querySelector('#canvas-placeholder');
            if(!cvs || !wrp) return;

            if(this.audioFile && this.userImage && plc) plc.style.display = 'none';

            let baseW = 1280, baseH = 720;
            if (this.app.state.format === 'tiktok') { baseW = 720; baseH = 1280; }

            cvs.width = baseW * this.app.state.resolution;
            cvs.height = baseH * this.app.state.resolution;

            wrp.style.aspectRatio = this.app.state.format === 'tiktok' ? '9/16' : '16/9';

            if (this.app.state.format === 'tiktok') {
                wrp.style.height = '75vh';
                wrp.style.width = 'auto';
            } else {
                wrp.style.width = '90vw';
                wrp.style.maxWidth = '1000px';
                wrp.style.height = 'auto';
            }

            if(!this.isPlaying) this.renderOneShot();
        },

        updateParams() {
            if(!this.isPlaying) return;
            const p = this.app.state.presets;
            if(this.src) this.src.playbackRate.value = p.pitch;
            if(this.nodes.bass) this.nodes.bass.gain.value = p.bass;
            if(this.nodes.robotFeedback) this.nodes.robotFeedback.gain.value = p.robot;
            if(this.nodes.noiseGain) this.nodes.noiseGain.gain.value = p.noise;
        },

        async togglePreview(btnP, btnR) {
            if(!this.audioFile || !this.userImage) return this.app.sys.toast("Inject Audio and Mask Image first!", "error");
            if(this.isPlaying) { this.stop(btnP, btnR); return; }
            this.isRecording = false;
            if(await this.startAudioChain()) {
                btnP.innerHTML = `<i data-lucide="square"></i> STOP PREVIEW`;
                btnP.style.color = 'var(--err)'; btnP.style.borderColor = 'var(--err)';
                if(window.lucide) window.lucide.createIcons();
            }
        },

        async startRender(btnP, btnR) {
            if(!this.audioFile || !this.userImage) return this.app.sys.toast("Inject Audio and Mask Image first!", "error");
            if(this.isPlaying) this.stop(btnP, btnR);
            this.isRecording = true;

            if(await this.startAudioChain()) {
                const cvs = this.app.sys.root.querySelector('#main-canvas');
                const stream = cvs.captureStream(30);
                const combined = new MediaStream([ ...stream.getVideoTracks(), ...this.dest.stream.getAudioTracks() ]);

                const bitrate = this.app.state.resolution >= 3 ? 15000000 : 5000000;
                const options = { mimeType: 'video/webm; codecs=vp9,opus', videoBitsPerSecond: bitrate, audioBitsPerSecond: 128000 };

                try { this.mediaRecorder = new MediaRecorder(combined, options); }
                catch (e) { this.mediaRecorder = new MediaRecorder(combined, { mimeType: 'video/webm', videoBitsPerSecond: bitrate }); }

                this.recordedChunks = [];
                this.mediaRecorder.ondataavailable = e => { if(e.data.size > 0) this.recordedChunks.push(e.data); };
                this.mediaRecorder.onstop = () => this.saveVideo();
                this.mediaRecorder.start();

                this.app.sys.root.querySelector('#render-progress').style.display = 'block';
                btnR.innerHTML = `PROCESSING...`; btnR.disabled = true; btnP.disabled = true;
            }
        },

        async startAudioChain() {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.dest = this.ctx.createMediaStreamDestination();
                const buf = await this.audioFile.arrayBuffer();
                const audData = await this.ctx.decodeAudioData(buf);
                const totalDur = audData.duration;
                const p = this.app.state.presets;

                this.src = this.ctx.createBufferSource(); this.src.buffer = audData; this.src.playbackRate.value = p.pitch;
                this.nodes.bass = this.ctx.createBiquadFilter(); this.nodes.bass.type = "lowshelf"; this.nodes.bass.frequency.value = 200; this.nodes.bass.gain.value = p.bass;
                this.nodes.robotDelay = this.ctx.createDelay(); this.nodes.robotDelay.delayTime.value = 0.01;
                this.nodes.robotFeedback = this.ctx.createGain(); this.nodes.robotFeedback.gain.value = p.robot;

                const dist = this.ctx.createWaveShaper(); dist.curve = this.makeCurve(50); dist.oversample = '4x';
                const lpf = this.ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 2500;
                const comp = this.ctx.createDynamicsCompressor();

                this.src.connect(this.nodes.bass);
                this.nodes.bass.connect(this.nodes.robotDelay); this.nodes.robotDelay.connect(this.nodes.robotFeedback); this.nodes.robotFeedback.connect(this.nodes.robotDelay);
                this.nodes.bass.connect(dist); this.nodes.robotDelay.connect(dist);
                dist.connect(lpf); lpf.connect(comp);

                const nBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
                const nData = nBuf.getChannelData(0); for(let i=0; i<nBuf.length; i++) nData[i] = Math.random() * 2 - 1;
                this.noiseSrc = this.ctx.createBufferSource(); this.noiseSrc.buffer = nBuf; this.noiseSrc.loop = true; this.noiseSrc.start();
                this.nodes.noiseGain = this.ctx.createGain(); this.nodes.noiseGain.gain.value = p.noise;
                const nFilt = this.ctx.createBiquadFilter(); nFilt.type = 'highpass'; nFilt.frequency.value = 1000;
                this.noiseSrc.connect(nFilt); nFilt.connect(this.nodes.noiseGain);

                this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 2048;
                comp.connect(this.analyser);
                if(!this.isRecording) { comp.connect(this.ctx.destination); this.nodes.noiseGain.connect(this.ctx.destination); }
                comp.connect(this.dest); this.nodes.noiseGain.connect(this.dest);

                this.src.start(0); this.isPlaying = true;
                if(this.bgType === 'video' && this.bgAsset) { this.bgAsset.currentTime = 0; this.bgAsset.play(); }

                if(this.isRecording) {
                    let start = Date.now();
                    const actualDuration = totalDur / p.pitch;
                    this.timerInt = setInterval(() => {
                        let elapsed = (Date.now() - start) / 1000;
                        let percent = Math.min((elapsed / actualDuration) * 100, 100);
                        this.app.sys.root.querySelector('#progress-bar').style.width = percent + '%';
                        this.app.sys.root.querySelector('#progress-text').innerText = Math.floor(percent) + '%';
                    }, 100);
                }

                this.renderVisual();
                this.src.onended = () => {
                    const root = this.app.sys.root;
                    this.stop(root.querySelector('#btn-preview'), root.querySelector('#btn-render'));
                };
                return true;
            } catch(e) { this.app.sys.toast("Core Err: " + e.message, "error"); this.stop(); return false; }
        },

        stop(btnP, btnR) {
            try { if(this.src) this.src.stop(); if(this.noiseSrc) this.noiseSrc.stop(); if(this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop(); if(this.bgAsset && this.bgType === 'video') this.bgAsset.pause(); } catch(e) {}
            clearInterval(this.timerInt); if(this.animationId) cancelAnimationFrame(this.animationId);
            this.isPlaying = false; this.isRecording = false;

            if(btnP) {
                btnP.innerHTML = `<i data-lucide="eye"></i> PREVIEW`;
                btnP.style.color = 'var(--prm)'; btnP.style.borderColor = 'var(--prm)';
                btnP.disabled = false;
            }
            if(btnR) {
                btnR.innerHTML = `<i data-lucide="aperture"></i> RENDER`;
                btnR.disabled = false;
            }
            const prog = this.app.sys.root.querySelector('#render-progress');
            if(prog) { prog.style.display = 'none'; this.app.sys.root.querySelector('#progress-bar').style.width = '0%'; }
            if(window.lucide) window.lucide.createIcons();
        },

        saveVideo() {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            this.app.saveToDevice(blob, `CYBER_VOICE_PROTOCOL_${Date.now()}.webm`, 'video/webm');
        },

        makeCurve(amt) {
            const k = amt, n = 44100, curve = new Float32Array(n), deg = Math.PI / 180;
            for (let i = 0; i < n; ++i) { const x = (i * 2) / n - 1; curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); }
            return curve;
        },

        renderVisual() {
            const cvs = this.app.sys.root.querySelector('#main-canvas'); if(!cvs) return;
            const ctx = cvs.getContext('2d');
            const data = new Uint8Array(this.analyser.frequencyBinCount);
            const draw = () => {
                if(!this.isPlaying) return;
                this.animationId = requestAnimationFrame(draw);
                this.analyser.getByteFrequencyData(data);
                this.app.visuals.render(ctx, cvs.width, cvs.height, data, this.userImage, this.bgAsset);
            };
            draw();
        },

        renderOneShot() {
            const cvs = this.app.sys.root.querySelector('#main-canvas'); if(!cvs) return;
            const ctx = cvs.getContext('2d');
            const data = new Uint8Array(2048).fill(0);
            this.app.visuals.render(ctx, cvs.width, cvs.height, data, this.userImage, this.bgAsset);
        }
    },

    // --- VISUAL & THEME MANAGER (MODIFIKASI ZOOM EFFECT - BASS MULTIPLIER DIKURANGI) ---
    visuals: {
        app: null, themes: {}, activeThemeId: 'hacker', pulseValue: 0, pulseDir: 1,

        init(app) { this.app = app; },

        register(id, name, logic) { this.themes[id] = { name, ...logic }; },

        refreshDropdown(selectEl) {
            if(!selectEl) return;
            selectEl.innerHTML = '';
            Object.keys(this.themes).forEach(key => {
                const opt = document.createElement('option');
                opt.value = key; opt.innerText = this.themes[key].name;
                selectEl.appendChild(opt);
            });
            selectEl.value = this.activeThemeId;
        },

        render(ctx, w, h, data, img, bgImage) {
            if (!ctx) return;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0; ctx.filter = 'none';
            ctx.clearRect(0, 0, w, h);

            let theme = this.themes[this.activeThemeId] || this.themes['hacker'];
            try { ctx.save(); theme.render(ctx, w, h, data, img, bgImage); ctx.restore(); }
            catch (e) { console.error(`Theme Err ${theme.name}:`, e); }
            this.renderWatermark(ctx, w, h);
        },

        renderWatermark(ctx, w, h) {
            if(!this.app.state.presets.watermark) return;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.pulseValue += 0.02 * this.pulseDir;
            if (this.pulseValue > 1) { this.pulseValue = 1; this.pulseDir = -1; }
            if (this.pulseValue < 0.2) { this.pulseValue = 0.2; this.pulseDir = 1; }

            const fontSize = w < 800 ? 12 : 16;
            ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            ctx.fillStyle = `rgba(255, 255, 255, ${this.pulseValue * 0.5})`;
            ctx.fillText("CREATED BY FLOWORK.CLOUD", w / 2, h - 30);
            ctx.restore();
        }
    },

    registerThemes() {
        const tm = this.visuals;

        tm.register('hacker', 'PROTOCOL 1: ANONYMOUS MASK', {
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if (bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, w, h); }
                else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); }
                ctx.fillStyle = '#0F0'; ctx.font = '14px monospace';
                if(Math.random() > 0.7) ctx.fillText(Math.random() > 0.5 ? "1" : "0", Math.random()*w, Math.random()*h);
                ctx.restore();

                let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass /= 30;
                // ZOOM EFFECT DITURUNKAN DARI bass * 4 KE bass * 1.2
                const cx = w/2, cy = h/2; const scale = (w < 800 ? 200 : 400) + (bass * 1.2);

                ctx.save();
                ctx.translate(cx, cy);
                ctx.beginPath(); ctx.strokeStyle = `rgba(84, 215, 246, 0.6)`; ctx.lineWidth = 3; ctx.arc(0, 0, scale/1.8, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, scale/2, 0, Math.PI * 2); ctx.clip();
                if (img) ctx.drawImage(img, -scale/2, -scale/2, scale, scale);
                else { ctx.fillStyle = '#000'; ctx.fill(); ctx.fillStyle = '#0f0'; ctx.textAlign = 'center'; ctx.fillText("NO IMAGE", 0, 0); }
                ctx.restore();
            }
        });

        tm.register('jarvis', 'PROTOCOL 2: JARVIS SYSTEM', {
            render(ctx, w, h, data, img, bgImage) {
                if (bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(0, 20, 40, 0.7)'; ctx.fillRect(0, 0, w, h); }
                else { ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, w, h); }

                const cx = w/2, cy = h/2; const radius = w < 1000 ? 200 : 400;
                const bars = 100; const step = (Math.PI * 2) / bars;

                ctx.beginPath();
                for (let i = 0; i < bars; i++) {
                    const barH = (data[i] / 255) * (radius * 0.8);
                    const angle = i * step;
                    ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
                    ctx.lineTo(cx + Math.cos(angle) * (radius + barH), cy + Math.sin(angle) * (radius + barH));
                }
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = w < 1000 ? 4 : 8; ctx.stroke();

                ctx.beginPath(); ctx.arc(cx, cy, radius - 10, 0, Math.PI*2);
                ctx.fillStyle = `rgba(0, 20, 40, 0.9)`; ctx.fill();
                ctx.strokeStyle = '#706bf3'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = (w < 1000 ? '20px' : '40px') + ' sans-serif'; ctx.textAlign = 'center';
                ctx.fillText("AI PROCESSING", cx, cy + (w < 1000 ? 90 : 180));

                if (img) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius/2.5, 0, Math.PI*2); ctx.clip(); ctx.globalAlpha = 0.8; ctx.drawImage(img, cx-radius/2.5, cy-radius/2.5, radius*0.8, radius*0.8); ctx.restore(); }
            }
        });

        tm.register('coding', 'PROTOCOL 3: LIVE CODING STREAM', {
            lines: [],
            codes: ["sudo root --force", "npm install hack-tool", "decrypting_hash...", "CREATED BY FLOWORK.CLOUD", "ERROR 404: IDENTITY NOT FOUND", "Injecting SQL Database...", "VISIT FLOWORK.CLOUD NOW", "0x1A4F memory_dump", "SYSTEM_OVERRIDE: TRUE", "brute_force_attack.exe", "POWERED BY NEURAL ENGINE"],
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if (bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, w, h); }
                else { ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, w, h); }

                ctx.fillStyle = '#0F0'; ctx.font = (w < 1000 ? '14px' : '20px') + ' "Courier New", monospace';
                if(Math.random() > 0.8) {
                    const text = "> " + this.codes[Math.floor(Math.random()*this.codes.length)];
                    this.lines.push({ x: 20, y: Math.random() * h, text: text, life: 150, speed: Math.random()*1.5 + 0.5, color: text.includes("FLOWORK") ? '#38bdf8' : '#00ff00' });
                }
                this.lines.forEach((l, i) => {
                    ctx.fillStyle = l.color; ctx.globalAlpha = l.life/150; ctx.fillText(l.text, l.x, l.y);
                    l.life -= 1; l.x += l.speed; if(l.life <= 0) this.lines.splice(i,1);
                });
                ctx.globalAlpha = 1.0;

                let bass = 0; for(let i=0; i<30; i++) bass+=data[i]; bass/=30;
                // ZOOM EFFECT DITURUNKAN KE bass * 0.8
                const cx = w/2, cy = h/2; const scale = (w < 800 ? 150 : 300) + (bass * 0.8);

                ctx.beginPath(); ctx.strokeStyle = '#0F0'; ctx.lineWidth = 2; ctx.setLineDash([10, 5]); ctx.arc(cx, cy, scale/1.8 + 20, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
                ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, scale/2, 0, Math.PI*2); ctx.clip();
                if (img) ctx.drawImage(img, -scale/2 + cx, -scale/2 + cy, scale, scale);
                ctx.restore(); ctx.restore();
            }
        });

        tm.register('reactor', 'PROTOCOL 4: ATOMIC REACTOR', {
            particles: [], angle: 0,
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if (bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(20, 0, 0, 0.6)'; ctx.fillRect(0, 0, w, h); }
                else { ctx.fillStyle = '#050000'; ctx.fillRect(0, 0, w, h); }
                ctx.restore();

                let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass /= 40;
                // ZOOM EFFECT DITURUNKAN KE bass * 1.5
                const cx = w/2, cy = h/2; const scale = (w < 800 ? 150 : 300) + (bass * 1.5);

                ctx.save(); ctx.translate(cx, cy);
                if(bass > 180) {
                    for(let i=0; i<5; i++) {
                        const ang = Math.random() * Math.PI * 2; const speed = Math.random() * 10 + 5;
                        this.particles.push({ x: Math.cos(ang) * (scale/2), y: Math.sin(ang) * (scale/2), vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 1.0, color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b' });
                    }
                }
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    let p = this.particles[i];
                    ctx.beginPath(); ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.arc(p.x, p.y, (bass/20) * p.life, 0, Math.PI * 2); ctx.fill();
                    p.x += p.vx; p.y += p.vy; p.life -= 0.03; if (p.life <= 0) this.particles.splice(i, 1);
                }
                ctx.globalAlpha = 1;

                this.angle += 0.02 + (bass / 5000);
                ctx.rotate(this.angle); ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.setLineDash([20, 40]); ctx.arc(0, 0, scale * 0.8, 0, Math.PI * 2); ctx.stroke();
                ctx.rotate(-this.angle * 2); ctx.beginPath(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.arc(0, 0, scale * 0.6, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]); ctx.rotate(this.angle);

                ctx.beginPath(); ctx.arc(0, 0, scale/2.5, 0, Math.PI*2); ctx.clip();
                if(img) { ctx.drawImage(img, -scale/2.5, -scale/2.5, scale*0.8, scale*0.8); }
                else { ctx.fillStyle = '#330000'; ctx.fill(); ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center'; ctx.font="bold 20px Arial"; ctx.fillText("DANGER", 0, 5); }

                if(bass > 150) { ctx.fillStyle = `rgba(255, 0, 0, ${(bass-150)/300})`; ctx.globalCompositeOperation = 'overlay'; ctx.fillRect(-scale, -scale, scale*2, scale*2); }
                ctx.restore();
            }
        });

        tm.register('retro', 'PROTOCOL 5: RETRO WAVE', {
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if (bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(20, 0, 40, 0.7)'; ctx.fillRect(0, 0, w, h); }
                else { let grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#0f0c29"); grd.addColorStop(1, "#302b63"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h); }

                let bass = 0; for(let i=0; i<50; i++) bass += data[i]; bass/=50;
                // ZOOM EFFECT DITURUNKAN KE bass * 0.8
                const cx = w/2, cy = h/2; const scale = (w < 800 ? 180 : 350) + (bass * 0.8);

                ctx.beginPath(); ctx.arc(cx, cy, scale/1.5, 0, Math.PI, true); ctx.fillStyle = '#ff00cc'; ctx.fill();
                ctx.beginPath(); ctx.arc(cx, cy, scale/1.5, 0, Math.PI, false); ctx.fillStyle = '#333399'; ctx.fill();

                ctx.fillStyle = '#0f0c29';
                for(let i=0; i<10; i++) { let y = cy + (i * (scale/10)); let hBar = i * 2; ctx.fillRect(cx - scale, y, scale*2, hBar); }

                ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, scale/2, 0, Math.PI*2); ctx.clip();
                if(img) ctx.drawImage(img, cx - scale/2, cy - scale/2, scale, scale);
                ctx.restore();

                ctx.fillStyle = '#00f2ff';
                for(let i=0; i<20; i++) {
                    let val = data[i + 10]; let hBar = (val / 255) * 100;
                    ctx.fillRect(cx - scale - 20 - (i*15), cy - hBar/2, 10, hBar);
                    ctx.fillRect(cx + scale + 10 + (i*15), cy - hBar/2, 10, hBar);
                }
                ctx.restore();
            }
        });

        tm.register('glitch', 'PROTOCOL 6: SYSTEM FAILURE', {
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if (bgImage) ctx.drawImage(bgImage, 0, 0, w, h); else { ctx.fillStyle = '#111'; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<20; i++) bass += data[i]; bass/=20;
                const cx = w/2, cy = h/2; const scale = (w < 800 ? 200 : 400);

                if(img) {
                    ctx.save(); ctx.globalAlpha = 0.7; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(img, cx - scale/2 + 5, cy - scale/2, scale, scale); ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(cx - scale/2, cy - scale/2, scale, scale); ctx.restore();
                    ctx.save(); ctx.globalAlpha = 0.7; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(img, cx - scale/2 - 5, cy - scale/2, scale, scale); ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(cx - scale/2, cy - scale/2, scale, scale); ctx.restore();
                    ctx.drawImage(img, cx - scale/2, cy - scale/2, scale, scale);
                }

                if(bass > 150) { ctx.fillStyle = '#fff'; ctx.font = "bold 40px Courier New"; ctx.fillText("NO SIGNAL", cx + (Math.random()*10), cy + (Math.random()*10)); }
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; for(let i=0; i<h; i+=4) { ctx.fillRect(0, i, w, 2); }
                ctx.restore();
            }
        });

        tm.register('illuminati', 'PROTOCOL 7: THE EYE', {
            angle: 0,
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if(bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(20, 15, 0, 0.8)'; ctx.fillRect(0,0,w,h); }
                else { let grd = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w); grd.addColorStop(0, "#443300"); grd.addColorStop(1, "#000000"); ctx.fillStyle = grd; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
                // ZOOM EFFECT DITURUNKAN KE bass * 0.5
                const cx = w/2, cy = h/2; const size = (w < 800 ? 150 : 300) + (bass * 0.5);

                ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle / 2); ctx.strokeStyle = `rgba(255, 215, 0, ${bass/300})`; ctx.lineWidth = 2;
                for(let i=0; i<20; i++) { ctx.rotate((Math.PI * 2) / 20); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 2, 0); ctx.stroke(); }
                ctx.restore();

                this.angle += 0.01 + (bass/5000);
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.angle);
                ctx.beginPath(); const triSize = size * 1.2; ctx.moveTo(0, -triSize); ctx.lineTo(triSize * 0.866, triSize * 0.5); ctx.lineTo(-triSize * 0.866, triSize * 0.5); ctx.closePath();
                ctx.lineWidth = 10; ctx.strokeStyle = '#FFD700'; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();

                ctx.rotate(-this.angle); ctx.beginPath(); ctx.arc(0, 0, size/2, 0, Math.PI*2); ctx.clip();
                if(img) ctx.drawImage(img, -size/2, -size/2, size, size);
                ctx.restore(); ctx.restore();
            }
        });

        tm.register('sonar', 'PROTOCOL 8: TARGET LOCK', {
            sweepAngle: 0, blips: [],
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if(bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(0, 50, 20, 0.8)'; ctx.fillRect(0,0,w,h); }
                else { ctx.fillStyle = '#001a00'; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
                const cx = w/2, cy = h/2; const radius = w < 800 ? 250 : 450;

                ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
                ctx.beginPath(); ctx.arc(cx, cy, radius * 0.25, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, radius * 0.5, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, radius * 0.75, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();

                ctx.globalAlpha = 1; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2, 0, Math.PI*2); ctx.clip();
                if(img) { ctx.drawImage(img, cx - radius*0.2, cy - radius*0.2, radius*0.4, radius*0.4); ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; ctx.fill(); }
                ctx.restore();

                this.sweepAngle += 0.05; ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.sweepAngle);
                let grd = ctx.createLinearGradient(0, 0, radius, 0); grd.addColorStop(0, "rgba(16, 185, 129, 0)"); grd.addColorStop(1, "rgba(16, 185, 129, 0.8)");
                ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, radius, 0, 0.2); ctx.lineTo(0,0); ctx.fill(); ctx.restore();

                if(bass > 160 && Math.random() > 0.7) {
                    const angle = Math.random() * Math.PI * 2; const dist = (Math.random() * radius * 0.8) + (radius * 0.2);
                    this.blips.push({x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, life: 1.0});
                }
                ctx.fillStyle = '#ef4444';
                for(let i=this.blips.length-1; i>=0; i--) {
                    let b = this.blips[i]; ctx.globalAlpha = b.life; ctx.beginPath(); ctx.arc(cx + b.x, cy + b.y, 5, 0, Math.PI*2); ctx.fill();
                    b.life -= 0.02; if(b.life <= 0) this.blips.splice(i,1);
                }
                ctx.restore();
            }
        });

        tm.register('neon', 'PROTOCOL 9: NEON CITY', {
            offset: 0,
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if(bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(20, 0, 40, 0.8)'; ctx.fillRect(0,0,w,h); }
                else { let grd = ctx.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#000000"); grd.addColorStop(0.5, "#2c003e"); grd.addColorStop(1, "#51007a"); ctx.fillStyle = grd; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
                const cx = w/2, cy = h/2;

                // ZOOM EFFECT DITURUNKAN KE bass * 0.5
                ctx.beginPath(); ctx.arc(cx, h*0.3, 100 + (bass * 0.5), 0, Math.PI*2); ctx.fillStyle = '#ff0055'; ctx.shadowBlur = 50; ctx.shadowColor = '#ff0055'; ctx.fill(); ctx.shadowBlur = 0;

                this.offset += 2 + (bass/50); if(this.offset > 40) this.offset = 0;
                ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
                const horizon = h * 0.5;

                for(let i=0; i<h; i+=40) {
                    let y = horizon + i + this.offset; if(y > h) continue;
                    let p = (y - horizon) / (h - horizon); ctx.globalAlpha = p;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }
                ctx.beginPath();
                for(let i=-w; i<w*2; i+=100) { ctx.moveTo(i + (w/2 - i)*0.2, horizon); ctx.lineTo(i - (w/2 - i)*2, h); ctx.stroke(); }
                ctx.globalAlpha = 1;

                const bars = 30; const barW = (w / 2) / bars; ctx.fillStyle = '#cc00ff';
                for(let i=0; i<bars; i++) {
                    let val = data[i] * 1.5;
                    ctx.fillRect(i * barW, horizon - val, barW-2, val); ctx.fillRect(i * barW, horizon, barW-2, val);
                    ctx.fillRect(w - (i * barW) - barW, horizon - val, barW-2, val); ctx.fillRect(w - (i * barW) - barW, horizon, barW-2, val);
                }

                ctx.beginPath(); ctx.arc(cx, h - 150, 80, 0, Math.PI*2); ctx.clip();
                if(img) ctx.drawImage(img, cx-80, h-230, 160, 160);
                ctx.restore();
            }
        });

        tm.register('spectrum', 'PROTOCOL 10: RGB PARTY', {
            hueOffset: 0,
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();
                if(bgImage) { ctx.drawImage(bgImage, 0, 0, w, h); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,w,h); }
                else { ctx.fillStyle = '#111'; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<20; i++) bass += data[i]; bass/=20;
                // ZOOM EFFECT DITURUNKAN KE bass * 0.5
                const cx = w/2, cy = h/2; const radius = (w < 800 ? 100 : 200) + (bass * 0.5);
                this.hueOffset += 2;

                const bars = 64; const step = (Math.PI * 2) / bars;
                for(let i=0; i<bars; i++) {
                    const val = data[i] || 0; const barH = (val / 255) * (w < 800 ? 150 : 300); const angle = i * step;
                    ctx.fillStyle = `hsl(${this.hueOffset + (i * 5)}, 100%, 50%)`;
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
                    ctx.fillRect(0, radius, 10, barH);
                    ctx.fillStyle = `hsl(${this.hueOffset + (i * 5) + 180}, 100%, 50%)`; ctx.fillRect(0, radius - 20, 6, 10 + (barH/4));
                    ctx.restore();
                }

                ctx.beginPath(); ctx.arc(cx, cy, radius - 10, 0, Math.PI*2); ctx.lineWidth = 5; ctx.strokeStyle = `hsl(${this.hueOffset}, 100%, 50%)`; ctx.stroke(); ctx.clip();
                if(img) ctx.drawImage(img, cx-radius, cy-radius, radius*2, radius*2);
                ctx.restore();
            }
        });

        // ---------------- TEMA BARU (11, 12, 13) ----------------

        tm.register('warp', 'PROTOCOL 11: WARP DRIVE', {
            stars: [],
            initStars(w, h) {
                for(let i=0; i<200; i++) {
                    this.stars.push({
                        x: Math.random() * w - w/2,
                        y: Math.random() * h - h/2,
                        z: Math.random() * w
                    });
                }
            },
            render(ctx, w, h, data, img, bgImage) {
                if(this.stars.length === 0) this.initStars(w, h);

                ctx.save();

                if(bgImage) {
                     ctx.drawImage(bgImage, 0, 0, w, h);
                     ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,w,h);
                } else {
                     ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
                }

                let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
                const cx = w/2, cy = h/2;

                const speed = 5 + (bass / 5);
                ctx.translate(cx, cy);

                ctx.fillStyle = '#fff';
                this.stars.forEach(s => {
                    s.z -= speed;
                    if(s.z <= 0) {
                        s.z = w;
                        s.x = Math.random() * w - w/2;
                        s.y = Math.random() * h - h/2;
                    }

                    const k = 128.0 / s.z;
                    const px = s.x * k;
                    const py = s.y * k;
                    const size = (1 - s.z / w) * 5;

                    if(bass > 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - s.z/w)})`;
                        ctx.lineWidth = size;
                        ctx.moveTo(px, py);
                        ctx.lineTo(px * 1.1, py * 1.1);
                        ctx.stroke();
                    }

                    ctx.beginPath();
                    ctx.arc(px, py, size, 0, Math.PI*2);
                    ctx.fill();
                });

                // ZOOM EFFECT DITURUNKAN KE bass * 0.5
                const scale = (w < 800 ? 150 : 300) + (bass * 0.5);

                let grad = ctx.createRadialGradient(0, 0, scale/2, 0, 0, scale);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1, `rgba(100, 200, 255, ${bass/255})`);

                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(0, 0, scale, 0, Math.PI*2); ctx.fill();

                ctx.beginPath(); ctx.arc(0, 0, scale/2, 0, Math.PI*2); ctx.clip();

                if(img) ctx.drawImage(img, -scale/2, -scale/2, scale, scale);
                else { ctx.fillStyle='#000'; ctx.fill(); }

                ctx.restore();
            }
        });

        tm.register('tesla', 'PROTOCOL 12: HIGH VOLTAGE', {
            drawBolt(ctx, x1, y1, x2, y2, displacement) {
                if (displacement < 2) {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    return;
                }
                let midX = (x1 + x2) / 2;
                let midY = (y1 + y2) / 2;
                midX += (Math.random() - 0.5) * displacement;
                midY += (Math.random() - 0.5) * displacement;
                this.drawBolt(ctx, x1, y1, midX, midY, displacement / 2);
                this.drawBolt(ctx, midX, midY, x2, y2, displacement / 2);
            },
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();

                if(bgImage) ctx.drawImage(bgImage, 0, 0, w, h);
                else { ctx.fillStyle = '#050510'; ctx.fillRect(0,0,w,h); }

                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,h);

                let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
                const cx = w/2, cy = h/2;
                const radius = (w < 800 ? 120 : 250);

                ctx.shadowBlur = bass;
                ctx.shadowColor = '#00ccff';
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI*2);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 5;
                ctx.stroke();

                if(bass > 100) {
                    const bolts = Math.floor(bass / 20);
                    ctx.strokeStyle = '#b3f0ff';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#00ccff';

                    for(let i=0; i<bolts; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = radius + (Math.random() * 300);
                        const x2 = cx + Math.cos(angle) * dist;
                        const y2 = cy + Math.sin(angle) * dist;

                        const x1 = cx + Math.cos(angle) * radius;
                        const y1 = cy + Math.sin(angle) * radius;

                        this.drawBolt(ctx, x1, y1, x2, y2, 50);
                    }
                }
                ctx.shadowBlur = 0;

                ctx.beginPath();
                ctx.arc(cx, cy, radius-5, 0, Math.PI*2);
                ctx.clip();

                if(img) ctx.drawImage(img, cx-radius, cy-radius, radius*2, radius*2);

                ctx.restore();
            }
        });

        tm.register('vortex', 'PROTOCOL 13: HYPNO ZONE', {
            rot: 0,
            render(ctx, w, h, data, img, bgImage) {
                ctx.save();

                if(bgImage) ctx.drawImage(bgImage, 0, 0, w, h);
                else { ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h); }

                let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
                const cx = w/2, cy = h/2;

                this.rot += 0.02 + (bass / 2000);

                ctx.translate(cx, cy);
                ctx.rotate(this.rot);

                const arms = 8;
                const maxRad = Math.max(w, h) * 1.5;

                for(let i=0; i<arms; i++) {
                    ctx.rotate((Math.PI * 2) / arms);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);

                    ctx.fillStyle = (i % 2 === 0) ? `rgba(255, 0, 100, ${bass/400})` : `rgba(100, 0, 255, ${bass/400})`;

                    ctx.lineTo(maxRad, -maxRad/4);
                    ctx.lineTo(maxRad, maxRad/4);
                    ctx.fill();
                }

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.translate(cx, cy);

                // ZOOM EFFECT DITURUNKAN KE bass * 0.5
                const scale = (w < 800 ? 150 : 250) + (bass * 0.5);
                ctx.beginPath();
                ctx.arc(0, 0, scale/2, 0, Math.PI*2);
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.clip();

                if(img) ctx.drawImage(img, -scale/2, -scale/2, scale, scale);

                ctx.restore();
            }
        });
    }
})