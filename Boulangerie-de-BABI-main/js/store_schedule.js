// ================================================================
// BOULANGERIE DE BABI — STORE HOURS & ORDER RESTRICTION CONTROLLER
// Store Hours: 05h45 to 23h00 (Abidjan Local Time)
// Programmes de sortie de pain : 06h00, 09h00, 14h00, 17h00, 18h00
// ================================================================

function isStoreOpen() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    const openInMinutes = 5 * 60 + 45;  // 05:45 = 345 min
    const closeInMinutes = 23 * 60;     // 23:00 = 1380 min
    return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
}

function getStoreOpeningMessage() {
    if (isStoreOpen()) {
        return {
            open: true,
            title: "☀️ La Boulangerie de BABI est Ouverte !",
            message: "Nos fours tournent à plein régime ! Sorties de pain chauds : 06h00, 09h00, 14h00, 17h00 et 18h00."
        };
    } else {
        return {
            open: false,
            title: "🥐 La Boulangerie est actuellement fermée (05h45 - 23h00)",
            message: "Nos fours se préparent pour vous accueillir dès 05h45 du matin ! Les commandes en ligne sont temporairement suspendues et réouvriront à 05h45."
        };
    }
}

function showStoreClosedModal() {
    let modalEl = document.getElementById('storeClosedModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'storeClosedModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header border-0 text-white p-4" style="background: linear-gradient(135deg, #2b160c, #422212);">
                    <div class="d-flex align-items-center gap-2">
                        <div class="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center" style="width:40px;height:40px;">
                            <i class="fa-solid fa-moon fs-5"></i>
                        </div>
                        <div>
                            <h5 class="modal-title fw-bold mb-0" style="font-family:'Playfair Display', serif;">Boulangerie Fermée</h5>
                            <small class="text-warning">Horaires : 05h45 - 23h00</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 text-center">
                    <div class="mb-3 text-warning display-4">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <h5 class="fw-bold mb-2" style="color: #2b160c;">Les commandes en ligne réouvrent à 05h45 !</h5>
                    <p class="text-muted small mb-3">Nos boulangers préparent la pâte fraîche et allument les fours dès l'aube. Vous pourrez valider votre panier dès 05h45 du matin.</p>
                    <div class="p-3 bg-light rounded-3 text-start small border mb-3">
                        <div class="fw-bold text-dark"><i class="fa-solid fa-circle-info text-warning me-1"></i> Horaires de la boutique :</div>
                        <div class="text-muted ms-3">• Lundi à Dimanche : 05h45 – 23h00</div>
                        <div class="fw-bold text-dark mt-2"><i class="fa-solid fa-fire text-danger me-1"></i> Sorties de pain chauds :</div>
                        <div class="text-muted ms-3">• 06h00 • 09h00 • 14h00 • 17h00 • 18h00</div>
                    </div>
                </div>
                <div class="modal-footer border-0 p-3 bg-light">
                    <button type="button" class="btn btn-warning w-100 fw-bold rounded-pill py-2" style="background:#fb923c; border:none; color:#2b160c;" data-bs-dismiss="modal">
                        J'ai compris
                    </button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modalEl);
    }
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

function removeNavbarStoreBadges() {
    document.querySelectorAll('.store-status-badge').forEach(el => {
        el.style.display = 'none';
        el.remove();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    removeNavbarStoreBadges();
});
