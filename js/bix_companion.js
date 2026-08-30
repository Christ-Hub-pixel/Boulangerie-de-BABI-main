/**
 * 🥐 BIX UNIVERSAL COMPANION & FLOATING COPILOT
 * Intégration omniprésente de la Mascotte BIX sur toutes les interfaces (Caissière, Gérante, Admin, Boutique)
 */

(function () {
    // Ne pas injecter si on est déjà sur bix.html
    if (window.location.pathname.endsWith('bix.html') || window.location.pathname === '/bix') {
        return;
    }

    // Détecter le rôle de l'interface courante
    let currentRole = 'client';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin')) currentRole = 'admin';
    else if (path.includes('gerante')) currentRole = 'gerante';
    else if (path.includes('caissiere') || path.includes('caisse')) currentRole = 'caissiere';

    // Injection des styles CSS de BIX Companion
    const style = document.createElement('style');
    style.innerHTML = `
        .bix-companion-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #090d16;
            border: 2px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            cursor: pointer;
            z-index: 999999;
            transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            user-select: none;
        }
        .bix-companion-fab:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 14px 35px rgba(245, 158, 11, 0.65);
        }
        .bix-companion-fab .bix-mascot-anim {
            animation: bixFabBounce 3.5s ease-in-out infinite;
        }
        @keyframes bixFabBounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
        }

        .bix-companion-popup {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 380px;
            max-width: calc(100vw - 32px);
            height: 540px;
            max-height: calc(100vh - 120px);
            background: #0b0f17;
            border: 1px solid rgba(245, 158, 11, 0.35);
            border-radius: 20px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 999999;
            animation: bixPopupIn 0.25s ease-out;
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .bix-companion-popup.active {
            display: flex;
        }
        @keyframes bixPopupIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .bix-popup-header {
            padding: 14px 18px;
            background: rgba(15, 23, 42, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .bix-popup-body {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .bix-popup-input-area {
            padding: 12px 16px;
            background: rgba(15, 23, 42, 0.95);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .bix-popup-input {
            flex: 1;
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 20px;
            padding: 8px 14px;
            color: #f8fafc;
            font-size: 13px;
            outline: none;
        }
        .bix-popup-input:focus {
            border-color: #f59e0b;
        }
        .bix-popup-send {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #f59e0b;
            color: #000;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            flex-shrink: 0;
        }
        .bix-chip-btn {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 11.5px;
            cursor: pointer;
            transition: all 0.15s;
            text-align: left;
        }
        .bix-chip-btn:hover {
            background: rgba(245, 158, 11, 0.2);
            border-color: rgba(245, 158, 11, 0.4);
            color: #fbbf24;
        }
    `;
    document.head.appendChild(style);

    // Construction du HTML de BIX Companion
    const companionDiv = document.createElement('div');
    companionDiv.id = 'bix-companion-root';
    companionDiv.innerHTML = `
        <!-- Floating FAB Button -->
        <button type="button" class="bix-companion-fab" id="bixFabTrigger" title="Demander à BIX (Mascotte IA)">
            <span class="bix-mascot-anim">🥐</span>
        </button>

        <!-- Interactive Popup Window -->
        <div class="bix-companion-popup" id="bixPopupContainer">
            <!-- Header -->
            <div class="bix-popup-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(245,158,11,0.2); display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        🥐
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 14px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
                            <span>BIX Copilot</span>
                            <span style="font-size: 9px; background: #f59e0b; color: #000; padding: 1px 5px; border-radius: 4px; font-weight: 800;">${currentRole.toUpperCase()}</span>
                        </div>
                        <div style="font-size: 10.5px; color: #94a3b8;">Supervision & Assistance en Direct</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <a href="bix.html" target="_blank" style="color: #fbbf24; font-size: 11px; text-decoration: none; padding: 3px 8px; border-radius: 6px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); font-weight: 700;" title="Ouvrir le grand cockpit BIX HQ">
                        HQ ↗
                    </a>
                    <button type="button" id="bixPopupClose" style="background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 4px;">✕</button>
                </div>
            </div>

            <!-- Messages Body -->
            <div class="bix-popup-body" id="bixPopupBody">
                <a href="bix.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #090d16; font-weight: 800; font-size: 12px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(245,158,11,0.35); transition: transform 0.15s;">
                    <span>🥐 Ouvrir BIX HQ (Cockpit Central)</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; font-size: 12.5px; color: #e2e8f0; line-height: 1.5;">
                    <p style="margin-bottom: 8px;">👋 <strong>Coucou ! Je suis BIX.</strong> Que souhaitez-vous vérifier sur cette interface ?</p>
                    <div style="display: flex; flex-direction: column; gap: 6px;" id="bixQuickSuggestions">
                        <!-- Role specific chips -->
                    </div>
                </div>
                <div id="bixPopupMessages" style="display: flex; flex-direction: column; gap: 10px;"></div>
            </div>

            <!-- Input Bar -->
            <form class="bix-popup-input-area" id="bixPopupForm">
                <input type="text" class="bix-popup-input" id="bixPopupInput" placeholder="Posez une question à BIX..." autocomplete="off"/>
                <button type="submit" class="bix-popup-send" title="Envoyer">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(companionDiv);

    // Initialisation des raccourcis selon le rôle
    const chipsContainer = document.getElementById('bixQuickSuggestions');
    if (chipsContainer) {
        if (currentRole === 'caissiere') {
            chipsContainer.innerHTML = `
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Combien de commandes sont à retirer avec code PIN ?')">🥖 Commandes à retirer (PIN)</button>
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Quels sont les articles bientôt en rupture ?')">📦 Vérifier les stocks disponibles</button>
            `;
        } else if (currentRole === 'gerante') {
            chipsContainer.innerHTML = `
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Quelles sont les prévisions de fournées pour demain matin ?')">🥖 Prévision de cuisson demain</button>
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Y a-t-il des alertes de rupture sur les matières premières ?')">⚠️ Alertes stocks & fournil</button>
            `;
        } else {
            chipsContainer.innerHTML = `
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Comment vont les ventes aujourd hui ?')">📊 Bilan des ventes du jour</button>
                <button type="button" class="bix-chip-btn" onclick="window.sendBixCompanionPrompt('Détecte les anomalies opérationnelles du jour')">🚨 Détecter les anomalies</button>
            `;
        }
    }

    // Toggle Popup
    const fab = document.getElementById('bixFabTrigger');
    const popup = document.getElementById('bixPopupContainer');
    const closeBtn = document.getElementById('bixPopupClose');

    if (fab && popup) {
        fab.addEventListener('click', () => {
            popup.classList.toggle('active');
            if (popup.classList.contains('active')) {
                const input = document.getElementById('bixPopupInput');
                if (input) input.focus();
            }
        });
    }

    if (closeBtn && popup) {
        closeBtn.addEventListener('click', () => {
            popup.classList.remove('active');
        });
    }

    // Envoi de message
    const form = document.getElementById('bixPopupForm');
    const input = document.getElementById('bixPopupInput');
    const msgContainer = document.getElementById('bixPopupMessages');
    const body = document.getElementById('bixPopupBody');

    window.sendBixCompanionPrompt = function (promptText) {
        if (input) {
            input.value = promptText;
            if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            input.value = '';

            if (msgContainer) {
                msgContainer.innerHTML += `
                    <div style="align-self: flex-end; background: #1e293b; color: #f8fafc; padding: 8px 12px; border-radius: 12px 12px 2px 12px; font-size: 12.5px; max-width: 85%; border: 1px solid rgba(255,255,255,0.08);">
                        ${escapeHtmlCompanion(text)}
                    </div>
                    <div id="bixCompanionLoading" style="align-self: flex-start; color: #fbbf24; font-size: 12px; padding: 6px 10px;">
                        <i class="fa-solid fa-spinner fa-spin me-1"></i> BIX réfléchit...
                    </div>
                `;
                if (body) body.scrollTop = body.scrollHeight;
            }

            try {
                const fetcher = (typeof window !== 'undefined' && typeof window.babiFetch === 'function') ? window.babiFetch : fetch;
                const apiBase = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '';
                const res = await fetcher(`${apiBase}/api/ai/assistant/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: text, message: text, role: currentRole })
                }, 15000);

                const loader = document.getElementById('bixCompanionLoading');
                if (loader) loader.remove();

                if (res && res.ok) {
                    const data = await res.json();
                    const reply = data.reply || data.response || "Analyse terminée.";
                    const cleanHtml = formatCompanionMarkdown(reply);

                    if (msgContainer) {
                        msgContainer.innerHTML += `
                            <div style="align-self: flex-start; background: rgba(24, 32, 47, 0.95); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid #f59e0b; border-radius: 14px 14px 14px 2px; padding: 12px 14px; font-size: 12.5px; color: #e2e8f0; line-height: 1.5; max-width: 90%;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #fbbf24;">
                                    <span>🥐 BIX</span>
                                    <button type="button" onclick="speakCompanionText(this)" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 11px;" title="Écouter">🔊</button>
                                </div>
                                <div class="bix-companion-text">${cleanHtml}</div>
                            </div>
                        `;
                        if (body) body.scrollTop = body.scrollHeight;
                    }
                }
            } catch (err) {
                const loader = document.getElementById('bixCompanionLoading');
                if (loader) loader.remove();
            }
        });
    }

    function escapeHtmlCompanion(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatCompanionMarkdown(raw) {
        if (!raw) return '';
        let h = raw.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/•\s*(.*?)(?=(\n|$))/g, '<div style="margin-left: 8px;">◆ $1</div>');
        h = h.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
        return h;
    }

    window.speakCompanionText = function (btn) {
        const parent = btn.closest('div').parentElement;
        const textElem = parent.querySelector('.bix-companion-text');
        if (textElem && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textElem.innerText.replace(/[*#◆]/g, ''));
            utterance.lang = 'fr-FR';
            window.speechSynthesis.speak(utterance);
        }
    };
})();
