// ?? Configuration Dynamique API - Boulangerie de BABI
// Bascule automatique entre Localhost (Dev) et LWS Cloud (Production)
(function() {
    const isProd = window.location.hostname.includes('boulangeriedebabi.com');
    window.API_BASE_URL = isProd ? 'https://api.boulangeriedebabi.com' : 'http://localhost:5000';
    console.log(`?? [Babi API Config] Connecté sur : ${window.API_BASE_URL}`);
})();
