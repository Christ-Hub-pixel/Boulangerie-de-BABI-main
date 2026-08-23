// ================================================================
// 🎓 BOULANGERIE DE BABI — INTERACTIVE DEMONSTRATIVE TUTORIAL HUB
// Visite Guidée Démonstrative & Intelligente pour les Clients
// ================================================================

class BabiInteractiveTutorial {
    constructor() {
        this.currentStep = 0;
        this.overlayEl = null;
        this.spotlightEl = null;
        this.cardEl = null;
        this.currentTargetEl = null;
        this.steps = [
            {
                id: 'categories',
                title: '1. Explorer le Fournil & les Catégories 🥖',
                text: 'Découvrez nos 5 rayons artisanaux : Pains & Baguettes croustillants, Viennoiseries au pur beurre, Pâtisseries fines et Jus naturels pressés.',
                instruction: 'Cliquez sur la catégorie ou le catalogue pour commencer la découverte',
                selector: '.category-nav, .category-filter-btn, .category-btn, #category-pains, [data-category], a[href*="produits.html"], .nav-item a[href*="produits"]',
                fallbackSelector: 'header, .navbar-brand',
                actionTrigger: 'click'
            },
            {
                id: 'add_to_cart',
                title: '2. Ajouter un Délicieux Produit au Panier 🥐',
                text: 'Chaque création est préparée avec amour et sortie chaude du four. Choisissez votre quantité et ajoutez-la directement au panier.',
                instruction: 'Cliquez sur le bouton "Ajouter au panier" en surbrillance pour tester',
                selector: '.btn-add-cart, .add-to-cart-btn, .product-card .btn, button[onclick*="addToCart"], .btn-primary-gold',
                fallbackSelector: '.product-card, .menu-item',
                actionTrigger: 'click'
            },
            {
                id: 'view_cart',
                title: '3. Consulter votre Panier en Direct 🛒',
                text: 'Retrouvez vos délices sélectionnés, calculez vos montants en temps réel et appliquez vos codes de fidélité.',
                instruction: 'Cliquez sur l\'icône du Panier pour vérifier vos articles',
                selector: '.cart-badge, .nav-cart-btn, a[href*="cart.html"], #cart-count, .cart-icon-wrapper',
                fallbackSelector: '.navbar-nav',
                actionTrigger: 'click'
            },
            {
                id: 'checkout_pin',
                title: '4. Retrait Express & Code PIN Sécurisé ⚡',
                text: 'Réglez en 1 clic par Wave Mobile Money et recevez immédiatement votre Code PIN unique pour un retrait en 15 secondes au comptoir sans attente !',
                instruction: 'Cliquez sur le bouton de commande pour comprendre le retrait express',
                selector: 'a[href*="checkout.html"], #checkoutBtn, button[onclick*="submitBabiOrder"], .btn-checkout, #submitOrderBtn',
                fallbackSelector: 'main, .container',
                actionTrigger: 'click'
            },
            {
                id: 'fidelity_rewards',
                title: '5. Points de Fidélité & Récompenses 🎁',
                text: 'Chaque commande vous rapporte des points de fidélité pour débloquer des croissants, pains au chocolat et gâteaux offerts.',
                instruction: 'Cliquez pour finaliser le guide et débloquer vos 50 points de bienvenue !',
                selector: 'a[href*="compte.html"], a[href*="fidelite.html"], .user-profile-btn, .nav-user-icon, .lr-user-icon',
                fallbackSelector: 'footer',
                actionTrigger: 'click'
            }
        ];
    }

    init() {
        this.injectLauncherButton();

        // Si l'utilisateur n'a jamais fait le tutoriel, on le démarre automatiquement
        const isCompleted = localStorage.getItem('babi_tutorial_completed');
        const isExcludedPage = window.location.pathname.includes('admin.html') || 
                               window.location.pathname.includes('caissiere.html') || 
                               window.location.pathname.includes('gerante.html');

        if (!isCompleted && !isExcludedPage) {
            setTimeout(() => {
                this.start();
            }, 800);
        }
    }

