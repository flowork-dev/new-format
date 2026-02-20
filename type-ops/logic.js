({
    state: {
        isFirstVisit: true,
        currentView: 'lander',
        mode: 'styles', // 'styles' or 'repeater'
        inputText: '',
        repeatCount: 50,
        repeatNewLine: true
    },

    sys: null,
    observer: null,
    appName: 'type-ops',

    themes: {
        dark: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(15, 23, 42, 0.95)',
            '--glass-border': '1px solid rgba(188, 19, 254, 0.2)',
            '--txt': '#f8fafc',
            '--txt-dim': '#94a3b8',
            '--prm': '#38bdf8', // Biru Utama
            '--scs': '#10b981',
            '--err': '#ef4444',
            '--brd': 'rgba(255, 255, 255, 0.05)',
            '--surface': 'rgba(255, 255, 255, 0.03)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.5)'
        },
        light: {
            '--bg-root': 'transparent',
            '--glass': 'rgba(255, 255, 255, 0.95)',
            '--glass-border': '1px solid rgba(0, 0, 0, 0.1)',
            '--txt': '#0f172a',
            '--txt-dim': '#64748b',
            '--prm': '#2563eb', // Biru Tetap Tajam di Terang
            '--scs': '#059669',
            '--err': '#dc2626',
            '--brd': 'rgba(0, 0, 0, 0.1)',
            '--surface': 'rgba(0, 0, 0, 0.04)',
            '--shadow': '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
    },

    // --- PUSTAKA 25 KARAKTER TACTICAL ---
    maps: {
        bold: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
        boldSans: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
        italic: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧0123456789",
        boldItalic: "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛0123456789",
        script: "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789",
        boldScript: "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃0123456789",
        gothic: "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷0123456789",
        boldGothic: "𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟0123456789",
        double: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙🇮🇳🇯🇰𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
        mono: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
        circles: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ0①②③④⑤⑥⑦⑧⑨",
        circlesDark: "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩⓿❶❷❸❹❺❻❼❽❾",
        squares: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉0123456789",
        squaresDark: "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉0123456789",
        parentheses: "⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵0⑴⑵⑶⑷⑸⑹⑺⑻⑼",
        wide: "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９",
        smallCaps: "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡ🇽ʏᴢᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡ🇽ʏᴢ0123456789",
        magic: "卂乃匚刀乇下厶卄工丁长乚爪𠘨口尸㔿尺丂丅凵リ山乂丫乙卂乃匚刀乇下厶卄工丁长乚爪𠘨口尸㔿尺丂丅凵リ山乂丫乙0123456789",
        sorcerer: "ꋬꃳꉔ꒯ꏂꄟꍌꁝ꒐꒻ꀘ꒒ꂵꋊꄲꉣꆰꋪꇙ꓄ꒄ꒦ꅐꇓꌦ꒓ꋬꃳꉔ꒯ꏂꄟꍌꁝ꒐꒻ꀘ꒒ꂵꋊꄲꉣꆰꋪꇙ꓄ꒄ꒦ꅐꇓꌦ꒓0123456789",
        rusify: "ДБϾDΞFGHIJҜLMИФPǪЯSΓЦVЩXYZДБϾDΞFGHIJҜLMИФPǪЯSΓЦVЩXYZ0123456789",
        sky: "ꁲꃼꏸ꒯ꍟꄘꁅꃬꀤ꒻ꀗ꒒ꁒꁹꆪꉣꆰꋪꌚ꓅ꐇꏳꅐꇼꂑꁴꁲꃼꏸ꒯ꍟꄘꁅꃬꀤ꒻ꀗ꒒ꁒꁹꆪꉣꆰꋪꌚ꓅ꐇꏳꅐꇼꂑꁴ0123456789",
        fairy: "᠘ᑌᓍᖘᗅSᗫᖴᘜHᒙKᒪZ᙭ᑢᐯᗷᘉᙢ᠘ᑌᓍᖘᗅSᗫᖴᘜHᒙKᒪZ᙭ᑢᐯᗷᘉᙢ0123456789",
        dirty: "ᗪ丨尺ㄒㄚᗪ丨尺ㄒㄚ0123456789",
        currency: "₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ0123456789",
        subscript: "ₐBCDₑFGₕᵢⱼₖₗₘₙₒₚQᵣₛₜᵤᵥWₓYZₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz₀₁₂₃₄₅₆₇₈₉"
    },
    normal: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",

    mount(sys) {
        this.sys = sys;
        if (localStorage.getItem('app_visited_' + this.appName)) {
            this.state.isFirstVisit = false;
            this.state.currentView = 'main';
        }
        this.render();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.onThemeChange(currentTheme);
        this.observer = new MutationObserver(() => this.onThemeChange(document.documentElement.getAttribute('data-theme')));
        this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    unmount() {
        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        this.sys.root.innerHTML = '';
    },

    onThemeChange(t) {
        const theme = this.themes[t] || this.themes['dark'];
        for (const [key, value] of Object.entries(theme)) this.sys.root.style.setProperty(key, value);
    },

    transform(text, type) {
        if (!text) return "";
        const targetMap = this.maps[type];
        if (!targetMap) return text;
        const mapArray = Array.from(targetMap);
        return text.split('').map(char => {
            const index = this.normal.indexOf(char);
            if (index === -1) return char;
            return mapArray[index] || char;
        }).join('');
    },

    // UPDATE UI TANPA RE-RENDER TOTAL (ANTI-KEDIP)
    updateSurgicalUI() {
        const root = this.sys.root;
        const stylesGrid = root.querySelector('#styles-grid');

        if (stylesGrid && this.state.mode === 'styles') {
            if (!this.state.inputText) {
                stylesGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--txt-dim); font-size:12px; letter-spacing:2px;" class="fade-in">WAITING FOR INPUT STREAM...</div>`;
            } else {
                stylesGrid.innerHTML = Object.keys(this.maps).map(key => `
                    <div class="style-card fade-in" data-style="${key}">
                        <div class="card-header">
                            <span>${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                            <i class="material-icons" style="font-size:10px;">content_copy</i>
                        </div>
                        <div class="txt-blue card-body">${this.transform(this.state.inputText, key)}</div>
                    </div>
                `).join('');

                root.querySelectorAll('.style-card').forEach(el => {
                    el.onclick = () => {
                        const txt = this.transform(this.state.inputText, el.dataset.style);
                        navigator.clipboard.writeText(txt);
                        this.sys.toast("COPIED: " + el.dataset.style.toUpperCase());
                    };
                });
            }
        }

        const repeaterPre = root.querySelector('#repeater-preview');
        if (repeaterPre && this.state.mode === 'repeater') {
            const sep = this.state.repeatNewLine ? '\n' : ' ';
            const count = Math.min(parseInt(this.state.repeatCount) || 1, 1000);
            repeaterPre.innerText = this.state.inputText ? Array(count).fill(this.state.inputText).join(sep) : "Waiting for tactical data...";
        }
    },

    render() {
        const content = this.state.currentView === 'lander' ? this.renderLander() : this.renderMain();
        this.sys.root.innerHTML = `
            <div class="app-root fade-in">
                <div class="content-limit">
                    ${content}
                </div>
            </div>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@500;700&display=swap');

                .app-root { width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg-root); color: var(--txt); font-family: 'JetBrains Mono', monospace; overflow-y: scroll; padding-top: 70px; padding-bottom: 90px; scrollbar-width: none; }
                .app-root::-webkit-scrollbar { display: none; }
                .content-limit { width: 100%; max-width: 1020px; margin: 0 auto; padding: 20px; box-sizing: border-box; }

                .glass-panel { background: var(--glass); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: var(--glass-border); border-radius: 24px; padding: 25px; box-shadow: var(--shadow); margin-bottom: 20px; }

                .nav-tabs { display: flex; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 16px; }
                .tab-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; background: transparent; color: var(--txt-dim); cursor: pointer; font-weight: 800; font-size: 10px; text-transform: uppercase; transition: all 0.3s; }
                .tab-btn.active { background: var(--prm); color: #fff; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); }

                .input-area { width: 100%; height: 110px; background: var(--surface); border: 1px solid var(--brd); border-radius: 16px; padding: 15px; color: var(--prm) !important; font-family: 'JetBrains Mono', monospace; font-size: 14px; resize: none; outline: none; margin-bottom: 10px; transition: border-color 0.3s; }
                .input-area:focus { border-color: var(--prm); }

                .btn { background: var(--prm); color: #fff; border: none; padding: 14px 28px; border-radius: 12px; cursor: pointer; font-weight: 800; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4); }
                .btn:active { transform: scale(0.95); }

                .style-card { background: var(--surface); border: 1px solid var(--brd); border-radius: 16px; padding: 15px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 10px; }
                .style-card:hover { border-color: var(--prm); transform: translateY(-2px); background: rgba(37, 99, 235, 0.05); }
                .card-header { display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 900; color: var(--txt-dim); }
                .card-body { font-size: 15px; word-break: break-all; line-height: 1.4; }

                .txt-blue { color: var(--prm) !important; font-weight: 700; }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        `;
        this.bindEvents();
        this.updateSurgicalUI();
    },

    renderLander() {
        return `
            <div class="glass-panel" style="text-align:center; max-width:600px; margin:auto;">
                <div style="width:60px; height:60px; background:var(--prm); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 0 20px var(--prm);">
                    <i class="material-icons" style="color:white; font-size:32px;">font_download</i>
                </div>
                <h1 style="font-family:'Orbitron'; font-size:32px; margin-bottom:15px; letter-spacing:2px;">TYPE_<span style="color:var(--prm);">OPS</span></h1>
                <p style="color:var(--txt-dim); font-size:14px; margin-bottom:30px; line-height:1.6;">Tactical Font Styler & Text Repeater. <br>Unlock 25+ unique unicode styles for professional messaging and social media protocols.</p>
                <button id="btn-start" class="btn" style="width:100%;">INITIALIZE ENCODER</button>
            </div>
        `;
    },

    renderMain() {
        const { mode, inputText, repeatCount } = this.state;
        return `
            <div class="nav-tabs">
                <button class="tab-btn ${mode === 'styles' ? 'active' : ''}" data-mode="styles">Font styles (25)</button>
                <button class="tab-btn ${mode === 'repeater' ? 'active' : ''}" data-mode="repeater">Repeater</button>
            </div>
            <div class="glass-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-size:10px; font-weight:900; color:var(--txt-dim); text-transform:uppercase;">Input Stream</div>
                    <button id="btn-clear" style="background:transparent; border:none; color:var(--err); font-size:10px; font-weight:900; cursor:pointer;">CLEAR DATA</button>
                </div>
                <textarea id="main-input" class="input-area" placeholder="Enter text to encode...">${inputText}</textarea>

                ${mode === 'styles' ? `
                    <div id="styles-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:15px; margin-top:10px;"></div>
                ` : `
                    <div class="glass-panel" style="background:rgba(0,0,0,0.1); margin-top:10px; border-radius:16px;">
                        <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                            <div style="flex:1; min-width:120px;">
                                <div style="font-size:9px; font-weight:900; color:var(--txt-dim); margin-bottom:5px;">COUNT</div>
                                <input type="number" id="rep-count" class="input-area" style="height:45px; margin-bottom:0;" value="${repeatCount}" min="1" max="1000">
                            </div>
                            <label style="display:flex; gap:8px; font-size:12px; cursor:pointer; font-weight:700; align-items:center;">
                                <input type="checkbox" id="rep-line" ${this.state.repeatNewLine ? 'checked' : ''} style="accent-color:var(--prm); width:18px; height:18px;"> NEW LINE
                            </label>
                            <button id="btn-copy-rep" class="btn" style="flex:1;">COPY REPEATED</button>
                        </div>
                    </div>
                    <div style="font-size:9px; font-weight:900; color:var(--txt-dim); margin:15px 0 8px;">LIVE PREVIEW</div>
                    <div id="repeater-preview" class="txt-blue" style="background:rgba(0,0,0,0.2); padding:20px; border-radius:16px; height:200px; overflow-y:auto; font-size:13px; white-space:pre-wrap; border:1px solid var(--brd);"></div>
                `}
            </div>
        `;
    },

    bindEvents() {
        const root = this.sys.root;
        root.querySelectorAll('button, textarea, input, .style-card').forEach(el => {
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation());
        });

        const btnStart = root.querySelector('#btn-start');
        if (btnStart) btnStart.onclick = () => {
            localStorage.setItem('app_visited_' + this.appName, 'true');
            this.state.currentView = 'main';
            this.render();
        };

        root.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => { this.state.mode = btn.dataset.mode; this.render(); };
        });

        const inp = root.querySelector('#main-input');
        if (inp) inp.oninput = (e) => { this.state.inputText = e.target.value; this.updateSurgicalUI(); };

        const btnClear = root.querySelector('#btn-clear');
        if (btnClear) btnClear.onclick = () => {
            this.state.inputText = '';
            if(inp) inp.value = '';
            this.updateSurgicalUI();
        };

        const repCount = root.querySelector('#rep-count');
        if (repCount) repCount.oninput = (e) => { this.state.repeatCount = e.target.value; this.updateSurgicalUI(); };

        const repLine = root.querySelector('#rep-line');
        if (repLine) repLine.onchange = (e) => { this.state.repeatNewLine = e.target.checked; this.updateSurgicalUI(); };

        const btnCopyRep = root.querySelector('#btn-copy-rep');
        if (btnCopyRep) btnCopyRep.onclick = () => {
            const txt = root.querySelector('#repeater-preview').innerText;
            if(!txt || txt.includes('Waiting')) return this.sys.toast("Nothing to copy", "error");
            navigator.clipboard.writeText(txt);
            this.sys.toast("REPEATED DATA COPIED");
        };
    }
})