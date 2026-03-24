/**
 * SkynetStore — Customer Reviews
 * Generates and displays product reviews
 */
const REVIEW_NAMES = [
    'Sophie M.', 'Lucas T.', 'Emma R.', 'Hugo D.', 'Camille L.',
    'Nathan B.', 'Lea P.', 'Jules G.', 'Chloe V.', 'Louis F.',
    'Manon S.', 'Theo K.', 'Ines A.', 'Arthur W.', 'Sarah H.',
    'Gabriel N.', 'Jade C.', 'Raphael J.', 'Clara Z.', 'Adam E.'
];

const REVIEW_TEMPLATES = {
    5: [
        "Absolument incroyable ! {product} a totalement change mon quotidien. La qualite est au rendez-vous.",
        "Je suis bluffé par la qualite. {product} depasse toutes mes attentes. Je recommande a 100% !",
        "Livraison rapide, produit impeccable. {product} est exactement ce qu'il me fallait.",
        "Meilleur achat de l'annee ! {product} fonctionne parfaitement, design superbe.",
        "Excellent rapport qualite/prix. {product} est un must-have pour tous les fans de tech.",
        "Wow, je ne m'attendais pas a une telle qualite pour ce prix. {product} est top !"
    ],
    4: [
        "Tres bon produit dans l'ensemble. {product} repond bien a mes besoins, quelques details a peaufiner.",
        "Satisfait de mon achat. {product} est performant et bien concu. Petit bemol sur l'emballage.",
        "Bon rapport qualite-prix pour {product}. L'installation est simple et rapide.",
        "{product} fait le job ! Interface intuitive, bonne autonomie. Un cran en dessous du premium.",
        "J'aime beaucoup {product}. Quelques fonctionnalites manquent mais l'essentiel est la."
    ],
    3: [
        "{product} est correct sans etre exceptionnel. Fait ce qu'on attend de lui, pas plus.",
        "Mitige sur {product}. La qualite est la mais l'ergonomie pourrait etre amelioree.",
        "Pas mal pour le prix. {product} a des points forts mais aussi des axes d'amelioration."
    ]
};

const REVIEW_TITLES = {
    5: ["Parfait !", "Coup de coeur", "Excellent achat", "Je recommande", "Au top !"],
    4: ["Tres bien", "Bon produit", "Satisfait", "Bien dans l'ensemble", "Recommandable"],
    3: ["Correct", "Peut mieux faire", "Moyen+", "Passable"]
};

function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateReviews(product) {
    const count = Math.min(product.reviews, 8);
    const reviews = [];
    const usedNames = new Set();

    for (let i = 0; i < count; i++) {
        const seed = product.id * 100 + i;
        const rand = seededRandom(seed);

        // Distribute ratings based on product rating
        let rating;
        if (rand < 0.55) rating = 5;
        else if (rand < 0.85) rating = 4;
        else rating = 3;

        // Pick a unique name
        let nameIdx = Math.floor(seededRandom(seed + 1) * REVIEW_NAMES.length);
        while (usedNames.has(nameIdx)) nameIdx = (nameIdx + 1) % REVIEW_NAMES.length;
        usedNames.add(nameIdx);

        const templates = REVIEW_TEMPLATES[rating];
        const titles = REVIEW_TITLES[rating];
        const tplIdx = Math.floor(seededRandom(seed + 2) * templates.length);
        const titleIdx = Math.floor(seededRandom(seed + 3) * titles.length);

        // Generate a date in the last 6 months
        const daysAgo = Math.floor(seededRandom(seed + 4) * 180);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const shortName = product.name.split('—')[0].trim();

        reviews.push({
            name: REVIEW_NAMES[nameIdx],
            rating: rating,
            title: titles[titleIdx],
            text: templates[tplIdx].replace('{product}', shortName),
            date: dateStr,
            daysAgo: daysAgo,
            verified: seededRandom(seed + 5) > 0.2
        });
    }

    // Sort by most recent
    reviews.sort((a, b) => a.daysAgo - b.daysAgo);
    return reviews;
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) html += '<span class="star filled">&#9733;</span>';
        else html += '<span class="star empty">&#9733;</span>';
    }
    return html;
}

function renderReviewsSummary(product, reviews) {
    const el = document.getElementById('reviews-summary');
    if (!el) return;

    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => counts[r.rating - 1]++);
    const total = reviews.length;

    let barsHtml = '';
    for (let i = 5; i >= 1; i--) {
        const pct = total > 0 ? Math.round((counts[i - 1] / total) * 100) : 0;
        barsHtml += `
            <div class="rating-bar-row">
                <span class="rating-bar-label">${i} <span class="star filled">&#9733;</span></span>
                <div class="rating-bar-track">
                    <div class="rating-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="rating-bar-count">${counts[i - 1]}</span>
            </div>`;
    }

    el.innerHTML = `
        <div class="reviews-summary-inner">
            <div class="reviews-score">
                <span class="reviews-score-number">${product.rating}</span>
                <div class="reviews-score-stars">${renderStars(Math.round(product.rating))}</div>
                <span class="reviews-score-count">${product.reviews} avis</span>
            </div>
            <div class="reviews-bars">
                ${barsHtml}
            </div>
        </div>`;
}

function renderReviewsList(reviews) {
    const el = document.getElementById('reviews-list');
    if (!el) return;

    el.innerHTML = reviews.map(r => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">${r.name.charAt(0)}</div>
                <div class="review-meta">
                    <span class="review-author">${r.name}${r.verified ? ' <span class="review-verified">Achat verifie</span>' : ''}</span>
                    <span class="review-date">${r.date}</span>
                </div>
                <div class="review-stars">${renderStars(r.rating)}</div>
            </div>
            <h4 class="review-title">${r.title}</h4>
            <p class="review-text">${r.text}</p>
        </div>
    `).join('');
}

function initReviews() {
    const productId = window.PRODUCT_PAGE_ID || parseInt(new URLSearchParams(window.location.search).get('id'));
    if (typeof PRODUCTS === 'undefined') return;
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const reviews = generateReviews(product);
    renderReviewsSummary(product, reviews);
    renderReviewsList(reviews);
}

document.addEventListener('DOMContentLoaded', initReviews);
