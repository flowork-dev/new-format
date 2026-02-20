({
    state: {
        isFirstVisit: true,
        currentView: 'main',
        isRecording: false,
        isPlaying: false,
        isRendering: false,
        audioBuffer: null,
        audioName: "No audio loaded",
        presets: { pitch: 0.70, bass: 15, robot: 0.40, noise: 0.05 }
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Wajib sinkron dengan OS) - Diperbarui ke Cyberpunk Blue
    themes: {
        dark: {
            '--bg-root': '#0a0a12', // Cyberpunk Dark Blue
            '--glass': 'rgba(13, 13, 33, 0.85)',
            '--glass-border': '1px solid #0055ff',
            '--txt': '#0088ff', // Biru (Sesuai instruksi: Tidak boleh putih/gelap)
            '--txt-dim': '#0055aa', // Biru Redup
            '--prm': '#00d0ff', // Cyan/Blue Neon
            '--scs': '#0044ff',
            '--err': '#ff0055',
            '--brd': 'rgba(0, 85, 255, 0.4)',
            '--surface': 'rgba(0, 85, 255, 0.1)',
            '--shadow': '0 4px 20px -1px rgba(0, 85, 255, 0.4)'
        },
        light: {
            '--bg-root': '#eef2ff',
            '--glass': 'rgba(255, 255, 255, 0.9)',
            '--glass-border': '1px solid #0088ff',
            '--txt': '#0044cc', // Tetap Biru
            '--txt-dim': '#3366ff',
            '--prm': '#0088ff',
            '--scs': '#0055ff',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 85, 255, 0.2)',
            '--surface': 'rgba(0, 85, 255, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 85, 255, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_voxmorph');
        if (!hasVisited) localStorage.setItem('app_visited_voxmorph', 'true');

        if(window.lucide) window.lucide.createIcons();
        else {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/lucide@latest';
            s.onload = () => { if(window.lucide) window.lucide.createIcons(); };
            document.head.appendChild(s);
        }

        this.engine.init(this);
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
        this.engine.stopAll();
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
            this.sys.toast("Saving audio to device...", "info");
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
        const p = this.state.presets;
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">

                    <div class="glass-panel main-panel">
                        <div class="panel-header">
                            <h2 style="margin:0; font-family:monospace; display:flex; align-items:center; gap:10px; color:var(--prm); font-size:20px; letter-spacing:2px; font-weight:bold;">
                                <i data-lucide="mic-2"></i> VOX MORPH
                            </h2>
                            <span id="status-badge" class="status-badge">READY</span>
                        </div>

                        <div class="input-section">
                            <div class="mic-container">
                                <button id="btn-mic" class="mic-btn">
                                    <i data-lucide="mic" style="width:40px; height:40px;"></i>
                                </button>
                                <div id="mic-label" style="margin-top:15px; font-family:monospace; font-weight:bold; color:var(--txt-dim); letter-spacing:1px; text-align:center;">
                                    TAP TO RECORD
                                </div>
                            </div>

                            <div class="divider-section">
                                <div class="divider-line"></div>
                                <span>OR UPLOAD FILE</span>
                                <div class="divider-line"></div>
                            </div>

                            <div class="upload-box" id="upload-trigger">
                                <i data-lucide="upload-cloud" style="color:var(--prm); margin-bottom:10px;"></i>
                                <div style="font-family:monospace; font-size:12px; color:var(--txt); font-weight:bold; text-align:center;">SELECT AUDIO FILE</div>
                                <input type="file" id="file-audio" accept="audio/*" style="display:none;">
                            </div>
                        </div>

                        <div id="processing-section" class="processing-section" style="display:none;">

                            <div class="audio-info">
                                <i data-lucide="file-audio" style="color:var(--scs); flex-shrink:0;"></i>
                                <span id="lbl-audio">audio_file.wav</span>
                            </div>

                            <div class="tuner-section">
                                <h3 style="font-family:monospace; font-size:11px; color:var(--prm); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                    <i data-lucide="sliders" style="width:14px;height:14px;"></i> VOICE SETTINGS
                                </h3>
                                <div class="tuner-grid">
                                    <div class="input-group">
                                        <label><span>PITCH (DEEP)</span><span id="set-pitch-val">${p.pitch}</span></label>
                                        <input type="range" id="set-pitch" min="0.5" max="1.5" step="0.01" value="${p.pitch}">
                                    </div>
                                    <div class="input-group">
                                        <label><span style="color:var(--scs);">BASS BOOST</span><span id="set-bass-val" style="color:var(--scs);">${p.bass}</span></label>
                                        <input type="range" id="set-bass" min="0" max="40" step="1" value="${p.bass}">
                                    </div>
                                    <div class="input-group">
                                        <label><span style="color:var(--err);">ROBOT EFFECT</span><span id="set-robot-val" style="color:var(--err);">${p.robot}</span></label>
                                        <input type="range" id="set-robot" min="0" max="0.95" step="0.01" value="${p.robot}">
                                    </div>
                                    <div class="input-group">
                                        <label><span style="color:var(--txt-dim);">STATIC NOISE</span><span id="set-noise-val">${p.noise}</span></label>
                                        <input type="range" id="set-noise" min="0" max="0.2" step="0.01" value="${p.noise}">
                                    </div>
                                </div>
                            </div>

                            <div class="action-grid">
                                <button id="btn-preview" class="btn btn-outline">
                                    <i data-lucide="play"></i> TEST HACKER VOICE
                                </button>
                                <button id="btn-export" class="btn btn-solid">
                                    <i data-lucide="download"></i> SAVE AUDIO
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="mobile-spacer"></div> </div>

            <style>
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-y: auto; overflow-x: hidden;
                    box-sizing: border-box;
                }

                /* TULISAN DI FORM / INPUT HARUS BIRU */
                input, textarea, select {
                    color: #0088ff !important;
                    background: var(--surface);
                    border: 1px solid var(--brd);
                }

                .content-limit {
                    width: 100%; max-width: 600px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    display: flex; flex-direction: column; align-items: center;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border); border-radius: 20px; padding: 25px;
                    box-shadow: var(--shadow); width: 100%;
                }

                .panel-header {
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid var(--brd); padding-bottom: 15px; margin-bottom: 20px;
                }

                .status-badge {
                    padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 10px; font-weight: bold;
                    background: var(--surface); border: 1px solid var(--brd); color: var(--txt);
                    letter-spacing: 1px; transition: all 0.3s; white-space: nowrap;
                }

                .mic-container {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    margin: 10px 0; width: 100%;
                }
                .mic-btn {
                    width: 90px; height: 90px; border-radius: 50%;
                    background: var(--surface); border: 2px solid var(--prm); color: var(--prm);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.3s ease; outline: none;
                    box-shadow: 0 0 20px rgba(0, 85, 255, 0.2); flex-shrink: 0;
                }
                .mic-btn:hover { background: rgba(0, 85, 255, 0.1); transform: scale(1.05); }
                .mic-btn.recording {
                    border-color: var(--err); color: var(--err); background: rgba(239, 68, 68, 0.1);
                    animation: pulse-record 1.5s infinite;
                }

                @keyframes pulse-record {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 30px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .upload-box {
                    width: 100%; border: 2px dashed var(--brd); border-radius: 16px;
                    padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s; background: var(--surface); text-align: center;
                }

                .divider-section {
                    width: 100%; display: flex; align-items: center; gap: 15px; margin: 15px 0;
                }
                .divider-section span {
                    font-family: monospace; font-size: 10px; color: var(--txt-dim); font-weight: bold;
                }
                .divider-line { flex: 1; height: 1px; background: var(--brd); }

                .processing-section {
                    margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--brd);
                    animation: fadeIn 0.4s ease-out; width: 100%;
                    display: flex; flex-direction: column; gap: 15px;
                }
                .audio-info {
                    display: flex; align-items: center; gap: 15px; background: var(--surface);
                    padding: 12px 15px; border-radius: 12px; border: 1px solid var(--brd);
                }

                .tuner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; }
                .input-group label { display: flex; justify-content: space-between; font-size: 9px; font-family: monospace; color: var(--txt-dim); margin-bottom: 6px; font-weight:bold; }

                input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: var(--brd); border-radius: 2px; outline: none; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--prm); cursor: pointer; box-shadow: 0 0 10px var(--prm); margin-top: -6px;}

                .action-grid { display: flex; gap: 10px; width: 100%; }
                .btn {
                    flex: 1; min-height: 45px; justify-content: center;
                    padding: 10px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: monospace;
                    display:flex; align-items:center; gap:8px; border:none; outline:none; font-size:11px;
                }
                .btn-outline { background: transparent; border: 1px solid var(--prm); color: var(--prm); }
                .btn-solid { background: var(--prm); color: #000; }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* ========================================= */
                /* DESKTOP RULES */
                /* ========================================= */
                @media (min-width: 768px) {
                    .app-root { padding-top: 20px; overflow: hidden; }
                    .content-limit { height: calc(100vh - 20px); justify-content: flex-start; }
                    .main-panel { display: flex; flex-direction: column; max-height: 100%; }
                    .input-section { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
                    .mic-container { margin: 0; width: auto; }
                    .upload-box { flex: 1; height: 100%; }
                    .divider-section { display: none !important; }
                    .processing-section { flex: 1; overflow: hidden; }
                    .tuner-section { flex: 1; overflow-y: auto; }
                }

                /* ========================================= */
                /* MOBILE RULES (GAP 85PX & SAFE SCROLL) */
                /* ========================================= */
                @media (max-width: 767px) {
                    .app-root {
                        padding-top: 85px !important;
                        padding-bottom: 85px !important;
                    }
                    .mobile-spacer {
                        height: 20px; width: 100%; flex-shrink: 0;
                    }
                    .content-limit { padding: 10px; }
                    .input-section { flex-direction: column; gap: 15px; }
                    .tuner-grid { display: flex; flex-direction: column; gap: 15px; }
                    .action-grid { flex-direction: column; gap: 10px; }
                }
            </style>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        root.querySelectorAll('button, input, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation(), {passive: false});
        });

        const uploadTrigger = root.querySelector('#upload-trigger');
        const fileInput = root.querySelector('#file-audio');

        uploadTrigger.onclick = () => fileInput.click();

        fileInput.onchange = (e) => {
            if(e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                this.state.audioName = file.name;
                this.engine.loadAudio(file);
            }
        };

        const btnMic = root.querySelector('#btn-mic');
        btnMic.onclick = () => {
            if(this.state.isRecording) this.engine.stopMic();
            else this.engine.startMic();
        };

        const btnPrev = root.querySelector('#btn-preview');
        btnPrev.onclick = () => {
            if(this.state.isPlaying) this.engine.stopPreview();
            else this.engine.startPreview();
        };

        const btnRender = root.querySelector('#btn-export');
        btnRender.onclick = () => {
            if(!this.state.isRendering) this.engine.exportHackerVoice();
        };

        const bindSlider = (id, key) => {
            const el = root.querySelector(id);
            if(el) {
                el.addEventListener('input', (e) => {
                    this.state.presets[key] = parseFloat(e.target.value);
                    const lbl = root.querySelector(`${id}-val`);
                    if(lbl) lbl.innerText = e.target.value;
                    this.engine.updateParams();
                });
            }
        };
        bindSlider('#set-pitch', 'pitch');
        bindSlider('#set-bass', 'bass');
        bindSlider('#set-robot', 'robot');
        bindSlider('#set-noise', 'noise');
    },

    updateUI() {
        const root = this.sys.root;
        const s = this.state;

        root.querySelector('#lbl-audio').innerText = s.audioName;
        root.querySelector('#processing-section').style.display = s.audioBuffer ? 'flex' : 'none';

        const btnMic = root.querySelector('#btn-mic');
        const lblMic = root.querySelector('#mic-label');
        if(s.isRecording) {
            btnMic.classList.add('recording');
            btnMic.innerHTML = `<i data-lucide="square" style="width:30px; height:30px;"></i>`;
            lblMic.innerText = "RECORDING... TAP TO STOP";
            lblMic.style.color = "var(--err)";
        } else {
            btnMic.classList.remove('recording');
            btnMic.innerHTML = `<i data-lucide="mic" style="width:40px; height:40px;"></i>`;
            lblMic.innerText = "TAP TO RECORD";
            lblMic.style.color = "var(--txt-dim)";
        }

        const btnPrev = root.querySelector('#btn-preview');
        if(s.isPlaying) {
            btnPrev.innerHTML = `<i data-lucide="square"></i> STOP PREVIEW`;
            btnPrev.style.color = 'var(--err)'; btnPrev.style.borderColor = 'var(--err)';
        } else {
            btnPrev.innerHTML = `<i data-lucide="play"></i> TEST HACKER VOICE`;
            btnPrev.style.color = 'var(--prm)'; btnPrev.style.borderColor = 'var(--prm)';
        }

        const btnRender = root.querySelector('#btn-export');
        if(s.isRendering) {
            btnRender.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> PROCESSING...`;
            btnRender.disabled = true;
        } else {
            btnRender.innerHTML = `<i data-lucide="download"></i> SAVE AUDIO`;
            btnRender.disabled = false;
        }

        const badge = root.querySelector('#status-badge');
        if(s.isRecording) { badge.innerText = "MIC ACTIVE"; badge.style.color = "var(--err)"; badge.style.borderColor = "var(--err)"; }
        else if(s.isPlaying) { badge.innerText = "PREVIEWING"; badge.style.color = "var(--scs)"; badge.style.borderColor = "var(--scs)"; }
        else if(s.isRendering) { badge.innerText = "ENCODING"; badge.style.color = "var(--prm)"; badge.style.borderColor = "var(--prm)"; }
        else if(s.audioBuffer) { badge.innerText = "AUDIO LOADED"; badge.style.color = "var(--txt)"; badge.style.borderColor = "var(--txt)"; }
        else { badge.innerText = "READY"; badge.style.color = "var(--txt-dim)"; badge.style.borderColor = "var(--brd)"; }

        if(window.lucide) window.lucide.createIcons();
    },

    engine: {
        app: null,
        actx: null,
        micRecorder: null,
        micChunks: [],
        srcNode: null,
        nodes: { bass: null, delay: null, feedback: null, noiseGain: null, noiseSrc: null },

        init(app) { this.app = app; },

        async startMic() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.micRecorder = new MediaRecorder(stream);
                this.micChunks = [];

                this.micRecorder.ondataavailable = e => { if(e.data.size > 0) this.micChunks.push(e.data); };
                this.micRecorder.onstop = () => {
                    stream.getTracks().forEach(t => t.stop());
                    const blob = new Blob(this.micChunks, { type: 'audio/webm' });
                    this.app.state.audioName = "mic_recording_" + Date.now() + ".webm";
                    this.loadAudio(blob);
                };

                this.micRecorder.start();
                this.app.state.isRecording = true;
                this.app.updateUI();
            } catch(e) {
                if(this.app.sys) this.app.sys.toast("Microphone access denied.", "error");
            }
        },

        stopMic() {
            if(this.micRecorder && this.micRecorder.state !== 'inactive') {
                this.micRecorder.stop();
                this.app.state.isRecording = false;
                this.app.updateUI();
            }
        },

        async loadAudio(fileOrBlob) {
            try {
                if(this.app.sys) this.app.sys.toast("Decoding audio...", "info");
                this.actx = new (window.AudioContext || window.webkitAudioContext)();
                const buffer = await fileOrBlob.arrayBuffer();
                this.app.state.audioBuffer = await this.actx.decodeAudioData(buffer);
                if(this.app.sys) this.app.sys.toast("Audio loaded.", "success");
                this.app.updateUI();
            } catch(e) {
                if(this.app.sys) this.app.sys.toast("Failed to decode audio.", "error");
            }
        },

        updateParams() {
            if(!this.app.state.isPlaying) return;
            const p = this.app.state.presets;
            if(this.srcNode) this.srcNode.playbackRate.value = p.pitch;
            if(this.nodes.bass) this.nodes.bass.gain.value = p.bass;
            if(this.nodes.feedback) this.nodes.feedback.gain.value = p.robot;
            if(this.nodes.noiseGain) this.nodes.noiseGain.gain.value = p.noise;
        },

        buildHackerGraph(ctx, destination) {
            const p = this.app.state.presets;
            const src = ctx.createBufferSource();
            src.buffer = this.app.state.audioBuffer;
            src.playbackRate.value = p.pitch;
            this.srcNode = src;

            const lpf = ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 2500;

            this.nodes.delay = ctx.createDelay();
            this.nodes.delay.delayTime.value = 0.015;
            this.nodes.feedback = ctx.createGain();
            this.nodes.feedback.gain.value = p.robot;

            this.nodes.bass = ctx.createBiquadFilter();
            this.nodes.bass.type = 'lowshelf';
            this.nodes.bass.frequency.value = 200;
            this.nodes.bass.gain.value = p.bass;

            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

            this.nodes.noiseSrc = ctx.createBufferSource();
            this.nodes.noiseSrc.buffer = noiseBuffer;
            this.nodes.noiseSrc.loop = true;
            this.nodes.noiseGain = ctx.createGain();
            this.nodes.noiseGain.gain.value = p.noise;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1000;

            src.connect(this.nodes.bass);
            this.nodes.bass.connect(lpf);
            lpf.connect(this.nodes.delay);
            this.nodes.delay.connect(this.nodes.feedback);
            this.nodes.feedback.connect(this.nodes.delay);
            this.nodes.noiseSrc.connect(noiseFilter);
            noiseFilter.connect(this.nodes.noiseGain);
            lpf.connect(destination);
            this.nodes.delay.connect(destination);
            this.nodes.noiseGain.connect(destination);

            return { src, noise: this.nodes.noiseSrc };
        },

        startPreview() {
            if(!this.app.state.audioBuffer) return;
            if(!this.actx) this.actx = new (window.AudioContext || window.webkitAudioContext)();
            this.stopAll();
            const nodes = this.buildHackerGraph(this.actx, this.actx.destination);
            nodes.src.onended = () => this.stopPreview();
            nodes.noise.start(0);
            nodes.src.start(0);
            this.app.state.isPlaying = true;
            this.app.updateUI();
        },

        stopPreview() {
            if(this.srcNode) { try { this.srcNode.stop(); } catch(e) {} this.srcNode = null; }
            if(this.nodes.noiseSrc) { try { this.nodes.noiseSrc.stop(); } catch(e) {} this.nodes.noiseSrc = null; }
            this.app.state.isPlaying = false;
            this.app.updateUI();
        },

        async exportHackerVoice() {
            if(!this.app.state.audioBuffer) return;
            this.stopAll();
            this.app.state.isRendering = true;
            this.app.updateUI();
            try {
                const duration = this.app.state.audioBuffer.duration / this.app.state.presets.pitch;
                const offlineCtx = new OfflineAudioContext(this.app.state.audioBuffer.numberOfChannels, 44100 * duration, 44100);
                const nodes = this.buildHackerGraph(offlineCtx, offlineCtx.destination);
                nodes.noise.start(0);
                nodes.src.start(0);
                const renderedBuffer = await offlineCtx.startRendering();
                const wavBlob = this.bufferToWav(renderedBuffer);
                this.app.saveToDevice(wavBlob, `VOX_MORPH_${Date.now()}.wav`, 'audio/wav');
            } catch(e) {
                if(this.app.sys) this.app.sys.toast("Export failed.", "error");
            } finally {
                this.app.state.isRendering = false;
                this.app.updateUI();
            }
        },

        stopAll() { this.stopMic(); this.stopPreview(); },

        bufferToWav(abuffer) {
            let numOfChan = abuffer.numberOfChannels,
                length = abuffer.length * numOfChan * 2 + 44,
                buffer = new ArrayBuffer(length),
                view = new DataView(buffer),
                channels = [], i, sample, offset = 0, pos = 0;
            function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
            function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
            setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
            setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
            setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
            setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164);
            setUint32(length - pos - 4);
            for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
            while(pos < length) {
                for(i = 0; i < numOfChan; i++) {
                    sample = Math.max(-1, Math.min(1, channels[i][offset]));
                    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
                    view.setInt16(pos, sample, true); pos += 2;
                }
                offset++
            }
            return new Blob([buffer], {type: "audio/wav"});
        }
    }
})