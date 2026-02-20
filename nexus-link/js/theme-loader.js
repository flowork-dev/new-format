//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\nexus-link\js\theme-loader.js total lines 25 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/**
 * NEXUS BIO - THEME REGISTRY SYSTEM
 * File ini menyiapkan global object untuk menampung tema.
 */

window.NEXUS_THEMES = {};

window.registerTheme = function(themeConfig) {
    if(!themeConfig.id || !themeConfig.name || !themeConfig.css) {
        console.error("Invalid Theme Config:", themeConfig);
        return;
    }
    window.NEXUS_THEMES[themeConfig.id] = themeConfig;
    console.log(`[THEME LOADED]: ${themeConfig.name}`);
};

window.getTheme = function(id) {
    return window.NEXUS_THEMES[id] || window.NEXUS_THEMES['glass'] || Object.values(window.NEXUS_THEMES)[0];
};
