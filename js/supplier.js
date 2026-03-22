/**
 * SkynetStore — Supplier Integration (AliExpress Dropshipping)
 * Gère la liaison entre les produits du site et le fournisseur AliExpress.
 * Architecture : simulation côté client, prête pour une API backend réelle.
 */
const Supplier = (() => {

    const STORAGE_KEY = 'skynet-supplier-mappings';
    const ORDERS_KEY = 'skynet-supplier-orders';
    const CONFIG_KEY = 'skynet-supplier-config';

    // ========================
    // CONFIGURATION FOURNISSEUR
    // ========================
    function getConfig() {
        const defaults = {
            platform: 'aliexpress',
            apiMode: 'simulation', // 'simulation' | 'live'
            autoForward: true,     // Transmission auto des commandes
            apiKey: '',
            apiSecret: '',
            trackingEnabled: true
        };
        return JSON.parse(localStorage.getItem(CONFIG_KEY) || JSON.stringify(defaults));
    }

    function saveConfig(config) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
            FirebaseDB.saveSupplierConfig(config);
        }
    }

    // ========================
    // MAPPING PRODUITS <-> FOURNISSEUR
    // ========================
    function getMappings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function saveMappings(mappings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
            FirebaseDB.saveSupplierMappings(mappings);
        }
    }

    function getMapping(productId) {
        return getMappings().find(m => m.productId === productId) || null;
    }

    function setMapping(productId, supplierData) {
        const mappings = getMappings();
        const idx = mappings.findIndex(m => m.productId === productId);
        const mapping = {
            productId,
            supplierProductId: supplierData.supplierProductId || '',
            supplierProductUrl: supplierData.supplierProductUrl || '',
            supplierPrice: parseFloat(supplierData.supplierPrice) || 0,
            supplierSku: supplierData.supplierSku || '',
            supplierName: supplierData.supplierName || 'AliExpress',
            lastSync: new Date().toISOString()
        };
        if (idx !== -1) {
            mappings[idx] = mapping;
        } else {
            mappings.push(mapping);
        }
        saveMappings(mappings);
        return mapping;
    }

    function removeMapping(productId) {
        const mappings = getMappings().filter(m => m.productId !== productId);
        saveMappings(mappings);
    }

    // Calcul de marge
    function getMargin(productId) {
        const mapping = getMapping(productId);
        if (!mapping || !mapping.supplierPrice) return null;
        const product = typeof PRODUCTS !== 'undefined' ? PRODUCTS.find(p => p.id === productId) : null;
        if (!product) return null;
        const margin = product.price - mapping.supplierPrice;
        const marginPercent = (margin / product.price) * 100;
        return { margin, marginPercent, supplierPrice: mapping.supplierPrice, salePrice: product.price };
    }

    // ========================
    // COMMANDES FOURNISSEUR
    // ========================
    function getSupplierOrders() {
        return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    }

    function saveSupplierOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady()) {
            FirebaseDB.saveSupplierOrders(orders);
        }
    }

    function getSupplierOrder(orderId) {
        return getSupplierOrders().find(o => o.orderId === orderId) || null;
    }

    /**
     * Transmet une commande au fournisseur (simulation ou API réelle)
     * @param {Object} order - La commande SkynetStore
     * @returns {Object} Résultat de la transmission
     */
    async function forwardOrder(order) {
        const config = getConfig();
        const mappings = getMappings();

        // Vérifier que tous les produits ont un mapping fournisseur
        const orderItems = order.items || [];
        const unmapped = orderItems.filter(item => !mappings.find(m => m.productId === item.id));

        if (unmapped.length > 0) {
            return {
                success: false,
                error: 'unmapped_products',
                unmappedIds: unmapped.map(i => i.id),
                message: `${unmapped.length} produit(s) sans liaison fournisseur`
            };
        }

        // Construire la commande fournisseur
        const supplierItems = orderItems.map(item => {
            const mapping = mappings.find(m => m.productId === item.id);
            return {
                supplierProductId: mapping.supplierProductId,
                supplierSku: mapping.supplierSku,
                quantity: item.qty,
                unitCost: mapping.supplierPrice,
                totalCost: mapping.supplierPrice * item.qty
            };
        });

        const totalCost = supplierItems.reduce((sum, i) => sum + i.totalCost, 0);

        if (config.apiMode === 'live' && config.apiKey) {
            // Mode API réelle — nécessite un backend proxy
            return await forwardToApi(order, supplierItems, totalCost, config);
        }

        // Mode simulation
        return simulateForward(order, supplierItems, totalCost);
    }

    /**
     * Simulation d'envoi de commande au fournisseur
     */
    function simulateForward(order, supplierItems, totalCost) {
        const supplierOrderId = 'AE-' + Date.now().toString(36).toUpperCase();
        const trackingNumber = 'TRK' + Math.random().toString(36).substring(2, 12).toUpperCase();

        const supplierOrder = {
            orderId: order.id,
            supplierOrderId,
            platform: 'aliexpress',
            status: 'processing',  // processing | shipped | in_transit | delivered | cancelled
            items: supplierItems,
            totalCost,
            profit: (order.total || 0) - totalCost,
            trackingNumber: null,
            estimatedDelivery: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            events: [
                {
                    date: new Date().toISOString(),
                    status: 'processing',
                    description: 'Commande transmise au fournisseur AliExpress'
                }
            ]
        };

        // Simuler l'ajout du tracking après un délai (stocké directement)
        supplierOrder.trackingNumber = trackingNumber;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 15);
        supplierOrder.estimatedDelivery = deliveryDate.toISOString();

        // Sauvegarder
        const orders = getSupplierOrders();
        orders.push(supplierOrder);
        saveSupplierOrders(orders);

        return {
            success: true,
            mode: 'simulation',
            supplierOrderId,
            trackingNumber,
            totalCost,
            profit: supplierOrder.profit,
            estimatedDelivery: supplierOrder.estimatedDelivery
        };
    }

    /**
     * Envoi réel via API (nécessite backend proxy pour sécuriser les clés)
     */
    async function forwardToApi(order, supplierItems, totalCost, config) {
        // Cette fonction est prête pour l'intégration avec un backend
        // Le backend servira de proxy pour appeler l'API AliExpress
        // Exemple d'endpoint: POST /api/supplier/forward-order
        try {
            const response = await fetch('/api/supplier/forward-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': config.apiKey
                },
                body: JSON.stringify({
                    order,
                    supplierItems,
                    totalCost,
                    platform: config.platform
                })
            });

            if (!response.ok) throw new Error('API error: ' + response.status);
            return await response.json();
        } catch (e) {
            console.warn('Supplier API error, falling back to simulation:', e);
            return simulateForward(order, supplierItems, totalCost);
        }
    }

    /**
     * Met à jour le statut d'une commande fournisseur
     */
    function updateSupplierOrderStatus(orderId, status, description) {
        const orders = getSupplierOrders();
        const order = orders.find(o => o.orderId === orderId);
        if (!order) return false;

        order.status = status;
        order.updatedAt = new Date().toISOString();
        order.events.push({
            date: new Date().toISOString(),
            status,
            description: description || statusLabel(status)
        });

        saveSupplierOrders(orders);
        return true;
    }

    function statusLabel(status) {
        const labels = {
            processing: 'En traitement',
            shipped: 'Expédié par le fournisseur',
            in_transit: 'En transit',
            delivered: 'Livré',
            cancelled: 'Annulé'
        };
        return labels[status] || status;
    }

    /**
     * Statistiques fournisseur
     */
    function getStats() {
        const orders = getSupplierOrders();
        const mappings = getMappings();

        const totalCost = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
        const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);
        const avgMargin = orders.length > 0 ? (totalProfit / (totalCost + totalProfit)) * 100 : 0;

        return {
            totalOrders: orders.length,
            mappedProducts: mappings.length,
            totalCost,
            totalProfit,
            avgMargin,
            pendingOrders: orders.filter(o => o.status === 'processing').length,
            shippedOrders: orders.filter(o => ['shipped', 'in_transit'].includes(o.status)).length,
            deliveredOrders: orders.filter(o => o.status === 'delivered').length
        };
    }

    return {
        // Config
        getConfig,
        saveConfig,
        // Mappings
        getMappings,
        getMapping,
        setMapping,
        removeMapping,
        getMargin,
        // Orders
        getSupplierOrders,
        getSupplierOrder,
        forwardOrder,
        updateSupplierOrderStatus,
        statusLabel,
        // Stats
        getStats
    };
})();
