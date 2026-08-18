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
    const isOpen = hours >= 6 && hours < 20;

    statusBadges.forEach(badge => {
        if (isOpen) {
            badge.className = "badge bg-success text-white fw-bold px-2 py-1 rounded-pill store-status-badge ms-2";
            badge.innerHTML = `<i class="fa-solid fa-circle text-light me-1" style="font-size: 0.55rem;"></i> Ouvert (06h - 20h)`;
        } else {
            badge.className = "badge bg-warning text-dark fw-bold px-2 py-1 rounded-pill store-status-badge ms-2";
            badge.innerHTML = `<i class="fa-solid fa-clock me-1"></i> Fermé (Ouvre à 06h)`;
        }
    });
}
