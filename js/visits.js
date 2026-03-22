/**
 * SkynetStore — Visit Tracker (Realtime Database)
 * Compteur de visites en temps réel via Firebase RTDB
 * Fallback localStorage si Firebase indisponible
 */
const Visits = (() => {
    const STORAGE_KEY = 'skynet-visits';

    function isRtdbReady() {
        return typeof rtdb !== 'undefined' && typeof firebase !== 'undefined' &&
               firebase.apps.length > 0 && firebaseConfig.apiKey !== 'VOTRE_API_KEY';
    }

    // ===== LOCAL STORAGE FALLBACK =====
    function getLocal() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"total":0,"pages":{},"products":{}}');
    }

    function saveLocal(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // ===== RTDB ATOMIC INCREMENTS =====
    function trackPage() {
        const page = window.location.pathname.replace(/[./#$\[\]]/g, '_');
        // Local
        const data = getLocal();
        data.total++;
        data.pages[page] = (data.pages[page] || 0) + 1;
        saveLocal(data);
        // RTDB
        if (isRtdbReady()) {
            rtdb.ref('visits/total').set(firebase.database.ServerValue.increment(1));
            rtdb.ref('visits/pages/' + page).set(firebase.database.ServerValue.increment(1));
        }
    }

    function trackProduct(productId) {
        if (!productId) return;
        // Local
        const data = getLocal();
        data.products[productId] = (data.products[productId] || 0) + 1;
        saveLocal(data);
        // RTDB
        if (isRtdbReady()) {
            rtdb.ref('visits/total').set(firebase.database.ServerValue.increment(1));
            rtdb.ref('visits/products/' + productId).set(firebase.database.ServerValue.increment(1));
        }
    }

    // ===== LECTURE LOCALE =====
    function getTotal() {
        return getLocal().total;
    }

    function getMostVisitedProducts(limit) {
        const products = getLocal().products;
        return Object.entries(products)
            .map(([id, count]) => ({ id: parseInt(id), visits: count }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, limit || 10);
    }

    function getStats() {
        return getLocal();
    }

    // ===== LECTURE FIREBASE RTDB =====
    async function loadFromFirebase() {
        if (!isRtdbReady()) return null;
        try {
            const snapshot = await rtdb.ref('visits').once('value');
            const fbData = snapshot.val();
            if (!fbData) return null;
            // Merge: Firebase = source de vérité
            const local = getLocal();
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

    // ===== ÉCOUTE TEMPS RÉEL (pour le dashboard admin) =====
    function onTotalChange(callback) {
        if (!isRtdbReady()) return () => {};
        const ref = rtdb.ref('visits/total');
        ref.on('value', snap => callback(snap.val() || 0));
        return () => ref.off('value');
    }

    function onProductsChange(callback) {
        if (!isRtdbReady()) return () => {};
        const ref = rtdb.ref('visits/products');
        ref.on('value', snap => callback(snap.val() || {}));
        return () => ref.off('value');
    }

    // Track current page on load
    trackPage();

    return {
        trackProduct, getTotal, getMostVisitedProducts, getStats,
        loadFromFirebase, onTotalChange, onProductsChange
    };
})();