    injectLauncherButton() {
        if (document.getElementById('babi-tutorial-launcher-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'babi-tutorial-launcher-btn';
        btn.type = 'button';
        btn.innerHTML = `
            <span style="font-size: 16px;">🎓</span>
            <span>Guide Découverte</span>
        `;
        btn.title = "Lancer le tutoriel interactif de la Boulangerie de BABI";
        btn.onclick = () => this.start();
        document.body.appendChild(btn);
    }

    start() {
        this.currentStep = 0;
        this.createOverlay();
        this.renderStep(this.currentStep);
    }

    createOverlay() {
        if (this.overlayEl) this.overlayEl.remove();

        this.overlayEl = document.createElement('div');
        this.overlayEl.id = 'babi-tutorial-overlay';
        this.overlayEl.innerHTML = `
            <div class="babi-tutorial-backdrop"></div>
            <div class="babi-tutorial-spotlight" id="babi-tutorial-spotlight"></div>
            <div class="babi-tutorial-card" id="babi-tutorial-card"></div>
        `;
        document.body.appendChild(this.overlayEl);

        this.spotlightEl = document.getElementById('babi-tutorial-spotlight');
        this.cardEl = document.getElementById('babi-tutorial-card');

        // Empêche le clic aléatoire en dehors pour forcer l'interaction intelligente
        this.overlayEl.querySelector('.babi-tutorial-backdrop').addEventListener('click', (e) => {
            e.stopPropagation();
            this.pulseCurrentTarget();
        });
    }

    pulseCurrentTarget() {
        if (this.spotlightEl) {
            this.spotlightEl.style.transform = 'scale(1.05)';
            setTimeout(() => {
                if (this.spotlightEl) this.spotlightEl.style.transform = 'scale(1)';
            }, 200);
        }
    }

    renderStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.showCelebration();
            return;
        }

        const step = this.steps[stepIndex];
        let target = document.querySelector(step.selector);
        if (!target) {
            target = document.querySelector(step.fallbackSelector) || document.body;
        }

        this.currentTargetEl = target;

        // Scroll doux vers l'élément
        if (target && target !== document.body) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => {
            this.positionSpotlight(target);
            this.positionCard(target, step, stepIndex);
            this.attachInteractiveListener(target, stepIndex);
        }, 350);
    }

    positionSpotlight(target) {
        if (!this.spotlightEl) return;

        if (target === document.body) {
            this.spotlightEl.style.display = 'none';
            return;
        }

        this.spotlightEl.style.display = 'block';
        const rect = target.getBoundingClientRect();
        const padding = 8;

        this.spotlightEl.style.top = `${Math.max(0, rect.top - padding)}px`;
        this.spotlightEl.style.left = `${Math.max(0, rect.left - padding)}px`;
        this.spotlightEl.style.width = `${rect.width + padding * 2}px`;
        this.spotlightEl.style.height = `${rect.height + padding * 2}px`;

        target.classList.add('babi-target-active');
    }

    positionCard(target, step, stepIndex) {
        if (!this.cardEl) return;

        const totalSteps = this.steps.length;
        const progressDots = this.steps.map((_, i) => `<div class="babi-tutorial-dot ${i <= stepIndex ? 'active' : ''}"></div>`).join('');

        this.cardEl.innerHTML = `
            <div class="babi-tutorial-header">
                <span class="babi-tutorial-step-badge">
                    <i class="fa-solid fa-sparkles"></i> Étape ${stepIndex + 1} / ${totalSteps}
                </span>
                <button type="button" class="babi-tutorial-btn-skip" onclick="window.babiTutorial.skip()">Passer</button>
            </div>
            <div class="babi-tutorial-progress">${progressDots}</div>
            <h4 class="babi-tutorial-title">${step.title}</h4>
            <p class="babi-tutorial-text">${step.text}</p>
            <div class="babi-tutorial-instruction">
                <span class="pointing-finger">👉</span>
                <span>${step.instruction}</span>
            </div>
            <div class="babi-tutorial-actions">
                <button type="button" class="babi-tutorial-btn-skip" onclick="window.babiTutorial.skip()">Quitter le guide</button>
                <button type="button" class="babi-tutorial-btn-action" onclick="window.babiTutorial.advanceNext()">
                    <span>J'appuie / Suivant</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        `;

        // Positionnement adaptatif (au-dessus ou en-dessous selon la hauteur disponible)
        const rect = target.getBoundingClientRect();
        const cardHeight = 280;
        const cardWidth = Math.min(380, window.innerWidth * 0.9);

        let top = rect.bottom + 16;
        if (top + cardHeight > window.innerHeight) {
            top = Math.max(20, rect.top - cardHeight - 16);
        }

        let left = Math.max(16, rect.left + (rect.width / 2) - (cardWidth / 2));
        if (left + cardWidth > window.innerWidth - 16) {
            left = window.innerWidth - cardWidth - 16;
        }

        this.cardEl.style.top = `${top}px`;
        this.cardEl.style.left = `${left}px`;
    }

    attachInteractiveListener(target, stepIndex) {
        if (!target || target === document.body) return;

        const advanceHandler = (e) => {
            // Nettoyage de la cible précédente
            target.classList.remove('babi-target-active');
            target.removeEventListener('click', advanceHandler);

            // Simulation ou déclenchement naturel puis passage intelligent à l'étape suivante
            setTimeout(() => {
                this.currentStep++;
                this.renderStep(this.currentStep);
            }, 300);
        };

        target.addEventListener('click', advanceHandler, { once: true });
    }

    advanceNext() {
        if (this.currentTargetEl) {
            this.currentTargetEl.classList.remove('babi-target-active');
        }
        this.currentStep++;
        this.renderStep(this.currentStep);
    }

    showCelebration() {
        if (!this.cardEl) return;
        if (this.spotlightEl) this.spotlightEl.style.display = 'none';

        localStorage.setItem('babi_tutorial_completed', 'true');

        this.cardEl.style.top = '50%';
        this.cardEl.style.left = '50%';
        this.cardEl.style.transform = 'translate(-50%, -50%)';
        this.cardEl.style.maxWidth = '440px';

        this.cardEl.innerHTML = `
            <div class="babi-tutorial-celebration">
                <div class="trophy-icon">🏆✨</div>
                <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 800; color: #1f1008; margin-bottom: 8px;">
                    Félicitations ! Vous êtes prêt(e)
                </h3>
                <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
                    Vous maîtrisez désormais les fonctionnalités clés de la <strong>Boulangerie de BABI</strong> : commande express, paiement sécurisé Wave, retrait sans contact par Code PIN et récompenses fidélité.
                </p>
                <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 12px; margin-bottom: 20px; text-align: left;">
                    <div style="font-weight: 800; color: #92400e; font-size: 13px; margin-bottom: 4px;">
                        <i class="fa-solid fa-gift text-warning me-1"></i> Bonus Découverte :
                    </div>
                    <div style="font-size: 12px; color: #451a03;">
                        Vos <strong>+50 points de fidélité</strong> sont activés pour votre prochaine fournée !
                    </div>
                </div>
                <button type="button" class="babi-tutorial-btn-action" style="width: 100%; justify-content: center; padding: 12px;" onclick="window.babiTutorial.finish()">
                    <i class="fa-solid fa-basket-shopping me-1"></i> Commencer mes Achats Gourmands
                </button>
            </div>
        `;
    }

    skip() {
        localStorage.setItem('babi_tutorial_completed', 'true');
        this.finish();
    }

    finish() {
        if (this.currentTargetEl) {
            this.currentTargetEl.classList.remove('babi-target-active');
        }
        if (this.overlayEl) {
            this.overlayEl.style.opacity = '0';
            setTimeout(() => {
                this.overlayEl.remove();
                this.overlayEl = null;
            }, 300);
        }
    }
}

// Initialisation globale
window.babiTutorial = new BabiInteractiveTutorial();

document.addEventListener('DOMContentLoaded', () => {
    window.babiTutorial.init();
});
