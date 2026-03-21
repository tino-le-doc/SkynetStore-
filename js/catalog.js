/**
 * SkynetStore — Catalog Page
 */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('catalog-products');
    const countEl = document.getElementById('results-count');
    if (!grid) return;

    // Read category from URL
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get('cat');

    // Pre-select category filter from URL
    if (urlCat) {
        const radio = document.querySelector(`input[name="category"][value="${urlCat}"]`);
        if (radio) radio.checked = true;
    }

    function getFilters() {
        const category = document.querySelector('input[name="category"]:checked')?.value || 'all';
        const price = document.querySelector('input[name="price"]:checked')?.value || 'all';
        const sort = document.getElementById('sort-select')?.value || 'popular';
        return { category, price, sort };
    }

    function filterAndRender() {
        const { category, price, sort } = getFilters();

        let filtered = [...PRODUCTS];

        // Category filter
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        // Price filter
        if (price !== 'all') {
            const [min, max] = price.includes('+')
                ? [parseInt(price), Infinity]
                : price.split('-').map(Number);
            filtered = filtered.filter(p => p.price >= min && p.price <= max);
        }

        // Sort
        switch (sort) {
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'popular':
            default:
                filtered.sort((a, b) => b.reviews - a.reviews);
                break;
        }

        // Render
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:60px 0;">Aucun produit trouvé pour ces critères.</p>';
        } else {
            grid.innerHTML = filtered.map(p => createProductCard(p, '../')).join('');
        }

        if (countEl) countEl.textContent = `${filtered.length} produit${filtered.length > 1 ? 's' : ''}`;
    }

    // Listen for filter changes
    document.querySelectorAll('input[name="category"], input[name="price"]').forEach(input => {
        input.addEventListener('change', filterAndRender);
    });

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', filterAndRender);

    // Mobile filter toggle
    const filterToggle = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('catalog-filters');
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }

    // Initial render
    filterAndRender();
});
