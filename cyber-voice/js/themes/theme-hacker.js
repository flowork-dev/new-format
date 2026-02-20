ThemeManager.register('hacker', 'PROTOCOL 1: ANONYMOUS MASK', {
    render(ctx, w, h, data, img, bgImage) {
        // --- LAYER 1: BACKGROUND ---
        ctx.save();
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
        }

        // Matrix Rain (Tetap ada sebagai identitas tema)
        ctx.fillStyle = '#0F0';
        ctx.font = '14px monospace';
        if(Math.random() > 0.7) {
            ctx.fillText(Math.random() > 0.5 ? "1" : "0", Math.random()*w, Math.random()*h);
        }
        ctx.restore();


        // --- LAYER 2: TOPENG / MASK ---

        // Hitung Audio Data
        let bass = 0;
        for(let i=0; i<30; i++) bass += data[i];
        bass /= 30;

        const cx = w/2, cy = h/2;
        const baseScale = w < 800 ? 200 : 400;
        const scale = baseScale + (bass * 4);

        // [MODIFIKASI: MATIKAN SHAKE/GOYANG]
        let shakeX = 0;
        let shakeY = 0;

        /* // Logic lama (Goyang):
        if(bass > 140) {
            shakeX = Math.random() * 20 - 10;
            shakeY = Math.random() * 20 - 10;
        }
        */

        ctx.save();

        // Pindahkan ke tengah (Tanpa Shake)
        ctx.translate(cx + shakeX, cy + shakeY);

        // 1. Gambar Lingkaran Neon
        ctx.beginPath();
        ctx.strokeStyle = `rgba(84, 215, 246, 0.6)`;
        ctx.lineWidth = 3;
        ctx.arc(0, 0, scale/1.8, 0, Math.PI*2);
        ctx.stroke();

        // 2. MASKING
        ctx.beginPath();
        ctx.arc(0, 0, scale/2, 0, Math.PI * 2);
        ctx.clip();

        // 3. Gambar User
        if (img) {
            ctx.drawImage(img, -scale/2, -scale/2, scale, scale);
        } else {
            ctx.fillStyle = '#000'; ctx.fill();
            ctx.fillStyle = '#0f0'; ctx.textAlign = 'center';
            ctx.fillText("NO IMAGE", 0, 0);
        }

        // [MODIFIKASI: MATIKAN GLITCH MERAH]
        /* if(bass > 160) {
             ctx.fillStyle = `rgba(255, 0, 0, 0.3)`;
             ctx.globalCompositeOperation = 'overlay';
             ctx.fillRect(-scale/2, -scale/2, scale, scale);
        }
        */

        ctx.restore();
    }
});