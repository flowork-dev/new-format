ThemeManager.register('jarvis', 'PROTOCOL 2: JARVIS SYSTEM', {
    render(ctx, w, h, data, img, bgImage) {
        // 1. Render BG (Tanpa Noise)
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(0, 20, 40, 0.7)'; // Biru gelap overlay
            ctx.fillRect(0, 0, w, h);
        } else {
            // Background statis warna gelap transparan
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, w, h);
        }

        const cx = w/2, cy = h/2;
        const radius = w < 1000 ? 200 : 400; // Responsif
        const bars = 100;
        const step = (Math.PI * 2) / bars;

        // Visualizer Circular (Stabil)
        ctx.beginPath();
        for (let i = 0; i < bars; i++) {
            const barHeight = (data[i] / 255) * (radius * 0.8);
            const angle = i * step;
            const x1 = cx + Math.cos(angle) * radius;
            const y1 = cy + Math.sin(angle) * radius;
            const x2 = cx + Math.cos(angle) * (radius + barHeight);
            const y2 = cy + Math.sin(angle) * (radius + barHeight);
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = '#54d7f6';
        ctx.lineWidth = w < 1000 ? 4 : 8;
        ctx.stroke();

        // Lingkaran Tengah
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 10, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0, 20, 40, 0.9)`;
        ctx.fill();
        ctx.strokeStyle = '#706bf3';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Teks Stabil
        ctx.fillStyle = '#fff';
        ctx.font = (w < 1000 ? '20px' : '40px') + ' Oswald';
        ctx.textAlign = 'center';
        ctx.fillText("AI PROCESSING", cx, cy + (w < 1000 ? 90 : 180));

        // Gambar User (Stabil di tengah)
        if (img) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius/2.5, 0, Math.PI*2);
            ctx.clip();
            ctx.globalAlpha = 0.8;
            ctx.drawImage(img, cx-radius/2.5, cy-radius/2.5, radius*0.8, radius*0.8);
            ctx.restore();
        }
    }
});