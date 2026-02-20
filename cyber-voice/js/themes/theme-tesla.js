ThemeManager.register('tesla', 'PROTOCOL 12: HIGH VOLTAGE', {
    // Fungsi Recursive Petir (Tetap ada buat visual effect)
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

        // 1. BG Logic
        if(bgImage) ctx.drawImage(bgImage, 0, 0, w, h);
        else { ctx.fillStyle = '#050510'; ctx.fillRect(0,0,w,h); }

        // Darken overlay (Stabil)
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,h);

        let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
        const cx = w/2, cy = h/2;
        const radius = (w < 800 ? 120 : 250);

        // 2. GLOWING ORB (Stabil)
        ctx.shadowBlur = bass;
        ctx.shadowColor = '#00ccff';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        ctx.stroke();

        // 3. LISTRIK NYAMBER (Effect Visual, bukan Noise Image)
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

                // Titik Awal (Di pinggir lingkaran)
                const x1 = cx + Math.cos(angle) * radius;
                const y1 = cy + Math.sin(angle) * radius;

                this.drawBolt(ctx, x1, y1, x2, y2, 50);
            }
        }
        ctx.shadowBlur = 0;

        // 4. USER IMAGE (Clean & Stabil)
        ctx.beginPath();
        ctx.arc(cx, cy, radius-5, 0, Math.PI*2);
        ctx.clip();

        if(img) ctx.drawImage(img, cx-radius, cy-radius, radius*2, radius*2);

        // [MODIFIKASI: HAPUS ELECTRIC OVERLAY DI MUKA AGAR BERSIH]
        /* if(Math.random() > 0.8 && bass > 150) {
            ctx.fillStyle = 'rgba(200, 255, 255, 0.3)';
            ctx.fillRect(cx-radius, cy-radius, radius*2, radius*2);
        } */

        ctx.restore();
    }
});