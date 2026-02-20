window.registerTheme({
    id: 'emerald',
    name: 'EMERALD CITY',
    previewColor: 'bg-emerald-900 border border-emerald-500',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Karla:wght@500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            background: #022c22; color: #d1fae5; font-family: 'Karla', sans-serif;
        }
        .container { width: 100%; max-width: 420px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; }
        .avatar { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 2px solid #10b981; padding: 4px; margin-bottom: 24px; }
        h1 { font-family: 'DM Serif Display', serif; font-size: 36px; color: #ecfdf5; margin-bottom: 6px; }
        p { font-size: 14px; color: #6ee7b7; margin-bottom: 48px; letter-spacing: 0.5px; }
        .link-card {
            width: 100%; padding: 20px; margin-bottom: 12px;
            background: rgba(6, 78, 59, 0.5); border: 1px solid #065f46;
            color: #ecfdf5; text-decoration: none; font-size: 16px; text-align: center;
            border-radius: 4px; transition: 0.3s; display: block;
        }
        .link-card:hover { background: #064e3b; border-color: #34d399; letter-spacing: 1px; color: #fff; }

        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background: #064e3b; }
            .container { background: #022c22; border: 1px solid #065f46; min-height: 800px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        }
    `
});