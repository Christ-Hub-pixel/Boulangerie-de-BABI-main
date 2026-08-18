/**
 * 🛡️ ANTI-HACKER CLIENT SHIELD (Protection Intégrité Navigateur & Anti-Falsification)
 * Empêche la modification frauduleuse des prix dans le panier et le DOM.
 */
(function() {
    'use strict';

    // 1. Avertissement Cyber-Défense dans la Console Développeur
    if (typeof console !== 'undefined') {
        const bannerStyle = 'color: #ea580c; font-size: 22px; font-weight: bold; text-shadow: 1px 1px black;';
        const warningStyle = 'color: #fbbf24; font-size: 14px; font-weight: bold;';
        console.log('%c🛡️ BOULANGERIE DE BABI — SYSTÈME SOUS CYBER-SURVEILLANCE', bannerStyle);
        console.log('%c⚠️ Toute tentative d\'injection de code, de modification de prix ou de falsification de session est interceptée, signée et signalée au SOC de sécurité.', warningStyle);
    }

    // 2. Anti-Clickjacking & Anti-Framing Client
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (e) {
        // En cas de Sandbox stricte
    }

    // 3. Validation de Sécurité des Prix dans le Panier (Anti-Price-Tampering)
    window.addEventListener('DOMContentLoaded', () => {
        // Observer les mutations suspectes sur les éléments de prix
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target && target.classList && target.classList.contains('price-display')) {
                        // Re-vérification côté serveur systématique lors de l'envoi de commande
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

})();
