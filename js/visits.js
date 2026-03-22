/**
 * SkynetStore — Visit Tracker
 * Compteur de visites du site et suivi des produits les plus visités
 * Stockage hybride : localStorage + Firebase (incréments atomiques)
 */
const Visits = (() => {
    const STORAGE_KEY = 'skynet-visits';

    function getData() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"total":0,"pages":{},"products":{}}');
    }

    function saveLocal(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function trackPage() {
        const data = getData();
        data.total++;
        const page = window.location.pathname;
        data.pages[page] = (data.pages[page] || 0) + 1;
        saveLocal(data);
        // Firebase atomic increment
        if (typeof FirebaseDB !== 'undefined' && typeof FirebaseDB.incrementVisit === 'function') {
            FirebaseDB.incrementVisit(page, null).catch(() => {});
        }
    }

    function trackProduct(productId) {
        if (!productId) return;
        const data = getData();
        data.products[productId] = (data.products[productId] || 0) + 1;
        saveLocal(data);
        // Firebase atomic increment
        if (typeof FirebaseDB !== 'undefined' && typeof FirebaseDB.incrementVisit === 'function') {
            FirebaseDB.incrementVisit(null, productId).catch(() => {});
        }
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

    // Charge les stats depuis Firebase (pour le dashboard admin)
    async function loadFromFirebase() {
        if (typeof FirebaseDB === 'undefined' || typeof FirebaseDB.getVisits !== 'function') return null;
        try {
            const fbData = await FirebaseDB.getVisits();
            if (!fbData) return null;
            // Merge Firebase data into localStorage
            const local = getData();
            local.total = Math.max(local.total, fbData.total || 0);
            if (fbData.products) {
                for (const [id, count] of Object.entries(fbData.products)) {
                    local.products[id] = Math.max(local.products[id] || 0, count);
                }
            }
            if (fbData.pages) {
                for (const [page, count] of Object.entries(fbData.pages)) {
                    local.pages[page] = Math.max(local.pages[page] || 0, count);
                }
            }
            saveLocal(local);
            return local;
        } catch (e) {
            console.warn('Visits.loadFromFirebase error:', e);
            return null;
        }
    }

    // Track current page on load
    trackPage();

    return { trackProduct, getTotal, getProductVisits, getMostVisitedProducts, getStats, loadFromFirebase };
})();
