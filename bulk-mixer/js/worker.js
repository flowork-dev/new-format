//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\bulk-mixer\js\worker.js total lines 152 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * SMART STITCH WORKER v5.1 (ANTI-STUTTER)
 * Logic: Filter Complex with Normalization (Scale & FPS)
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
    ffmpeg = createFFmpeg({
        corePath: LIB_PATH + 'ffmpeg-core.js',
        log: true,
        mainName: 'main'
    });
    await ffmpeg.load();
}

self.onmessage = async (e) => {
    const { type, data } = e.data;
    if (type === 'PROCESS_STITCH') {
        try {
            await initFFmpeg();
            await processStitching(data);
        } catch (err) {
            self.postMessage({ type: 'ERROR', msg: err.message });
        }
    }
};

async function processStitching({ masterFile, slaveFiles, mode, index }) {
    const { fetchFile } = FFmpeg;
    const outName = `stitched_${index}_${Date.now()}.mp4`;
    const SAFE_LIMIT = 50;
    const filesToProcess = slaveFiles.slice(0, SAFE_LIMIT);

    try {
        let args = [];
        let filterComplex = "";


        if (mode === 'audio_master') {

            const masterName = 'master_audio.mp3';
            ffmpeg.FS('writeFile', masterName, await fetchFile(masterFile));
            args.push('-i', masterName);

            for (let i = 0; i < filesToProcess.length; i++) {
                const fname = `vid_${i}.mp4`;
                ffmpeg.FS('writeFile', fname, await fetchFile(filesToProcess[i]));
                args.push('-i', fname);

                const inputIdx = i + 1; // +1 karena index 0 itu audio master
                filterComplex += `[${inputIdx}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p[v${i}];`;
            }

            for (let i = 0; i < filesToProcess.length; i++) {
                filterComplex += `[v${i}]`;
            }
            filterComplex += `concat=n=${filesToProcess.length}:v=1:a=0[outv]`;

            args.push(
                '-filter_complex', filterComplex,
                '-map', '[outv]', // Video dari hasil jahit yang sudah dinormalisasi
                '-map', '0:a',    // Audio dari Master (Input 0)
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', // Re-encode video (Wajib)
                '-c:a', 'copy',   // Audio Copy (Aman & Cepat)
                '-shortest',      // Stop jika audio habis
                '-y', outName
            );

        } else {

            const masterName = 'master_video.mp4';
            ffmpeg.FS('writeFile', masterName, await fetchFile(masterFile));
            args.push('-i', masterName);

            for (let i = 0; i < filesToProcess.length; i++) {
                const fname = `aud_${i}.mp3`;
                ffmpeg.FS('writeFile', fname, await fetchFile(filesToProcess[i]));
                args.push('-i', fname);
            }

            for (let i = 0; i < filesToProcess.length; i++) {
                filterComplex += `[${i+1}:a]`; // +1 karena 0 itu video master
            }
            filterComplex += `concat=n=${filesToProcess.length}:v=0:a=1[outa]`;

            args.push(
                '-filter_complex', filterComplex,
                '-map', '0:v',    // Video dari Master
                '-map', '[outa]', // Audio dari hasil jahit
                '-c:v', 'copy',   // Video Copy (Super Cepat)
                '-c:a', 'aac',    // Audio Encode (AAC standar)
                '-shortest',
                '-y', outName
            );
        }

        await ffmpeg.run(...args);

        try {
            const data = ffmpeg.FS('readFile', outName);
            self.postMessage({ type: 'DONE', buffer: data.buffer, name: outName }, [data.buffer]);
        } catch (readErr) {
            console.error("Gagal baca output:", readErr);
            throw new Error("Render Gagal (Output File Not Found). Cek konsistensi file input.");
        }

        try { ffmpeg.FS('unlink', 'master_audio.mp3'); } catch(e){}
        try { ffmpeg.FS('unlink', 'master_video.mp4'); } catch(e){}
        try { ffmpeg.FS('unlink', outName); } catch(e){}
        for (let i = 0; i < filesToProcess.length; i++) {
            try { ffmpeg.FS('unlink', `vid_${i}.mp4`); } catch(e){}
            try { ffmpeg.FS('unlink', `aud_${i}.mp3`); } catch(e){}
        }

    } catch (err) {
        if (err.message && err.message.includes('exit(0)')) {
             try {
                const data = ffmpeg.FS('readFile', outName);
                self.postMessage({ type: 'DONE', buffer: data.buffer, name: outName }, [data.buffer]);
             } catch(e) { throw err; }
        } else {
            throw err;
        }
    }
}
