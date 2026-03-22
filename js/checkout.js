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

    // Pre-fill form for logged-in users
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        const user = Auth.getCurrentUser();
        if (user) {
            const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
            setVal('first-name', user.firstName);
            setVal('last-name', user.lastName);
            setVal('email', user.email);
            setVal('phone', user.phone);
            setVal('address', user.address);
            setVal('city', user.city);
            setVal('postal', user.postal);
            if (user.country) setVal('country', user.country);
        }
    }

    // Card number formatting
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        });
    }

    // Expiry formatting
    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
            e.target.value = v;
        });
    }

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

            // Build order object
            const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
            const order = {
                id: orderNum,
                customerName: (document.getElementById('first-name')?.value || '') + ' ' + (document.getElementById('last-name')?.value || ''),
                customerEmail: document.getElementById('email')?.value || (user ? user.email : ''),
                date: new Date().toISOString(),
                total: Cart.getTotal() + (Cart.getTotal() >= 50 ? 0 : 4.99),
                status: 'pending',
                items: Cart.items.map(i => ({ id: i.id, qty: i.qty }))
            };

            // Save order to localStorage
            const orders = JSON.parse(localStorage.getItem('skynet-orders') || '[]');
            orders.push(order);
            localStorage.setItem('skynet-orders', JSON.stringify(orders));

            // Sync order to Firebase
            if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
                FirebaseDB.saveOrder(order);
            }

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
