/**
 * SkynetStore — Real Stats Counter
 * Fetches real numbers from Firebase instead of fake hardcoded values
 */
document.addEventListener('DOMContentLoaded', async () => {
    const useFirebase = typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady();
    if (!useFirebase) return;

    try {
        // Products count
        const productsEl = document.getElementById('stat-products');
        if (productsEl) {
            const snap = await db.collection('products').get();
            productsEl.textContent = snap.size || 0;
        }

        // Customers count (users with role 'customer')
        const customersEl = document.getElementById('stat-customers');
        if (customersEl) {
            const snap = await db.collection('users').where('role', '==', 'customer').get();
            customersEl.textContent = snap.size || 0;
        }

        // Reviews count (about page)
        const reviewsEl = document.getElementById('stat-reviews');
        if (reviewsEl) {
            const snap = await db.collection('reviews').get();
            reviewsEl.textContent = snap.size || 0;
        }
    } catch (e) {
        console.warn('real-stats: unable to fetch counts', e);
    }
});
