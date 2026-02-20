ThemeManager.register('coding', 'PROTOCOL 3: LIVE CODING STREAM', {
    lines: [],
    // Daftar kode yang bakal muncul acak (Gw tambahin branding Flowork disini)
    codes: [
        "sudo root --force",
        "npm install hack-tool",
        "decrypting_hash...",
        "CREATED BY FLOWORK.CLOUD",  // <--- SISIPAN 1
        "ERROR 404: IDENTITY NOT FOUND",
        "Injecting SQL Database...",
        "VISIT FLOWORK.CLOUD NOW",   // <--- SISIPAN 2
        "0x1A4F memory_dump",
        "SYSTEM_OVERRIDE: TRUE",
        "brute_force_attack.exe",
        "POWERED BY NEURAL ENGINE"
    ],

    render(ctx, w, h, data, img, bgImage) {
        ctx.save();

        // 1. Render BG
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, w, h);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Gelap banget biar teks kebaca
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, w, h);
        }

        // 2. Teks Koding Berjalan
        ctx.fillStyle = '#0F0';
        ctx.font = (w < 1000 ? '14px' : '20px') + ' "Courier New", monospace';

        // Spawn baris baru secara random
        if(Math.random() > 0.8) {
            const text = "> " + this.codes[Math.floor(Math.random()*this.codes.length)];
            // Kalau teksnya branding Flowork, warnanya beda dikit (Cyan)
            const isBranding = text.includes("FLOWORK");

            this.lines.push({
                x: 20,
                y: Math.random() * h,
                text: text,
                life: 150,
                speed: Math.random()*1.5 + 0.5,
                color: isBranding ? '#54d7f6' : '#00ff00' // Highlight branding
            });
        }

        // Render & Update Lines
        this.lines.forEach((l, i) => {
            ctx.fillStyle = l.color;
            ctx.globalAlpha = l.life/150;
            ctx.fillText(l.text, l.x, l.y);

            l.life -= 1;
            l.x += l.speed; // Gerak ke kanan

            if(l.life <= 0) this.lines.splice(i,1);
        });

        ctx.globalAlpha = 1.0;

        // 3. User Image (Topeng)
        let bass = 0; for(let i=0; i<30; i++) bass+=data[i]; bass/=30;
        const cx = w/2, cy = h/2;
        const scale = (w < 800 ? 150 : 300) + (bass * 2);

        // Lingkaran Cyber di sekeliling muka
        ctx.beginPath();
        ctx.strokeStyle = '#0F0';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.arc(cx, cy, scale/1.8 + 20, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, scale/2, 0, Math.PI*2);
        ctx.clip();

        if (img) ctx.drawImage(img, -scale/2 + cx, -scale/2 + cy, scale, scale);

        // Glitch Effect di muka (VISUAL NOISE)
        // [MODIFIKASI: MATIKAN GLITCH AGAR NOISE 0]
        /* if(bass > 150) {
             ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
             ctx.fillRect(cx - scale/2, cy - scale/2, scale, scale * Math.random());
        }
        */

        ctx.restore();
        ctx.restore();
    }
});