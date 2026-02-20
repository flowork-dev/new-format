window.registerTheme({
    id: 'glass',
    name: 'GLASS MISM',
    previewColor: 'bg-gradient-to-br from-purple-600 to-blue-500',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center;
            font-family: 'Space Grotesk', sans-serif;
            color: #2D3436;
            background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
            background-attachment: fixed;
        }

        .container {
            width: 100%; max-width: 480px; padding: 60px 24px;
            display: flex; flex-direction: column; align-items: center;
        }

        .avatar {
            width: 110px; height: 110px; border-radius: 50%; object-fit: cover;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border: 4px solid rgba(255,255,255,0.9);
        }

        h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #2d3436; text-shadow: 0 2px 10px rgba(255,255,255,0.5); }
        p { font-size: 14px; color: #4b6584; margin-bottom: 40px; font-weight: 600; }

        .link-card {
            display: block; width: 100%; padding: 18px 25px; margin-bottom: 16px;
            background: rgba(255, 255, 255, 0.65); /* Lebih solid biar kontras */
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 20px;
            text-decoration: none;
            color: #2d3436; /* Teks Gelap */
            font-weight: 700; font-size: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: all 0.3s;
        }
        .link-card:hover {
            transform: scale(1.02);
            background: rgba(255,255,255,0.9);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            color: #000;
        }

        /* FRAME DESKTOP */
        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background-image: url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'); background-size: cover; }
            .container {
                background: rgba(255,255,255,0.2);
                backdrop-filter: blur(25px);
                border: 1px solid rgba(255,255,255,0.4);
                border-radius: 40px;
                box-shadow: 0 20px 80px rgba(0,0,0,0.2);
                min-height: 80vh;
            }
        }
    `
});