ThemeManager.register('warp', 'PROTOCOL 11: WARP DRIVE', {
    stars: [],

    // Init bintang (Lazy load)
    initStars(w, h) {
        for(let i=0; i<200; i++) {
            this.stars.push({
                x: Math.random() * w - w/2,
                y: Math.random() * h - h/2,
                z: Math.random() * w
            });
        }
    },

    render(ctx, w, h, data, img, bgImage) {
        if(this.stars.length === 0) this.initStars(w, h);

        ctx.save();

        // 1. BG Space (Clean)
        if(bgImage) {
             ctx.drawImage(bgImage, 0, 0, w, h);
             ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,w,h);
        } else {
             ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
        }

        let bass = 0; for(let i=0; i<40; i++) bass += data[i]; bass/=40;
        const cx = w/2, cy = h/2;

        // Kecepatan bintang based on audio (Smooth)
        const speed = 5 + (bass / 5);

        ctx.translate(cx, cy);

        // 2. RENDER STARS
        ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            // Move star towards screen
            s.z -= speed;

            // Respawn jika lewat layar
            if(s.z <= 0) {
                s.z = w;
                s.x = Math.random() * w - w/2;
                s.y = Math.random() * h - h/2;
            }

            // Project 3D to 2D
            const k = 128.0 / s.z;
            const px = s.x * k;
            const py = s.y * k;

            // Ukuran bintang makin dekat makin gede
            const size = (1 - s.z / w) * 5;

            // Draw Trail (Efek ngebut - Halus)
            if(bass > 100) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - s.z/w)})`;
                ctx.lineWidth = size;
                ctx.moveTo(px, py);
                ctx.lineTo(px * 1.1, py * 1.1); // Trail ke luar
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI*2);
            ctx.fill();
        });

        // 3. BLACK HOLE / PLANET (USER IMAGE) - Stabil
        const scale = (w < 800 ? 150 : 300) + (bass/4);

        // Aura (Gradient Halus)
        let grad = ctx.createRadialGradient(0, 0, scale/2, 0, 0, scale);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(100, 200, 255, ${bass/255})`);

        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, scale, 0, Math.PI*2); ctx.fill();

        // Image Crop Circle
        ctx.beginPath(); ctx.arc(0, 0, scale/2, 0, Math.PI*2); ctx.clip();

        if(img) ctx.drawImage(img, -scale/2, -scale/2, scale, scale);
        else { ctx.fillStyle='#000'; ctx.fill(); }

        ctx.restore();
    }
});