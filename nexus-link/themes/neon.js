window.registerTheme({
    id: 'neon',
    name: 'NEON DEMON',
    previewColor: 'bg-black border border-[#00ff00]',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Courier+Prime&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* MOBILE / DEFAULT */
        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #050505;
            background-image: linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px);
            background-size: 30px 30px;
            font-family: 'Syncopate', sans-serif;
            color: #fff;
        }

        .container {
            width: 100%;
            max-width: 480px;
            padding: 60px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .avatar {
            width: 100px; height: 100px; border-radius: 12px; object-fit: cover;
            margin-bottom: 25px; border: 2px solid #00ff00;
            box-shadow: 0 0 20px #00ff00; filter: grayscale(100%) contrast(120%);
        }

        h1 { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: #fff; text-shadow: 2px 2px 0px #00ff00; }
        p { font-family: 'Courier Prime', monospace; font-size: 12px; color: #00ff00; margin-bottom: 40px; letter-spacing: 1px; }

        .link-card {
            display: block; width: 100%; padding: 20px; margin-bottom: 18px;
            background: #000; border: 1px solid #333;
            text-decoration: none;
            color: #fff; font-weight: 700; font-size: 14px;
            text-transform: uppercase; letter-spacing: 2px;
            position: relative; overflow: hidden;
            transition: all 0.2s;
            clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
        .link-card:hover {
            background: #00ff00; color: #000; border-color: #00ff00;
            box-shadow: 0 0 30px #00ff00;
        }

        /* --- DESKTOP FRAME MODE --- */
        @media (min-width: 768px) {
            body {
                justify-content: center;
                padding: 40px 0;
            }
            .container {
                border: 2px solid #333;
                border-radius: 20px;
                box-shadow: 0 0 50px rgba(0, 255, 0, 0.1);
                background: #000;
                min-height: 800px;
                position: relative;
            }
            /* Fake Phone Notch or Cyber Accents */
            .container::before {
                content: "SYS.ONLINE";
                position: absolute; top: 10px; left: 20px;
                font-family: 'Courier Prime'; font-size: 10px; color: #00ff00; opacity: 0.5;
            }
        }
    `
});