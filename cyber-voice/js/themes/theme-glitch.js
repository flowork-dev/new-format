ThemeManager.register('glitch', 'PROTOCOL 6: SYSTEM FAILURE', {
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Static Noise
        if (bgImage) ctx.drawImage(bgImage, 0, 0, w, h);
        else { ctx.fillStyle = '#111'; ctx.fillRect(0,0,w,h); }

        // [MODIFIKASI: MATIKAN NOISE SEMUT]
        /* if(Math.random() > 0.5) {
            const noiseH = Math.random() * h;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, noiseH, w, Math.random() * 50);
        }
        */

        let bass = 0; for(let i=0; i<20; i++) bass += data[i]; bass/=20;
        const cx = w/2, cy = h/2;
        const scale = (w < 800 ? 200 : 400);

        // 2. GLITCH IMAGE EFFECT
        if(img) {
            // [MODIFIKASI: JITTER 0 SUPAYA GAMBAR TENANG/TIDAK GOYANG]
            const jitter = 0;

            const rX = (Math.random() * jitter) - (jitter/2);
            const rY = (Math.random() * jitter) - (jitter/2);

            // Layer Merah (Geser Kiri - Tetap ada tapi statis)
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(img, cx - scale/2 + rX + 5, cy - scale/2 + rY, scale, scale);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillRect(cx - scale/2, cy - scale/2, scale, scale);
            ctx.restore();

            // Layer Biru (Geser Kanan - Tetap ada tapi statis)
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(img, cx - scale/2 - rX - 5, cy - scale/2 - rY, scale, scale);
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillRect(cx - scale/2, cy - scale/2, scale, scale);
            ctx.restore();

            // Layer Asli (Tengah - Putih)
            ctx.drawImage(img, cx - scale/2, cy - scale/2, scale, scale);
        }

        // 3. TEXT ERROR
        if(bass > 150) {
            ctx.fillStyle = '#fff';
            ctx.font = "bold 40px Courier New";
            ctx.fillText("NO SIGNAL", cx + (Math.random()*10), cy + (Math.random()*10));
        }

        // 4. SCANLINES
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        for(let i=0; i<h; i+=4) {
            ctx.fillRect(0, i, w, 2);
        }

        ctx.restore();
    }
});