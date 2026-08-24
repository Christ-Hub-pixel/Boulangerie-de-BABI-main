/**
 * 🎂 SIMULATEUR INTERACTIF DE GÂTEAUX SUR-MESURE (BABI 2026)
 */

let cakeState = {
    event: 'anniversaire',
    tiers: 1,
    sponge: 'vanille',
    filling: 'ganache_choc',
    frostingColor: '#fef08a',
    message: 'Joyeux Anniversaire !',
    options: {
        feuilleOr: false,
        macarons: false,
        bougies: false
    },
    basePrice: 20000,
    optionsPrice: 0,
    totalPrice: 20000,
    acomptePrice: 10000,
    portions: '15 à 20 parts'
};

const TIER_PRICING = {
    1: { price: 20000, portions: '15 à 20 parts' },
    2: { price: 38000, portions: '30 à 45 parts' },
    3: { price: 65000, portions: '55 à 80 parts' }
};

document.addEventListener('DOMContentLoaded', () => {
    updateCakeConfig();
    updateCartCount();
});

function setTiers(count, btn) {
    cakeState.tiers = count;
    document.querySelectorAll('.btn-tier-select').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    updateCakeConfig();
}

function updateCakeMessage(msg) {
    cakeState.message = msg || 'Votre Message';
    const textEl = document.getElementById('tierMessageText');
    if (textEl) textEl.innerText = cakeState.message;
}

function updateCakeConfig() {
    // 1. Read event
    const eventInput = document.querySelector('input[name="cakeEvent"]:checked');
    if (eventInput) cakeState.event = eventInput.value;

    // 2. Read sponge & filling
    const spongeInput = document.querySelector('input[name="cakeSponge"]:checked');
    if (spongeInput) cakeState.sponge = spongeInput.value;

    const fillingInput = document.querySelector('input[name="cakeFilling"]:checked');
    if (fillingInput) cakeState.filling = fillingInput.value;

    // 3. Read color
    const colorInput = document.querySelector('input[name="frostingColor"]:checked');
    if (colorInput) cakeState.frostingColor = colorInput.value;

    // 4. Read options
    cakeState.options.feuilleOr = !!document.getElementById('opt-feuille-or')?.checked;
    cakeState.options.macarons = !!document.getElementById('opt-macarons')?.checked;
    cakeState.options.bougies = !!document.getElementById('opt-bougies-fontaine')?.checked;

    // 5. Calculate prices
    const tierData = TIER_PRICING[cakeState.tiers] || TIER_PRICING[1];
    cakeState.basePrice = tierData.price;
    cakeState.portions = tierData.portions;

    let opts = 0;
    if (cakeState.options.feuilleOr) opts += 5000;
    if (cakeState.options.macarons) opts += 6000;
    if (cakeState.options.bougies) opts += 2500;
    cakeState.optionsPrice = opts;

    cakeState.totalPrice = cakeState.basePrice + cakeState.optionsPrice;
    cakeState.acomptePrice = Math.round(cakeState.totalPrice * 0.5);

    // 6. Update Active Card CSS
    document.querySelectorAll('.option-pill-card, .flavor-card, .color-chip').forEach(card => {
        const inp = card.querySelector('input');
        if (inp && inp.checked) card.classList.add('active');
        else card.classList.remove('active');
    });

    // 7. Update 3D Canvas visual
    renderCakeCanvas();

    // 8. Update Summary Text
    document.getElementById('cake-portions-badge').innerText = cakeState.portions;
    document.getElementById('summary-tier-count').innerText = `${cakeState.tiers} étage${cakeState.tiers > 1 ? 's' : ''}`;
    document.getElementById('summary-base-price').innerText = formatFCFA(cakeState.basePrice);
    document.getElementById('summary-options-price').innerText = opts > 0 ? `+ ${formatFCFA(opts)}` : '+ 0 FCFA';
    document.getElementById('summary-total-price').innerText = formatFCFA(cakeState.totalPrice);
    document.getElementById('summary-acompte-price').innerText = `Acompte : ${formatFCFA(cakeState.acomptePrice)}`;
}

