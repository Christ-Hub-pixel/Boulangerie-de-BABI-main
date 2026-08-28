/**
 * 🥐 BABI BRAIN IA — CONSEILLER GOURMAND & ASSISTANT OMNI-CANAL
 * Intégration sur le Site Web, Boutique en ligne et Simulateur de Gâteau
 */

(function() {
    // Ne pas afficher sur les pages admin/caissiere/gerante si elles ont leur propre interface
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('admin') || pathname.includes('caissiere') || pathname.includes('gerante')) {
        return;
    }

    // 1. Injection du HTML du Widget Conseiller Gourmand
    function injectAiWidget() {
        if (document.getElementById('babi-client-ai-fab')) return;

        const widgetHtml = `
            <!-- Bouton Flottant Conseiller Gourmand IA -->
            <div id="babi-client-ai-fab" onclick="toggleClientAiDrawer()" style="position: fixed; bottom: 24px; left: 24px; z-index: 9999; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #2b160c, #78350f); color: #ffffff; padding: 12px 18px; border-radius: 9999px; cursor: pointer; box-shadow: 0 10px 30px rgba(43, 22, 12, 0.4); border: 2px solid #fbbf24; transition: all 0.25s ease; font-family: system-ui, -apple-system, sans-serif;">
                <span class="material-symbols-outlined" style="font-size: 22px; color: #fbbf24;">auto_awesome</span>
                <span style="font-weight: 800; font-size: 12.5px; letter-spacing: 0.2px;">Conseiller Gourmand IA</span>
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80;"></span>
            </div>

            <!-- Tiroir Chat Conseiller Gourmand -->
            <div id="babi-client-ai-drawer" class="hidden" style="position: fixed; bottom: 90px; left: 24px; z-index: 99999; width: 360px; max-width: calc(100vw - 32px); height: 500px; max-height: calc(100vh - 120px); background: #ffffff; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1.5px solid #fde68a; display: flex; flex-direction: column; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; display: none;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2b160c, #451a03); color: #fff; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(251, 191, 36, 0.2); display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-outlined" style="color: #fbbf24; font-size: 20px;">bakery_dining</span>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #fff;">Conseiller BABI</h4>
                            <span style="font-size: 11px; color: #fde68a;">Votre sommelier boulanger en direct</span>
                        </div>
                    </div>
                    <button type="button" onclick="toggleClientAiDrawer()" style="background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer;">✕</button>
                </div>

                <!-- Chips Suggestions -->
                <div style="background: #fffbeb; padding: 8px 10px; border-bottom: 1px solid #fef3c7; display: flex; gap: 6px; overflow-x: auto; white-space: nowrap;">
                    <button type="button" onclick="sendClientAiQuickPrompt('Quel est le petit-déjeuner idéal ?')" style="padding: 4px 10px; border-radius: 12px; border: 1px solid #fcd34d; background: #ffffff; font-size: 10.5px; font-weight: 700; color: #78350f; cursor: pointer;">🌅 Petit-déjeuner</button>
                    <button type="button" onclick="sendClientAiQuickPrompt('Que manger ce midi ?')" style="padding: 4px 10px; border-radius: 12px; border: 1px solid #fcd34d; background: #ffffff; font-size: 10.5px; font-weight: 700; color: #78350f; cursor: pointer;">🥪 Pause midi</button>
                    <button type="button" onclick="sendClientAiQuickPrompt('Idée pour le goûter')" style="padding: 4px 10px; border-radius: 12px; border: 1px solid #fcd34d; background: #ffffff; font-size: 10.5px; font-weight: 700; color: #78350f; cursor: pointer;">🍪 Goûter</button>
                    <button type="button" onclick="sendClientAiQuickPrompt('Gâteau anniversaire sur-mesure')" style="padding: 4px 10px; border-radius: 12px; border: 1px solid #fcd34d; background: #ffffff; font-size: 10.5px; font-weight: 700; color: #78350f; cursor: pointer;">🎂 Gâteaux</button>
                    <button type="button" onclick="sendClientAiQuickPrompt('Zone de livraison à Abidjan')" style="padding: 4px 10px; border-radius: 12px; border: 1px solid #fcd34d; background: #ffffff; font-size: 10.5px; font-weight: 700; color: #78350f; cursor: pointer;">🛵 Livraison</button>
                </div>

                <!-- Messages -->
                <div id="babi-client-ai-messages" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 12.5px; background: #fafaf9;">
                    <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; color: #292524; align-self: flex-start; max-width: 90%; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-weight: 800; font-size: 11px; margin-bottom: 2px; color: #b45309;">✨ Conseiller BABI :</div>
                        Bonjour et bienvenue à la **Boulangerie de BABI** ! Comment puis-je vous régaler aujourd'hui ?
                    </div>
                </div>

                <!-- Formulaire Input -->
                <form onsubmit="handleClientAiChat(event)" style="padding: 8px 10px; border-top: 1px solid #e7e5e4; background: #ffffff; display: flex; gap: 6px; align-items: center;">
                    <input type="text" id="babi-client-ai-input" placeholder="Posez une question (ex: gâteau, jus, pain chaud)..." style="flex: 1; padding: 8px 12px; border-radius: 12px; border: 1.5px solid #d6d3d1; font-size: 12px; outline: none;"/>
                    <button type="submit" style="background: #2b160c; color: #fbbf24; border: none; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
                    </button>
                </form>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = widgetHtml;
        document.body.appendChild(wrapper);
    }

    window.toggleClientAiDrawer = function() {
        const drawer = document.getElementById('babi-client-ai-drawer');
        if (!drawer) return;

        if (drawer.style.display === 'none' || !drawer.style.display) {
            drawer.style.display = 'flex';
            const input = document.getElementById('babi-client-ai-input');
            if (input) input.focus();
        } else {
            drawer.style.display = 'none';
        }
    };

    window.sendClientAiQuickPrompt = function(promptText) {
        const input = document.getElementById('babi-client-ai-input');
        if (input) {
            input.value = promptText;
            handleClientAiChat();
        }
    };

    window.handleClientAiChat = async function(e) {
        if (e && e.preventDefault) e.preventDefault();

        const input = document.getElementById('babi-client-ai-input');
        const container = document.getElementById('babi-client-ai-messages');
        if (!input || !container) return;

        const text = input.value.trim();
        if (!text) return;

        // Message client
        container.innerHTML += `
            <div style="background: #2b160c; color: #ffffff; border-radius: 14px; padding: 8px 12px; align-self: flex-end; max-width: 85%;">
                ${text}
            </div>
        `;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // Loading
        const loadId = 'client-load-' + Date.now();
        container.innerHTML += `
            <div id="${loadId}" style="background: #f5f5f4; border-radius: 14px; padding: 8px 12px; align-self: flex-start; color: #78716c; font-size: 11px;">
                <i class="fa-solid fa-spinner fa-spin me-1"></i> Recherche des meilleures gourmandises...
            </div>
        `;
        container.scrollTop = container.scrollHeight;

        try {
            const apiBase = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
            const res = await fetch(`${apiBase}/ai/client-advisor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();

            const loadEl = document.getElementById(loadId);
            if (loadEl) loadEl.remove();

            if (data && data.success) {
                let productsHtml = '';
                if (Array.isArray(data.suggestedProducts) && data.suggestedProducts.length > 0) {
                    productsHtml = `
                        <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
                            ${data.suggestedProducts.map(p => `
                                <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #fcd34d; border-radius: 10px; padding: 6px 8px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <img src="${p.img}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" onerror="this.src='assets/product_baguette.png'"/>
                                        <div>
                                            <div style="font-weight: 800; font-size: 11.5px; color: #2b160c;">${p.nom}</div>
                                            <div style="font-size: 10.5px; color: #b45309; font-weight: 700;">${p.prix} FCFA</div>
                                        </div>
                                    </div>
                                    <button type="button" onclick="addToCartFromAi('${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${p.img.replace(/'/g, "\\'")}')" style="background: #fb923c; color: #2b160c; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 10.5px; cursor: pointer;">
                                        + Ajouter
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                let actionBtnHtml = '';
                if (data.actionLink) {
                    actionBtnHtml = `
                        <div style="margin-top: 8px;">
                            <a href="${data.actionLink}" style="display: block; text-align: center; background: #d97706; color: #fff; text-decoration: none; padding: 8px; border-radius: 10px; font-weight: 800; font-size: 11px;">
                                ${data.actionText || 'Voir la page'}
                            </a>
                        </div>
                    `;
                }

                container.innerHTML += `
                    <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; color: #292524; align-self: flex-start; max-width: 90%; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-weight: 800; font-size: 11px; margin-bottom: 2px; color: #b45309;">✨ Conseiller BABI :</div>
                        <div>${(data.reply || '').replace(/\n/g, '<br>')}</div>
                        ${productsHtml}
                        ${actionBtnHtml}
                    </div>
                `;
            } else {
                container.innerHTML += `
                    <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; color: #292524; align-self: flex-start;">
                        Je suis à votre disposition ! N'hésitez pas à me demander nos pains chauds, viennoiseries ou jus du jour.
                    </div>
                `;
            }
        } catch (_) {
            const loadEl = document.getElementById(loadId);
            if (loadEl) loadEl.remove();
            container.innerHTML += `
                <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 14px; padding: 10px 12px; color: #292524; align-self: flex-start;">
                    Nos équipes au fournil sont à votre service pour vous servir nos meilleures fournées du jour !
                </div>
            `;
        }

        container.scrollTop = container.scrollHeight;
    };

    window.addToCartFromAi = function(nom, prix, img) {
        if (typeof addToCart === 'function') {
            addToCart(nom, prix, img);
        } else {
            // Fallback localStorage cart
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(i => i.nom === nom);
            if (existing) {
                existing.quantite = (existing.quantite || 1) + 1;
            } else {
                cart.push({ nom: nom, prix: prix, quantite: 1, image: img });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            if (typeof updateCartCount === 'function') updateCartCount();
        }

        // Notification visuelle
        const notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:#16a34a;color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;font-size:12.5px;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
        notif.innerHTML = `✅ "${nom}" ajouté au panier !`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2500);
    };

    // Auto-initialisation au chargement de la page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAiWidget);
    } else {
        injectAiWidget();
    }
})();
