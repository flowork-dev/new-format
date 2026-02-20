ThemeManager.register('neon', 'PROTOCOL 9: NEON CITY', {
    offset: 0,
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Deep Purple (Clean Gradient)
        if(bgImage) {
             ctx.drawImage(bgImage, 0, 0, w, h);
             ctx.fillStyle = 'rgba(20, 0, 40, 0.8)';
             ctx.fillRect(0,0,w,h);
        } else {
             // Langit Gradient
             let grd = ctx.createLinearGradient(0, 0, 0, h);
             grd.addColorStop(0, "#000000");
             grd.addColorStop(0.5, "#2c003e");
             grd.addColorStop(1, "#51007a");
             ctx.fillStyle = grd;
             ctx.fillRect(0,0,w,h);
        }

        let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
        const cx = w/2, cy = h/2;

        // 2. MATAHARI CYBERPUNK (Pulse Stabil)
        ctx.beginPath();
        ctx.arc(cx, h*0.3, 100 + (bass/2), 0, Math.PI*2);
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#ff0055';
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3. MOVING GRID (Gerakan Halus)
        this.offset += 2 + (bass/50);
        if(this.offset > 40) this.offset = 0; // Seamless Loop

        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';

        const horizon = h * 0.5;

        // Garis Horizontal (Jalan)
        for(let i=0; i<h; i+=40) {
            let y = horizon + i + this.offset;
            if(y > h) continue;

            // Perspektif: Makin jauh makin transparan
            let p = (y - horizon) / (h - horizon);
            ctx.globalAlpha = p;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Garis Vertikal (Perspektif)
        ctx.beginPath();
        for(let i=-w; i<w*2; i+=100) {
            ctx.moveTo(i + (w/2 - i)*0.2, horizon); // Titik hilang
            ctx.lineTo(i - (w/2 - i)*2, h); // Melebar ke bawah
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // 4. AUDIO BARS (GEDUNG NEON)
        const bars = 30;
        const barW = (w / 2) / bars;
        ctx.fillStyle = '#cc00ff';

        for(let i=0; i<bars; i++) {
            let val = data[i] * 1.5;
            // Gedung Kiri
            ctx.fillRect(i * barW, horizon - val, barW-2, val);
            ctx.fillRect(i * barW, horizon, barW-2, val); // Refleksi

            // Gedung Kanan
            ctx.fillRect(w - (i * barW) - barW, horizon - val, barW-2, val);
            ctx.fillRect(w - (i * barW) - barW, horizon, barW-2, val); // Refleksi
        }

        // 5. USER IMAGE (Floating Driver - Stabil)
        ctx.beginPath();
        ctx.arc(cx, h - 150, 80, 0, Math.PI*2);
        ctx.clip();
        if(img) ctx.drawImage(img, cx-80, h-230, 160, 160);

        ctx.restore();
    }
});