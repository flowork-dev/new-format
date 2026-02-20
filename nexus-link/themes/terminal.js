window.registerTheme({
    id: 'terminal',
    name: 'ROOT ACCESS',
    previewColor: 'bg-black border border-green-500',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            display: flex; flex-direction: column; align-items: center;
            background-color: #000;
            color: #00ff00; /* Hacker Green */
            font-family: 'VT323', monospace;
            font-size: 1.3rem;
            overflow-x: hidden;
        }

        /* EFEK GARIS CRT (SCANLINES) */
        body::after {
            content: " ";
            display: block;
            position: fixed;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 999;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }

        .container {
            width: 100%;
            max-width: 480px;
            padding: 60px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 10;
        }

        .avatar {
            width: 120px; height: 120px;
            border: 2px solid #00ff00;
            margin-bottom: 25px;
            /* Filter biar gambarnya jadi ijo */
            filter: grayscale(100%) contrast(150%) brightness(0.8) sepia(100%) hue-rotate(50deg) saturate(500%);
            padding: 4px;
            border-radius: 0; /* Kotak kaku */
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 5px;
            text-transform: uppercase;
            text-shadow: 0 0 10px #00ff00;
            line-height: 1;
        }

        /* Cursor Kedip */
        h1::after {
            content: '_';
            animation: blink 1s infinite step-end;
        }

        p {
            font-size: 1.4rem;
            color: #008f11;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-align: center;
        }

        .link-card {
            display: block; width: 100%;
            padding: 15px 20px;
            margin-bottom: 15px;
            background: #000;
            border: 2px solid #00ff00;
            color: #00ff00;
            text-decoration: none;
            font-size: 1.5rem;
            text-transform: uppercase;
            transition: 0s; /* No smooth transition, instant hacker feel */
            position: relative;
        }

        .link-card::before {
            content: '> ';
            margin-right: 10px;
        }

        .link-card:hover {
            background: #00ff00;
            color: #000;
            box-shadow: 0 0 20px #00ff00;
            font-weight: bold;
            cursor: cell;
        }

        @keyframes blink { 50% { opacity: 0; } }

        /* --- DESKTOP FRAME MODE (MONITOR JADUL) --- */
        @media (min-width: 768px) {
            body {
                justify-content: center;
                background: #050505;
                padding: 40px 0;
            }
            .container {
                background: #000;
                border: 10px solid #1a1a1a;
                border-radius: 5px;
                box-shadow: 0 0 0 2px #333, 0 0 50px rgba(0, 255, 0, 0.1);
                min-height: 800px;
                max-width: 450px;
                padding-top: 50px; /* Space for fake header */
            }

            /* Fake Terminal Header Window */
            .container::before {
                content: "root@nexus:~# ./execute_bio.sh";
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 35px;
                background: #00ff00;
                color: #000;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                padding-left: 15px;
                font-weight: bold;
                border-bottom: 2px solid #005500;
            }
        }
    `
});