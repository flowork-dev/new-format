//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\dedupe-list\js\dedupe-engine.js total lines 121 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * DEDUPE LIST ENGINE
 * Fungsi: Menghapus baris duplikat dengan berbagai opsi
 */

window.DedupeEngine = {
    elInput: null,
    elOutput: null,

    elOptLower: null,
    elOptKeepBlanks: null,
    elOptSort: null,

    elStatInput: null,
    elStatOutput: null,
    elStatRemoved: null,

    init() {
        this.elInput = document.getElementById('input-text');
        this.elOutput = document.getElementById('output-text');

        this.elOptLower = document.getElementById('opt-lowercase');
        this.elOptKeepBlanks = document.getElementById('opt-keep-blanks');
        this.elOptSort = document.getElementById('opt-sort');

        this.elStatInput = document.getElementById('stat-input');
        this.elStatOutput = document.getElementById('stat-output');
        this.elStatRemoved = document.getElementById('stat-removed');

        if(!this.elInput) return;

        console.log("[Dedupe] Ready");
    },

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            this.elInput.value = text;
            this.process(); // Auto process on paste
        } catch(e) {
            alert("Gagal paste. Gunakan Ctrl+V");
        }
    },

    process() {
        const raw = this.elInput.value;
        if(!raw) { this.clearAll(); return; }

        let lines = raw.split(/\r?\n/);

        const originalCount = lines.length;
        const ignoreCase = this.elOptLower.checked;
        const keepBlanks = this.elOptKeepBlanks.checked;
        const doSort = this.elOptSort.checked;

        let uniqueLines = new Set();
        let finalArray = [];


        lines.forEach(line => {
            let processedLine = line;

            if (!keepBlanks) {
                processedLine = processedLine.trim(); // Hapus spasi depan belakang
                if (!processedLine) return; // Skip baris kosong total
            } else {
                processedLine = processedLine.trimEnd();
            }

            if (ignoreCase) {
                processedLine = processedLine.toLowerCase();
            }

            uniqueLines.add(processedLine);
        });

        finalArray = Array.from(uniqueLines);

        if (doSort) {
            finalArray.sort((a, b) => a.localeCompare(b));
        }

        this.elOutput.value = finalArray.join('\n');

        const finalCount = finalArray.length;
        this.elStatInput.innerText = originalCount;
        this.elStatOutput.innerText = finalCount;
        this.elStatRemoved.innerText = originalCount - finalCount;
    },

    copy() {
        const text = this.elOutput.value;
        if(!text) return;
        navigator.clipboard.writeText(text);

        const btn = document.querySelector('button[onclick="DedupeEngine.copy()"]');
        const oldHtml = btn.innerHTML;
        btn.innerHTML = "COPIED!";
        btn.classList.add("bg-white", "text-black");

        setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.classList.remove("bg-white", "text-black");
            lucide.createIcons();
        }, 1500);
    },

    clearAll() {
        this.elInput.value = "";
        this.elOutput.value = "";
        this.elStatInput.innerText = "0";
        this.elStatOutput.innerText = "0";
        this.elStatRemoved.innerText = "0";
    }
};
