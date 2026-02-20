({
    state: {
        isFirstVisit: true,
        currentView: 'lander',

        // Data Struk
        store: {
            name: "STARBUCKS COFFEE",
            address: "Grand Indonesia Mall, West Mall, Ground Floor. Jl. M.H. Thamrin No.1",
            cashier: "John Doe",
            txId: "TX-9928371",
            footer: "Thank you for your visit. Customer Service: 0812-3456-7890",
            taxRate: 10,
            discount: 0
        },
        items: [
            { name: "Caramel Macchiato", qty: 1, price: 55000 },
            { name: "Asian Dolce Latte", qty: 2, price: 48000 }
        ],
        dateTime: {
            isAuto: true,
            date: "",
            time: ""
        },

        // UI State
        activeModal: null,

        // Viewport State (Zoom & Pan)
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        isDragging: false,
        startPan: { x: 0, y: 0 },
        lastPinchDist: 0 // Untuk tracking cubitan
    },

    sys: null,
    observer: null,
    canvasLoaded: false,

    // THEME DEFINITIONS
    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(255, 255, 255, 0.1)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#54d7f6', // Neon Cyan
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.1)',
            '--surface': 'rgba(255, 255, 255, 0.05)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            '--paper': '#ffffff',
            '--ink': '#000000'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#007aff',
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '--paper': '#f0f0f0',
            '--ink': '#1a1a1a'
        }
    },

    mount(sys) {
        this.sys = sys;
        const hasVisited = localStorage.getItem('app_visited_struk_tactical');
        if (hasVisited) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }

        this.loadDependencies().then(() => {
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            this.render();

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
            this.bindEvents();
        });
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
        return new Promise((resolve) => {
            if (window.html2canvas) {
                this.canvasLoaded = true;
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
            script.onload = () => {
                this.canvasLoaded = true;
                resolve();
            };
            document.head.appendChild(script);
        });
    },

    // --- SAVE PROTOCOL ---
    saveToDevice(blob, filename, mimeType) {
        if (this.sys && typeof this.sys.download === 'function') {
            this.sys.toast("Saving to device...", "info");
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
    updateTime() {
        if (!this.state.dateTime.isAuto) return;
        const now = new Date();
        this.state.dateTime.date = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        this.state.dateTime.time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        if (this.state.currentView === 'main' && !this.state.activeModal) {
            const dateEl = this.sys.root.querySelector('#r-date');
            const timeEl = this.sys.root.querySelector('#r-time');
            if(dateEl) dateEl.innerText = this.state.dateTime.date;
            if(timeEl) timeEl.innerText = this.state.dateTime.time;
        }
    },

    formatPrice(num) {
        return "Rp " + num.toLocaleString('id-ID');
    },

    calculateTotals() {
        const subtotal = this.state.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const tax = subtotal * (this.state.store.taxRate / 100);
        const total = Math.max(0, subtotal + tax - this.state.store.discount);
        return { subtotal, tax, total };
    },

    generateBarcode() {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">`;
        let x = 0;
        while(x < 200) {
            const width = Math.random() > 0.7 ? 3 : 1;
            if(Math.random() > 0.3) { svg += `<rect x="${x}" y="0" width="${width}" height="40" fill="black" />`; }
            x += width + (Math.random() > 0.5 ? 1 : 2);
        }
        svg += `</svg>`;
        return svg;
    },

    // --- RENDERING ---
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
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=VT323&display=swap');

                .app-root {
                    width: 100%; height: 100%; display: flex; flex-direction: column;
                    background: var(--bg-root); color: var(--txt);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow: hidden;
                    padding-top: 60px; padding-bottom: 20px;
                }

                .content-limit {
                    width: 100%; max-width: 1020px; margin: 0 auto;
                    height: 100%; display: flex; flex-direction: column; align-items: center;
                    position: relative;
                }

                .glass-panel {
                    background: var(--glass);
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    border: var(--glass-border);
                    border-radius: 24px; padding: 30px;
                    box-shadow: var(--shadow);
                }

                .btn {
                    background: var(--prm); color: #000; border: none;
                    padding: 12px 24px; border-radius: 12px; cursor: pointer;
                    font-weight: 800; transition: transform 0.2s;
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .btn:active { transform: scale(0.95); }
                .btn.sec { background: var(--surface); color: var(--txt); border: var(--glass-border); }
                .btn.dang { background: rgba(239, 68, 68, 0.2); color: var(--err); border: 1px solid var(--err); }

                /* RECEIPT CANVAS */
                .receipt-viewport {
                    flex: 1; width: 100%; display: flex; align-items: center; justify-content: center;
                    overflow: hidden; cursor: grab; position: relative; touch-action: none;
                }
                .receipt-viewport:active { cursor: grabbing; }

                .receipt-paper {
                    background: var(--paper); color: var(--ink);
                    width: 320px; padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    font-family: 'VT323', monospace;
                    transform-origin: center;
                    will-change: transform;
                    user-select: none;
                }

                .r-dashed { border-bottom: 2px dashed var(--ink); margin: 10px 0; opacity: 0.5; }
                .r-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 16px; line-height: 1; }
                .r-center { text-align: center; }
                .r-bold { font-weight: bold; }
                .r-lg { font-size: 20px; }

                /* DOCK (FLOATING MENU) */
                .dock {
                    position: fixed; left: 50%; transform: translateX(-50%);
                    background: var(--glass); border: var(--glass-border);
                    padding: 10px 20px; border-radius: 24px;
                    display: flex; gap: 15px; box-shadow: var(--shadow);
                    backdrop-filter: blur(20px); z-index: 50;
                    overflow-x: auto; max-width: 90%;

                    /* DEFAULT (Desktop) */
                    bottom: 30px;
                }

                /* MOBILE ADJUSTMENT: Raise dock 40px+ from bottom */
                @media (max-width: 768px) {
                    .dock { bottom: 90px; }
                }

                .dock-btn {
                    display: flex; flex-direction: column; align-items: center; gap: 4px;
                    background: transparent; border: none; color: var(--txt-dim);
                    cursor: pointer; min-width: 50px;
                }
                .dock-btn svg { width: 24px; height: 24px; stroke-width: 2; }
                .dock-btn span { font-size: 10px; font-weight: 600; }
                .dock-btn:hover, .dock-btn.active { color: var(--prm); }

                /* MODAL */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    display: flex; items-center; justify-content: center;
                    z-index: 100; backdrop-filter: blur(5px);
                }
                .modal {
                    background: #1e1e24; border: 1px solid var(--prm);
                    width: 90%; max-width: 400px; border-radius: 20px;
                    padding: 24px; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .inp-grp { margin-bottom: 15px; }
                .inp-lbl { display: block; font-size: 11px; color: var(--txt-dim); margin-bottom: 5px; text-transform: uppercase; }
                .inp {
                    width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                    padding: 10px; border-radius: 8px; color: #fff; outline: none;
                }
                .inp:focus { border-color: var(--prm); }

                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;

        if(currentView === 'main') {
            setTimeout(() => this.updateTransform(), 0);
        }

        this.bindEvents();
    },

    renderLander() {
        return `
            <div class="glass-panel" style="text-align: center; margin: auto;">
                <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 10px; color: var(--prm);">TACTICAL RECEIPT</h1>
                <p style="color: var(--txt-dim); margin-bottom: 30px; font-size: 14px;">
                    Professional Thermal Receipt Generator.<br>100% Client-Side. Anti-Detect.
                </p>
                <div style="display:flex; justify-content:center; gap:20px; margin-bottom:40px;">
                    <div style="text-align:center;">
                        <div style="font-size:20px; color:var(--scs); font-weight:bold;">HD</div>
                        <div style="font-size:10px; color:var(--txt-dim);">VECTOR</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:20px; color:var(--prm); font-weight:bold;">LOCAL</div>
                        <div style="font-size:10px; color:var(--txt-dim);">PRIVACY</div>
                    </div>
                </div>
                <button id="btn-start" class="btn" style="width: 100%;">START ENGINE</button>
            </div>
        `;
    },

    renderMainApp() {
        const { store, items, dateTime, activeModal } = this.state;
        const { subtotal, tax, total } = this.calculateTotals();

        const itemsHtml = items.map(item => `
            <div style="margin-bottom: 8px;">
                <div class="r-row r-bold">
                    <span>${item.name}</span>
                    <span>${this.formatPrice(item.price * item.qty)}</span>
                </div>
                <div style="font-size: 14px; opacity: 0.7;">
                    ${item.qty} x ${this.formatPrice(item.price)}
                </div>
            </div>
        `).join('');

        let modalHtml = activeModal ? this.renderModal(activeModal) : '';

        return `
            <div id="viewport" class="receipt-viewport">
                <div id="receipt" class="receipt-paper">
                    <div class="r-center" style="margin-bottom: 15px;">
                        <div class="r-bold r-lg">${store.name}</div>
                        <div style="font-size:14px; margin-top:5px; line-height:1.2;">${store.address}</div>
                    </div>

                    <div class="r-dashed"></div>

                    <div class="r-row">
                        <span id="r-date">${dateTime.date}</span>
                        <span id="r-time">${dateTime.time}</span>
                    </div>
                    <div class="r-row">
                        <span>ID: ${store.txId}</span>
                        <span>CS: ${store.cashier}</span>
                    </div>

                    <div class="r-dashed"></div>

                    <div style="min-height: 50px;">
                        ${itemsHtml}
                    </div>

                    <div class="r-dashed"></div>

                    <div class="r-row">
                        <span>Subtotal</span>
                        <span>${this.formatPrice(subtotal)}</span>
                    </div>
                    <div class="r-row">
                        <span>Tax (${store.taxRate}%)</span>
                        <span>${this.formatPrice(tax)}</span>
                    </div>
                    ${store.discount > 0 ? `
                    <div class="r-row">
                        <span>Discount</span>
                        <span>-${this.formatPrice(store.discount)}</span>
                    </div>` : ''}

                    <div class="r-dashed"></div>

                    <div class="r-row r-bold r-lg" style="margin-top: 10px;">
                        <span>TOTAL</span>
                        <span>${this.formatPrice(total)}</span>
                    </div>

                    <div class="r-center" style="margin-top: 20px; font-size: 14px; line-height: 1.2;">
                        ${store.footer}
                    </div>

                    <div style="margin-top: 20px; opacity: 0.8;">
                        ${this.generateBarcode()}
                        <div class="r-center" style="font-size:10px; letter-spacing:4px; margin-top:2px;">${store.txId}</div>
                    </div>
                </div>
            </div>

            <div style="position:fixed; bottom:150px; right:20px; display:flex; flex-direction:column; gap:10px;">
                <button id="btn-zoom-in" class="btn sec" style="padding:10px;">+</button>
                <button id="btn-reset-view" class="btn sec" style="padding:10px; font-size:10px;">RST</button>
                <button id="btn-zoom-out" class="btn sec" style="padding:10px;">-</button>
            </div>

            <div class="dock">
                <button class="dock-btn" data-modal="store">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18v-8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z"/><path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M12 2v4"/><path d="M2 7h20"/><path d="M22 7l-2.5-2.5L18 7l-2.5-2.5L13 7l-2.5-2.5L8 7 5.5 4.5 3 7"/></svg>
                    <span>Store</span>
                </button>
                <button class="dock-btn" data-modal="items">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <span>Items</span>
                </button>
                <button class="dock-btn" data-modal="tx">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <span>Details</span>
                </button>
                <button class="dock-btn" data-modal="date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Time</span>
                </button>
                <div style="width:1px; background:var(--glass-border);"></div>
                <button class="dock-btn" id="btn-download" style="color:var(--scs);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Print</span>
                </button>
            </div>

            ${modalHtml}
        `;
    },

    renderModal(type) {
        let content = '';
        if (type === 'store') {
            content = `
                <div class="inp-grp"><label class="inp-lbl">Store Name</label><input id="i-s-name" class="inp" value="${this.state.store.name}"></div>
                <div class="inp-grp"><label class="inp-lbl">Address</label><textarea id="i-s-addr" class="inp" rows="3">${this.state.store.address}</textarea></div>
                <div class="inp-grp"><label class="inp-lbl">Footer Message</label><textarea id="i-s-foot" class="inp" rows="2">${this.state.store.footer}</textarea></div>
                <button id="m-save-store" class="btn" style="width:100%">UPDATE STORE</button>
            `;
        } else if (type === 'tx') {
            content = `
                <div class="inp-grp"><label class="inp-lbl">Transaction ID</label><input id="i-t-id" class="inp" value="${this.state.store.txId}"></div>
                <div class="inp-grp"><label class="inp-lbl">Cashier Name</label><input id="i-t-cash" class="inp" value="${this.state.store.cashier}"></div>
                <div style="display:flex; gap:10px;">
                    <div class="inp-grp" style="flex:1"><label class="inp-lbl">Tax (%)</label><input id="i-t-tax" type="number" class="inp" value="${this.state.store.taxRate}"></div>
                    <div class="inp-grp" style="flex:1"><label class="inp-lbl">Discount</label><input id="i-t-disc" type="number" class="inp" value="${this.state.store.discount}"></div>
                </div>
                <button id="m-save-tx" class="btn" style="width:100%">UPDATE DETAILS</button>
            `;
        } else if (type === 'items') {
            const list = this.state.items.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:8px;">
                    <div>
                        <div style="font-weight:bold; font-size:13px;">${item.name}</div>
                        <div style="font-size:11px; opacity:0.6;">${item.qty} x ${item.price}</div>
                    </div>
                    <button class="btn dang" style="padding:5px 10px; font-size:10px;" data-del-item="${idx}">DEL</button>
                </div>
            `).join('');
            content = `
                <div style="max-height:300px; overflow-y:auto; margin-bottom:20px;">${list}</div>
                <button id="m-add-item" class="btn sec" style="width:100%">+ ADD ITEM</button>
            `;
        } else if (type === 'item_form') {
            content = `
                <div class="inp-grp"><label class="inp-lbl">Item Name</label><input id="i-it-name" class="inp" placeholder="e.g. Coffee"></div>
                <div style="display:flex; gap:10px;">
                    <div class="inp-grp"><label class="inp-lbl">Qty</label><input id="i-it-qty" type="number" class="inp" value="1"></div>
                    <div class="inp-grp"><label class="inp-lbl">Price</label><input id="i-it-prc" type="number" class="inp" placeholder="0"></div>
                </div>
                <button id="m-save-item" class="btn" style="width:100%">ADD TO LIST</button>
                <button id="m-back-items" class="btn sec" style="width:100%; margin-top:10px;">CANCEL</button>
            `;
        } else if (type === 'date') {
            content = `
                <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center;">
                    <span>Auto Date/Time</span>
                    <button id="tgl-auto" class="btn sec" style="padding:5px 10px;">${this.state.dateTime.isAuto ? 'ON' : 'OFF'}</button>
                </div>
                <div id="man-date-wrap" style="${this.state.dateTime.isAuto ? 'opacity:0.3; pointer-events:none' : ''}">
                    <div class="inp-grp"><label class="inp-lbl">Date (DD/MM/YYYY)</label><input id="i-d-date" class="inp" value="${this.state.dateTime.date}"></div>
                    <div class="inp-grp"><label class="inp-lbl">Time (HH:MM)</label><input id="i-d-time" class="inp" value="${this.state.dateTime.time}"></div>
                    <button id="m-save-date" class="btn" style="width:100%">APPLY MANUAL</button>
                </div>
            `;
        }

        return `
            <div class="modal-overlay" id="modal-bg">
                <div class="modal">
                    <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                        <span style="font-weight:bold; color:var(--prm);">${type.toUpperCase()}</span>
                        <button id="m-close" style="background:none; border:none; color:var(--err); font-weight:bold; cursor:pointer;">X</button>
                    </div>
                    ${content}
                </div>
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;

        // Lander
        const btnStart = root.querySelector('#btn-start');
        if (btnStart) {
            btnStart.onclick = () => {
                this.state.isFirstVisit = false;
                this.state.currentView = 'main';
                localStorage.setItem('app_visited_struk_tactical', 'true');
                this.render();
            };
            return;
        }

        // --- MODAL & FORMS ---
        root.querySelectorAll('[data-modal]').forEach(btn => {
            btn.onclick = () => { this.state.activeModal = btn.dataset.modal; this.render(); };
        });

        const closeBtn = root.querySelector('#m-close');
        const modalBg = root.querySelector('#modal-bg');
        const closeModal = () => { this.state.activeModal = null; this.render(); };
        if (closeBtn) closeBtn.onclick = closeModal;
        if (modalBg) modalBg.onclick = (e) => { if(e.target === modalBg) closeModal(); };

        const bindSave = (id, callback) => {
            const btn = root.querySelector(id);
            if(btn) btn.onclick = callback;
        };

        bindSave('#m-save-store', () => {
            this.state.store.name = root.querySelector('#i-s-name').value;
            this.state.store.address = root.querySelector('#i-s-addr').value;
            this.state.store.footer = root.querySelector('#i-s-foot').value;
            closeModal();
        });

        bindSave('#m-save-tx', () => {
            this.state.store.txId = root.querySelector('#i-t-id').value;
            this.state.store.cashier = root.querySelector('#i-t-cash').value;
            this.state.store.taxRate = parseFloat(root.querySelector('#i-t-tax').value) || 0;
            this.state.store.discount = parseFloat(root.querySelector('#i-t-disc').value) || 0;
            closeModal();
        });

        bindSave('#tgl-auto', () => {
            this.state.dateTime.isAuto = !this.state.dateTime.isAuto;
            this.render();
        });

        bindSave('#m-save-date', () => {
            this.state.dateTime.date = root.querySelector('#i-d-date').value;
            this.state.dateTime.time = root.querySelector('#i-d-time').value;
            closeModal();
        });

        bindSave('#m-add-item', () => { this.state.activeModal = 'item_form'; this.render(); });
        bindSave('#m-back-items', () => { this.state.activeModal = 'items'; this.render(); });

        bindSave('#m-save-item', () => {
            const name = root.querySelector('#i-it-name').value;
            const qty = parseInt(root.querySelector('#i-it-qty').value) || 1;
            const price = parseInt(root.querySelector('#i-it-prc').value) || 0;
            if(name && price) {
                this.state.items.push({ name, qty, price });
                this.state.activeModal = 'items';
                this.render();
            }
        });

        root.querySelectorAll('[data-del-item]').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.delItem);
                this.state.items.splice(idx, 1);
                this.render();
            };
        });

        // --- TOUCH / PAN / ZOOM LOGIC ---
        const vp = root.querySelector('#viewport');
        const btnZoomIn = root.querySelector('#btn-zoom-in');
        const btnZoomOut = root.querySelector('#btn-zoom-out');
        const btnReset = root.querySelector('#btn-reset-view');

        if (btnZoomIn) btnZoomIn.onclick = () => { this.state.zoom += 0.1; this.updateTransform(); };
        if (btnZoomOut) btnZoomOut.onclick = () => { this.state.zoom = Math.max(0.5, this.state.zoom - 0.1); this.updateTransform(); };
        if (btnReset) btnReset.onclick = () => { this.state.zoom = 1; this.state.pan = {x:0, y:0}; this.updateTransform(); };

        if (vp) {
            // MOUSE
            vp.onmousedown = (e) => {
                this.state.isDragging = true;
                this.state.startPan = { x: e.clientX - this.state.pan.x, y: e.clientY - this.state.pan.y };
            };
            window.onmouseup = () => this.state.isDragging = false;
            window.onmousemove = (e) => {
                if (!this.state.isDragging) return;
                e.preventDefault();
                this.state.pan = { x: e.clientX - this.state.startPan.x, y: e.clientY - this.state.startPan.y };
                this.updateTransform();
            };

            // TOUCH (MULTITOUCH ZOOM SUPPORT)
            vp.ontouchstart = (e) => {
                if (e.touches.length === 2) {
                    // Pinch Start
                    this.state.isDragging = false;
                    const dist = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );
                    this.state.lastPinchDist = dist;
                } else if (e.touches.length === 1) {
                    // Pan Start
                    this.state.isDragging = true;
                    this.state.startPan = { x: e.touches[0].clientX - this.state.pan.x, y: e.touches[0].clientY - this.state.pan.y };
                }
            };

            vp.ontouchmove = (e) => {
                e.preventDefault(); // Stop Browser Zoom/Scroll

                if (e.touches.length === 2) {
                    // Pinch Move
                    const currentDist = Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    );

                    if (this.state.lastPinchDist > 0) {
                        const delta = currentDist - this.state.lastPinchDist;
                        // Sensitivity factor 0.005
                        const newZoom = this.state.zoom + (delta * 0.005);
                        this.state.zoom = Math.min(Math.max(0.5, newZoom), 3.0);
                        this.updateTransform();
                    }
                    this.state.lastPinchDist = currentDist;
                }
                else if (e.touches.length === 1 && this.state.isDragging) {
                    // Pan Move
                    this.state.pan = { x: e.touches[0].clientX - this.state.startPan.x, y: e.touches[0].clientY - this.state.startPan.y };
                    this.updateTransform();
                }
            };

            vp.ontouchend = (e) => {
                if (e.touches.length < 2) this.state.lastPinchDist = 0;
                if (e.touches.length === 0) this.state.isDragging = false;
            };
        }

        const btnDownload = root.querySelector('#btn-download');
        if (btnDownload) btnDownload.onclick = () => this.generateImage();
    },

    updateTransform() {
        const paper = this.sys.root.querySelector('#receipt');
        if (paper) {
            paper.style.transform = `translate(${this.state.pan.x}px, ${this.state.pan.y}px) scale(${this.state.zoom})`;
        }
    },

    generateImage() {
        if (!this.canvasLoaded) {
            this.sys.toast("Engine loading...", "warn");
            return;
        }

        this.sys.toast("Printing receipt...", "info");
        const receipt = this.sys.root.querySelector('#receipt');
        const oldTransform = receipt.style.transform;
        receipt.style.transform = 'scale(1)'; // Reset for clean capture

        html2canvas(receipt, {
            scale: 2,
            backgroundColor: null,
            useCORS: true
        }).then(canvas => {
            receipt.style.transform = oldTransform;
            canvas.toBlob(blob => {
                const filename = `receipt-${this.state.store.txId}.png`;
                this.saveToDevice(blob, filename, 'image/png');
            });
        }).catch(err => {
            console.error(err);
            receipt.style.transform = oldTransform;
            this.sys.toast("Print failed", "err");
        });
    }
})