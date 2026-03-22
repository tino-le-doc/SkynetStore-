/**
 * SkynetStore — Search
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    let debounceTimer;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
                return;
            }
            const results = PRODUCTS.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.categoryLabel.toLowerCase().includes(query)
            ).slice(0, 5);

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-no-result">Aucun produit trouv\u00e9</div>';
            } else {
                const isInPages = window.location.pathname.includes('/pages/');
                const isInProducts = window.location.pathname.includes('/pages/products/');
                const prefix = isInProducts ? '../../' : (isInPages ? '../' : '');
                searchResults.innerHTML = results.map(p => `
                    <a href="${prefix}pages/products/${p.slug}.html" class="search-result-item">
                        <span class="search-result-img">${p.image ? `<img src="${p.image}" alt="${p.name}">` : p.emoji}</span>
                        <div class="search-result-info">
                            <span class="search-result-name">${p.name}</span>
                            <span class="search-result-price">${formatPrice(p.price)}</span>
                        </div>
                    </a>
                `).join('');
            }
            searchResults.style.display = 'block';
        }, 200);
    });

    // Close search results on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchResults.style.display = 'none';
        }
    });

    // Close on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            searchInput.blur();
        }
    });
});
