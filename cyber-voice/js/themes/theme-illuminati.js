ThemeManager.register('illuminati', 'PROTOCOL 7: THE EYE', {
    angle: 0,
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Dark Gold
        if(bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(20, 15, 0, 0.8)';
            ctx.fillRect(0,0,w,h);
        } else {
            let grd = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
            grd.addColorStop(0, "#443300");
            grd.addColorStop(1, "#000000");
            ctx.fillStyle = grd;
            ctx.fillRect(0,0,w,h);
        }

        let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
        const cx = w/2, cy = h/2;

        // Ukuran berdenyut halus sesuai bass
        const size = (w < 800 ? 150 : 300) + (bass/2);

        // 2. RAYS OF LIGHT (Sinar keluar)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle / 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${bass/300})`; // Gold Transparency
        ctx.lineWidth = 2;
        const rays = 20;
        for(let i=0; i<rays; i++) {
            ctx.rotate((Math.PI * 2) / rays);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(size * 2, 0);
            ctx.stroke();
        }
        ctx.restore();

        // 3. ROTATING TRIANGLE
        // Rotasi stabil, sedikit dipercepat bass tapi tidak acak
        this.angle += 0.01 + (bass/5000);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);

        ctx.beginPath();
        const triSize = size * 1.2;
        // Rumus Segitiga Sama Sisi
        ctx.moveTo(0, -triSize);
        ctx.lineTo(triSize * 0.866, triSize * 0.5);
        ctx.lineTo(-triSize * 0.866, triSize * 0.5);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FFD700'; // GOLD
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();

        // 4. USER IMAGE (THE EYE) - Stabil di tengah
        ctx.rotate(-this.angle); // Counter-rotate biar gambar tetap tegak

        // Clip jadi lingkaran di tengah segitiga
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
        ctx.clip();

        if(img) ctx.drawImage(img, -size/2, -size/2, size, size);

        ctx.restore();
        ctx.restore();
    }
});