ThemeManager.register('sonar', 'PROTOCOL 8: TARGET LOCK', {
    sweepAngle: 0,
    blips: [], // Titik-titik target

    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. BG Night Vision (Clean)
        if(bgImage) {
             ctx.drawImage(bgImage, 0, 0, w, h);
             ctx.fillStyle = 'rgba(0, 50, 20, 0.8)'; // Hijau Gelap Overlay
             ctx.fillRect(0,0,w,h);
        } else {
             // Solid Dark Green (No Static Noise)
             ctx.fillStyle = '#001a00';
             ctx.fillRect(0,0,w,h);
        }

        let bass = 0; for(let i=0; i<30; i++) bass += data[i]; bass/=30;
        const cx = w/2, cy = h/2;
        const radius = w < 800 ? 250 : 450;

        // 2. RADAR RINGS (Grid Stabil)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        ctx.beginPath(); ctx.arc(cx, cy, radius * 0.25, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, radius * 0.5, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, radius * 0.75, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.stroke();

        // Crosshair
        ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius); ctx.stroke();

        // 3. USER IMAGE (Target Tengah - Stabil/No Shake)
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, radius * 0.2, 0, Math.PI*2); ctx.clip();

        if(img) {
            // Gambar diam di tengah
            ctx.drawImage(img, cx - radius*0.2, cy - radius*0.2, radius*0.4, radius*0.4);
            // Overlay Grid halus di atas muka
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; ctx.fill();
        }
        ctx.restore();

        // 4. RADAR SWEEP (Jarum Muter Halus)
        this.sweepAngle += 0.05;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.sweepAngle);

        // Gradient Sweep Clean
        let grd = ctx.createLinearGradient(0, 0, radius, 0);
        grd.addColorStop(0, "rgba(0, 255, 0, 0)");
        grd.addColorStop(1, "rgba(0, 255, 0, 0.8)");

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0, 0, radius, 0, 0.2); // Sektor kecil
        ctx.lineTo(0,0);
        ctx.fill();
        ctx.restore();

        // 5. BLIPS (Titik Musuh - Visual Element)
        if(bass > 160 && Math.random() > 0.7) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (Math.random() * radius * 0.8) + (radius * 0.2);
            this.blips.push({x: Math.cos(angle)*dist, y: Math.sin(angle)*dist, life: 1.0});
        }

        // Render Blips
        ctx.fillStyle = '#ff0000'; // Target Merah
        for(let i=this.blips.length-1; i>=0; i--) {
            let b = this.blips[i];
            ctx.globalAlpha = b.life;
            ctx.beginPath();
            ctx.arc(cx + b.x, cy + b.y, 5, 0, Math.PI*2);
            ctx.fill();
            b.life -= 0.02;
            if(b.life <= 0) this.blips.splice(i,1);
        }

        ctx.restore();
    }
});