//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\clip-protocol\js\worker.js total lines 97 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * CLIP PROTOCOL WORKER v6.3 (PIXEL FORMAT FIX)
 * Fixes: Added -pix_fmt yuv420p to prevent corrupt video on players.
 */

const workerLocation = self.location.href;
const APP_ROOT = workerLocation.substring(0, workerLocation.lastIndexOf('/') + 1).replace('js/', '');
const LIB_PATH = APP_ROOT + 'libs/';

if (typeof window === 'undefined') self.window = self;
if (typeof document === 'undefined') {
    self.document = {
        createElement: () => ({ src: '', type: '', appendChild: () => {} }),
        getElementsByTagName: () => [{ appendChild: () => {} }],
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        currentScript: { src: LIB_PATH + 'ffmpeg.min.js' }
    };
}

try { importScripts(LIB_PATH + 'ffmpeg.min.js'); } catch (e) {}

let ffmpeg = null;

async function initFFmpeg() {
    if (ffmpeg) return;
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({ corePath: LIB_PATH + 'ffmpeg-core.js', log: true, mainName: 'main' });
    await ffmpeg.load();
}

self.onmessage = async (e) => {
    const { type, data } = e.data;
    if (type === 'PROCESS_SINGLE') {
        try {
            await initFFmpeg();
            if (data.fontBuffer) {
                try {
                    ffmpeg.FS('writeFile', '/font.ttf', new Uint8Array(data.fontBuffer));
                } catch(e) { /* ignore */ }
            }
            await processSingleClip(data);
        } catch (err) {
            self.postMessage({ type: 'ERROR', msg: err.message });
        }
    }
};

async function processSingleClip({ file, start, end, mode, videoFilter, index }) {
    const { fetchFile } = FFmpeg;
    const inputName = 'source.mp4';
    const outName = `clip_${index}.mp4`;

    try {
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));

        let args = [
            '-ss', start, '-to', end,
            '-i', inputName,
            '-vf', videoFilter || 'null',
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'copy',
            outName
        ];

        if (mode === 'original' && (!videoFilter || videoFilter === 'null')) {
            args = ['-ss', start, '-to', end, '-i', inputName, '-c', 'copy', outName];
        }

        await ffmpeg.run(...args);

        const fileData = ffmpeg.FS('readFile', outName);
        self.postMessage({ type: 'CLIP_DONE', buffer: fileData.buffer, name: outName }, [fileData.buffer]);

    } catch (err) {
        if (err.message && err.message.includes('exit(0)')) {
             try {
                const fileData = ffmpeg.FS('readFile', outName);
                self.postMessage({ type: 'CLIP_DONE', buffer: fileData.buffer, name: outName }, [fileData.buffer]);
             } catch(e) { throw err; }
        } else {
            throw err;
        }
    } finally {
        try { ffmpeg.FS('unlink', inputName); } catch(e){}
        try { ffmpeg.FS('unlink', outName); } catch(e){}
        try { ffmpeg.FS('unlink', '/font.ttf'); } catch(e){}
        self.postMessage({ type: 'WORKER_FINISHED' });
    }
}
