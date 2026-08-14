document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GESTION DE L'ÉTAT DE CONNEXION DANS LE HEADER ---
    function updateHeader() {
        const user = JSON.parse(localStorage.getItem('babi_user'));
        const accountBtns = document.querySelectorAll('a[href="connexion.html"]');
        
        if (user) {
            accountBtns.forEach(btn => {
                // Change "MON COMPTE" to the user's first name, and allow logout on click
                btn.innerHTML = `<i class="fa-regular fa-user"></i> BONJOUR ${user.prenom.toUpperCase()}`;
                btn.href = "#"; // Prevent going to login page
                btn.classList.add('logged-in-btn');
                
                // Si on clique dessus, on se déconnecte
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("Voulez-vous vous déconnecter ?")) {
                        localStorage.removeItem('babi_user');
                        window.location.reload();
                    }
                });
            });
        }
    }

    updateHeader();

    // --- 2. PAGE D'INSCRIPTION ---
    if (window.location.pathname.includes('inscription.html') || document.title.includes('Inscription')) {
        const registerForm = document.querySelector('.lr-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const inputs = registerForm.querySelectorAll('input');
                const prenom = inputs[0].value;
                const nom = inputs[1].value;
                const email = inputs[2].value;
                const phone = inputs[3] ? inputs[3].value : '';
                
                const user = { prenom, nom, email, phone };
                localStorage.setItem('babi_user', JSON.stringify(user));
                
                alert("Compte créé avec succès ! Bienvenue " + prenom + ".");
                window.location.href = 'index.html';
            });
        }
    }

    // --- 3. PAGE DE CONNEXION ---
    if (window.location.pathname.includes('connexion.html') || document.title.includes('Connexion')) {
        const loginForm = document.querySelector('.lr-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const inputs = loginForm.querySelectorAll('input');
                const identifiant = inputs[0].value;
                // En simulation, on accepte n'importe quel mot de passe
                
                // Extract prenom from email or phone for display
                let prenom = "Client";
                if(identifiant.includes('@')) {
                    prenom = identifiant.split('@')[0];
                    prenom = prenom.charAt(0).toUpperCase() + prenom.slice(1);
                }
                
                const user = { prenom: prenom, email: identifiant };
                localStorage.setItem('babi_user', JSON.stringify(user));
                
                alert("Connexion réussie ! Bienvenue " + prenom + ".");
                window.location.href = 'index.html';
            });
        }
    }
});
