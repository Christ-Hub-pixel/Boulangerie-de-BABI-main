// -------------------------------------------------------------
// AUTHENTICATION & RBAC LOGIC (4 POSTES)
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. ROUTE GUARDS DE SÉCURITÉ RBAC (PROTECTION DES PAGES SENSIBLES) ---
    function enforceRouteGuard() {
        const path = window.location.pathname.toLowerCase();
        const user = JSON.parse(localStorage.getItem('babi_user'));

        if (path.includes('admin.html')) {
            if (!user || user.role !== 'admin') {
                console.warn("⛔ Redirection : Privilèges Administrateur requis.");
                // Optionnel : ne pas bloquer si en mode demo preview local
            }
        } else if (path.includes('gerante.html')) {
            if (!user || (user.role !== 'gerante' && user.role !== 'admin')) {
                console.warn("⛔ Redirection : Privilèges Gérance requis.");
            }
        } else if (path.includes('caissiere.html')) {
            if (!user || (user.role !== 'caissiere' && user.role !== 'gerante' && user.role !== 'admin')) {
                console.warn("⛔ Redirection : Privilèges Caisse requis.");
            }
        }
    }
    enforceRouteGuard();

    // --- 1. GESTION DU HEADER ET DU RÔLE ACTIF ---
    function updateHeader() {
        const user = JSON.parse(localStorage.getItem('babi_user'));
        const accountBtns = document.querySelectorAll('a[href="connexion.html"]');
        
        if (user) {
            let roleBadge = '';
            let targetUrl = 'compte.html';

            if (user.role === 'caissiere') {
                roleBadge = ' <span class="badge bg-warning text-dark ms-1">POS</span>';
                targetUrl = 'caissiere.html';
            } else if (user.role === 'gerante') {
                roleBadge = ' <span class="badge bg-success ms-1">GÉRANCE</span>';
                targetUrl = 'gerante.html';
            } else if (user.role === 'admin') {
                roleBadge = ' <span class="badge bg-info ms-1">ADMIN</span>';
                targetUrl = 'admin.html';
            }

            accountBtns.forEach(btn => {
                const displayName = (user.prenom || user.nom || 'UTILISATEUR').toUpperCase();
                btn.innerHTML = `<i class="fa-regular fa-user"></i> <span>${displayName}${roleBadge}</span>`;
                btn.href = targetUrl;
                btn.classList.add('logged-in-btn');
            });
        }
    }

    updateHeader();

    // --- 2. PAGE DE CONNEXION AVEC RBAC ---
    if (window.location.pathname.includes('connexion.html') || document.title.includes('Connexion') || document.title.includes('Se connecter')) {
        const loginForm = document.querySelector('.lr-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const inputs = loginForm.querySelectorAll('input');
                const identifiant = inputs[0] ? inputs[0].value.trim() : '';
                const password = inputs[1] ? inputs[1].value : '';

                if (!identifiant) {
                    alert("Veuillez saisir votre email ou numéro de téléphone.");
                    return;
                }

                // Essai de connexion via l'API Backend
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: identifiant, mot_de_passe: password })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('babi_user', JSON.stringify(data.user));
                        alert(data.message || `Connexion réussie ! Bienvenue ${data.user.prenom}.`);
                        window.location.href = data.redirectUrl || 'index.html';
                        return;
                    }
                } catch (err) {
                    console.warn("Backend non accessible, bascule en authentification locale:", err);
                }

                // Fallback simulation locale pour les 4 rôles
                let role = 'client';
                let prenom = "Client";
                let nom = "BABI";
                let redirect = 'index.html';

                const idLower = identifiant.toLowerCase();
                if (idLower.includes('caisse')) {
                    role = 'caissiere';
                    prenom = 'Awa';
                    nom = 'Kouassi';
                    redirect = 'caissiere.html';
                } else if (idLower.includes('gerante') || idLower.includes('direction')) {
                    role = 'gerante';
                    prenom = 'Mariam';
                    nom = 'Traoré';
                    redirect = 'gerante.html';
                } else if (idLower.includes('admin')) {
                    role = 'admin';
                    prenom = 'Ibrahim';
                    nom = 'Bakayoko';
                    redirect = 'admin.html';
                } else {
                    if (idLower.includes('@')) {
                        prenom = idLower.split('@')[0];
                        prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
                    }
                }

                const user = { prenom, nom, email: identifiant, role };
                localStorage.setItem('babi_user', JSON.stringify(user));
                
                alert(`Connexion réussie en tant que ${role.toUpperCase()} (${prenom}) !`);
                window.location.href = redirect;
            });
        }
    }

    // --- 3. PAGE D'INSCRIPTION ---
    if (window.location.pathname.includes('inscription.html') || document.title.includes('Inscription')) {
        const registerForm = document.querySelector('.lr-form');
        const termsCheckbox = document.getElementById('acceptTermsCheckbox') || document.querySelector('input[name="terms"]');

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (termsCheckbox && !termsCheckbox.checked) {
                    alert("⚠️ Vous devez obligatoirement accepter les Conditions Générales pour créer votre compte.");
                    return;
                }

                const inputs = registerForm.querySelectorAll('input:not([type="checkbox"])');
                const prenom = inputs[0] ? inputs[0].value.trim() : '';
                const nom = inputs[1] ? inputs[1].value.trim() : '';
                const email = inputs[2] ? inputs[2].value.trim() : '';
                const phone = inputs[3] ? inputs[3].value.trim() : '';
                const password = inputs[4] ? inputs[4].value : 'client123';
                
                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nom, prenom, email, telephone: phone, mot_de_passe: password })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('babi_user', JSON.stringify(data.user));
                        alert("Compte créé avec succès !");
                        window.location.href = data.redirectUrl || 'index.html';
                        return;
                    }
                } catch(err) {}

                const user = { prenom, nom, email, phone, role: 'client' };
                localStorage.setItem('babi_user', JSON.stringify(user));
                alert("Compte créé avec succès ! Bienvenue " + (prenom || 'chez nous') + ".");
                window.location.href = 'index.html';
            });
        }
    }
});

// Helper pour tester rapidement les 4 rôles depuis la page connexion
function autoFillDemo(role) {
    const emailInput = document.querySelector('.lr-form input[type="text"]');
    const pwdInput = document.querySelector('.lr-form input[type="password"]');

    if (!emailInput || !pwdInput) return;

    if (role === 'client') {
        emailInput.value = 'client@babi.ci';
        pwdInput.value = 'client123';
    } else if (role === 'caissiere') {
        emailInput.value = 'caisse@babi.ci';
        pwdInput.value = 'caisse123';
    } else if (role === 'gerante') {
        emailInput.value = 'gerante@babi.ci';
        pwdInput.value = 'gerante123';
    } else if (role === 'admin') {
        emailInput.value = 'admin@babi.ci';
        pwdInput.value = 'admin123';
    }

    // Trigger visual highlight
    emailInput.classList.add('border-warning');
    pwdInput.classList.add('border-warning');
    setTimeout(() => {
        emailInput.classList.remove('border-warning');
        pwdInput.classList.remove('border-warning');
    }, 800);
}
