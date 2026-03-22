/**
 * SkynetStore — Shopping Cart
 */
const Cart = {
    items: JSON.parse(localStorage.getItem('skynet-cart') || '[]'),

    save() {
        localStorage.setItem('skynet-cart', JSON.stringify(this.items));
        this.updateUI();
        // Sync cart to Firebase for logged-in users
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady() && typeof Auth !== 'undefined') {
            const user = Auth.getCurrentUser();
            if (user) FirebaseDB.saveCart(user.id, this.items);
        }
    },

    add(productId, qty = 1) {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const existing = this.items.find(i => i.id === productId);
        if (existing) {
            existing.qty = Math.min(existing.qty + qty, 10);
        } else {
            this.items.push({ id: productId, qty });
        }
        this.save();
        this.open();
    },

    remove(productId) {
        this.items = this.items.filter(i => i.id !== productId);
        this.save();
    },

    updateQty(productId, qty) {
        const item = this.items.find(i => i.id === productId);
        if (item) {
            item.qty = Math.max(1, Math.min(qty, 10));
            this.save();
        }
    },

    getTotal() {
        return this.items.reduce((sum, item) => {
            const product = PRODUCTS.find(p => p.id === item.id);
            return sum + (product ? product.price * item.qty : 0);
        }, 0);
    },

    getCount() {
        return this.items.reduce((sum, item) => sum + item.qty, 0);
    },

    clear() {
        this.items = [];
        this.save();
    },

    open() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
    },

    close() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    },

    updateUI() {
        // Update count badge
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = this.getCount();

        // Update cart items
        const itemsEl = document.getElementById('cart-items');
        const footerEl = document.getElementById('cart-footer');
        const totalEl = document.getElementById('cart-total-price');

        if (!itemsEl) return;

        if (this.items.length === 0) {
            itemsEl.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        if (footerEl) footerEl.style.display = 'block';

        itemsEl.innerHTML = this.items.map(item => {
            const product = PRODUCTS.find(p => p.id === item.id);
            if (!product) return '';
            return `
                <div class="cart-item">
                    <div class="cart-item-image">${product.emoji}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${product.name}</div>
                        <div class="cart-item-price">${formatPrice(product.price * item.qty)}</div>
                        <div class="cart-item-qty">
                            <button onclick="Cart.updateQty(${product.id}, ${item.qty - 1})">−</button>
                            <span>${item.qty}</span>
                            <button onclick="Cart.updateQty(${product.id}, ${item.qty + 1})">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="Cart.remove(${product.id})">&times;</button>
                </div>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = formatPrice(this.getTotal());
    }
};

// Global helper
function addToCart(productId) {
    Cart.add(productId);
}

// Init cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateUI();

    // Cart button
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) cartBtn.addEventListener('click', () => Cart.open());

    // Close cart
    const cartClose = document.getElementById('cart-close');
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartClose) cartClose.addEventListener('click', () => Cart.close());
    if (cartOverlay) cartOverlay.addEventListener('click', () => Cart.close());
});
