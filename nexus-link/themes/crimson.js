window.registerTheme({
    id: 'crimson',
    name: 'CRIMSON OPS',
    previewColor: 'bg-black border border-red-600',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            background: #0a0a0a; color: #fff; font-family: 'Chakra Petch', sans-serif;
        }
        .container { width: 100%; max-width: 420px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; }
        .avatar { width: 100px; height: 100px; clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%); object-fit: cover; margin-bottom: 24px; border: 2px solid #ef4444; }
        h1 { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; color: #fff; }
        p { font-size: 12px; color: #f87171; margin-bottom: 40px; background: #450a0a; padding: 4px 10px; border-radius: 4px; }
        .link-card {
            width: 100%; padding: 16px; margin-bottom: 12px;
            background: #171717; border-left: 4px solid #444; color: #fff; text-decoration: none;
            font-weight: 700; text-transform: uppercase; transition: 0.2s; display: block;
        }
        .link-card:hover { border-left-color: #ef4444; background: #ef4444; color: #000; padding-left: 24px; }

        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background: #000; }
            .container { border: 1px solid #333; background: #0a0a0a; min-height: 800px; box-shadow: 0 0 40px rgba(220, 38, 38, 0.2); }
        }
    `
});