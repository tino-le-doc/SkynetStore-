/**
 * SkynetStore — Standalone Admin Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // ===== AUTH CHECK =====
    if (!Auth.isAdmin()) {
        window.location.href = '../pages/account.html';
        return;
    }

    const user = Auth.getCurrentUser();
    document.getElementById('admin-name').textContent = user.firstName;
    document.getElementById('topbar-user').textContent = user.firstName;

    // ===== CATEGORY LABELS =====
    const CATEGORY_LABELS = {
        enceintes: 'Enceintes IA',
        wearables: 'Wearables IA',
        maison: 'Maison Connectée',
        robots: 'Robots & Drones',
        audio: 'Audio IA',
        gadgets: 'Gadgets IA'
    };

    // ===== STATE =====
    let products = loadProducts();
    let editingId = null;
    let deletingId = null;

    // ===== DOM REFS =====
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const tbody = document.getElementById('admin-products-body');
    const modal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');
    const orderModal = document.getElementById('order-modal');
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('edit-image');
    const imagePreview = document.getElementById('image-preview');

    // ===== NAVIGATION =====
    const navLinks = document.querySelectorAll('.sidebar-link[data-page]');
    const pages = document.querySelectorAll('.page');

    function navigateTo(pageId) {
        pages.forEach(p => p.classList.remove('active'));
        navLinks.forEach(l => l.classList.remove('active'));

        const target = document.getElementById('page-' + pageId);
        const link = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
        if (target) target.classList.add('active');
        if (link) link.classList.add('active');

        // Close mobile sidebar
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');

        // Refresh page data
        if (pageId === 'dashboard') refreshDashboard();
        if (pageId === 'products') renderProductsTable();
        if (pageId === 'orders') renderOrders();
        if (pageId === 'customers') renderCustomers();
        if (pageId === 'supplier') refreshSupplierPage();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            window.location.hash = page;
            navigateTo(page);
        });
    });

    // Handle hash navigation
    function handleHash() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(hash);
    }
    window.addEventListener('hashchange', handleHash);

    // ===== MOBILE SIDEBAR =====
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    // ===== DASHBOARD =====
    function refreshDashboard() {
        products = loadProducts();
        const orders = getOrders();
        const users = getUsers();

        document.getElementById('stat-products').textContent = products.length;
        document.getElementById('stat-orders').textContent = orders.length;
        document.getElementById('stat-customers').textContent = users.filter(u => u.role === 'customer').length;

        const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        document.getElementById('stat-revenue').textContent = formatPrice(revenue);

        // Popular products
        const popular = products.filter(p => p.popular).slice(0, 5);
        const popularEl = document.getElementById('popular-products');
        if (popular.length === 0) {
            popularEl.innerHTML = '<p class="empty-state">Aucun produit populaire.</p>';
        } else {
            popularEl.innerHTML = popular.map(p => `
                <div class="popular-item">
                    <div class="popular-item-icon">${p.image ? `<img src="${p.image}" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:6px;">` : p.emoji}</div>
                    <div class="popular-item-info">
                        <div class="popular-item-name">${escapeHTML(p.name)}</div>
                        <div class="popular-item-price">${formatPrice(p.price)}</div>
                    </div>
                </div>
            `).join('');
        }

        // Recent orders
        const recentOrdersEl = document.getElementById('recent-orders');
        const recent = orders.slice(-5).reverse();
        if (recent.length === 0) {
            recentOrdersEl.innerHTML = '<p class="empty-state">Aucune commande pour le moment.</p>';
        } else {
            recentOrdersEl.innerHTML = `<table class="admin-table"><thead><tr><th>N°</th><th>Total</th><th>Statut</th></tr></thead><tbody>` +
                recent.map(o => `<tr><td>${escapeHTML(o.id)}</td><td>${formatPrice(o.total)}</td><td><span class="status-badge status-${o.status || 'pending'}">${statusLabel(o.status)}</span></td></tr>`).join('') +
                `</tbody></table>`;
        }
    }

    // ===== PRODUCTS TABLE =====
    function renderProductsTable() {
        products = loadProducts();
        tbody.innerHTML = products.map(p => {
            const imgCell = p.image
                ? `<img src="${p.image}" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:8px;">`
                : `<span style="font-size:2rem;">${p.emoji || '📦'}</span>`;
            return `
                <tr data-id="${p.id}">
                    <td>${imgCell}</td>
                    <td><strong>${escapeHTML(p.name)}</strong></td>
                    <td><span class="admin-badge">${escapeHTML(p.categoryLabel || CATEGORY_LABELS[p.category] || p.category)}</span></td>
                    <td>${formatPrice(p.price)}</td>
                    <td>${p.oldPrice ? formatPrice(p.oldPrice) : '—'}</td>
                    <td>${p.popular ? '<span style="color:var(--green);">Oui</span>' : 'Non'}</td>
                    <td class="admin-actions-cell">
                        <button class="btn-icon btn-edit" data-id="${p.id}" title="Modifier">&#9998;</button>
                        <button class="btn-icon btn-delete" data-id="${p.id}" title="Supprimer">&#128465;</button>
                    </td>
                </tr>`;
        }).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
        });
    }

    // ===== PRODUCT MODAL =====
    function openEditModal(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;
        editingId = id;
        document.getElementById('modal-title').textContent = 'Modifier le Produit';
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-slug').value = p.slug || '';
        document.getElementById('edit-category').value = p.category;
        document.getElementById('edit-emoji').value = p.emoji || '';
        document.getElementById('edit-image').value = p.image || '';
        document.getElementById('edit-price').value = p.price;
        document.getElementById('edit-old-price').value = p.oldPrice || '';
        document.getElementById('edit-description').value = p.description;
        document.getElementById('edit-features').value = (p.features || []).join('\n');
        document.getElementById('edit-rating').value = p.rating || 4.5;
        document.getElementById('edit-reviews').value = p.reviews || 0;
        document.getElementById('edit-popular').checked = !!p.popular;
        updateImagePreview();
        modal.style.display = 'flex';
    }

    function openNewModal() {
        editingId = null;
        document.getElementById('modal-title').textContent = 'Nouveau Produit';
        form.reset();
        document.getElementById('edit-rating').value = 4.5;
        document.getElementById('edit-reviews').value = 0;
        clearImagePreview();
        modal.style.display = 'flex';
    }

    function closeModal() { modal.style.display = 'none'; editingId = null; }

    function openDeleteModal(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;
        deletingId = id;
        document.getElementById('delete-product-name').textContent = p.name;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() { deleteModal.style.display = 'none'; deletingId = null; }

    // ===== IMAGE UPLOAD =====
    const dropZone = document.getElementById('image-drop-zone');
    const fileInput = document.getElementById('edit-image-file');
    const previewImg = document.getElementById('image-preview-img');
    const placeholder = document.getElementById('image-upload-placeholder');
    const removeBtn = document.getElementById('image-remove-btn');

    function showImagePreview(dataUrl) {
        imageInput.value = dataUrl;
        previewImg.src = dataUrl;
        imagePreview.style.display = 'flex';
        placeholder.style.display = 'none';
    }

    function clearImagePreview() {
        imageInput.value = '';
        previewImg.src = '';
        fileInput.value = '';
        imagePreview.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    function handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('L\'image ne doit pas dépasser 2 Mo.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => showImagePreview(e.target.result);
        reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImageFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImagePreview();
    });

    function updateImagePreview() {
        const url = imageInput.value.trim();
        if (url) {
            showImagePreview(url);
        } else {
            clearImagePreview();
        }
    }

    function generateSlug(name) {
        return name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function saveProduct(e) {
        e.preventDefault();
        const name = document.getElementById('edit-name').value.trim();
        const slug = document.getElementById('edit-slug').value.trim() || generateSlug(name);
        const category = document.getElementById('edit-category').value;
        const emoji = document.getElementById('edit-emoji').value.trim() || '📦';
        const image = document.getElementById('edit-image').value.trim();
        const price = parseFloat(document.getElementById('edit-price').value);
        const oldPriceVal = document.getElementById('edit-old-price').value.trim();
        const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
        const description = document.getElementById('edit-description').value.trim();
        const featuresText = document.getElementById('edit-features').value.trim();
        const features = featuresText ? featuresText.split('\n').map(f => f.trim()).filter(Boolean) : [];
        const rating = parseFloat(document.getElementById('edit-rating').value) || 4.5;
        const reviews = parseInt(document.getElementById('edit-reviews').value) || 0;
        const popular = document.getElementById('edit-popular').checked;
        const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;

        const productData = {
            name, slug, category,
            categoryLabel: CATEGORY_LABELS[category] || category,
            emoji, price, oldPrice, discount,
            rating, reviews, description, features, popular
        };
        if (image) productData.image = image;

        if (editingId) {
            const idx = products.findIndex(p => p.id === editingId);
            if (idx !== -1) products[idx] = { ...products[idx], ...productData };
        } else {
            productData.id = products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
            products.push(productData);
        }

        saveProducts(products);
        renderProductsTable();
        closeModal();
        if (document.getElementById('page-supplier').classList.contains('active')) refreshSupplierPage();
    }

    function deleteProduct() {
        if (!deletingId) return;
        if (typeof Supplier !== 'undefined') Supplier.removeMapping(deletingId);
        products = products.filter(p => p.id !== deletingId);
        saveProducts(products);
        renderProductsTable();
        closeDeleteModal();
        if (document.getElementById('page-supplier').classList.contains('active')) refreshSupplierPage();
    }

    // ===== ORDERS =====
    function getOrders() {
        return JSON.parse(localStorage.getItem('skynet-orders') || '[]');
    }

    function saveOrders(orders) {
        localStorage.setItem('skynet-orders', JSON.stringify(orders));
        // Sync to Firebase
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
            orders.forEach(o => FirebaseDB.saveOrder(o));
        }
    }

    function statusLabel(status) {
        const labels = {
            pending: 'En attente',
            confirmed: 'Confirmée',
            shipped: 'Expédiée',
            delivered: 'Livrée',
            cancelled: 'Annulée'
        };
        return labels[status] || 'En attente';
    }

    function renderOrders() {
        const orders = getOrders();
        const ordersBody = document.getElementById('orders-body');
        const emptyEl = document.getElementById('orders-empty');

        if (orders.length === 0) {
            ordersBody.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        ordersBody.innerHTML = orders.slice().reverse().map(o => `
            <tr>
                <td><strong>${escapeHTML(o.id)}</strong></td>
                <td>${escapeHTML(o.customerName || 'Client')}</td>
                <td>${o.date ? new Date(o.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td>${formatPrice(o.total || 0)}</td>
                <td>
                    <select class="form-input order-status-select" data-order-id="${o.id}" style="padding:4px 8px;width:auto;font-size:0.8rem;">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>En attente</option>
                        <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirmée</option>
                        <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
                        <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Livrée</option>
                        <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-view-order" data-order-id="${o.id}" title="Voir">👁</button>
                </td>
            </tr>
        `).join('');

        // Status change handlers
        ordersBody.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', () => {
                const orders = getOrders();
                const order = orders.find(o => o.id === select.dataset.orderId);
                if (order) {
                    order.status = select.value;
                    saveOrders(orders);
                }
            });
        });

        // View order detail
        ordersBody.querySelectorAll('.btn-view-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const orders = getOrders();
                const order = orders.find(o => o.id === btn.dataset.orderId);
                if (order) showOrderDetail(order);
            });
        });
    }

    function showOrderDetail(order) {
        document.getElementById('order-modal-title').textContent = 'Commande ' + order.id;
        const body = document.getElementById('order-modal-body');
        const items = (order.items || []).map(item => {
            const product = products.find(p => p.id === item.id);
            const name = product ? product.name : 'Produit supprimé';
            const price = product ? product.price : 0;
            return `<tr><td>${escapeHTML(name)}</td><td>x${item.qty}</td><td>${formatPrice(price * item.qty)}</td></tr>`;
        }).join('');

        body.innerHTML = `
            <p><strong>Client :</strong> ${escapeHTML(order.customerName || '—')}</p>
            <p><strong>Email :</strong> ${escapeHTML(order.customerEmail || '—')}</p>
            <p><strong>Date :</strong> ${order.date ? new Date(order.date).toLocaleString('fr-FR') : '—'}</p>
            <p><strong>Statut :</strong> <span class="status-badge status-${order.status || 'pending'}">${statusLabel(order.status)}</span></p>
            <hr style="border-color:var(--border);margin:16px 0;">
            <table class="admin-table"><thead><tr><th>Produit</th><th>Qté</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
            <p style="text-align:right;margin-top:16px;font-size:1.1rem;"><strong>Total : ${formatPrice(order.total || 0)}</strong></p>
        `;
        orderModal.style.display = 'flex';
    }

    // ===== CUSTOMERS =====
    function getUsers() {
        return JSON.parse(localStorage.getItem('skynet-users') || '[]');
    }

    function renderCustomers() {
        const users = getUsers();
        const customersBody = document.getElementById('customers-body');

        customersBody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${escapeHTML(u.firstName || '')} ${escapeHTML(u.lastName || '')}</strong></td>
                <td>${escapeHTML(u.email)}</td>
                <td>${escapeHTML(u.city || '—')}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                <td><span class="admin-badge" style="${u.role === 'admin' ? 'background:rgba(255,107,0,0.15);color:var(--accent);' : ''}">${u.role === 'admin' ? 'Admin' : 'Client'}</span></td>
            </tr>
        `).join('');
    }

    // ===== SETTINGS =====
    function loadSettings() {
        const defaults = {
            storeName: 'SkynetStore',
            email: 'contact@skynetstore.eu',
            phone: '+33 1 23 45 67 89',
            freeShipping: 50,
            shippingFee: 4.99
        };
        return JSON.parse(localStorage.getItem('skynet-settings') || JSON.stringify(defaults));
    }

    function initSettings() {
        const s = loadSettings();
        document.getElementById('setting-store-name').value = s.storeName || '';
        document.getElementById('setting-email').value = s.email || '';
        document.getElementById('setting-phone').value = s.phone || '';
        document.getElementById('setting-free-shipping').value = s.freeShipping || 50;
        document.getElementById('setting-shipping-fee').value = s.shippingFee || 4.99;
    }

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const settings = {
            storeName: document.getElementById('setting-store-name').value.trim(),
            email: document.getElementById('setting-email').value.trim(),
            phone: document.getElementById('setting-phone').value.trim(),
            freeShipping: parseFloat(document.getElementById('setting-free-shipping').value) || 50,
            shippingFee: parseFloat(document.getElementById('setting-shipping-fee').value) || 4.99
        };
        localStorage.setItem('skynet-settings', JSON.stringify(settings));
        // Sync to Firebase
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
            FirebaseDB.saveSettings(settings);
        }
        alert('Paramètres enregistrés.');
    });

    document.getElementById('export-data-btn').addEventListener('click', () => {
        const data = {
            products: loadProducts(),
            orders: getOrders(),
            users: getUsers(),
            settings: loadSettings()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'skynetstore-export.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('reset-data-btn').addEventListener('click', () => {
        if (confirm('Réinitialiser toutes les données ? Cette action est irréversible.')) {
            localStorage.removeItem('skynet-products');
            localStorage.removeItem('skynet-orders');
            localStorage.removeItem('skynet-settings');
            products = loadProducts();
            refreshDashboard();
            alert('Données réinitialisées.');
        }
    });

    // ===== SUPPLIER / FOURNISSEUR =====
    const supplierModal = document.getElementById('supplier-modal');
    const supplierOrderModal = document.getElementById('supplier-order-modal');
    const supplierForm = document.getElementById('supplier-mapping-form');

    function refreshSupplierPage() {
        products = loadProducts();
        renderSupplierStats();
        renderSupplierMappings();
        renderSupplierOrders();
        loadSupplierConfig();
    }

    function renderSupplierStats() {
        if (typeof Supplier === 'undefined') return;
        const stats = Supplier.getStats();
        document.getElementById('stat-mapped').textContent = stats.mappedProducts;
        document.getElementById('stat-supplier-orders').textContent = stats.totalOrders;
        document.getElementById('stat-total-cost').textContent = formatPrice(stats.totalCost);
        document.getElementById('stat-total-profit').textContent = formatPrice(stats.totalProfit);
    }

    function renderSupplierMappings() {
        if (typeof Supplier === 'undefined') return;
        const mappingsBody = document.getElementById('supplier-mapping-body');
        mappingsBody.innerHTML = products.map(p => {
            const mapping = Supplier.getMapping(p.id);
            const marginInfo = Supplier.getMargin(p.id);
            const linked = !!mapping;
            const marginDisplay = marginInfo
                ? `<span style="color:var(--green);font-weight:600;">${formatPrice(marginInfo.margin)} (${marginInfo.marginPercent.toFixed(1)}%)</span>`
                : '<span style="color:var(--text-secondary);">—</span>';
            return `
                <tr>
                    <td><strong>${escapeHTML(p.name)}</strong></td>
                    <td>${formatPrice(p.price)}</td>
                    <td>${linked ? `<code style="background:rgba(46,125,50,0.1);padding:2px 6px;border-radius:4px;">${escapeHTML(mapping.supplierProductId)}</code>` : '<span style="color:var(--red);">Non lié</span>'}</td>
                    <td>${linked ? formatPrice(mapping.supplierPrice) : '—'}</td>
                    <td>${marginDisplay}</td>
                    <td class="admin-actions-cell">
                        <button class="btn-icon btn-edit btn-link-supplier" data-id="${p.id}" title="${linked ? 'Modifier la liaison' : 'Lier au fournisseur'}">🔗</button>
                        ${linked ? `<button class="btn-icon btn-delete btn-unlink-supplier" data-id="${p.id}" title="Supprimer la liaison">✂️</button>` : ''}
                        <button class="btn-icon btn-delete btn-delete-supplier-product" data-id="${p.id}" title="Supprimer le produit">&#128465;</button>
                    </td>
                </tr>`;
        }).join('');

        mappingsBody.querySelectorAll('.btn-link-supplier').forEach(btn => {
            btn.addEventListener('click', () => openSupplierModal(parseInt(btn.dataset.id)));
        });
        mappingsBody.querySelectorAll('.btn-unlink-supplier').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer la liaison fournisseur pour ce produit ?')) {
                    Supplier.removeMapping(parseInt(btn.dataset.id));
                    refreshSupplierPage();
                }
            });
        });
        mappingsBody.querySelectorAll('.btn-delete-supplier-product').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const p = products.find(x => x.id === id);
                if (!p) return;
                if (confirm(`Supprimer le produit « ${p.name} » ? Cette action est irréversible.`)) {
                    if (typeof Supplier !== 'undefined') Supplier.removeMapping(id);
                    products = products.filter(x => x.id !== id);
                    saveProducts(products);
                    refreshSupplierPage();
                }
            });
        });
    }

    function openSupplierModal(productId) {
        const p = products.find(x => x.id === productId);
        if (!p) return;
        const mapping = Supplier.getMapping(productId);

        document.getElementById('supplier-edit-product-id').value = productId;
        document.getElementById('supplier-edit-product-name').value = p.name;
        document.getElementById('supplier-edit-id').value = mapping ? mapping.supplierProductId : '';
        document.getElementById('supplier-edit-url').value = mapping ? mapping.supplierProductUrl : '';
        document.getElementById('supplier-edit-sku').value = mapping ? mapping.supplierSku : '';
        document.getElementById('supplier-edit-price').value = mapping ? mapping.supplierPrice : '';

        supplierModal.style.display = 'flex';
    }

    function closeSupplierModal() { supplierModal.style.display = 'none'; }

    supplierForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = parseInt(document.getElementById('supplier-edit-product-id').value);
        Supplier.setMapping(productId, {
            supplierProductId: document.getElementById('supplier-edit-id').value.trim(),
            supplierProductUrl: document.getElementById('supplier-edit-url').value.trim(),
            supplierSku: document.getElementById('supplier-edit-sku').value.trim(),
            supplierPrice: document.getElementById('supplier-edit-price').value
        });
        closeSupplierModal();
        refreshSupplierPage();
    });

    document.getElementById('supplier-add-product-btn').addEventListener('click', openNewModal);

    document.getElementById('supplier-modal-close').addEventListener('click', closeSupplierModal);
    document.getElementById('supplier-modal-cancel').addEventListener('click', closeSupplierModal);
    supplierModal.addEventListener('click', (e) => { if (e.target === supplierModal) closeSupplierModal(); });

    function supplierStatusLabel(status) {
        const labels = {
            processing: 'En traitement',
            shipped: 'Expédié',
            in_transit: 'En transit',
            delivered: 'Livré',
            cancelled: 'Annulé'
        };
        return labels[status] || status;
    }

    function renderSupplierOrders() {
        if (typeof Supplier === 'undefined') return;
        const orders = Supplier.getSupplierOrders();
        const ordersBody = document.getElementById('supplier-orders-body');
        const emptyEl = document.getElementById('supplier-orders-empty');

        if (orders.length === 0) {
            ordersBody.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        ordersBody.innerHTML = orders.slice().reverse().map(o => `
            <tr>
                <td><strong>${escapeHTML(o.orderId)}</strong></td>
                <td><code style="background:rgba(46,125,50,0.1);padding:2px 6px;border-radius:4px;">${escapeHTML(o.supplierOrderId)}</code></td>
                <td>${formatPrice(o.totalCost || 0)}</td>
                <td><span style="color:var(--green);font-weight:600;">${formatPrice(o.profit || 0)}</span></td>
                <td>${o.trackingNumber ? `<code>${escapeHTML(o.trackingNumber)}</code>` : '—'}</td>
                <td>
                    <select class="form-input supplier-status-select" data-order-id="${o.orderId}" style="padding:4px 8px;width:auto;font-size:0.8rem;">
                        <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>En traitement</option>
                        <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Expédié</option>
                        <option value="in_transit" ${o.status === 'in_transit' ? 'selected' : ''}>En transit</option>
                        <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Livré</option>
                        <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-view-supplier-order" data-order-id="${o.orderId}" title="Voir">👁</button>
                </td>
            </tr>
        `).join('');

        ordersBody.querySelectorAll('.supplier-status-select').forEach(select => {
            select.addEventListener('change', () => {
                Supplier.updateSupplierOrderStatus(select.dataset.orderId, select.value);
                renderSupplierStats();
            });
        });

        ordersBody.querySelectorAll('.btn-view-supplier-order').forEach(btn => {
            btn.addEventListener('click', () => {
                const order = Supplier.getSupplierOrder(btn.dataset.orderId);
                if (order) showSupplierOrderDetail(order);
            });
        });
    }

    function showSupplierOrderDetail(order) {
        document.getElementById('supplier-order-modal-title').textContent = 'Commande fournisseur — ' + order.supplierOrderId;
        const body = document.getElementById('supplier-order-modal-body');

        const items = (order.items || []).map(item => {
            return `<tr>
                <td><code>${escapeHTML(item.supplierProductId)}</code></td>
                <td>${escapeHTML(item.supplierSku || '—')}</td>
                <td>x${item.quantity}</td>
                <td>${formatPrice(item.unitCost)}</td>
                <td>${formatPrice(item.totalCost)}</td>
            </tr>`;
        }).join('');

        const events = (order.events || []).map(ev => `
            <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
                <span style="color:var(--text-secondary);font-size:0.8rem;white-space:nowrap;">${new Date(ev.date).toLocaleString('fr-FR')}</span>
                <span><strong>${supplierStatusLabel(ev.status)}</strong> — ${escapeHTML(ev.description)}</span>
            </div>
        `).join('');

        body.innerHTML = `
            <p><strong>Commande site :</strong> ${escapeHTML(order.orderId)}</p>
            <p><strong>ID Fournisseur :</strong> <code>${escapeHTML(order.supplierOrderId)}</code></p>
            <p><strong>Plateforme :</strong> AliExpress</p>
            <p><strong>Statut :</strong> <span class="status-badge status-${order.status === 'in_transit' ? 'shipped' : order.status}">${supplierStatusLabel(order.status)}</span></p>
            <p><strong>N° Tracking :</strong> ${order.trackingNumber ? `<code>${escapeHTML(order.trackingNumber)}</code>` : 'Non disponible'}</p>
            <p><strong>Livraison estimée :</strong> ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('fr-FR') : '—'}</p>
            <hr style="border-color:var(--border);margin:16px 0;">
            <h3 style="margin-bottom:12px;">Articles commandés</h3>
            <table class="admin-table">
                <thead><tr><th>ID Produit</th><th>SKU</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead>
                <tbody>${items}</tbody>
            </table>
            <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:1.05rem;">
                <span><strong>Coût total :</strong> ${formatPrice(order.totalCost || 0)}</span>
                <span style="color:var(--green);"><strong>Marge :</strong> ${formatPrice(order.profit || 0)}</span>
            </div>
            <hr style="border-color:var(--border);margin:16px 0;">
            <h3 style="margin-bottom:12px;">Historique</h3>
            ${events || '<p class="text-secondary">Aucun événement.</p>'}
        `;
        supplierOrderModal.style.display = 'flex';
    }

    document.getElementById('supplier-order-modal-close').addEventListener('click', () => { supplierOrderModal.style.display = 'none'; });
    supplierOrderModal.addEventListener('click', (e) => { if (e.target === supplierOrderModal) supplierOrderModal.style.display = 'none'; });

    // Configuration fournisseur
    function loadSupplierConfig() {
        if (typeof Supplier === 'undefined') return;
        const config = Supplier.getConfig();
        document.getElementById('supplier-platform').value = config.platform || 'aliexpress';
        document.getElementById('supplier-mode').value = config.apiMode || 'simulation';
        document.getElementById('supplier-auto-forward').checked = config.autoForward !== false;
        document.getElementById('supplier-api-key').value = config.apiKey || '';
        document.getElementById('supplier-api-secret').value = config.apiSecret || '';
        toggleApiFields(config.apiMode);
    }

    function toggleApiFields(mode) {
        const show = mode === 'live';
        document.getElementById('api-key-group').style.display = show ? 'block' : 'none';
        document.getElementById('api-secret-group').style.display = show ? 'block' : 'none';
    }

    document.getElementById('supplier-mode').addEventListener('change', (e) => {
        toggleApiFields(e.target.value);
    });

    document.getElementById('save-supplier-config-btn').addEventListener('click', () => {
        Supplier.saveConfig({
            platform: document.getElementById('supplier-platform').value,
            apiMode: document.getElementById('supplier-mode').value,
            autoForward: document.getElementById('supplier-auto-forward').checked,
            apiKey: document.getElementById('supplier-api-key').value.trim(),
            apiSecret: document.getElementById('supplier-api-secret').value.trim(),
            trackingEnabled: true
        });
        alert('Configuration fournisseur enregistrée.');
    });

    // ===== ESCAPE HTML =====
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== EVENT LISTENERS =====
    document.getElementById('add-product-btn').addEventListener('click', openNewModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', deleteProduct);
    document.getElementById('order-modal-close').addEventListener('click', () => { orderModal.style.display = 'none'; });
    form.addEventListener('submit', saveProduct);

    document.getElementById('edit-name').addEventListener('input', (e) => {
        if (!editingId) {
            document.getElementById('edit-slug').value = generateSlug(e.target.value);
        }
    });

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });
    orderModal.addEventListener('click', (e) => { if (e.target === orderModal) orderModal.style.display = 'none'; });

    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = '../pages/account.html';
    });

    // ===== INIT =====
    initSettings();
    handleHash();
});
