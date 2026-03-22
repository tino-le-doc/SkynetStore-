/**
 * SkynetStore — Visit Tracker
 * Compteur de visites du site et suivi des produits les plus visités
 */
const Visits = (() => {
    const STORAGE_KEY = 'skynet-visits';

    function getData() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"total":0,"pages":{},"products":{}}');
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Sync to Firebase if available
        if (typeof FirebaseDB !== 'undefined' && typeof FirebaseDB.saveVisits === 'function') {
            FirebaseDB.saveVisits(data).catch(() => {});
        }
    }

    function trackPage() {
        const data = getData();
        data.total++;
        const page = window.location.pathname;
        data.pages[page] = (data.pages[page] || 0) + 1;
        save(data);
    }

    function trackProduct(productId) {
        if (!productId) return;
        const data = getData();
        data.products[productId] = (data.products[productId] || 0) + 1;
        save(data);
    }

    function getTotal() {
        return getData().total;
    }

    function getProductVisits() {
        return getData().products;
    }

    function getMostVisitedProducts(limit) {
        const products = getData().products;
        return Object.entries(products)
            .map(([id, count]) => ({ id: parseInt(id), visits: count }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, limit || 10);
    }

    function getStats() {
        const data = getData();
        return {
            total: data.total,
            pages: data.pages,
            products: data.products
        };
    }

    // Track current page on load
    trackPage();

    return { trackProduct, getTotal, getProductVisits, getMostVisitedProducts, getStats };
})();
