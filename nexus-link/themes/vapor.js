window.registerTheme({
    id: 'vapor',
    name: 'VAPOR WAVE',
    previewColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    css: (data) => `
        @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Inter:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh; display: flex; flex-direction: column; align-items: center;
            background: linear-gradient(180deg, #240046 0%, #7b2cbf 100%);
            color: #fff; font-family: 'Inter', sans-serif;
        }
        .container { width: 100%; max-width: 420px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; }
        .avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #ff9e00; box-shadow: 0 0 20px #ff9e00; margin-bottom: 20px; }
        h1 { font-family: 'Righteous', cursive; font-size: 32px; color: #ff9e00; margin-bottom: 10px; text-shadow: 2px 2px 0px #3c096c; }
        p { font-size: 14px; color: #e0aaff; margin-bottom: 40px; letter-spacing: 1px; }
        .link-card {
            width: 100%; padding: 18px; margin-bottom: 14px;
            background: rgba(36, 0, 70, 0.6); backdrop-filter: blur(10px);
            border: 2px solid #ff0054; border-radius: 50px;
            color: #fff; text-decoration: none; font-weight: bold; text-align: center;
            transition: transform 0.2s; display: block;
        }
        .link-card:hover { transform: scale(1.05); background: #ff0054; color: #fff; box-shadow: 0 0 20px #ff0054; }

        @media (min-width: 768px) {
            body { justify-content: center; padding: 40px 0; background: #10002b; }
            .container { background: linear-gradient(180deg, #240046 0%, #3c096c 100%); border-radius: 40px; border: 4px solid #5a189a; min-height: 800px; }
        }
    `
});