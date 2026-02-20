const FlashHype = {
    imageData: null,

    init: function() {
        // Set Min Date
        const input = document.getElementById('inp-time');
        if(input) {
            const now = new Date();
            input.min = now.toISOString().slice(0,16);
        }
    },

    handleImage: function(input) {
        const file = input.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                // Resize Image
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                let width = img.width;
                let height = img.height;
                if(width > MAX_WIDTH) { height *= MAX_WIDTH/width; width = MAX_WIDTH; }

                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                this.imageData = canvas.toDataURL('image/jpeg', 0.8);

                // Update UI
                document.getElementById('preview-thumb').src = this.imageData;
                document.getElementById('preview-thumb').classList.remove('hidden');
                document.getElementById('prev-img').src = this.imageData;
            }
        };
        reader.readAsDataURL(file);
    },

    updatePreview: function() {
        const name = document.getElementById('inp-name').value || "NAMA PRODUK";
        const original = parseInt(document.getElementById('inp-original').value) || 0;
        const promo = parseInt(document.getElementById('inp-promo').value) || 0;
        const msg = document.getElementById('inp-message').value;

        document.getElementById('prev-name').innerText = name.toUpperCase();
        document.getElementById('prev-original').innerText = this.formatRupiah(original);
        document.getElementById('prev-promo').innerText = this.formatRupiah(promo);

        const msgEl = document.getElementById('prev-message');
        if(msg) { msgEl.innerText = `"${msg}"`; msgEl.classList.remove('hidden'); }
        else { msgEl.classList.add('hidden'); }

        if(original > 0 && promo > 0) {
            const percent = Math.round(((original - promo) / original) * 100);
            document.getElementById('prev-percent').innerText = percent + "%";
        }
    },

    formatRupiah: function(val) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits:0 }).format(val);
    },

    validateDate: function() {
        const input = document.getElementById('inp-time');
        const selected = new Date(input.value);
        const now = new Date();
        const max = new Date(); max.setMonth(max.getMonth() + 3);

        if(selected < now || selected > max) {
            // Ganti alert pake border merah aja biar gak ganggu
            input.style.borderColor = 'red';
            input.value = "";
        } else {
            input.style.borderColor = '#FFD700';
        }
    },

    publish: async function() {
        const name = document.getElementById('inp-name').value;
        const endTime = document.getElementById('inp-time').value;
        const link = document.getElementById('inp-link').value;
        const btn = document.getElementById('btn-publish');

        if(!name || !endTime || !this.imageData || !link) {
            // Efek getar kalo error
            btn.classList.add('animate-pulse');
            setTimeout(() => btn.classList.remove('animate-pulse'), 500);
            return;
        }

        btn.innerHTML = "PROCESSING DATA...";
        btn.disabled = true;

        try {
            const payload = {
                productName: name,
                originalPrice: document.getElementById('inp-original').value,
                promoPrice: document.getElementById('inp-promo').value,
                endTime, image: this.imageData, ctaLink: link,
                message: document.getElementById('inp-message').value
            };

            const res = await fetch('/api/v1/flash-hype/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if(!res.ok) throw new Error(result.error);

            // --- SUKSES: TAMPILKAN MODAL ---
            const finalLink = `${window.location.origin}/promo/${result.id}`;
            document.getElementById('result-link').innerText = finalLink;
            document.getElementById('success-modal').classList.add('active');

            // RESET FORM
            this.resetForm();

        } catch(e) {
            console.error(e);
            btn.innerHTML = "ERROR - RETRY";
        } finally {
            btn.disabled = false;
            btn.innerHTML = "INITIATE LAUNCH SEQUENCE";
        }
    },

    resetForm: function() {
        document.getElementById('inp-name').value = "";
        document.getElementById('inp-original').value = "";
        document.getElementById('inp-promo').value = "";
        document.getElementById('inp-message').value = "";
        document.getElementById('inp-link').value = "";
        document.getElementById('inp-time').value = "";
        document.getElementById('preview-thumb').classList.add('hidden');
        this.imageData = null;
        this.updatePreview(); // Reset preview juga
    },

    copyLink: function() {
        const text = document.getElementById('result-link').innerText;
        navigator.clipboard.writeText(text);
        const btn = document.querySelector('#success-modal button:first-child');
        btn.innerText = "COPIED!";
        setTimeout(() => btn.innerText = "COPY LINK", 2000);
    },

    closeModal: function() {
        document.getElementById('success-modal').classList.remove('active');
    }
};

FlashHype.init();
setInterval(() => {
    document.getElementById('prev-timer').innerText = new Date().toLocaleTimeString();
}, 1000);