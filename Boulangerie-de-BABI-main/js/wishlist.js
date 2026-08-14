// ================================================================
// BABI WISHLIST SYSTEM — LocalStorage Powered
// ================================================================
const WISHLIST_KEY = 'babi_wishlist';

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch(e) {
        return [];
    }
}

function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    updateWishlistBadges();
}

function toggleWishlist(productName) {
    let list = getWishlist();
    const index = list.findIndex(item => (typeof item === 'string' ? item === productName : item.name === productName));
    
    if (index >= 0) {
        list.splice(index, 1);
        showWishlistToast(`💔 "${productName}" retiré de vos favoris.`);
    } else {
        list.push(productName);
        showWishlistToast(`❤️ "${productName}" ajouté à vos favoris !`);
    }
    
    saveWishlist(list);
    if (typeof renderWishlistPage === 'function') {
        renderWishlistPage();
    }
}

function isWishlisted(productName) {
    const list = getWishlist();
    return list.some(item => (typeof item === 'string' ? item === productName : item.name === productName));
}

function updateWishlistBadges() {
    const count = getWishlist().length;
    document.querySelectorAll('.wishlist-count-badge').forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

function showWishlistToast(msg) {
    let container = document.getElementById('babi-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'babi-toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast show align-items-center text-white bg-dark border-0 mb-2 shadow-lg';
    toast.innerHTML = `<div class="d-flex"><div class="toast-body fw-bold">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateWishlistBadges();
});
