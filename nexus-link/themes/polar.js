window.registerTheme({
    id: 'polar',
    name: 'ARCTIC FROST',
    previewColor: 'bg-white border border-blue-200',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            background: #f0f9ff; color: #0f172a; font-family: 'Outfit', sans-serif;
        }
        .container { width: 100%; max-width: 420px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; }
        .avatar { width: 110px; height: 110px; border-radius: 30px; object-fit: cover; border: 4px solid #fff; box-shadow: 0 10px 25px rgba(56,189,248,0.2); margin-bottom: 20px; }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; color: #0284c7; }
        p { font-size: 14px; color: #64748b; margin-bottom: 30px; font-weight: 500; }
        .link-card {
            width: 100%; padding: 18px; margin-bottom: 12px;
            background: #fff; border: 2px solid #e0f2fe; border-radius: 16px;
            color: #0f172a; font-weight: 700; text-decoration: none; text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: 0.2s;
        }
        .link-card:hover { border-color: #38bdf8; background: #f0f9ff; color: #0284c7; transform: translateY(-2px); }

        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background: #e0f2fe; }
            .container { background: #fff; border-radius: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); min-height: 800px; }
        }
    `
});