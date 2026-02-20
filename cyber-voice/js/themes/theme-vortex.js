ThemeManager.register('vortex', 'PROTOCOL 13: HYPNO ZONE', {
    rot: 0,
    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Logic
        if(bgImage) ctx.drawImage(bgImage, 0, 0, w, h);
        else { ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h); }

        let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
        const cx = w/2, cy = h/2;

        // ROTATION LOGIC (Smooth Spin)
        this.rot += 0.02 + (bass / 2000);

        ctx.translate(cx, cy);
        ctx.rotate(this.rot);

        // 2. DRAW SPIRAL ARMS
        const arms = 8;
        const maxRad = Math.max(w, h) * 1.5; // Lebih besar biar nutup layar

        for(let i=0; i<arms; i++) {
            ctx.rotate((Math.PI * 2) / arms);
            ctx.beginPath();
            ctx.moveTo(0, 0);

            // Warna selang seling Transparan (Tanpa Flash Kasar)
            // Menggunakan opacity rendah biar tidak sakit mata
            ctx.fillStyle = (i % 2 === 0) ? `rgba(255, 0, 100, ${bass/400})` : `rgba(100, 0, 255, ${bass/400})`;

            // Gambar Segitiga Spiral
            ctx.lineTo(maxRad, -maxRad/4);
            ctx.lineTo(maxRad, maxRad/4);
            ctx.fill();
        }

        // 3. STATIC CENTER (User Image Stabil)
        // Reset Transformasi total agar gambar diam di tengah
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(cx, cy);

        // Pulsating Border
        const scale = (w < 800 ? 150 : 250) + (bass/2);
        ctx.beginPath();
        ctx.arc(0, 0, scale/2, 0, Math.PI*2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.clip();

        if(img) ctx.drawImage(img, -scale/2, -scale/2, scale, scale);

        ctx.restore();
    }
});