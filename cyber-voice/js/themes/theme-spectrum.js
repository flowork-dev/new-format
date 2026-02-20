ThemeManager.register('spectrum', 'PROTOCOL 10: RGB PARTY', {
    hueOffset: 0,
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Logic
        if(bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,w,h);
        } else {
            ctx.fillStyle = '#111'; ctx.fillRect(0,0,w,h);
        }

        let bass = 0; for(let i=0; i<20; i++) bass += data[i]; bass/=20;
        const cx = w/2, cy = h/2;

        // Radius berdenyut halus
        const radius = (w < 800 ? 100 : 200) + (bass/2);

        // Update Warna Pelangi (Smooth)
        this.hueOffset += 2;

        // CIRCULAR BARS
        const bars = 64;
        const step = (Math.PI * 2) / bars;

        for(let i=0; i<bars; i++) {
            const val = data[i] || 0;
            const barH = (val / 255) * (w < 800 ? 150 : 300);
            const angle = i * step;

            // Warna Warni RGB
            ctx.fillStyle = `hsl(${this.hueOffset + (i * 5)}, 100%, 50%)`;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            // Bar Luar
            ctx.fillRect(0, radius, 10, barH);
            // Bar Dalam (Kecil)
            ctx.fillStyle = `hsl(${this.hueOffset + (i * 5) + 180}, 100%, 50%)`;
            ctx.fillRect(0, radius - 20, 6, 10 + (barH/4));

            ctx.restore();
        }

        // CENTER IMAGE
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 10, 0, Math.PI*2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = `hsl(${this.hueOffset}, 100%, 50%)`;
        ctx.stroke();
        ctx.clip();

        if(img) ctx.drawImage(img, cx-radius, cy-radius, radius*2, radius*2);

        // [MODIFIKASI: MATIKAN FLASH PUTIH AGAR GAMBAR BERSIH]
        /* if(bass > 160) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fill();
        } */

        ctx.restore();
    }
});