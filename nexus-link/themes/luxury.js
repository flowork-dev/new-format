window.registerTheme({
    id: 'luxury',
    name: 'LUXURIA',
    previewColor: 'bg-gradient-to-br from-[#111] to-black border border-yellow-700',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* MOBILE / DEFAULT */
        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #050505;
            color: #d4af37;
            font-family: 'Lato', sans-serif;
        }

        .container {
            width: 100%;
            max-width: 420px;
            padding: 60px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .avatar {
            width: 110px; height: 110px; border-radius: 50%; object-fit: cover;
            border: 1px solid #d4af37; padding: 3px; margin-bottom: 20px;
            transition: transform 0.5s;
        }
        .avatar:hover { transform: rotate(5deg) scale(1.05); }

        h1 {
            font-family: 'Playfair Display', serif; font-size: 26px; color: #fff; margin-bottom: 6px; letter-spacing: 1px;
        }
        p { font-size: 12px; color: #888; margin-bottom: 40px; letter-spacing: 2px; text-transform: uppercase; }

        .link-card {
            display: block; width: 100%; padding: 18px; margin-bottom: 12px;
            background: rgba(255,255,255,0.02);
            border: 1px solid #333;
            color: #ccc;
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            text-decoration: none;
            transition: 0.4s;
            position: relative;
            overflow: hidden;
        }

        .link-card:hover {
            border-color: #d4af37;
            color: #d4af37;
            background: rgba(212,175,55,0.05);
            transform: translateY(-2px);
        }

        /* --- DESKTOP FRAME MODE --- */
        @media (min-width: 768px) {
            body {
                justify-content: center;
                background-image: radial-gradient(#222 1px, transparent 1px);
                background-size: 30px 30px;
                padding: 40px 0;
            }
            .container {
                background: #080808;
                border: 8px solid #1a1a1a;
                border-radius: 40px;
                box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9);
                min-height: 800px; /* Tinggi Fix kayak HP */
            }
        }
    `
});