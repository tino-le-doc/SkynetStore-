/**
 * SkynetStore — Product Database
 * Products can be edited by admin via localStorage
 */
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        slug: "echo-ai-pro",
        name: "Echo AI Pro — Enceinte Intelligente",
        category: "enceintes",
        categoryLabel: "Enceintes IA",
        price: 89.99,
        oldPrice: 129.99,
        discount: 31,
        rating: 4.8,
        reviews: 342,
        emoji: "🔊",
        description: "Enceinte IA de nouvelle génération avec assistant vocal avancé, son surround 360° et reconnaissance vocale multi-utilisateurs. Contrôlez votre maison connectée d'une simple commande.",
        features: [
            "Assistant IA avec compréhension contextuelle",
            "Son Hi-Fi 360° avec bass boost adaptatif",
            "Reconnaissance vocale multi-utilisateurs",
            "Compatible Alexa, Google Home & HomeKit",
            "Mode confidentialité avec bouton physique"
        ],
        popular: true
    },
    {
        id: 2,
        slug: "neurolens-ar",
        name: "NeuroLens AR — Lunettes Réalité Augmentée",
        category: "wearables",
        categoryLabel: "Wearables IA",
        price: 349.99,
        oldPrice: 449.99,
        discount: 22,
        rating: 4.6,
        reviews: 128,
        emoji: "👓",
        description: "Lunettes AR légères avec IA intégrée. Traduction en temps réel, navigation holographique, assistant visuel et affichage tête haute. Le futur se porte sur le nez.",
        features: [
            "Affichage AR haute résolution",
            "Traduction instantanée en 40 langues",
            "Navigation GPS holographique",
            "Assistant IA contextuel",
            "Autonomie 12h, recharge rapide 30min"
        ],
        popular: true
    },
    {
        id: 3,
        slug: "sentinelcam-360",
        name: "SentinelCam 360 — Caméra de Sécurité IA",
        category: "maison",
        categoryLabel: "Maison Connectée",
        price: 79.99,
        oldPrice: 99.99,
        discount: 20,
        rating: 4.7,
        reviews: 589,
        emoji: "📷",
        description: "Caméra de surveillance IA avec détection de personnes, animaux et véhicules. Vision nocturne couleur, audio bidirectionnel et alertes intelligentes sur votre smartphone.",
        features: [
            "Détection IA : personnes, animaux, véhicules",
            "Vision nocturne couleur jusqu'à 15m",
            "Audio bidirectionnel avec réduction de bruit IA",
            "Stockage cloud gratuit 7 jours",
            "Résistante aux intempéries IP67"
        ],
        popular: true
    },
    {
        id: 4,
        slug: "companionbot-mini",
        name: "CompanionBot Mini — Robot Compagnon IA",
        category: "robots",
        categoryLabel: "Robots & Drones",
        price: 199.99,
        oldPrice: 279.99,
        discount: 29,
        rating: 4.9,
        reviews: 256,
        emoji: "🤖",
        description: "Petit robot compagnon doté d'une IA émotionnelle. Il apprend vos habitudes, répond à vos émotions et peut contrôler votre maison connectée. Le meilleur ami des technophiles.",
        features: [
            "IA émotionnelle avec apprentissage adaptatif",
            "Reconnaissance faciale pour toute la famille",
            "Contrôle vocal de la maison connectée",
            "Caméra HD intégrée avec suivi automatique",
            "Batterie 18h, charge par induction"
        ],
        popular: true
    },
    {
        id: 5,
        slug: "sonicbuds-ai",
        name: "SonicBuds AI — Écouteurs IA",
        category: "audio",
        categoryLabel: "Audio IA",
        price: 149.99,
        oldPrice: 199.99,
        discount: 25,
        rating: 4.7,
        reviews: 723,
        emoji: "🎧",
        description: "Écouteurs sans fil avec ANC adaptatif piloté par IA, son spatial et traduction simultanée. L'audio du futur, directement dans vos oreilles.",
        features: [
            "ANC adaptatif avec IA environnementale",
            "Son spatial personnalisé par IA",
            "Traduction simultanée en 30 langues",
            "Autonomie 36h avec boîtier",
            "Résistant eau & sueur IPX5"
        ],
        popular: true
    },
    {
        id: 6,
        slug: "linguavox",
        name: "LinguaVox — Traducteur IA Portable",
        category: "gadgets",
        categoryLabel: "Gadgets IA",
        price: 59.99,
        oldPrice: 79.99,
        discount: 25,
        rating: 4.5,
        reviews: 412,
        emoji: "🌐",
        description: "Traducteur vocal IA de poche qui traduit instantanément 100+ langues. Compact, rapide et précis — votre passeport linguistique universel.",
        features: [
            "Traduction instantanée 100+ langues",
            "Reconnaissance vocale IA avancée",
            "Mode photo pour traduire du texte",
            "Fonctionne offline pour 12 langues",
            "Ultra-compact, format carte de crédit"
        ],
        popular: true
    },
    {
        id: 7,
        slug: "novadrone-x1",
        name: "NovaDrone X1 — Drone Autonome IA",
        category: "robots",
        categoryLabel: "Robots & Drones",
        price: 299.99,
        oldPrice: 399.99,
        discount: 25,
        rating: 4.8,
        reviews: 178,
        emoji: "🚁",
        description: "Drone autonome avec pilotage IA, évitement d'obstacles 360° et caméra 4K stabilisée. Suivi automatique de sujets et modes cinématiques pré-programmés.",
        features: [
            "Pilotage autonome par IA",
            "Caméra 4K avec stabilisation 3 axes",
            "Évitement d'obstacles 360°",
            "Suivi intelligent de sujets",
            "Autonomie 40 min, portée 8km"
        ],
        popular: false
    },
    {
        id: 8,
        slug: "pulsewatch-ai",
        name: "PulseWatch AI — Montre Santé IA",
        category: "wearables",
        categoryLabel: "Wearables IA",
        price: 179.99,
        oldPrice: 229.99,
        discount: 22,
        rating: 4.6,
        reviews: 634,
        emoji: "⌚",
        description: "Montre connectée avec suivi santé propulsé par IA. ECG, SpO2, analyse du sommeil et coaching sportif personnalisé. Votre coach santé au poignet.",
        features: [
            "ECG et SpO2 avec analyse IA",
            "Suivi du sommeil avec recommandations",
            "Coaching sportif IA personnalisé",
            "GPS intégré, 30+ modes sport",
            "Autonomie 14 jours"
        ],
        popular: false
    },
    {
        id: 9,
        slug: "auralight",
        name: "AuraLight — Ampoule Connectée IA",
        category: "maison",
        categoryLabel: "Maison Connectée",
        price: 24.99,
        oldPrice: 34.99,
        discount: 29,
        rating: 4.4,
        reviews: 891,
        emoji: "💡",
        description: "Ampoule connectée qui s'adapte à votre humeur grâce à l'IA. 16 millions de couleurs, scènes automatiques et intégration domotique complète.",
        features: [
            "16 millions de couleurs RGB+W",
            "Adaptation automatique à l'ambiance",
            "Programmation intelligente par IA",
            "Compatible tous assistants vocaux",
            "Faible consommation 9W = 60W"
        ],
        popular: false
    },
    {
        id: 10,
        slug: "mindkey-ai",
        name: "MindKey AI — Clavier Prédictif IA",
        category: "gadgets",
        categoryLabel: "Gadgets IA",
        price: 129.99,
        oldPrice: 159.99,
        discount: 19,
        rating: 4.5,
        reviews: 267,
        emoji: "⌨️",
        description: "Clavier mécanique sans fil avec IA prédictive intégrée. Auto-complétion intelligente, correction contextuelle et macros adaptatifs pour coder plus vite.",
        features: [
            "IA prédictive avec auto-complétion",
            "Switches mécaniques silencieux",
            "Rétroéclairage RGB personnalisable",
            "Mode développeur avec macros IA",
            "Bluetooth 5.3 + USB-C"
        ],
        popular: false
    },
    {
        id: 11,
        slug: "voxbox-pro",
        name: "VoxBox Pro — Enceinte Multi-Room IA",
        category: "enceintes",
        categoryLabel: "Enceintes IA",
        price: 159.99,
        oldPrice: 199.99,
        discount: 20,
        rating: 4.7,
        reviews: 195,
        emoji: "🎵",
        description: "Enceinte multi-room premium avec IA musicale. Calibration acoustique automatique, recommandations musicales personnalisées et audio haute résolution.",
        features: [
            "Calibration acoustique IA automatique",
            "Audio Hi-Res 24bit/96kHz",
            "Recommandations musicales IA",
            "Multi-room synchronisé",
            "AirPlay 2, Chromecast & Spotify Connect"
        ],
        popular: false
    },
    {
        id: 12,
        slug: "scangenius",
        name: "ScanGenius — Scanner 3D IA Portable",
        category: "gadgets",
        categoryLabel: "Gadgets IA",
        price: 89.99,
        oldPrice: 119.99,
        discount: 25,
        rating: 4.3,
        reviews: 143,
        emoji: "📱",
        description: "Scanner 3D portable qui utilise l'IA pour numériser des objets en haute fidélité. Parfait pour l'impression 3D, la modélisation et le e-commerce.",
        features: [
            "Scan 3D haute fidélité par IA",
            "Reconstruction automatique des textures",
            "Export STL, OBJ, PLY",
            "Application mobile intuitive",
            "Précision 0.1mm"
        ],
        popular: false
    }
];

