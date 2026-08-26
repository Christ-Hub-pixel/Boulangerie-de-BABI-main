/**
 * 🥖 Boulangerie de BABI — Module "Fournées de Pain Chaud en Direct"
 * Créneaux officiels : 06h00 • 09h00 • 14h00 • 17h00 • 18h00
 * - Calcul en temps réel de la prochaine sortie de pain
 * - Compte à rebours animé ultra-précis (heures, minutes, secondes)
 * - Design Responsive Luxury sans césure ni troncature
 * - Détection de fournée en direct (sortie du four)
 * - Alerte sonore & visuelle
 */

(function () {
    'use strict';

    const BREAD_SCHEDULES = [
        { hour: 6, minute: 0, timeStr: "06h00", name: "Matinée Aube" },
        { hour: 9, minute: 0, timeStr: "09h00", name: "Petit Déjeuner" },
        { hour: 14, minute: 0, timeStr: "14h00", name: "Déjeuner & Goûter" },
        { hour: 17, minute: 0, timeStr: "17h00", name: "Sortie des Classes" },
        { hour: 18, minute: 0, timeStr: "18h00", name: "Fournée du Soir" }
    ];

    function getNextBreadBatch() {
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);

        for (let i = 0; i < BREAD_SCHEDULES.length; i++) {
            const batch = BREAD_SCHEDULES[i];
            const batchMinutes = batch.hour * 60 + batch.minute;
            const diff = batchMinutes - currentTotalMinutes;

            // En plein dans la fournée fraîche (-15 min à +10 min)
            if (diff >= -15 && diff <= 10) {
                return {
                    status: 'active',
                    batch: batch,
                    timeStr: batch.timeStr,
                    name: batch.name
                };
            }

            // Prochaine fournée à venir aujourd'hui
            if (diff > 10) {
                const targetTime = new Date();
                targetTime.setHours(batch.hour, batch.minute, 0, 0);
                const remainingSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));
                return {
                    status: 'upcoming',
                    batch: batch,
                    targetTime: targetTime,
                    remainingSeconds: remainingSeconds,
                    timeStr: batch.timeStr,
                    name: batch.name
                };
            }
        }

        // Toutes les fournées du jour sont terminées ➔ Prochaine demain à 06h00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(6, 0, 0, 0);
        const remainingSeconds = Math.max(0, Math.floor((tomorrow - now) / 1000));

        return {
            status: 'upcoming_tomorrow',
            batch: BREAD_SCHEDULES[0],
            targetTime: tomorrow,
            remainingSeconds: remainingSeconds,
            timeStr: "06h00",
            name: "Demain matin"
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
                <div class="babi-hot-bread-card babi-hot-bread-active-card p-3 p-md-4 rounded-4 shadow-lg border border-warning"
                    style="background: linear-gradient(135deg, #2b1408 0%, #4a210d 100%); color: #ffffff;">
                    <div class="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start">
                        <div class="d-flex align-items-center gap-3 justify-content-center justify-content-md-start">
                            <div class="babi-flame-pulse text-warning fs-1 flex-shrink-0">
                                🔥
                            </div>
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-1 flex-wrap justify-content-center justify-content-md-start">
                                    <span class="badge bg-danger text-white rounded-pill px-3 py-1 fw-bold text-uppercase" style="font-size:0.75rem;">
                                        <i class="fa-solid fa-fire me-1"></i> FOURNÉE EN DIRECT : SORTIE DU FOUR !
                                    </span>
                                    <span class="badge bg-warning text-dark rounded-pill px-2 py-1 fw-bold" style="font-size:0.75rem;">
                                        ${info.timeStr} (${info.name})
                                    </span>
                                </div>
                                <h4 class="fw-bold mb-1 text-white" style="font-family:'Playfair Display', serif; font-size:1.3rem;">
                                    Baguettes Chaudes & Croustillantes en Rayon !
                                </h4>
                                <p class="text-warning-emphasis small mb-0 opacity-90">
                                    Le pain sort du fournil à Riviera. Fumant, doré et prêt à déguster.
                                </p>
                            </div>
                        </div>

                        <div class="d-flex gap-2 flex-shrink-0 w-100 w-md-auto justify-content-center">
                            <a href="produits.html?cat=pain" class="btn btn-warning btn-lg fw-bold text-dark rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2"
                                style="background: linear-gradient(135deg, #fbbf24, #f59e0b); border:none;">
                                <i class="fa-solid fa-basket-shopping"></i> Commander du Pain Chaud
                            </a>
                        </div>
                    </div>
                </div>
                `;
            } else {
                const t = formatTime(info.remainingSeconds);
                container.innerHTML = `
                <div class="babi-hot-bread-card p-3 p-md-4 rounded-4 shadow-lg border border-warning border-opacity-25"
                    style="background: linear-gradient(145deg, #241208 0%, #3a1c0d 100%); color: #ffffff; position:relative; overflow:hidden;">
                    
                    <!-- Top Header Badges -->
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                        <span class="badge bg-warning text-dark rounded-pill px-3 py-1 fw-bold text-uppercase" style="font-size:0.75rem; letter-spacing:0.3px;">
                            <i class="fa-solid fa-fire me-1 text-danger"></i> FOURNÉE DE ${info.timeStr} — ${info.name.toUpperCase()}
                        </span>
                        <span class="badge bg-dark bg-opacity-75 text-warning border border-warning border-opacity-30 rounded-pill px-2 py-1 small">
                            <i class="fa-solid fa-location-dot me-1 text-warning"></i> Fournil Riviera
                        </span>
                    </div>

                    <!-- Middle Title & Countdown Layout -->
                    <div class="row align-items-center g-2 mt-1">
                        
                        <!-- Left text info -->
                        <div class="col-12 col-lg-7 text-center text-lg-start">
                            <h5 class="fw-bold mb-1 text-white" style="font-family:'Playfair Display', serif; font-size:1.2rem; line-height:1.25;">
                                Pain Chaud au Feu de Bois en Préparation
                            </h5>
                            <p class="text-light opacity-75 small mb-0">
                                Fournées du jour : <strong>06h</strong> • <strong>09h</strong> • <strong>14h</strong> • <strong>17h</strong> • <strong>18h</strong>
                            </p>
                        </div>

                        <!-- Right Countdown Tiles & Alert Button -->
                        <div class="col-12 col-lg-5">
                            <div class="d-flex align-items-center justify-content-center justify-content-lg-end gap-1 gap-sm-2 mt-2 mt-lg-0">
                                
                                <!-- Heures -->
                                <div class="babi-countdown-tile text-center px-2 py-1 px-sm-3 py-sm-2 rounded-3 bg-dark bg-opacity-60 border border-warning border-opacity-30">
                                    <div class="fw-bold text-warning font-monospace fs-4 fs-sm-3 lh-1">${t.hours}</div>
                                    <div class="text-light opacity-60 text-uppercase mt-1" style="font-size:0.58rem; letter-spacing:0.3px;">Heures</div>
                                </div>

                                <span class="text-warning fw-bold fs-5 opacity-50">:</span>

                                <!-- Minutes -->
                                <div class="babi-countdown-tile text-center px-2 py-1 px-sm-3 py-sm-2 rounded-3 bg-dark bg-opacity-60 border border-warning border-opacity-30">
                                    <div class="fw-bold text-warning font-monospace fs-4 fs-sm-3 lh-1">${t.minutes}</div>
                                    <div class="text-light opacity-60 text-uppercase mt-1" style="font-size:0.58rem; letter-spacing:0.3px;">Minutes</div>
                                </div>

                                <span class="text-warning fw-bold fs-5 opacity-50">:</span>

                                <!-- Secondes -->
                                <div class="babi-countdown-tile text-center px-2 py-1 px-sm-3 py-sm-2 rounded-3 bg-dark bg-opacity-60 border border-warning border-opacity-30">
                                    <div class="fw-bold text-warning font-monospace fs-4 fs-sm-3 lh-1">${t.seconds}</div>
                                    <div class="text-light opacity-60 text-uppercase mt-1" style="font-size:0.58rem; letter-spacing:0.3px;">Secondes</div>
                                </div>

                                <!-- Alert Button -->
                                <button type="button" class="btn btn-warning text-dark rounded-pill px-3 py-2 ms-1 ms-sm-2 fw-bold d-flex align-items-center gap-1 shadow-sm flex-shrink-0" 
                                    title="M'alerter dès la sortie" onclick="window.triggerHotBreadChime()" style="font-size:0.75rem;">
                                    <i class="fa-solid fa-bell"></i> <span>Alerte</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                `;
            }
        });
    }

    window.triggerHotBreadChime = function () {
        try {
            if ('vibrate' in navigator) {
                navigator.vibrate([35, 25, 35]);
            }
        } catch (_) {}
    };

    document.addEventListener('DOMContentLoaded', () => {
        updateHotBreadWidget();
        setInterval(updateHotBreadWidget, 15000);
    });

})();
