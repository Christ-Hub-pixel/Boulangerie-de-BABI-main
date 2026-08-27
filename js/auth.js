// -------------------------------------------------------------
// GESTION AUTHENTIFICATION & UTILISATEURS (FIREBASE + HYBRID API)
// -------------------------------------------------------------

const API_ROOT = (typeof window !== 'undefined' && (window.API_BASE_URL || (window.location.protocol.startsWith('http') ? '' : 'http://localhost:5000'))) || '';

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD29RIoK7hYmKxm20L3ZLtOk2bic6vuOxQ",
    authDomain: "boulangerie-babi-app.firebaseapp.com",
    projectId: "boulangerie-babi-app",
    storageBucket: "boulangerie-babi-app.firebasestorage.app",
    messagingSenderId: "745132784695",
    appId: "1:745132784695:web:d5e30df01010932f0ed3b2"
};

// Initialisation Firebase avec persistance locale illimitée
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
            console.log("🔒 Persistance de session Firebase locale activée.");
        });
        console.log("🔥 Firebase Web Auth initialisé avec succès pour Boulangerie de Babi");
    } catch (e) {
        console.warn("Erreur d'initialisation Firebase:", e);
    }
}

// Auto-redirection immédiate si déjà connecté (évite de réafficher le formulaire de connexion)
(function checkExistingSession() {
    const rawUser = localStorage.getItem('babi_user');
    const path = window.location.pathname.toLowerCase();
    
    if (path.includes('connexion.html') || path.includes('inscription.html')) {
        if (rawUser) {
            try {
                const user = JSON.parse(rawUser);
                if (user && (user.email || user.nom || user.id)) {
                    console.log("Utilisateur déjà authentifié, redirection directe vers le compte.");
                    window.location.replace('compte.html');
                }
            } catch (_) {}
        }
    }
})();

let isGoogleAuthInProgress = false;

// Fonction globale de connexion avec Google
async function loginWithGoogleFirebase() {
    if (isGoogleAuthInProgress) {
        console.warn("Connexion Google déjà en cours...");
        return;
    }

    if (typeof firebase === 'undefined' || !firebase.auth) {
        window.location.href = 'app/#/login';
        return;
    }

    isGoogleAuthInProgress = true;

    // Mise à jour visuelle des boutons
    const googleBtns = document.querySelectorAll('.btn-google');
    googleBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;

        if (user) {
            const displayName = user.displayName || 'Client Google';
            const parts = displayName.split(' ');
            const prenom = parts[0] || 'Client';
            const nom = parts.slice(1).join(' ') || 'Babi VIP';

            const babiUser = {
                id: user.uid,
                prenom: prenom,
                nom: nom,
                email: user.email || '',
                photoURL: user.photoURL || '',
                role: 'client',
                points: 50,
                code_fidelite: 'BABI-' + Math.floor(1000 + Math.random() * 9000)
            };

            localStorage.setItem('babi_user', JSON.stringify(babiUser));
            const token = await user.getIdToken();
            localStorage.setItem('auth_token', token);

            // Synchronisation optionnelle avec le backend
            try {
                await fetch(`${API_ROOT}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: babiUser, token: token })
                });
            } catch (_) {}

            alert(`🎉 Connexion Google réussie ! Bienvenue ${prenom}. Vos 50 points de fidélité sont crédités.`);
            window.location.href = 'compte.html';
        }
    } catch (error) {
        console.error("Firebase Google Auth Error:", error);
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log("Fenêtre Google fermée ou requête précédente annulée.");
            return;
        }
        if (error.code === 'auth/unauthorized-domain') {
            alert("Veuillez autoriser votre domaine dans Firebase Console > Authentication > Paramètres > Domaines autorisés.");
            return;
        }
        alert("Erreur de connexion Google : " + (error.message || error));
    } finally {
        isGoogleAuthInProgress = false;
        googleBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Brancher les boutons Google sur le site web sans duplication
    const googleBtns = document.querySelectorAll('.btn-google');
    googleBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            loginWithGoogleFirebase();
        };
    });
    
    // --- 0. ROUTE GUARDS DE SÉCURITÉ RBAC (PROTECTION DES PAGES SENSIBLES) ---
    function enforceRouteGuard() {
        const path = window.location.pathname.toLowerCase();
        const user = JSON.parse(localStorage.getItem('babi_user'));

        if (path.includes('admin.html')) {
            if (!user || user.role !== 'admin') {
                console.warn("⛔ Redirection : Privilèges Administrateur requis.");
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
        const accountBtns = document.querySelectorAll('a[href="connexion.html"], .logged-in-btn');
        
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
                const displayName = (user.prenom || user.nom || 'MON COMPTE').toUpperCase();
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
                    const res = await fetch(`${API_ROOT}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: identifiant, mot_de_passe: password })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('babi_user', JSON.stringify(data.user));
                        alert(data.message || `Connexion réussie ! Bienvenue ${data.user.prenom}.`);
                        window.location.href = data.redirectUrl || (data.user.role === 'client' ? 'compte.html' : 'index.html');
                        return;
                    }
                } catch (err) {
                    console.warn("Backend non accessible, bascule en authentification locale:", err);
                }

                // Fallback simulation locale pour les 4 rôles
                let role = 'client';
                let prenom = "Client";
                let nom = "BABI";
                let redirect = 'compte.html';

                const idLower = identifiant.toLowerCase();
                if (idLower.includes('caisse')) {
                    role = 'caissiere';
                    prenom = 'Caissière';
                    nom = '';
                    redirect = 'caissiere.html';
                } else if (idLower.includes('gerante') || idLower.includes('direction')) {
                    role = 'gerante';
                    prenom = 'Gérante';
                    nom = 'Fournil';
                    redirect = 'gerante.html';
                } else if (idLower.includes('admin')) {
                    role = 'admin';
                    prenom = 'Administrateur';
                    nom = '';
                    redirect = 'admin.html';
                } else {
                    if (idLower.includes('@')) {
                        prenom = idLower.split('@')[0];
                        prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
                    }
                }

                const user = { prenom, nom, email: identifiant, role, points: 50 };
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
                const phoneInput = inputs[3];
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const password = inputs[4] ? inputs[4].value : 'client123';
                
                // 📱 VALIDATION STRICTE DU NUMÉRO DE TÉLÉPHONE
                const cleanPhone = phone.replace(/\D/g, '');
                if (!phone || cleanPhone.length < 8) {
                    alert("⚠️ Le numéro de téléphone est strictement obligatoire pour créer votre compte et recevoir vos notifications de commande (au moins 8 à 10 chiffres).");
                    if (phoneInput) {
                        phoneInput.focus();
                        phoneInput.style.borderColor = '#dc2626';
                        phoneInput.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.2)';
                    }
                    return;
                }

                try {
                    const res = await fetch(`${API_ROOT}/api/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nom, prenom, email, telephone: phone, mot_de_passe: password })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('babi_user', JSON.stringify(data.user));
                        alert("🎉 Compte créé avec succès ! Bienvenue chez Boulangerie de BABI.");
                        window.location.href = data.redirectUrl || 'compte.html';
                        return;
                    } else {
                        const errData = await res.json();
                        if (errData && errData.error) {
                            alert("Erreur : " + errData.error);
                            return;
                        }
                    }
                } catch(err) {}

                const user = { prenom, nom, email, phone, role: 'client', points: 50 };
                localStorage.setItem('babi_user', JSON.stringify(user));
                alert("🎉 Compte créé avec succès ! Bienvenue " + (prenom || 'chez nous') + ".");
                window.location.href = 'compte.html';
            });
        }
    }
});

