//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\text-detox\js\detox-engine.js total lines 96 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * TEXT DETOX ENGINE
 * Prinsip: Whitelisting ASCII Only.
 * Apa yang tidak ada di keyboard standar = SAMPAH/HIDDEN CHAR.
 */

window.DetoxEngine = {
    elInput: null,
    elOutput: null,
    elCountRemoved: null,
    elCountKept: null,
    elStatus: null,

    init() {
        this.elInput = document.getElementById('input-text');
        this.elOutput = document.getElementById('output-text');
        this.elCountRemoved = document.getElementById('count-removed');
        this.elCountKept = document.getElementById('count-kept');
        this.elStatus = document.getElementById('status-badge');

        if(!this.elInput) return;

        let timeout;
        this.elInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.process(), 300);
        });

        console.log("[Detox] Engine Ready");
    },

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            this.elInput.value = text;
            this.process();
        } catch(e) {
            alert("Gagal paste otomatis. Silakan Ctrl+V manual.");
        }
    },

    process() {
        const rawText = this.elInput.value;
        if(!rawText) {
            this.resetStats();
            return;
        }


        const cleanText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, '');

        const removedCount = rawText.length - cleanText.length;

        this.elOutput.value = cleanText;
        this.elCountKept.innerText = cleanText.length;
        this.elCountRemoved.innerText = removedCount;

        if(removedCount > 0) {
            this.elStatus.innerHTML = `<span class="text-red-500 animate-pulse">DETECTED ${removedCount} GHOST CHARS!</span>`;
            this.elCountRemoved.parentElement.classList.add('animate-pulse');
            setTimeout(() => this.elCountRemoved.parentElement.classList.remove('animate-pulse'), 500);
        } else {
            this.elStatus.innerHTML = `<span class="text-[#00ff9d]">CLEAN TEXT</span>`;
        }
    },

    copy() {
        const text = this.elOutput.value;
        if(!text) return;
        navigator.clipboard.writeText(text);

        const originalBtn = document.querySelector('button[onclick="DetoxEngine.copy()"]').innerHTML;
        const btn = document.querySelector('button[onclick="DetoxEngine.copy()"]');
        btn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> TERSALIN!`;
        btn.classList.add('bg-[#00ff9d]', 'text-black');

        setTimeout(() => {
            btn.innerHTML = originalBtn;
            btn.classList.remove('bg-[#00ff9d]', 'text-black');
            lucide.createIcons();
        }, 2000);
    },

    resetStats() {
        this.elOutput.value = "";
        this.elCountRemoved.innerText = "0";
        this.elCountKept.innerText = "0";
        this.elStatus.innerHTML = "READY";
    }
};
