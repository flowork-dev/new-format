({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        isLoading: true,
        currency: 'IDR',
        taxRate: 0,
        discount: 0,
        items: [
            { desc: 'Tactical Consultation', qty: 1, price: 2500000 }
        ],
        invoiceMeta: {
            number: 'INV/2026/001',
            date: new Date().toISOString().split('T')[0],
            term: 'Due on Receipt',
            notes: ''
        },
        profile: {
            name: '',
            email: '',
            address: ''
        },
        client: {
            name: '',
            email: '',
            address: ''
        }
    },
    sys: null,
    observer: null,

    // DEFINISI TEMA (Mengadopsi warna Tactical: Purple & Cyan)
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 16, 22, 0.95)',
            '--glass-border': '1px solid rgba(112, 107, 243, 0.3)',
            '--txt': '#e0f0ff',
            '--txt-dim': '#8a8db1',
            '--prm': '#706bf3', // Neon Purple
            '--scs': '#54d7f6', // Neon Cyan
            '--err': '#ef4444',
            '--brd': 'rgba(112, 107, 243, 0.2)',
            '--surface': 'rgba(26, 27, 38, 0.8)',
            '--shadow': '0 10px 30px -5px rgba(0, 0, 0, 0.8)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#4f46e5',
            '--scs': '#06b6d4',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(241, 245, 249, 1)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }
    },

    mount(sys) {
        this.sys = sys;

        // Cek History Visit
        const hasVisited = localStorage.getItem('app_visited_invoice_tactical');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }

        // Load Data Profile Tersimpan
        const savedProfile = localStorage.getItem('flowork_invoice_profile');
        if(savedProfile) {
            try { this.state.profile = JSON.parse(savedProfile); } catch(e){}
        }

        this.render();
        this.loadDependencies();

        // Theme Observer
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'data-theme') {
                    this.onThemeChange(document.documentElement.getAttribute('data-theme'));
                }
            });
        });
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        const root = this.sys.root;
        for (const [key, value] of Object.entries(theme)) root.style.setProperty(key, value);
    },

    loadDependencies() {
        // Load Font Awesome & Google Fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        this.sys.root.appendChild(fontLink);

        const gFont = document.createElement('link');
        gFont.rel = 'stylesheet';
        gFont.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Inter:wght@300;400;600;800&display=swap';
        this.sys.root.appendChild(gFont);

        // Load jsPDF
        const script1 = document.createElement('script');
        script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = () => {
            // Load AutoTable
            const script2 = document.createElement('script');
            script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
            script2.onload = () => {
                this.state.isLoading = false;
                if(this.state.currentView === 'main') this.render();
            };
            this.sys.root.appendChild(script2);
        };
        this.sys.root.appendChild(script1);
    },

    // --- PROTOKOL DOWNLOAD HYBRID (WAJIB - ANTI GAGAL) ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving invoice to device...", "info");
            this.sys.download(blob, filename, mimeType);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        }
    },

    // --- LOGIC ---

    formatMoney(amount) {
        const prefix = this.state.currency === 'IDR' ? 'Rp ' : '$ ';
        return prefix + amount.toLocaleString(this.state.currency === 'IDR' ? 'id-ID' : 'en-US');
    },

    calculateTotal() {
        const subtotal = this.state.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
        const taxAmount = subtotal * (this.state.taxRate / 100);
        const total = subtotal + taxAmount - this.state.discount;
        return { subtotal, taxAmount, total };
    },

    // Update tampilan angka tanpa re-render penuh (Optimasi UX)
    updateLiveTotals() {
        const { subtotal, taxAmount, total } = this.calculateTotal();
        const root = this.sys.root;

        const elSub = root.querySelector('#val-subtotal');
        const elTax = root.querySelector('#val-tax');
        const elDisc = root.querySelector('#val-discount');
        const elTotal = root.querySelector('#val-total');

        if(elSub) elSub.innerText = this.formatMoney(subtotal);
        if(elTax) elTax.innerText = this.formatMoney(taxAmount);
        if(elDisc) elDisc.innerText = '-' + this.formatMoney(this.state.discount);
        if(elTotal) elTotal.innerText = this.formatMoney(total);
    },

    generatePDF() {
        if(!window.jspdf) {
            this.sys.toast("Engine initializing... please wait.", "error");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const { number } = this.state.invoiceMeta;
        const { subtotal, taxAmount, total } = this.calculateTotal();

        // Header
        doc.setFontSize(26);
        doc.setTextColor(112, 107, 243); // Tactical Purple
        doc.text("INVOICE", 20, 30);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`#${number}`, 20, 38);

        // Sender Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(this.state.profile.name || 'SENDER NAME', 20, 50);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(this.state.profile.email || '', 20, 55);

        // Client Info (Right Aligned)
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(this.state.client.name || 'CLIENT NAME', 190, 50, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(this.state.client.email || '', 190, 55, { align: 'right' });

        // Table
        doc.autoTable({
            startY: 70,
            head: [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
            body: this.state.items.map(i => [
                i.desc,
                i.qty,
                this.formatMoney(i.price),
                this.formatMoney(i.qty * i.price)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [112, 107, 243] },
            styles: { font: 'helvetica', fontSize: 10 }
        });

        const finalY = doc.lastAutoTable.finalY + 10;

        // Totals
        doc.setFontSize(10);
        doc.text(`Subtotal:`, 140, finalY);
        doc.text(this.formatMoney(subtotal), 190, finalY, { align: 'right' });

        doc.text(`Tax (${this.state.taxRate}%):`, 140, finalY + 5);
        doc.text(this.formatMoney(taxAmount), 190, finalY + 5, { align: 'right' });

        doc.text(`Discount:`, 140, finalY + 10);
        doc.text(`-${this.formatMoney(this.state.discount)}`, 190, finalY + 10, { align: 'right' });

        doc.setFontSize(14);
        doc.setTextColor(112, 107, 243);
        doc.text(`TOTAL:`, 140, finalY + 20);
        doc.text(this.formatMoney(total), 190, finalY + 20, { align: 'right' });

        // Footer Note
        if(this.state.invoiceMeta.notes) {
             doc.setFontSize(8);
             doc.setTextColor(150);
             doc.text(`Notes: ${this.state.invoiceMeta.notes}`, 20, 280);
        }

        // Output Blob
        const pdfBlob = doc.output('blob');
        this.saveToDevice(pdfBlob, `INVOICE_${number.replace(/\//g, '-')}.pdf`, 'application/pdf');
    },

    // --- ACTIONS ---

    enterApp() {
        this.state.isFirstVisit = false;
        this.state.currentView = 'main';
        localStorage.setItem('app_visited_invoice_tactical', 'true');
        this.render();
    },

    addItem() {
        this.state.items.push({ desc: '', qty: 1, price: 0 });
        this.render(); // Re-render untuk menambah baris DOM
    },

    removeItem(index) {
        this.state.items.splice(index, 1);
        this.render(); // Re-render untuk hapus baris
    },

    updateItem(index, key, value) {
        // Update state tanpa re-render penuh agar fokus input tidak hilang
        this.state.items[index][key] = (key === 'qty' || key === 'price') ? parseFloat(value || 0) : value;
        this.updateLiveTotals();
    },

    saveProfile() {
        localStorage.setItem('flowork_invoice_profile', JSON.stringify(this.state.profile));
        this.sys.toast("Sender profile secured locally.", "success");
    },

    // --- RENDERERS ---

    renderLander() {
        return `
            <div class="glass-panel fade-in lander-container">
                <div class="lander-icon">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <h1 class="orbitron-title">
                    INVOICE <span style="color: var(--prm);">TACTICAL</span>
                </h1>
                <p class="lander-desc">
                    Military-grade billing system for professionals. Secure local data, clean PDF exports, and precise calculations.
                </p>
                <div class="tags-container">
                    <div class="tag">NO WATERMARK</div>
                    <div class="tag">USD & IDR</div>
                    <div class="tag">SECURE</div>
                </div>
                <button id="btn-enter" class="btn btn-block" style="margin-top: 40px;">
                    INITIALIZE SYSTEM
                </button>
            </div>
        `;
    },

    renderMainApp() {
        if(this.state.isLoading) {
             return `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p class="loading-text">LOADING MODULES...</p>
                </div>
             `;
        }

        const { subtotal, taxAmount, total } = this.calculateTotal();

        // Template List Item
        const itemsHtml = this.state.items.map((item, index) => `
            <div class="item-row">
                <input type="text" class="tac-input item-desc" data-index="${index}" value="${item.desc}" placeholder="Item Name">
                <input type="number" class="tac-input item-qty" data-index="${index}" value="${item.qty}" placeholder="1">
                <input type="number" class="tac-input item-price" data-index="${index}" value="${item.price}" placeholder="0">
                <button class="btn-remove" data-index="${index}">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            </div>
        `).join('');

        return `
            <div class="fade-in main-layout">

                <div class="glass-panel paper-preview">

                    <div class="paper-header">
                        <div>
                            <div class="accent-bar"></div>
                            <h2 class="invoice-title">INVOICE</h2>
                            <div class="ref-wrapper">
                                <span class="label-tiny">REF:</span>
                                <input id="inp-number" type="text" value="${this.state.invoiceMeta.number}" class="input-ref">
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="meta-field">
                                <label class="label-tiny">Date</label>
                                <input id="inp-date" type="date" value="${this.state.invoiceMeta.date}" class="input-clean right">
                            </div>
                             <div class="meta-field">
                                <label class="label-tiny">Terms</label>
                                <select id="inp-term" class="input-clean right pointer">
                                    <option ${this.state.invoiceMeta.term === 'Due on Receipt' ? 'selected' : ''}>Due on Receipt</option>
                                    <option ${this.state.invoiceMeta.term === 'NET 15' ? 'selected' : ''}>NET 15</option>
                                    <option ${this.state.invoiceMeta.term === 'NET 30' ? 'selected' : ''}>NET 30</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="entities-grid">
                        <div>
                            <label class="label-section">FROM (ORIGIN)</label>
                            <input id="inp-sender-name" class="input-clean heading" type="text" placeholder="YOUR NAME / COMPANY" value="${this.state.profile.name}">
                            <input id="inp-sender-email" class="input-clean sub" type="text" placeholder="email@domain.com" value="${this.state.profile.email}">
                            <textarea id="inp-sender-addr" class="input-clean meta" rows="2" placeholder="Street Address, City, Zip">${this.state.profile.address}</textarea>
                            <button id="btn-save-profile" class="btn-text-action">
                                <i class="fa-solid fa-floppy-disk"></i> Save Profile
                            </button>
                        </div>
                        <div style="text-align: right;">
                            <label class="label-section">TO (TARGET)</label>
                            <input id="inp-client-name" class="input-clean heading right" type="text" placeholder="CLIENT NAME" value="${this.state.client.name}">
                            <input id="inp-client-email" class="input-clean sub right" type="text" placeholder="client@target.com" value="${this.state.client.email}">
                            <textarea id="inp-client-addr" class="input-clean meta right" rows="2" placeholder="Client Address">${this.state.client.address}</textarea>
                        </div>
                    </div>

                    <div class="items-header">
                        <span>Description</span>
                        <span class="center">Qty</span>
                        <span class="right">Price</span>
                        <span></span>
                    </div>

                    <div id="items-container">
                        ${itemsHtml}
                    </div>

                    <button id="btn-add-item" class="btn-dashed">
                        + ADD LINE ITEM
                    </button>

                    <div class="footer-calc">
                        <div class="notes-area">
                            <label class="label-tiny">Notes / Payment Info</label>
                            <textarea id="inp-notes" class="input-area" placeholder="Bank Details: ...">${this.state.invoiceMeta.notes}</textarea>
                        </div>

                        <div class="totals-area">
                             <div class="calc-settings">
                                <div>
                                    <label class="label-tiny-dark">Tax (%)</label>
                                    <input id="inp-tax" type="number" class="tac-input small" value="${this.state.taxRate}">
                                </div>
                                <div>
                                    <label class="label-tiny-dark">Discount</label>
                                    <input id="inp-disc" type="number" class="tac-input small" value="${this.state.discount}">
                                </div>
                             </div>

                             <div class="summary-row">
                                <span>Subtotal</span>
                                <span id="val-subtotal">${this.formatMoney(subtotal)}</span>
                             </div>
                             <div class="summary-row">
                                <span>Tax</span>
                                <span id="val-tax">${this.formatMoney(taxAmount)}</span>
                             </div>
                              <div class="summary-row discount">
                                <span>Discount</span>
                                <span id="val-discount">-${this.formatMoney(this.state.discount)}</span>
                             </div>
                             <div class="total-box">
                                <span class="total-label">Total Due</span>
                                <span id="val-total" class="total-value">${this.formatMoney(total)}</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="glass-panel controls-dock">
                    <div class="currency-group">
                         <button id="btn-curr-idr" class="curr-btn ${this.state.currency === 'IDR' ? 'active' : ''}">IDR</button>
                         <button id="btn-curr-usd" class="curr-btn ${this.state.currency === 'USD' ? 'active' : ''}">USD</button>
                    </div>
                    <button id="btn-export" class="btn btn-glow">
                        <i class="fa-solid fa-file-pdf"></i> EXPORT PDF
                    </button>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        // Lander
        const btnEnter = root.querySelector('#btn-enter');
        if(btnEnter) btnEnter.onclick = () => this.enterApp();

        // Actions
        const btnAdd = root.querySelector('#btn-add-item');
        if(btnAdd) btnAdd.onclick = () => this.addItem();

        const btnExport = root.querySelector('#btn-export');
        if(btnExport) btnExport.onclick = () => this.generatePDF();

        const btnSaveProfile = root.querySelector('#btn-save-profile');
        if(btnSaveProfile) btnSaveProfile.onclick = () => this.saveProfile();

        // Currency
        const btnIdr = root.querySelector('#btn-curr-idr');
        if(btnIdr) btnIdr.onclick = () => { this.state.currency = 'IDR'; this.render(); };
        const btnUsd = root.querySelector('#btn-curr-usd');
        if(btnUsd) btnUsd.onclick = () => { this.state.currency = 'USD'; this.render(); };

        // Item Inputs (Direct Binding for Performance)
        root.querySelectorAll('.item-desc').forEach(el => {
            el.oninput = (e) => { this.state.items[e.target.dataset.index].desc = e.target.value; };
        });
        root.querySelectorAll('.item-qty').forEach(el => {
            el.oninput = (e) => this.updateItem(e.target.dataset.index, 'qty', e.target.value);
        });
        root.querySelectorAll('.item-price').forEach(el => {
            el.oninput = (e) => this.updateItem(e.target.dataset.index, 'price', e.target.value);
        });
        root.querySelectorAll('.btn-remove').forEach(el => {
            el.onclick = (e) => this.removeItem(e.currentTarget.dataset.index);
        });

        // Meta Inputs
        const bindMeta = (id, stateKey, subKey) => {
            const el = root.querySelector(id);
            if(el) el.oninput = (e) => {
                if(subKey) this.state[stateKey][subKey] = e.target.value;
                else {
                    this.state[stateKey] = parseFloat(e.target.value) || 0;
                    this.updateLiveTotals();
                }
            };
        };

        bindMeta('#inp-number', 'invoiceMeta', 'number');
        bindMeta('#inp-date', 'invoiceMeta', 'date');
        bindMeta('#inp-term', 'invoiceMeta', 'term');
        bindMeta('#inp-notes', 'invoiceMeta', 'notes');

        bindMeta('#inp-sender-name', 'profile', 'name');
        bindMeta('#inp-sender-email', 'profile', 'email');
        bindMeta('#inp-sender-addr', 'profile', 'address');

        bindMeta('#inp-client-name', 'client', 'name');
        bindMeta('#inp-client-email', 'client', 'email');
        bindMeta('#inp-client-addr', 'client', 'address');

        bindMeta('#inp-tax', 'taxRate');
        bindMeta('#inp-disc', 'discount');

        // Prevent Click-through
        root.querySelectorAll('button, input, textarea, select, .glass-panel').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });
    },

    render() {
        const { currentView } = this.state;
        const content = currentView === 'lander' ? this.renderLander() : this.renderMainApp();

        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                /* CORE LAYOUT */
                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Inter', sans-serif;
                    overflow-y: scroll; overflow-x: hidden;
                    padding-top: 50px; padding-bottom: 90px;
                    scrollbar-width: none; -ms-overflow-style: none;
                }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit {
                    width: 100%; max-width: 900px; margin: 0 auto;
                    padding: 20px; box-sizing: border-box;
                    flex: 1; display: flex; flex-direction: column;
                }

                /* GLASS PANEL */
                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 16px; padding: 25px;
                    box-shadow: var(--shadow);
                }

                /* BUTTONS */
                .btn {
                    background: var(--prm); color: #fff; border: none;
                    padding: 12px 24px; border-radius: 8px; cursor: pointer;
                    font-weight: 700; transition: transform 0.2s, box-shadow 0.2s;
                    font-family: 'Orbitron', sans-serif; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.95); }
                .btn-glow:hover { box-shadow: 0 0 15px var(--prm); }
                .btn-block { width: 100%; display: block; }
                .btn-dashed {
                    width: 100%; padding: 12px; border: 1px dashed var(--txt-dim);
                    background: transparent; color: var(--txt-dim);
                    font-size: 11px; font-weight: 700; cursor: pointer;
                    border-radius: 6px; margin-top: 15px; transition: 0.2s;
                }
                .btn-dashed:hover { border-color: var(--prm); color: var(--prm); }
                .btn-text-action {
                    font-size: 10px; color: var(--scs); background: transparent;
                    border: none; font-weight: 800; cursor: pointer;
                    text-transform: uppercase; margin-top: 5px;
                }

                /* LANDER */
                .lander-container { text-align: center; margin-top: 5vh; }
                .lander-icon {
                    width: 80px; height: 80px; margin: 0 auto 20px;
                    background: rgba(112, 107, 243, 0.1); border: 1px solid var(--prm);
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-size: 30px; color: var(--prm);
                }
                .orbitron-title { font-family: 'Orbitron'; font-weight: 900; font-size: 2rem; margin: 0 0 10px; color: var(--txt); }
                .lander-desc { color: var(--txt-dim); font-size: 0.9rem; max-width: 400px; margin: 0 auto 30px; line-height: 1.6; }
                .tags-container { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
                .tag {
                    background: var(--surface); padding: 5px 10px; border-radius: 4px;
                    font-size: 10px; font-family: 'Share Tech Mono'; color: var(--scs);
                }

                /* MAIN APP */
                .main-layout { display: flex; flex-direction: column; gap: 20px; }
                .paper-preview { background: #fff; color: #1e293b; position: relative; } /* Paper always white */

                .paper-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; gap: 20px; }
                .accent-bar { width: 60px; height: 6px; background: var(--prm); margin-bottom: 15px; }
                .invoice-title { font-family: 'Orbitron'; font-size: 2.5rem; font-weight: 900; line-height: 1; margin: 0; color: #1a1b26; }
                .ref-wrapper { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
                .input-ref {
                    background: rgba(112, 107, 243, 0.1); border: none; padding: 4px 8px;
                    color: var(--prm); font-weight: 800; font-family: 'Share Tech Mono';
                    width: 140px; border-radius: 4px; outline: none;
                }

                .entities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px dashed #e2e8f0; }

                /* CLEAN INPUTS (Paper Style) */
                .input-clean { width: 100%; background: transparent; border: none; outline: none; font-family: 'Inter', sans-serif; display: block; margin-bottom: 2px; }
                .input-clean.heading { font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
                .input-clean.sub { font-size: 12px; font-weight: 500; color: #64748b; }
                .input-clean.meta { font-size: 11px; color: #94a3b8; resize: none; }
                .input-clean.right { text-align: right; }
                .input-clean.pointer { cursor: pointer; }

                .label-tiny { display: block; font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
                .label-tiny-dark { display: block; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                .label-section { display: block; font-size: 10px; font-weight: 900; color: var(--prm); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }

                /* ITEMS TABLE */
                .items-header {
                    background: #1e293b; padding: 10px; border-radius: 6px;
                    display: grid; grid-template-columns: 1fr 60px 100px 30px; gap: 10px;
                    margin-bottom: 15px;
                }
                .items-header span { font-size: 10px; font-weight: 800; color: #fff; text-transform: uppercase; }
                .items-header span.center { text-align: center; }
                .items-header span.right { text-align: right; }

                .item-row {
                    display: grid; grid-template-columns: 1fr 60px 100px 30px; gap: 10px;
                    margin-bottom: 8px; align-items: center;
                }
                .tac-input {
                    background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px;
                    font-family: 'Share Tech Mono'; font-size: 12px; color: #334155; width: 100%; outline: none;
                }
                .tac-input:focus { border-color: var(--prm); background: #fff; }
                .tac-input.small { padding: 5px; }

                .btn-remove { background: transparent; border: none; color: var(--err); cursor: pointer; font-size: 14px; }

                /* FOOTER */
                .footer-calc { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; flex-wrap: wrap; gap: 20px; }
                .notes-area { flex: 1; min-width: 200px; }
                .input-area { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-size: 11px; color: #475569; outline: none; resize: none; min-height: 80px; }

                .totals-area { width: 250px; }
                .calc-settings { display: flex; gap: 10px; margin-bottom: 15px; }
                .summary-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 5px; }
                .summary-row.discount { color: var(--err); }

                .total-box {
                    background: #1e293b; color: #fff; padding: 15px; border-radius: 8px;
                    display: flex; justify-content: space-between; align-items: center; margin-top: 10px;
                }
                .total-label { font-size: 10px; font-weight: 800; text-transform: uppercase; }
                .total-value { font-size: 18px; font-weight: 900; }

                /* CONTROLS DOCK */
                .controls-dock { display: flex; gap: 15px; justify-content: space-between; align-items: center; }
                .currency-group { display: flex; gap: 10px; }
                .curr-btn {
                    background: rgba(255,255,255,0.05); border: 1px solid var(--brd); color: var(--txt-dim);
                    padding: 8px 16px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;
                }
                .curr-btn.active { background: var(--prm); color: #fff; border-color: var(--prm); }

                /* ANIMATION */
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .loading-container { text-align: center; margin-top: 20vh; }
                .spinner {
                    width: 40px; height: 40px; margin: 0 auto;
                    border: 3px solid var(--prm); border-top-color: transparent;
                    border-radius: 50%; animation: spin 1s linear infinite;
                }
                .loading-text { margin-top: 20px; font-family: 'Orbitron'; font-size: 12px; letter-spacing: 2px; color: var(--txt-dim); }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                /* MOBILE */
                @media (max-width: 600px) {
                    .entities-grid { grid-template-columns: 1fr; gap: 20px; }
                    .entities-grid > div { text-align: left !important; }
                    .input-clean.right, .input-clean.meta.right { text-align: left; }
                    .footer-calc { flex-direction: column; align-items: stretch; }
                    .totals-area { width: 100%; }
                }
            </style>
        `;
        this.bindEvents();
    }
})