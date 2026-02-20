ThemeManager.register('reactor', 'PROTOCOL 4: ATOMIC REACTOR', {
    particles: [],
    angle: 0,

    render(ctx, w, h, data, img, bgImage) {
        // --- 1. SETUP & BACKGROUND ---
        ctx.save();

        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            // Overlay Merah Gelap (Clean)
            ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
            ctx.fillRect(0, 0, w, h);
        } else {
            // Default Background Solid (No Noise)
            ctx.fillStyle = '#050000';
            ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();

        // --- 2. AUDIO DATA ---
        let bass = 0;
        for(let i=0; i<40; i++) bass += data[i];
        bass /= 40;

        const cx = w/2, cy = h/2;
        const scale = (w < 800 ? 150 : 300) + (bass * 3); // Ukuran core

        ctx.save();
        ctx.translate(cx, cy);

        // --- 3. PARTICLE SYSTEM (EXPLOSION) ---
        // Partikel tetap ada karena ini elemen visual, bukan noise glitch
        if(bass > 180) {
            for(let i=0; i<5; i++) {
                const ang = Math.random() * Math.PI * 2;
                const speed = Math.random() * 10 + 5;
                this.particles.push({
                    x: Math.cos(ang) * (scale/2),
                    y: Math.sin(ang) * (scale/2),
                    vx: Math.cos(ang) * speed,
                    vy: Math.sin(ang) * speed,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#ff4d4d' : '#ff9f43'
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.arc(p.x, p.y, (bass/20) * p.life, 0, Math.PI * 2);
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;

            if (p.life <= 0) this.particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;


        // --- 4. ROTATING RINGS (WARNING SIGNS) ---
        this.angle += 0.02 + (bass / 5000); // Muter halus

        // Ring Luar
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.strokeStyle = '#ff4d4d';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 40]);
        ctx.arc(0, 0, scale * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Ring Dalam
        ctx.rotate(-this.angle * 2);
        ctx.beginPath();
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.arc(0, 0, scale * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Reset Rotasi
        ctx.setLineDash([]);
        ctx.rotate(this.angle);

        // --- 5. CORE IMAGE (USER MASK) ---

        // [MODIFIKASI: MATIKAN SHAKE CORE]
        let shake = 0;
        // if(bass > 200) shake = Math.random() * 10 - 5; // Dulu ada ini

        ctx.beginPath();
        ctx.arc(shake, shake, scale/2.5, 0, Math.PI*2);
        ctx.clip();

        if(img) {
            ctx.drawImage(img, -scale/2.5 + shake, -scale/2.5 + shake, scale*0.8, scale*0.8);
        } else {
            ctx.fillStyle = '#330000'; ctx.fill();
            ctx.fillStyle = '#ff0000'; ctx.textAlign = 'center'; ctx.font="bold 20px Arial";
            ctx.fillText("DANGER", 0, 5);
        }

        // Overlay Merah (Tetap ada tapi smooth)
        if(bass > 150) {
            ctx.fillStyle = `rgba(255, 0, 0, ${(bass-150)/300})`; // Lebih subtle transparansinya
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillRect(-scale, -scale, scale*2, scale*2);
        }

        ctx.restore();

        // --- 6. TEXT HUD ---
        ctx.save();
        ctx.fillStyle = '#ff4d4d';
        ctx.font = "bold 16px monospace";
        ctx.fillText(`CORE TEMP: ${Math.floor(bass * 10)}°C`, 20, 40);

        // Bar Meter Sederhana
        ctx.fillStyle = '#330000';
        ctx.fillRect(20, 50, 200, 10);
        ctx.fillStyle = bass > 200 ? '#ff0000' : '#ff9f43';
        ctx.fillRect(20, 50, bass * 0.8, 10);
        ctx.restore();
    }
});