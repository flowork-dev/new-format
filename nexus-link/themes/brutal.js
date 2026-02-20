window.registerTheme({
    id: 'brutal',
    name: 'NEO BRUTAL',
    previewColor: 'bg-white border-2 border-black',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            background: #facc15; color: #000; font-family: 'Archivo', sans-serif;
        }
        .container { width: 100%; max-width: 420px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; }
        .avatar { width: 120px; height: 120px; border-radius: 0; object-fit: cover; border: 4px solid #000; box-shadow: 8px 8px 0px #000; margin-bottom: 24px; background: #fff; }
        h1 { font-size: 32px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; background: #fff; padding: 5px 15px; border: 3px solid #000; box-shadow: 4px 4px 0 #000; }
        p { font-size: 16px; font-weight: 800; margin-bottom: 40px; background: #000; color: #fff; padding: 5px 10px; }
        .link-card {
            width: 100%; padding: 20px; margin-bottom: 16px;
            background: #fff; border: 3px solid #000;
            color: #000; text-decoration: none; font-weight: 800; font-size: 18px;
            box-shadow: 6px 6px 0px #000; transition: 0.2s; display: block; text-align: center;
        }
        .link-card:hover { transform: translate(2px, 2px); box-shadow: 2px 2px 0px #000; background: #f472b6; }

        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background: #8b5cf6; }
            .container { background: #facc15; border: 4px solid #000; min-height: 800px; box-shadow: 20px 20px 0 rgba(0,0,0,0.2); }
        }
    `
});