function renderCakeCanvas() {
    const tier1 = document.getElementById('tier1');
    const tier2 = document.getElementById('tier2');
    const tier3 = document.getElementById('tier3');

    // Tiers Visibility
    if (tier2) tier2.classList.toggle('hidden', cakeState.tiers < 2);
    if (tier3) tier3.classList.toggle('hidden', cakeState.tiers < 3);

    // Frosting Color Application
    [tier1, tier2, tier3].forEach(t => {
        if (t) {
            t.style.backgroundColor = cakeState.frostingColor;
            if (cakeState.options.feuilleOr) {
                t.style.backgroundImage = 'radial-gradient(#fde047 1px, transparent 1px)';
                t.style.backgroundSize = '8px 8px';
            } else {
                t.style.backgroundImage = 'none';
            }
        }
    });

    // Sponge styling preview
    const spongeColors = {
        vanille: '#fef08a',
        chocolat: '#451a03',
        redvelvet: '#991b1b',
        noisette: '#d97706'
    };
    const spColor = spongeColors[cakeState.sponge] || '#fef08a';
    document.querySelectorAll('.tier-sponge').forEach(el => el.style.borderColor = spColor);
}

function openCakeOrderModal() {
    const modal = document.getElementById('cakeOrderModal');
    if (!modal) return;

    document.getElementById('modal-cake-title').innerText = `Gâteau ${capitalize(cakeState.event)} (${cakeState.tiers} Étage${cakeState.tiers > 1 ? 's' : ''} - ${cakeState.portions})`;
    document.getElementById('modal-cake-price').innerText = formatFCFA(cakeState.totalPrice);
    document.getElementById('modal-cake-details').innerText = `Génoise : ${capitalize(cakeState.sponge)} • Garniture : ${capitalize(cakeState.filling)} • Message : "${cakeState.message}"`;
    document.getElementById('btnSubmitCakeText').innerText = `Confirmer la Réservation (Acompte : ${formatFCFA(cakeState.acomptePrice)})`;

    // Set default date to tomorrow 16:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);
    const dateInput = document.getElementById('order-client-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = tomorrow.toISOString().slice(0, 16);
    }

    modal.classList.remove('hidden');
}

function closeCakeOrderModal() {
    document.getElementById('cakeOrderModal')?.classList.add('hidden');
}

async function submitCakeOrder(e) {
    e.preventDefault();

    const name = document.getElementById('order-client-name')?.value;
    const phone = document.getElementById('order-client-phone')?.value;
    const date = document.getElementById('order-client-date')?.value;
    const mode = document.getElementById('order-client-mode')?.value;
    const notes = document.getElementById('order-client-notes')?.value;
    const payMethod = document.querySelector('input[name="cakePayment"]:checked')?.value || 'wave';

    if (!name || !phone) {
        alert("Veuillez renseigner votre nom et votre numéro de téléphone WhatsApp.");
        return;
    }

    const cakeOrderPayload = {
        customer_name: name,
        phone: phone,
        address: mode === 'livraison' ? (notes || 'Livraison VIP Abidjan') : 'Retrait Boutique Riviera',
        items: JSON.stringify([{
            name: `Gâteau Sur-Mesure (${cakeState.tiers} Étages - ${cakeState.event})`,
            price: cakeState.totalPrice,
            quantity: 1,
            details: {
                tiers: cakeState.tiers,
                sponge: cakeState.sponge,
                filling: cakeState.filling,
                message: cakeState.message,
                options: cakeState.options,
                date_retrait: date
            }
        }]),
        total_price: cakeState.totalPrice,
        payment_method: payMethod === 'wave' ? 'Wave Acompte 50%' : 'Espèces au retrait',
        type_retrait: mode === 'livraison' ? 'livraison' : 'click_collect',
        delivery_notes: `Date souhaitée: ${date}. ${notes || ''}`
    };

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cakeOrderPayload)
        });

        const data = await res.json();
        if (res.ok) {
            closeCakeOrderModal();
            alert(`🎉 Félicitations ${name} ! Votre commande de gâteau d'exception #${data.orderId || ''} a été enregistrée avec succès. Notre maître pâtissier vous contactera sur WhatsApp au ${phone}.`);
            window.location.href = `compte.html?id=${data.orderId || ''}`;
        } else {
            alert(data.error || "Erreur lors de l'enregistrement de la commande.");
        }
    } catch (err) {
        alert("Erreur de connexion serveur : " + err.message);
    }
}

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('babi_cart') || '[]');
        const count = cart.reduce((sum, it) => sum + (it.quantity || 1), 0);
        const badge = document.getElementById('cart-badge-count');
        if (badge) badge.innerText = count;
    } catch (_) {}
}

function formatFCFA(val) {
    return (val || 0).toLocaleString('fr-FR') + ' FCFA';
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
