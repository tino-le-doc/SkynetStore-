/**
 * SkynetStore — Checkout Page
 */
document.addEventListener('DOMContentLoaded', () => {
    const orderItems = document.getElementById('order-items');
    const orderSubtotal = document.getElementById('order-subtotal');
    const orderShipping = document.getElementById('order-shipping');
    const orderTotal = document.getElementById('order-total');

    function renderOrderSummary() {
        if (!orderItems) return;

        if (Cart.items.length === 0) {
            orderItems.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">Votre panier est vide</p>';
            return;
        }

        orderItems.innerHTML = Cart.items.map(item => {
            const product = PRODUCTS.find(p => p.id === item.id);
            if (!product) return '';
            return `
                <div class="order-item">
                    <div class="order-item-image">${product.emoji}</div>
                    <div class="order-item-details">
                        <div class="order-item-name">${product.name}</div>
                        <div class="order-item-qty">Qté: ${item.qty}</div>
                    </div>
                    <div class="order-item-price">${formatPrice(product.price * item.qty)}</div>
                </div>
            `;
        }).join('');

        const subtotal = Cart.getTotal();
        const shipping = subtotal >= 50 ? 0 : 4.99;
        const total = subtotal + shipping;

        if (orderSubtotal) orderSubtotal.textContent = formatPrice(subtotal);
        if (orderShipping) orderShipping.textContent = shipping === 0 ? 'Gratuite' : formatPrice(shipping);
        if (orderTotal) orderTotal.textContent = formatPrice(total);
    }

    renderOrderSummary();

    // Payment method toggle
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const cardFields = document.getElementById('card-fields');
            const value = opt.querySelector('input').value;
            if (cardFields) {
                cardFields.style.display = value === 'card' ? 'block' : 'none';
            }
        });
    });

    // Submit checkout
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (Cart.items.length === 0) {
                alert('Votre panier est vide !');
                return;
            }

            // Generate order number
            const orderNum = 'SK-' + Date.now().toString(36).toUpperCase();

            // Show success modal
            const modal = document.getElementById('success-modal');
            const orderNumEl = document.getElementById('order-number');
            if (modal) modal.style.display = 'flex';
            if (orderNumEl) orderNumEl.textContent = orderNum;

            // Clear cart
            Cart.clear();
        });
    }
});
