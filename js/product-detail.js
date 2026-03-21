/**
 * SkynetStore — Product Detail Page
 */
document.addEventListener('DOMContentLoaded', () => {
    const productId = window.PRODUCT_PAGE_ID || parseInt(new URLSearchParams(window.location.search).get('id'));
    const product = PRODUCTS.find(p => p.id === productId);

    if (!product) {
        document.getElementById('product-detail').innerHTML =
            '<div class="container" style="text-align:center;padding:80px 0;"><h2>Produit introuvable</h2><p style="color:var(--text-secondary);margin:12px 0 24px;">Ce produit n\'existe pas ou a été retiré.</p><a href="catalog.html" class="btn btn-primary">Retour au catalogue</a></div>';
        return;
    }

    // Fill page
    document.title = product.name + ' — SkynetStore';
    document.getElementById('breadcrumb-product').textContent = product.name;
    document.getElementById('product-image').innerHTML = `<span style="font-size:6rem">${product.emoji}</span>`;
    document.getElementById('product-category').textContent = product.categoryLabel;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-rating').innerHTML = generateStars(product.rating) + ` · ${product.reviews} avis`;
    document.getElementById('product-price').textContent = formatPrice(product.price);
    document.getElementById('product-description').textContent = product.description;

    const oldPriceEl = document.getElementById('product-old-price');
    const discountEl = document.getElementById('product-discount');
    if (product.oldPrice) {
        oldPriceEl.textContent = formatPrice(product.oldPrice);
        discountEl.textContent = `-${product.discount}%`;
    } else {
        oldPriceEl.style.display = 'none';
        discountEl.style.display = 'none';
    }

    // Features
    const featuresEl = document.getElementById('product-features');
    if (product.features) {
        featuresEl.innerHTML = product.features.map(f => `<li>${f}</li>`).join('');
    }

    // Quantity selector
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        qtyInput.value = Math.min(10, parseInt(qtyInput.value) + 1);
    });

    // Add to cart
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        Cart.add(product.id, parseInt(qtyInput.value));
    });

    // Related products
    const relatedGrid = document.getElementById('related-products');
    if (relatedGrid) {
        const basePath = window.PRODUCT_PAGE_ID ? '../../' : '../';
        const related = PRODUCTS
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4);
        if (related.length === 0) {
            const others = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);
            relatedGrid.innerHTML = others.map(p => createProductCard(p, basePath)).join('');
        } else {
            relatedGrid.innerHTML = related.map(p => createProductCard(p, basePath)).join('');
        }
    }
});
