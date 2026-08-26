// Fichier JavaScript principal pour Boulangerie de Babi
document.addEventListener("DOMContentLoaded", function() {
    console.log("Le site Boulangerie de Babi est chargé et prêt !");
    
    // Password toggle visibility
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            // Find the input in the same container
            const input = this.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.classList.remove('fa-eye-slash');
                    this.classList.add('fa-eye');
                } else {
                    input.type = 'password';
                    this.classList.remove('fa-eye');
                    this.classList.add('fa-eye-slash');
                }
            }
        });
    });
        
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Footer Animation
    const footerObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const footerElement = document.querySelector('.footer-fade-in');
    if (footerElement) {
        footerObserver.observe(footerElement);
    }

    // Live Store Open/Closed Badge Status
    updateStoreStatusBadge();
});

function updateStoreStatusBadge() {
    const statusBadges = document.querySelectorAll('.store-status-badge');
    const now = new Date();
    const hours = now.getHours();
    const isOpen = hours >= 5 && (hours < 23 || (hours === 5 && now.getMinutes() >= 45));

    statusBadges.forEach(badge => {
        if (isOpen) {
            badge.className = "badge bg-success text-white fw-bold px-2 py-1 rounded-pill store-status-badge ms-2";
            badge.innerHTML = `<i class="fa-solid fa-circle text-light me-1" style="font-size: 0.55rem;"></i> Ouvert (05h45 - 23h)`;
        } else {
            badge.className = "badge bg-warning text-dark fw-bold px-2 py-1 rounded-pill store-status-badge ms-2";
            badge.innerHTML = `<i class="fa-solid fa-clock me-1"></i> Fermé (Ouvre à 05h45)`;
        }
    });
}

// =========================================================================
// 🌟 LUXURY BABI DIALOG & CONFIRMATION ENGINE (Zero native browser popups)
// =========================================================================
window.showBabiCustomConfirm = function({
    title = "Confirmation",
    message = "Voulez-vous vraiment effectuer cette action ?",
    icon = "fa-circle-question",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    confirmColor = "gradient-red",
    onConfirm = () => {},
    onCancel = () => {}
} = {}) {
    const existing = document.getElementById('babiCustomConfirmModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'babiCustomConfirmModal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.25s ease;
    `;

    const bgGradient = confirmColor === 'gradient-emerald'
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : confirmColor === 'gradient-amber'
        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

    const iconColor = confirmColor === 'gradient-emerald' ? '#059669' : confirmColor === 'gradient-amber' ? '#d97706' : '#ef4444';
    const iconBg = confirmColor === 'gradient-emerald' ? '#ecfdf5' : confirmColor === 'gradient-amber' ? '#fffbeb' : '#fef2f2';

    const iconClass = icon.startsWith('fa-') ? icon : `fa-${icon}`;

    modal.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 24px;
            max-width: 420px;
            width: 100%;
            padding: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
            transform: scale(0.92);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center;
        " id="babiConfirmCard">
            <div style="
                width: 64px;
                height: 64px;
                margin: 0 auto 18px auto;
                border-radius: 20px;
                background: ${iconBg};
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${iconColor};
                font-size: 28px;
                box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08);
            ">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <h3 style="
                font-family: 'Playfair Display', serif, system-ui;
                font-size: 20px;
                font-weight: 800;
                color: #1e293b;
                margin: 0 0 8px 0;
            ">${title}</h3>
            <p style="
                font-size: 14px;
                color: #64748b;
                margin: 0 0 24px 0;
                line-height: 1.5;
            ">${message}</p>
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            ">
                <button type="button" id="babiConfirmCancelBtn" style="
                    padding: 12px 18px;
                    border-radius: 14px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.15s ease;
                ">${cancelText}</button>
                <button type="button" id="babiConfirmOkBtn" style="
                    padding: 12px 18px;
                    border-radius: 14px;
                    border: none;
                    background: ${bgGradient};
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.15s ease;
                ">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        const card = document.getElementById('babiConfirmCard');
        if (card) card.style.transform = 'scale(1)';
    });

    const closeModal = () => {
        modal.style.opacity = '0';
        const card = document.getElementById('babiConfirmCard');
        if (card) card.style.transform = 'scale(0.92)';
        setTimeout(() => modal.remove(), 250);
    };

    document.getElementById('babiConfirmCancelBtn').onclick = () => {
        closeModal();
        if (typeof onCancel === 'function') onCancel();
    };
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
            if (typeof onCancel === 'function') onCancel();
        }
    };
    document.getElementById('babiConfirmOkBtn').onclick = () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
    };
};
