/**
 * SkynetStore — Admin Panel
 * Product management (CRUD)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Auth check — admin only
    if (!Auth.isAdmin()) {
        window.location.href = 'account.html';
        return;
    }

    const user = Auth.getCurrentUser();
    document.getElementById('admin-user-name').textContent = user.firstName;

    // Category labels map
    const CATEGORY_LABELS = {
        enceintes: 'Enceintes IA',
        wearables: 'Wearables IA',
        maison: 'Maison Connectée',
        robots: 'Robots & Drones',
        audio: 'Audio IA',
        gadgets: 'Gadgets IA'
    };

    // State
    let products = loadProducts();
    let editingId = null;
    let deletingId = null;

    // DOM
    const tbody = document.getElementById('admin-products-body');
    const modal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');
    const form = document.getElementById('product-form');
    const imageInput = document.getElementById('edit-image');
    const imagePreview = document.getElementById('image-preview');

    // --- Render Table ---
    function renderTable() {
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

        // Bind edit/delete buttons
        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
        });
    }

    // --- Modal: Open for Edit ---
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

    // --- Modal: Open for New Product ---
    function openNewModal() {
        editingId = null;
        document.getElementById('modal-title').textContent = 'Nouveau Produit';
        form.reset();
        document.getElementById('edit-rating').value = 4.5;
        document.getElementById('edit-reviews').value = 0;
        imagePreview.innerHTML = '';
        modal.style.display = 'flex';
    }

    // --- Modal: Close ---
    function closeModal() {
        modal.style.display = 'none';
        editingId = null;
    }

    // --- Delete Modal ---
    function openDeleteModal(id) {
        const p = products.find(x => x.id === id);
        if (!p) return;
        deletingId = id;
        document.getElementById('delete-product-name').textContent = p.name;
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        deletingId = null;
    }

    // --- Image Preview ---
    function updateImagePreview() {
        const url = imageInput.value.trim();
        if (url) {
            imagePreview.innerHTML = `<img src="${escapeHTML(url)}" alt="Aperçu" style="max-width:200px;max-height:120px;object-fit:contain;border-radius:8px;margin-top:8px;">`;
        } else {
            imagePreview.innerHTML = '';
        }
    }

    // --- Generate slug from name ---
    function generateSlug(name) {
        return name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    // --- Save Product (create or update) ---
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
            // Update existing
            const idx = products.findIndex(p => p.id === editingId);
            if (idx !== -1) {
                products[idx] = { ...products[idx], ...productData };
            }
        } else {
            // Create new
            const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
            productData.id = maxId + 1;
            products.push(productData);
        }

        saveProducts(products);
        renderTable();
        closeModal();
    }

    // --- Delete Product ---
    function deleteProduct() {
        if (!deletingId) return;
        products = products.filter(p => p.id !== deletingId);
        saveProducts(products);
        renderTable();
        closeDeleteModal();
    }

    // --- Escape HTML ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Event Listeners ---
    document.getElementById('add-product-btn').addEventListener('click', openNewModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-confirm').addEventListener('click', deleteProduct);
    form.addEventListener('submit', saveProduct);
    imageInput.addEventListener('input', updateImagePreview);

    // Auto-generate slug when name changes
    document.getElementById('edit-name').addEventListener('input', (e) => {
        if (!editingId) {
            document.getElementById('edit-slug').value = generateSlug(e.target.value);
        }
    });

    // Close modals on overlay click
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

    // Logout
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'account.html';
    });

    // Mobile menu
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('open');
            menuBtn.classList.toggle('active');
        });
    }

    // Init
    renderTable();
});
