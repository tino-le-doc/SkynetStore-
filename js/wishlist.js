/**
 * SkynetStore — Wishlist (Favoris)
 */
const Wishlist = {
    items: JSON.parse(localStorage.getItem('skynet-wishlist') || '[]'),

    save() {
        localStorage.setItem('skynet-wishlist', JSON.stringify(this.items));
    },

    toggle(productId) {
        const idx = this.items.indexOf(productId);
        if (idx > -1) {
            this.items.splice(idx, 1);
        } else {
            this.items.push(productId);
        }
        this.save();
    },

    has(productId) {
        return this.items.includes(productId);
    },

    getProducts() {
        return PRODUCTS.filter(p => this.items.includes(p.id));
    },

    getCount() {
        return this.items.length;
    }
};

function toggleWishlist(productId) {
    Wishlist.toggle(productId);
    // Re-render product cards on page
    const cards = document.querySelectorAll(`.product-card[data-id="${productId}"]`);
    cards.forEach(card => {
        const btn = card.querySelector('.wishlist-btn');
        if (btn) {
            const isWished = Wishlist.has(productId);
            btn.classList.toggle('active', isWished);
            btn.innerHTML = isWished ? '&#9829;' : '&#9825;';
        }
    });
    // Update wishlist count badge if present
    const countEl = document.getElementById('wishlist-count');
    if (countEl) countEl.textContent = Wishlist.getCount();
}
