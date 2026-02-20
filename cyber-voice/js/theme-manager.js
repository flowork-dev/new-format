//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\cyber-voice\js\theme-manager.js total lines 99
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * THEME MANAGER V14 (STABLE EDITION)
 * - Menghapus semua hujan kode (Matrix dihapus total).
 * - Menambahkan Watermark "flowork.cloud" di pojok bawah dengan efek kedip (Pulse).
 */
window.ThemeManager = {
    themes: {},
    activeThemeId: 'hacker',

    pulseValue: 0,
    pulseDir: 1,

    init() {
        console.log("[THEME MANAGER] Back to Stable Mode. Watermark Active.");
        this.refreshDropdown();
    },

    register(id, name, renderLogic) {
        if (typeof renderLogic.render !== 'function') return;
        this.themes[id] = { name, ...renderLogic };
        this.refreshDropdown();
    },

    render(ctx, w, h, data, img, bgImage) {
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        ctx.filter = 'none';
        ctx.clearRect(0, 0, w, h);

        let theme = this.themes[this.activeThemeId];
        if (!theme) theme = this.internalHackerTheme;

        try {
            ctx.save();
            theme.render(ctx, w, h, data, img, bgImage);
            ctx.restore();
        } catch (e) {
            console.error(`[THEME CRASH] ${theme.name}:`, e);
        }

        this.renderWatermark(ctx, w, h);
    },

    renderWatermark(ctx, w, h) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.pulseValue += 0.02 * this.pulseDir;
        if (this.pulseValue > 1) { this.pulseValue = 1; this.pulseDir = -1; }
        if (this.pulseValue < 0.2) { this.pulseValue = 0.2; this.pulseDir = 1; }

        const fontSize = w < 800 ? 12 : 16;
        ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
        ctx.textAlign = "center";

        ctx.fillStyle = `rgba(255, 255, 255, ${this.pulseValue * 0.4})`;

        ctx.fillText("create by flowork.cloud", w / 2, h - 30);

        ctx.restore();
    },

    refreshDropdown() {
        const select = document.getElementById('theme-select');
        if (!select) return;
        const current = select.value;
        select.innerHTML = '';
        if (Object.keys(this.themes).length === 0) {
            this.register('hacker', 'PROTOCOL 1: ANONYMOUS (CORE)', this.internalHackerTheme.render);
        }
        Object.keys(this.themes).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key; opt.innerText = this.themes[key].name;
            select.appendChild(opt);
        });
        if (this.themes[current]) select.value = current;
        else select.value = this.activeThemeId;
        select.onchange = (e) => { this.activeThemeId = e.target.value; };
    },

    internalHackerTheme: {
        name: "INTERNAL CORE",
        render(ctx, w, h, data, img, bgImage) {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#0f0'; ctx.textAlign = 'center';
            ctx.fillText("SYSTEM OK", w/2, h/2);
        }
    }
};
