//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\cyber-voice\js\core.js total lines 325
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * FLOWORK CORE ENGINE V3.3 (SOUND FIX & PROGRESS BAR)
 */

const AppController = {
    isLoggedIn: false, basePath: 'partials',
    async init() {
        console.log("%c[SYSTEM BOOT] FLOWORK NEURAL DIVISION", "color: #54d7f6; font-weight: bold;");
        if(localStorage.getItem('flowork_session')) this.isLoggedIn = true;
        await Promise.all([ this.loadPartial('view-lander', `${this.basePath}/lander.html`), this.loadPartial('view-app', `${this.basePath}/app.html`) ]);
        if(window.ThemeManager) window.ThemeManager.init();
        if(typeof lucide !== 'undefined') lucide.createIcons();
        this.isLoggedIn ? this.switchTab('lander') : this.switchTab('app');
        window.AudioEngine = AudioEngine;
    },
    async loadPartial(id, url) {
        const c = document.getElementById(id); if(!c) return;
        try { const r = await fetch(url); if(!r.ok) throw 1; c.innerHTML = await r.text(); }
        catch(e) { c.innerHTML = `<div class="text-red-500">ERR: ${url}</div>`; }
    },
    switchTab(tab) {
        document.getElementById('view-lander').classList.add('hidden-view');
        document.getElementById('view-app').classList.add('hidden-view');
        const tv = document.getElementById(`view-${tab}`); if(tv) tv.classList.remove('hidden-view');
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('text-[#54d7f6]', 'opacity-100'));
        const ab = document.getElementById(`tab-${tab}`); if(ab) ab.classList.add('text-[#54d7f6]', 'opacity-100');
        if(tab === 'app') {
            setTimeout(() => {
                const w = document.getElementById('canvas-wrapper'), c = document.getElementById('main-canvas');
                if(w && c && c.parentNode !== w) { w.innerHTML=''; w.appendChild(c); c.style.display='block'; }
                AudioEngine.updateCanvasSize(); AudioEngine.checkReady();
                if(typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        }
    }
};

const AudioEngine = {
    ctx: null, src: null, noiseSrc: null, analyser: null, dest: null,
    mediaRecorder: null, recordedChunks: [],

    micRecorder: null, micChunks: [], isMicRecording: false,

    nodes: { bass: null, robotDelay: null, robotFeedback: null, noiseGain: null },
    audioFile: null, userImage: null, bgAsset: null, bgType: 'none',
    targetFormat: 'tiktok', resolutionScale: 1,
    isPlaying: false, isRecording: false, animationId: null, timerInt: null,

    handleAudio(input) { if (input.files[0]) this.loadAudioFile(input.files[0]); },
    loadAudioFile(file) {
        this.audioFile = file;
        const l = document.getElementById('label-audio');
        if(l) { l.innerText = file.name.substring(0, 20) + "..."; l.classList.add('text-[#54d7f6]'); }
        this.checkReady();
    },
    handleImage(input) {
        if (input.files[0]) {
            const r = new FileReader();
            r.onload = (e) => {
                this.userImage = new Image(); this.userImage.src = e.target.result;
                this.userImage.onload = () => this.checkReady();
                const l = document.getElementById('label-image'); if(l) l.innerText = input.files[0].name.substring(0, 15) + "...";
            };
            r.readAsDataURL(input.files[0]);
        }
    },
    handleBg(input) {
        if (input.files[0]) {
            const file = input.files[0];
            const isVideo = file.type.startsWith('video');
            const url = URL.createObjectURL(file);
            const l = document.getElementById('label-bg'); if(l) l.innerText = file.name.substring(0, 15) + "...";
            if (isVideo) {
                if(this.bgAsset && this.bgType === 'video') this.bgAsset.pause();
                this.bgAsset = document.createElement('video');
                this.bgAsset.src = url; this.bgAsset.loop = true; this.bgAsset.muted = true; this.bgAsset.play();
                this.bgType = 'video';
            } else {
                this.bgAsset = new Image(); this.bgAsset.src = url; this.bgType = 'image';
                this.bgAsset.onload = () => { if(!this.isPlaying) this.renderOneShot(); };
            }
        }
    },
    async toggleMic() {
        if(this.isMicRecording) {
            this.micRecorder.stop(); this.isMicRecording = false;
            const btn = document.getElementById('btn-mic');
            btn.classList.remove('border-red-500', 'text-red-500', 'animate-pulse'); btn.classList.add('border-[#3a3962]');
            document.getElementById('mic-text').innerText = "REC";
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.micRecorder = new MediaRecorder(stream); this.micChunks = [];
                this.micRecorder.ondataavailable = e => this.micChunks.push(e.data);
                this.micRecorder.onstop = () => {
                    const blob = new Blob(this.micChunks, { type: 'audio/webm' });
                    const file = new File([blob], "mic_recording.webm", { type: "audio/webm" });
                    this.loadAudioFile(file);
                    stream.getTracks().forEach(track => track.stop());
                };
                this.micRecorder.start(); this.isMicRecording = true;
                const btn = document.getElementById('btn-mic');
                btn.classList.remove('border-[#3a3962]'); btn.classList.add('border-red-500', 'text-red-500', 'animate-pulse');
                document.getElementById('mic-text').innerText = "STOP";
            } catch(e) { alert("Mic Error: " + e.message); }
        }
    },

    checkReady() {
        const isReady = this.audioFile && this.userImage;
        const b1 = document.getElementById('btn-preview'), b2 = document.getElementById('btn-render');
        if(isReady) {
            if(b1) { b1.disabled=false; b1.classList.remove('opacity-50','cursor-not-allowed'); b1.classList.add('hover:bg-[#54d7f6]','hover:text-black'); }
            if(b2) { b2.disabled=false; b2.classList.remove('opacity-50','cursor-not-allowed'); b2.classList.add('hover:scale-[1.02]'); }
            this.updateCanvasSize();
            if(!this.isPlaying) this.renderOneShot();
        }
    },
    setFormat(fmt) {
        this.targetFormat = fmt;
        const bTk = document.getElementById('btn-tiktok'), bYt = document.getElementById('btn-youtube');
        const act = "py-2 text-[10px] font-bold rounded bg-[#54d7f6] text-black border border-[#54d7f6]";
        const inact = "py-2 text-[10px] font-bold rounded bg-transparent text-gray-400 border border-[#3a3962] hover:border-white";
        if(bTk && bYt) { if(fmt === 'tiktok') { bTk.className = act; bYt.className = inact; } else { bYt.className = act; bTk.className = inact; } }
        this.updateCanvasSize(); if(!this.isPlaying) this.renderOneShot();
    },
    setResolution(scale) {
        this.resolutionScale = scale;
        const badges = { 1: 'res-720', 1.5: 'res-1080', 3: 'res-4k' };
        Object.keys(badges).forEach(k => {
            const btn = document.getElementById(badges[k]);
            if(btn) {
                if(parseFloat(k) === scale) btn.className = "py-1 text-[9px] font-bold rounded bg-[#3a3962] text-white border border-[#54d7f6]";
                else btn.className = "py-1 text-[9px] font-bold rounded bg-transparent text-gray-500 border border-[#3a3962]";
            }
        });
        const badgeEl = document.getElementById('res-badge');
        if(badgeEl) { badgeEl.innerText = scale===1?'HD 720p':scale===1.5?'FHD 1080p':'4K ULTRA'; badgeEl.classList.remove('hidden'); }
        this.updateCanvasSize(); if(!this.isPlaying) this.renderOneShot();
    },
    updateCanvasSize() {
        const cvs = document.getElementById('main-canvas'), wrp = document.getElementById('canvas-wrapper');
        if(!cvs || !wrp) return;
        let baseW = 720, baseH = 1280; if (this.targetFormat !== 'tiktok') { baseW = 1280; baseH = 720; }
        cvs.width = baseW * this.resolutionScale; cvs.height = baseH * this.resolutionScale;
        wrp.style.aspectRatio = this.targetFormat === 'tiktok' ? '9/16' : '16/9';
        wrp.style.height = this.targetFormat === 'tiktok' ? '90%' : 'auto';
        wrp.style.width = this.targetFormat === 'tiktok' ? 'auto' : '90%';
    },
    updateParams() {
        const v = (id) => {
            const val = document.getElementById(id).value;
            const displayId = id.replace('set-', 'val-');
            const displayEl = document.getElementById(displayId);
            if(displayEl) displayEl.innerText = val;
            return parseFloat(val);
        };
        const pitch = v('set-pitch');
        const bass = v('set-bass');
        const robot = v('set-robot');
        const noise = v('set-noise');

        if(!this.isPlaying) return;
        if(this.src) this.src.playbackRate.value = pitch;
        if(this.nodes.bass) this.nodes.bass.gain.value = bass;
        if(this.nodes.robotFeedback) this.nodes.robotFeedback.gain.value = robot;
        if(this.nodes.noiseGain) this.nodes.noiseGain.gain.value = noise;
    },

    async togglePreview() {
        if(this.isPlaying) { this.stop(); return; }
        this.isRecording = false;
        if(await this.startAudioChain()) {
            document.getElementById('monitor-status').style.opacity = '1';
            document.getElementById('btn-preview').innerHTML = `<i data-lucide="square"></i> STOP PREVIEW`;
            lucide.createIcons();
        }
    },

    async startRender() {
        if(this.isPlaying) this.stop();
        this.isRecording = true;
        if(await this.startAudioChain()) {
            const cvs = document.getElementById('main-canvas');
            const stream = cvs.captureStream(30);
            const combined = new MediaStream([ ...stream.getVideoTracks(), ...this.dest.stream.getAudioTracks() ]);

            const bitrate = this.resolutionScale >= 3 ? 15000000 : 5000000;
            const options = { mimeType: 'video/webm; codecs=vp9,opus', videoBitsPerSecond: bitrate, audioBitsPerSecond: 128000 };

            try { this.mediaRecorder = new MediaRecorder(combined, options); }
            catch (e) {
                console.warn("VP9/Opus not supported, fallback");
                this.mediaRecorder = new MediaRecorder(combined, { mimeType: 'video/webm', videoBitsPerSecond: bitrate });
            }

            this.recordedChunks = [];
            this.mediaRecorder.ondataavailable = e => { if(e.data.size > 0) this.recordedChunks.push(e.data); };
            this.mediaRecorder.onstop = () => this.saveVideo();
            this.mediaRecorder.start();

            document.getElementById('render-progress').classList.remove('hidden');
            document.getElementById('btn-render').innerHTML = `<i data-lucide="loader" class="animate-spin"></i> RENDERING...`;
            document.getElementById('btn-render').disabled = true; document.getElementById('btn-preview').disabled = true;
            lucide.createIcons();
        }
    },

    async startAudioChain() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.dest = this.ctx.createMediaStreamDestination();
            const buf = await this.audioFile.arrayBuffer();
            const audData = await this.ctx.decodeAudioData(buf);
            const totalDur = audData.duration; // Total Duration

            const v = (id) => parseFloat(document.getElementById(id).value);

            this.src = this.ctx.createBufferSource(); this.src.buffer = audData; this.src.playbackRate.value = v('set-pitch');
            this.nodes.bass = this.ctx.createBiquadFilter(); this.nodes.bass.type = "lowshelf"; this.nodes.bass.frequency.value = 200; this.nodes.bass.gain.value = v('set-bass');
            this.nodes.robotDelay = this.ctx.createDelay(); this.nodes.robotDelay.delayTime.value = 0.01;
            this.nodes.robotFeedback = this.ctx.createGain(); this.nodes.robotFeedback.gain.value = v('set-robot');

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
            this.noiseGain = this.ctx.createGain(); this.noiseGain.gain.value = v('set-noise');
            const nFilt = this.ctx.createBiquadFilter(); nFilt.type = 'highpass'; nFilt.frequency.value = 1000;
            this.noiseSrc.connect(nFilt); nFilt.connect(this.noiseGain);

            this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 2048;
            comp.connect(this.analyser);
            if(!this.isRecording) { comp.connect(this.ctx.destination); this.noiseGain.connect(this.ctx.destination); }
            comp.connect(this.dest); this.noiseGain.connect(this.dest);

            this.src.start(0); this.isPlaying = true;
            if(this.bgType === 'video' && this.bgAsset) { this.bgAsset.currentTime = 0; this.bgAsset.play(); }

            if(this.isRecording) {
                let start = Date.now();
                const actualDuration = totalDur / v('set-pitch');

                this.timerInt = setInterval(() => {
                    let elapsed = (Date.now() - start) / 1000;
                    let percent = Math.min((elapsed / actualDuration) * 100, 100);

                    document.getElementById('progress-bar').style.width = percent + '%';
                    document.getElementById('progress-text').innerText = Math.floor(percent) + '%';

                }, 100);
            }

            this.renderVisual();
            this.src.onended = () => this.stop();
            return true;
        } catch(e) { alert("ERR: " + e.message); console.error(e); this.stop(); return false; }
    },

    stop() {
        try { if(this.src) this.src.stop(); if(this.noiseSrc) this.noiseSrc.stop(); if(this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop(); if(this.bgAsset && this.bgType === 'video') this.bgAsset.pause(); } catch(e) {}
        clearInterval(this.timerInt); if(this.animationId) cancelAnimationFrame(this.animationId);
        this.isPlaying = false; this.isRecording = false;
        const st = document.getElementById('monitor-status'); if(st) st.style.opacity = '0';
        document.getElementById('btn-preview').innerHTML = `<i data-lucide="eye"></i> TEST SYSTEM (PREVIEW)`;
        document.getElementById('btn-render').innerHTML = `<i data-lucide="aperture"></i> COMPILE VIDEO`;
        document.getElementById('btn-render').disabled = false; document.getElementById('btn-preview').disabled = false;

        document.getElementById('render-progress').classList.add('hidden');
        document.getElementById('progress-bar').style.width = '0%';

        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    saveVideo() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = `CYBER_FLOWORK_${Date.now()}.webm`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
        alert("RENDER DONE! CHECK DOWNLOADS.");
    },

    makeCurve(amt) {
        const k = amt, n = 44100, curve = new Float32Array(n), deg = Math.PI / 180;
        for (let i = 0; i < n; ++i) { const x = (i * 2) / n - 1; curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); }
        return curve;
    },

    renderVisual() {
        const cvs = document.getElementById('main-canvas'); if(!cvs) return;
        const ctx = cvs.getContext('2d');
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        const draw = () => {
            if(!this.isPlaying) return;
            this.animationId = requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(data);
            if(window.ThemeManager) window.ThemeManager.render(ctx, cvs.width, cvs.height, data, this.userImage, this.bgAsset);
        };
        draw();
    },

    renderOneShot() {
        const cvs = document.getElementById('main-canvas'); if(!cvs) return;
        const ctx = cvs.getContext('2d');
        const data = new Uint8Array(2048).fill(0);
        if(window.ThemeManager) window.ThemeManager.render(ctx, cvs.width, cvs.height, data, this.userImage, this.bgAsset);
    }
};

window.onload = () => AppController.init();
