// PWA Registration and Native Installation Trigger

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker PWA enregistré avec succès !', reg.scope))
      .catch(err => console.log('Erreur enregistrement Service Worker:', err));
  });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBtns = document.querySelectorAll('.btn-install-pwa');
  installBtns.forEach(btn => {
    btn.style.display = 'inline-flex';
    btn.addEventListener('click', triggerPwaInstall);
  });
});

function triggerPwaInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Installation de l\'application BABI acceptée !');
      }
      deferredPrompt = null;
    });
  } else {
    alert("Pour installer l'application sur votre téléphone:\n\n📱 Android: Appuyez sur les 3 points en haut à droite du navigateur puis sur 'Ajouter à l'écran d'accueil'.\n\n🍏 iPhone: Appuyez sur l'icône de Partage en bas puis sur 'Sur l'écran d'accueil'.");
  }
}
