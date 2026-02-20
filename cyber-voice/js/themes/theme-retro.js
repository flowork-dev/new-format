ThemeManager.register('retro', 'PROTOCOL 5: RETRO WAVE', {
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Logic (Stabil)
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(20, 0, 40, 0.7)'; // Ungu Gelap Overlay
            ctx.fillRect(0, 0, w, h);
        } else {
            // Gradient BG Retro Clean
            let grd = ctx.createLinearGradient(0, 0, 0, h);
            grd.addColorStop(0, "#0f0c29");
            grd.addColorStop(1, "#302b63");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
        }

        // Analisa Audio
        let bass = 0; for(let i=0; i<50; i++) bass += data[i]; bass/=50;

        const cx = w/2, cy = h/2;
        // Scale hanya untuk efek Pulse (Denyut), bukan getar
        const scale = (w < 800 ? 180 : 350) + (bass * 2);

        // 2. SUN (Matahari di belakang)
        ctx.beginPath();
        ctx.arc(cx, cy, scale/1.5, 0, Math.PI, true); // Atas
        ctx.fillStyle = '#ff00cc';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, scale/1.5, 0, Math.PI, false); // Bawah
        ctx.fillStyle = '#333399';
        ctx.fill();

        // Garis-garis Retro Sun (Stabil)
        ctx.fillStyle = '#0f0c29';
        for(let i=0; i<10; i++) {
            // Posisi garis relative terhadap center dan scale
            let y = cy + (i * (scale/10));
            let hBar = i * 2;
            ctx.fillRect(cx - scale, y, scale*2, hBar);
        }

        // 3. USER IMAGE (Bulat di tengah matahari)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, scale/2, 0, Math.PI*2);
        ctx.clip();
        // Gambar diam di tengah, hanya ukurannya yang 'breathing'
        if(img) ctx.drawImage(img, cx - scale/2, cy - scale/2, scale, scale);
        ctx.restore();

        // 4. EQUALIZER BARS (Kiri Kanan - Simetris)
        ctx.fillStyle = '#00f2ff'; // Cyan Neon
        const bars = 20;

        for(let i=0; i<bars; i++) {
            let val = data[i + 10];
            let hBar = (val / 255) * 100;

            // Kiri
            ctx.fillRect(cx - scale - 20 - (i*15), cy - hBar/2, 10, hBar);
            // Kanan
            ctx.fillRect(cx + scale + 10 + (i*15), cy - hBar/2, 10, hBar);
        }

        ctx.restore();
    }
});