/**
 * Load products: merge defaults with admin edits from localStorage
 */
const PRODUCTS_STORAGE_KEY = 'skynet-products';

function loadProducts() {
    const stored = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || 'null');
    if (!stored) return [...DEFAULT_PRODUCTS];
    // Merge: stored products override defaults by id, keep new ones added by admin
    const defaultIds = DEFAULT_PRODUCTS.map(p => p.id);
    const merged = DEFAULT_PRODUCTS.map(def => {
        const override = stored.find(s => s.id === def.id);
        return override || def;
    });
    // Add any new products created by admin (ids not in defaults)
    stored.forEach(s => {
        if (!defaultIds.includes(s.id)) merged.push(s);
    });
    return merged;
}

function saveProducts(products) {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

const PRODUCTS = loadProducts();

/**
 * Helper: Format price to EUR
 */
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + ' €';
}

/**
 * Helper: Generate star rating HTML
 */
function generateStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + ` (${rating})`;
}

/**
 * Generate product card HTML
 */
function createProductCard(product, basePath) {
    const prefix = basePath || '';
    const imageHTML = product.image
        ? `<img src="${product.image}" alt="${product.name}" style="max-width:100%;max-height:120px;object-fit:contain;">`
        : product.emoji;
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-card-image">
                ${imageHTML}
                ${product.discount ? `<span class="product-badge">-${product.discount}%</span>` : ''}
            </div>
            <div class="product-card-body">
                <span class="product-card-category">${product.categoryLabel}</span>
                <h3 class="product-card-name">
                    <a href="${prefix}pages/products/${product.slug}.html">${product.name}</a>
                </h3>
                <p class="product-card-desc">${product.description}</p>
                <div class="product-card-footer">
                    <div>
                        <span class="product-card-price">${formatPrice(product.price)}</span>
                        ${product.oldPrice ? `<span class="product-card-old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <button class="add-cart-btn" onclick="addToCart(${product.id})">+ Panier</button>
                </div>
            </div>
        </div>
    `;
}
