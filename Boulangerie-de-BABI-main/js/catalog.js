document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return; // Only run on pages with the grid

    let allProducts = [];
    let currentCategory = 'Tous les produits';
    
    // Checkboxes in the sidebar
    const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="c"]');

    // Fetch the JSON database
    fetch('data/products.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            renderProducts(allProducts);
            setupFilters();
        })
        .catch(error => console.error("Error loading products:", error));

    function generateStarsHTML(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<i class="fa-solid fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
            } else {
                starsHTML += '<i class="fa-regular fa-star"></i>';
            }
        }
        return starsHTML;
    }

    function renderProducts(products) {
        productGrid.innerHTML = '';
        
        if (products.length === 0) {
            productGrid.innerHTML = '<div class="col-12 text-center py-5 text-muted">Aucun produit trouvé dans cette catégorie.</div>';
            return;
        }

        products.forEach(product => {
            // Check for badge (e.g. POPULAIRE, -20%)
            const badgeHTML = product.badge 
                ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">${product.badge}</span>` 
                : '';
            
            // Render original price only if the badge contains '%' (meaning it's a discount)
            let oldPriceHTML = '';
            if (product.badge && product.badge.includes('%')) {
                // Approximate original price based on discount
                const discountMatch = product.badge.match(/(\d+)/);
                if (discountMatch) {
                    const discount = parseInt(discountMatch[1]);
                    const originalPrice = Math.round(product.price / (1 - (discount/100)));
                    // oldPriceHTML = `<span class="text-muted text-decoration-line-through ms-1" style="font-size:0.8rem;">${originalPrice} FCFA</span>`;
                }
            }

            const starsHTML = generateStarsHTML(product.rating || 4.5);
            const reviewsCount = product.reviews || 0;

            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="card product-card h-100 border-0 shadow-sm overflow-hidden" style="transition: transform 0.2s;">
                    <div class="position-relative overflow-hidden">
                        ${badgeHTML}
                        <img src="${product.image}" class="card-img-top product-img" alt="${product.name}" style="height:180px;object-fit:cover;transition:transform 0.4s;">
                        <button class="wishlist-btn position-absolute top-0 end-0 m-2 btn btn-sm bg-white rounded-circle shadow-sm border-0" style="width:32px;height:32px;">
                            <i class="fa-regular fa-heart text-danger"></i>
                        </button>
                    </div>
                    <div class="card-body p-2 d-flex flex-column">
                        <h6 class="fw-semibold mb-1" style="font-size:0.88rem;">${product.name}</h6>
                        <div class="text-warning mb-1" style="font-size:0.7rem;">
                            ${starsHTML} <span class="text-muted">(${reviewsCount})</span>
                        </div>
                        <div class="mb-2">
                            <span class="fw-bold text-dark">${product.price} <small>FCFA</small></span>
                            ${oldPriceHTML}
                        </div>
                        <button class="btn btn-primary btn-sm w-100 fw-bold text-dark mt-auto add-to-cart-btn" 
                            data-name="${product.name}" 
                            data-price="${product.price}" 
                            data-image="${product.image}">
                            <i class="fa-solid fa-cart-plus me-1"></i>AJOUTER
                        </button>
                    </div>
                </div>
            `;
            productGrid.appendChild(col);
        });

        // Re-attach event listeners to the new "Ajouter" buttons from cart_actions.js
        if (typeof window.setupAddToCartButtons === 'function') {
            window.setupAddToCartButtons();
        }
    }

    function setupFilters() {
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Uncheck all others to simulate radio button behavior for categories
                    categoryCheckboxes.forEach(cb => {
                        if (cb !== e.target) cb.checked = false;
                    });
                    
                    const label = e.target.nextElementSibling.innerText.trim();
                    currentCategory = label;
                    filterProducts();
                } else {
                    // If user unchecks, default to all
                    const allProductsCheckbox = document.getElementById('c1');
                    if (allProductsCheckbox && allProductsCheckbox !== e.target) {
                        allProductsCheckbox.checked = true;
                    }
                    currentCategory = 'Tous les produits';
                    filterProducts();
                }
            });
        });
    }

    function filterProducts() {
        if (currentCategory === 'Tous les produits') {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.category === currentCategory);
            renderProducts(filtered);
        }
    }
});
