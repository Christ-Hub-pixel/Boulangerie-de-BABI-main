// ================================================================
// BOULANGERIE DE BABI — STORE HOURS & ORDER RESTRICTION CONTROLLER
// Store Hours: 05h45 to 23h00 (Abidjan Local Time GMT)
// Programmes de sortie de pain : 06h00, 09h00, 14h00, 17h00, 18h00
// ================================================================

function getAbidjanTime() {
    const now = new Date();
    // Côte d'Ivoire est sur le fuseau horaire GMT / UTC+0
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

function isStoreOpen() {
    const { totalMinutes } = getAbidjanTime();
    const openInMinutes = 5 * 60 + 45;  // 05:45 = 345 min
    const closeInMinutes = 23 * 60;     // 23:00 = 1380 min
    return totalMinutes >= openInMinutes && totalMinutes < closeInMinutes;
}

function getStoreOpeningMessage() {
    if (isStoreOpen()) {
        return {
            open: true,
            title: "☀️ La Boulangerie de BABI est Ouverte !",
            message: "Nos fours tournent à plein régime (05h45 - 23h00) ! Sorties de pain chauds : 06h00, 09h00, 14h00, 17h00 et 18h00."
        };
    } else {
        return {
            open: false,
            title: "🌙 La Boulangerie est actuellement fermée (05h45 - 23h00)",
            message: "Nos maîtres boulangers se préparent pour vous accueillir dès 05h45 du matin ! Les commandes en ligne réouvriront à 05h45."
        };
    }
}

function showStoreClosedModal(actionContext = 'action') {
    let modalEl = document.getElementById('storeClosedModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'storeClosedModal';
        modalEl.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            animation: fadeIn 0.25s ease-out;
        `;

        modalEl.innerHTML = `
            <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; border: 1.5px solid #fed7aa; animation: slideUp 0.3s ease-out;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1f1008 0%, #431d0e 100%); color: #fff; padding: 24px; position: relative; border-bottom: 3px solid #f59e0b;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                            <i class="fa-solid fa-moon"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 800; color: #ffffff;">Boulangerie Actuellement Fermée</h4>
                            <span style="display: inline-block; margin-top: 3px; font-size: 12px; font-weight: 700; color: #fbbf24; background: rgba(245, 158, 11, 0.18); padding: 2px 8px; border-radius: 6px;">
                                <i class="fa-regular fa-clock me-1"></i> Horaires : 05h45 – 23h00 (7j/7)
                            </span>
                        </div>
                    </div>
                    <button type="button" onclick="closeStoreClosedModal()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
                </div>

                <!-- Body -->
                <div style="padding: 24px; text-align: center; color: #1e293b;">
                    <div style="font-size: 42px; margin-bottom: 12px;">🥖🌙</div>
                    <h5 style="font-weight: 800; font-size: 17px; color: #1f1008; margin-bottom: 8px;">
                        Nos fours se préparent pour demain matin !
                    </h5>
                    <p style="font-size: 13.5px; color: #64748b; line-height: 1.6; margin-bottom: 18px;">
                        Il est actuellement tard la nuit à Abidjan. Nos maîtres boulangers sont au repos et commenceront à pétrir la pâte dès l'aube pour la première fournée de <strong>06h00</strong>.
                    </p>

                    <!-- Horaires details card -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 14px; text-align: left; font-size: 12.5px; margin-bottom: 20px;">
                        <div style="font-weight: 700; color: #92400e; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-circle-info"></i> Informations de service :
                        </div>
                        <div style="color: #451a03; margin-bottom: 4px;">• <strong>Ouverture de la boulangerie :</strong> Dès 05h45 du matin</div>
                        <div style="color: #451a03; margin-bottom: 4px;">• <strong>Fermeture de la boulangerie :</strong> À 23h00</div>
                        <div style="color: #b45309; font-weight: 600; margin-top: 6px;">
                            <i class="fa-solid fa-fire text-danger"></i> Sorties de pain chaud : 06h00 • 09h00 • 14h00 • 17h00 • 18h00
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button type="button" onclick="closeStoreClosedModal()" style="flex: 1; padding: 12px 18px; border-radius: 12px; border: none; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #ffffff; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                            <i class="fa-solid fa-check me-1"></i> J'ai compris
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    } else {
        modalEl.style.display = 'flex';
    }
}

function closeStoreClosedModal() {
    const modalEl = document.getElementById('storeClosedModal');
    if (modalEl) {
        modalEl.style.display = 'none';
    }
}

function checkStoreBeforeAction(actionName, onAllowedCallback) {
    if (isStoreOpen()) {
        if (typeof onAllowedCallback === 'function') {
            onAllowedCallback();
        }
    } else {
        showStoreClosedModal(actionName);
    }
}

function renderStoreStatusBanner() {
    // Le bandeau permanent intrusif est supprimé pour préserver une interface propre et professionnelle.
    const existing = document.getElementById('babiStoreClosedGlobalBanner');
    if (existing) existing.remove();
}

document.addEventListener('DOMContentLoaded', () => {
    renderStoreStatusBanner();
});
