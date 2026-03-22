/**
 * SkynetStore — Firebase Database Service
 * Couche d'abstraction Firestore qui remplace localStorage
 * Fonctionne en mode hybride : Firebase si disponible, localStorage en fallback
 */
const FirebaseDB = (() => {

    // Vérifie si Firebase est bien configuré (pas les valeurs par défaut)
    function isFirebaseReady() {
        return typeof firebase !== 'undefined' &&
               firebase.apps.length > 0 &&
               firebaseConfig.apiKey !== 'VOTRE_API_KEY';
    }

    // ========================
    // PRODUCTS
    // ========================
    async function getProducts() {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('products').orderBy('id').get();
            if (snapshot.empty) return null;
            return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('FirebaseDB.getProducts error:', e);
            return null;
        }
    }

    async function saveProduct(product) {
        if (!isFirebaseReady()) return false;
        try {
            const docRef = db.collection('products').doc(String(product.id));
            await docRef.set(product, { merge: true });
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveProduct error:', e);
            return false;
        }
    }

    async function saveAllProducts(products) {
        if (!isFirebaseReady()) return false;
        try {
            const batch = db.batch();
            products.forEach(p => {
                const ref = db.collection('products').doc(String(p.id));
                batch.set(ref, p);
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveAllProducts error:', e);
            return false;
        }
    }

    async function deleteProduct(productId) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('products').doc(String(productId)).delete();
            return true;
        } catch (e) {
            console.warn('FirebaseDB.deleteProduct error:', e);
            return false;
        }
    }

    // Initialise les produits par défaut dans Firestore si la collection est vide
    async function initProducts(defaultProducts) {
        if (!isFirebaseReady()) return false;
        try {
            const snapshot = await db.collection('products').limit(1).get();
            if (snapshot.empty) {
                await saveAllProducts(defaultProducts);
                return true;
            }
            return false;
        } catch (e) {
            console.warn('FirebaseDB.initProducts error:', e);
            return false;
        }
    }

    // ========================
    // USERS
    // ========================
    async function getUsers() {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('users').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('FirebaseDB.getUsers error:', e);
            return null;
        }
    }

    async function getUserByEmail(email) {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('users')
                .where('email', '==', email).limit(1).get();
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { _docId: doc.id, ...doc.data() };
        } catch (e) {
            console.warn('FirebaseDB.getUserByEmail error:', e);
            return null;
        }
    }

    async function saveUser(user) {
        if (!isFirebaseReady()) return false;
        try {
            const docRef = db.collection('users').doc(String(user.id));
            await docRef.set(user, { merge: true });
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveUser error:', e);
            return false;
        }
    }

    async function initAdminUser(adminAccount) {
        if (!isFirebaseReady()) return false;
        try {
            const existing = await getUserByEmail(adminAccount.email);
            if (!existing) {
                await saveUser(adminAccount);
                return true;
            }
            return false;
        } catch (e) {
            console.warn('FirebaseDB.initAdminUser error:', e);
            return false;
        }
    }

    // ========================
    // ORDERS
    // ========================
    async function getOrders() {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('orders').orderBy('date', 'desc').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('FirebaseDB.getOrders error:', e);
            return null;
        }
    }

    async function saveOrder(order) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('orders').doc(order.id).set(order);
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveOrder error:', e);
            return false;
        }
    }

    async function updateOrderStatus(orderId, status) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('orders').doc(orderId).update({ status });
            return true;
        } catch (e) {
            console.warn('FirebaseDB.updateOrderStatus error:', e);
            return false;
        }
    }

    // ========================
    // SETTINGS
    // ========================
    async function getSettings() {
        if (!isFirebaseReady()) return null;
        try {
            const doc = await db.collection('config').doc('settings').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn('FirebaseDB.getSettings error:', e);
            return null;
        }
    }

    async function saveSettings(settings) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('config').doc('settings').set(settings);
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveSettings error:', e);
            return false;
        }
    }

    // ========================
    // CART (par utilisateur connecté)
    // ========================
    async function getCart(userId) {
        if (!isFirebaseReady() || !userId) return null;
        try {
            const doc = await db.collection('carts').doc(String(userId)).get();
            return doc.exists ? doc.data().items || [] : null;
        } catch (e) {
            console.warn('FirebaseDB.getCart error:', e);
            return null;
        }
    }

    async function saveCart(userId, items) {
        if (!isFirebaseReady() || !userId) return false;
        try {
            await db.collection('carts').doc(String(userId)).set({ items, updatedAt: new Date().toISOString() });
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveCart error:', e);
            return false;
        }
    }

    // ========================
    // SUPPLIER (Fournisseur)
    // ========================
    async function getSupplierMappings() {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('supplierMappings').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('FirebaseDB.getSupplierMappings error:', e);
            return null;
        }
    }

    async function saveSupplierMappings(mappings) {
        if (!isFirebaseReady()) return false;
        try {
            const batch = db.batch();
            mappings.forEach(m => {
                const ref = db.collection('supplierMappings').doc(String(m.productId));
                batch.set(ref, m);
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveSupplierMappings error:', e);
            return false;
        }
    }

    async function getSupplierOrders() {
        if (!isFirebaseReady()) return null;
        try {
            const snapshot = await db.collection('supplierOrders').orderBy('createdAt', 'desc').get();
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
        } catch (e) {
            console.warn('FirebaseDB.getSupplierOrders error:', e);
            return null;
        }
    }

    async function saveSupplierOrders(orders) {
        if (!isFirebaseReady()) return false;
        try {
            const batch = db.batch();
            orders.forEach(o => {
                const ref = db.collection('supplierOrders').doc(o.orderId);
                batch.set(ref, o);
            });
            await batch.commit();
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveSupplierOrders error:', e);
            return false;
        }
    }

    async function saveSupplierConfig(config) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('config').doc('supplier').set(config);
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveSupplierConfig error:', e);
            return false;
        }
    }

    async function getSupplierConfig() {
        if (!isFirebaseReady()) return null;
        try {
            const doc = await db.collection('config').doc('supplier').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn('FirebaseDB.getSupplierConfig error:', e);
            return null;
        }
    }

    // ========================
    // VISITS
    // ========================
    async function getVisits() {
        if (!isFirebaseReady()) return null;
        try {
            const doc = await db.collection('config').doc('visits').get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn('FirebaseDB.getVisits error:', e);
            return null;
        }
    }

    async function saveVisits(data) {
        if (!isFirebaseReady()) return false;
        try {
            await db.collection('config').doc('visits').set(data);
            return true;
        } catch (e) {
            console.warn('FirebaseDB.saveVisits error:', e);
            return false;
        }
    }

    async function incrementVisit(page, productId) {
        if (!isFirebaseReady()) return false;
        try {
            const increment = firebase.firestore.FieldValue.increment(1);
            const updates = { total: increment };
            if (page) updates[`pages.${page.replace(/[/.]/g, '_')}`] = increment;
            if (productId) updates[`products.${productId}`] = increment;
            await db.collection('config').doc('visits').set(updates, { merge: true });
            return true;
        } catch (e) {
            console.warn('FirebaseDB.incrementVisit error:', e);
            return false;
        }
    }

    return {
        isFirebaseReady,
        // Products
        getProducts, saveProduct, saveAllProducts, deleteProduct, initProducts,
        // Users
        getUsers, getUserByEmail, saveUser, initAdminUser,
        // Orders
        getOrders, saveOrder, updateOrderStatus,
        // Settings
        getSettings, saveSettings,
        // Cart
        getCart, saveCart,
        // Supplier
        getSupplierMappings, saveSupplierMappings,
        getSupplierOrders, saveSupplierOrders,
        getSupplierConfig, saveSupplierConfig,
        // Visits
        getVisits, saveVisits, incrementVisit
    };
})();
