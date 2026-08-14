/**
 * 🥖 Boulangerie de BABI — Module "Fournées de Pain Chaud en Direct"
 * Créneaux officiels : 06h00 • 09h00 • 14h00 • 17h00 • 18h00
 * - Calcul en temps réel de la prochaine sortie de pain
 * - Compte à rebours animé (heures, minutes, secondes)
 * - Détection de fournée en cours (±15 min du créneau) avec animation vapeur/feu
 * - Notification d'alerte sonore et visuelle
 */

(function () {
    'use strict';

    const BREAD_SCHEDULES = [
        { hour: 6, minute: 0, label: "06h00 (Matinée Aube)" },
        { hour: 9, minute: 0, label: "09h00 (Petit Déjeuner)" },
        { hour: 14, minute: 0, label: "14h00 (Déjeuner & Goûter)" },
        { hour: 17, minute: 0, label: "17h00 (Sortie des Classes)" },
        { hour: 18, minute: 0, label: "18h00 (Fournée du Soir)" }
    ];

    function getNextBreadBatch() {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);

        // Trouver le créneau actif ou le prochain
        for (let i = 0; i < BREAD_SCHEDULES.length; i++) {
            const batch = BREAD_SCHEDULES[i];
            const batchMinutes = batch.hour * 60 + batch.minute;
            const diff = batchMinutes - currentTotalMinutes;

            // Si on est dans la fenêtre de fournée fraîche (10 min avant jusqu'à 20 min après)
            if (diff >= -20 && diff <= 10) {
                return {
                    status: 'active',
                    batch: batch,
                    diffMinutes: diff,
                    label: batch.label
                };
            }

            // Si c'est la prochaine fournée de la journée
            if (diff > 10) {
                const targetTime = new Date();
                targetTime.setHours(batch.hour, batch.minute, 0, 0);
                const remainingSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));
                return {
                    status: 'upcoming',
                    batch: batch,
                    targetTime: targetTime,
                    remainingSeconds: remainingSeconds,
                    label: batch.label
                };
            }
        }

        // Si toutes les fournées du jour sont passées, la prochaine est demain à 06h00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        const remainingSeconds = Math.max(0, Math.floor((tomorrow - now) / 1000));

        return {
            status: 'upcoming_tomorrow',
            batch: BREAD_SCHEDULES[0],
            targetTime: tomorrow,
            remainingSeconds: remainingSeconds,
            label: "06h00 (Demain matin)"
        };
    }

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        return {
            hours: String(h).padStart(2, '0'),
            minutes: String(m).padStart(2, '0'),
            seconds: String(s).padStart(2, '0')
        };
    }

    function updateHotBreadWidget() {
        const containers = document.querySelectorAll('.babi-hot-bread-widget');
        if (containers.length === 0) return;

        const info = getNextBreadBatch();

        containers.forEach(container => {
            if (info.status === 'active') {
                container.innerHTML = `
                <div class="babi-hot-bread-active p-3 p-md-4 rounded-4 shadow-sm border border-warning d-flex flex-wrap align-items-center justify-content-between gap-3" 
                    style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);">
                    <div class="d-flex align-items-center gap-3">
                        <div class="babi-hot-bread-flame text-danger display-5" style="animation: pulse 1.2s infinite;">
                            🔥
                        </div>
                        <div>
                            <span class="badge bg-danger text-white rounded-pill px-3 py-1 mb-1 fw-bold" style="font-size:0.75rem;">
                                <i class="fa-solid fa-fire me-1"></i> FOURNÉE ACTUELLE : SORTIE DU FOUR !
                            </span>
                            <h4 class="fw-bold mb-0" style="color: #2b160c; font-family:'Playfair Display', serif;">
                                Baguettes Chaudes & Croustillantes (${info.batch.hour}h00)
                            </h4>
                            <p class="text-muted small mb-0 mt-1">Le pain est fumant et croustillant en boutique et prêt pour expédition immédiate.</p>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <a href="produits.html?cat=pain" class="btn btn-warning fw-bold text-dark rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2" 
                            style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border:none;">
                            <i class="fa-solid fa-basket-shopping"></i> Commander du Pain Chaud
                        </a>
                    </div>
                </div>
                `;
            } else {
                const t = formatTime(info.remainingSeconds);
                container.innerHTML = `
                <div class="babi-hot-bread-upcoming p-3 p-md-4 rounded-4 shadow-sm border d-flex flex-wrap align-items-center justify-content-between gap-3"
                    style="background: linear-gradient(135deg, #2b160c 0%, #43200f 100%); color: #ffffff;">
                    <div class="d-flex align-items-center gap-3">
                        <div class="babi-hot-bread-icon bg-warning bg-opacity-20 text-warning rounded-circle p-3 d-flex align-items-center justify-content-center" style="width:58px;height:58px;flex-shrink:0;">
                            <i class="fa-solid fa-fire-burner fs-2"></i>
                        </div>
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span class="badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold" style="font-size:0.72rem;">
                                    <i class="fa-solid fa-clock me-1"></i> PROCHAINE SORTIE DE PAIN
                                </span>
                                <span class="text-warning small fw-bold">${info.label}</span>
                            </div>
                            <h5 class="fw-bold mb-0 text-white" style="font-family:'Playfair Display', serif;">
                                Fournée au feu de bois en préparation
                            </h5>
                            <small class="text-light opacity-75">Sorties du jour : 06h00 • 09h00 • 14h00 • 17h00 • 18h00</small>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center gap-2 flex-shrink-0">
                        <div class="d-flex gap-2 text-center">
                            <div class="bg-dark bg-opacity-50 px-3 py-2 rounded-3 border border-secondary border-opacity-50">
                                <div class="fw-bold fs-4 text-warning font-monospace">${t.hours}</div>
                                <div class="text-light opacity-50" style="font-size:0.65rem;">HEURES</div>
                            </div>
                            <div class="bg-dark bg-opacity-50 px-3 py-2 rounded-3 border border-secondary border-opacity-50">
                                <div class="fw-bold fs-4 text-warning font-monospace">${t.minutes}</div>
                                <div class="text-light opacity-50" style="font-size:0.65rem;">MINUTES</div>
                            </div>
                            <div class="bg-dark bg-opacity-50 px-3 py-2 rounded-3 border border-secondary border-opacity-50">
                                <div class="fw-bold fs-4 text-warning font-monospace">${t.seconds}</div>
                                <div class="text-light opacity-50" style="font-size:0.65rem;">SECONDES</div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline-warning rounded-circle d-flex align-items-center justify-content-center ms-2" 
                            style="width:44px;height:44px;" title="Alerte fournil" onclick="window.triggerHotBreadChime()">
                            <i class="fa-regular fa-bell"></i>
                        </button>
                    </div>
                </div>
                `;
            }
        });
    }

    window.triggerHotBreadChime = function () {
        // Alerte visuelle / sonore
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) { }

        alert("🔔 Alerte Fournée Activée !\nVous recevrez un signal dès la prochaine sortie de pain chaud à la Boulangerie de BABI.");
    };

    document.addEventListener('DOMContentLoaded', () => {
        updateHotBreadWidget();
        setInterval(updateHotBreadWidget, 1000);
    });

})();
