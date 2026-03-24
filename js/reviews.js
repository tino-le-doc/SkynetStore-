/**
 * SkynetStore — Customer Reviews (Firebase + localStorage fallback)
 * Real reviews submitted by logged-in customers
 */
const Reviews = (() => {
    const LOCAL_KEY = 'skynet-reviews';

    function _useFirebase() {
        return typeof FirebaseDB !== 'undefined' && FirebaseDB.isFirebaseReady();
    }

    // ========================
    // Storage
    // ========================
    async function getReviews(productId) {
        if (_useFirebase()) {
            try {
                const snapshot = await db.collection('reviews')
                    .where('productId', '==', productId)
                    .orderBy('createdAt', 'desc')
                    .get();
                if (!snapshot.empty) {
                    return snapshot.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));
                }
                return [];
            } catch (e) {
                console.warn('Reviews.getReviews Firebase error:', e);
            }
        }
        // Fallback localStorage
        const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        return (all[productId] || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async function saveReview(review) {
        if (_useFirebase()) {
            try {
                await db.collection('reviews').add(review);
                return true;
            } catch (e) {
                console.warn('Reviews.saveReview Firebase error:', e);
            }
        }
        // Fallback localStorage
        const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        if (!all[review.productId]) all[review.productId] = [];
        all[review.productId].unshift(review);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
        return true;
    }

    async function hasUserReviewed(productId, userId) {
        if (_useFirebase()) {
            try {
                const snapshot = await db.collection('reviews')
                    .where('productId', '==', productId)
                    .where('userId', '==', userId)
                    .limit(1)
                    .get();
                return !snapshot.empty;
            } catch (e) {
                console.warn('Reviews.hasUserReviewed Firebase error:', e);
            }
        }
        const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        return (all[productId] || []).some(r => r.userId === userId);
    }

    // ========================
    // Rendering helpers
    // ========================
    function renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating
                ? '<span class="star filled">&#9733;</span>'
                : '<span class="star empty">&#9733;</span>';
        }
        return html;
    }

    function formatDate(isoStr) {
        return new Date(isoStr).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // ========================
    // Summary
    // ========================
    function renderSummary(reviews) {
        const el = document.getElementById('reviews-summary');
        if (!el) return;

        const total = reviews.length;
        if (total === 0) {
            el.innerHTML = `
                <div class="reviews-summary-inner reviews-empty-summary">
                    <p>Aucun avis pour le moment. Soyez le premier a donner votre avis !</p>
                </div>`;
            return;
        }

        const counts = [0, 0, 0, 0, 0];
        let sum = 0;
        reviews.forEach(r => {
            counts[r.rating - 1]++;
            sum += r.rating;
        });
        const avg = (sum / total).toFixed(1);

        let barsHtml = '';
        for (let i = 5; i >= 1; i--) {
            const pct = Math.round((counts[i - 1] / total) * 100);
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
                    <span class="reviews-score-number">${avg}</span>
                    <div class="reviews-score-stars">${renderStars(Math.round(parseFloat(avg)))}</div>
                    <span class="reviews-score-count">${total} avis</span>
                </div>
                <div class="reviews-bars">${barsHtml}</div>
            </div>`;
    }

    // ========================
    // Review cards
    // ========================
    function renderList(reviews) {
        const el = document.getElementById('reviews-list');
        if (!el) return;

        if (reviews.length === 0) {
            el.innerHTML = '';
            return;
        }

        el.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-avatar">${(r.authorName || 'A').charAt(0).toUpperCase()}</div>
                    <div class="review-meta">
                        <span class="review-author">${escapeHtml(r.authorName)} <span class="review-verified">Achat verifie</span></span>
                        <span class="review-date">${formatDate(r.createdAt)}</span>
                    </div>
                    <div class="review-stars">${renderStars(r.rating)}</div>
                </div>
                <h4 class="review-title">${escapeHtml(r.title)}</h4>
                <p class="review-text">${escapeHtml(r.text)}</p>
            </div>
        `).join('');
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // ========================
    // Review form
    // ========================
    function renderForm(productId) {
        const el = document.getElementById('review-form-container');
        if (!el) return;

        const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;

        if (!user) {
            const isInProducts = window.location.pathname.includes('/pages/products/');
            const loginPath = isInProducts ? '../account.html' : 'account.html';
            el.innerHTML = `
                <div class="review-login-prompt">
                    <p>Connectez-vous pour laisser un avis</p>
                    <a href="${loginPath}" class="btn btn-primary btn-sm">Se connecter</a>
                </div>`;
            return;
        }

        el.innerHTML = `
            <form class="review-form" id="review-form">
                <h3>Donner votre avis</h3>
                <div class="review-form-rating">
                    <label>Votre note</label>
                    <div class="star-selector" id="star-selector">
                        <span class="star-select" data-value="1">&#9733;</span>
                        <span class="star-select" data-value="2">&#9733;</span>
                        <span class="star-select" data-value="3">&#9733;</span>
                        <span class="star-select" data-value="4">&#9733;</span>
                        <span class="star-select" data-value="5">&#9733;</span>
                    </div>
                    <input type="hidden" id="review-rating-value" value="0">
                </div>
                <div class="form-group">
                    <label for="review-title-input">Titre de votre avis</label>
                    <input type="text" id="review-title-input" placeholder="Resumez votre experience" maxlength="100" required>
                </div>
                <div class="form-group">
                    <label for="review-text-input">Votre commentaire</label>
                    <textarea id="review-text-input" rows="4" placeholder="Partagez votre experience avec ce produit..." maxlength="1000" required></textarea>
                </div>
                <div class="review-form-message" id="review-form-message"></div>
                <button type="submit" class="btn btn-primary">Publier mon avis</button>
            </form>`;

        // Star selector interaction
        const stars = el.querySelectorAll('.star-select');
        const ratingInput = document.getElementById('review-rating-value');
        let selectedRating = 0;

        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.dataset.value);
                stars.forEach(s => {
                    s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
                });
            });

            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.value);
                ratingInput.value = selectedRating;
                stars.forEach(s => {
                    s.classList.toggle('selected', parseInt(s.dataset.value) <= selectedRating);
                });
            });
        });

        el.querySelector('.star-selector').addEventListener('mouseleave', () => {
            stars.forEach(s => {
                s.classList.remove('hovered');
                s.classList.toggle('selected', parseInt(s.dataset.value) <= selectedRating);
            });
        });

        // Form submit
        document.getElementById('review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgEl = document.getElementById('review-form-message');
            const rating = parseInt(ratingInput.value);
            const title = document.getElementById('review-title-input').value.trim();
            const text = document.getElementById('review-text-input').value.trim();

            if (rating < 1 || rating > 5) {
                msgEl.textContent = 'Veuillez selectionner une note.';
                msgEl.className = 'review-form-message error';
                return;
            }
            if (!title) {
                msgEl.textContent = 'Veuillez ajouter un titre.';
                msgEl.className = 'review-form-message error';
                return;
            }
            if (!text) {
                msgEl.textContent = 'Veuillez ecrire un commentaire.';
                msgEl.className = 'review-form-message error';
                return;
            }

            // Check if already reviewed
            const alreadyReviewed = await hasUserReviewed(productId, user.id);
            if (alreadyReviewed) {
                msgEl.textContent = 'Vous avez deja donne votre avis sur ce produit.';
                msgEl.className = 'review-form-message error';
                return;
            }

            const review = {
                productId: productId,
                userId: user.id,
                authorName: (user.firstName || '') + ' ' + (user.lastName ? user.lastName.charAt(0) + '.' : ''),
                rating: rating,
                title: title,
                text: text,
                createdAt: new Date().toISOString()
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Publication...';

            await saveReview(review);

            msgEl.textContent = 'Merci pour votre avis !';
            msgEl.className = 'review-form-message success';

            // Refresh reviews list
            setTimeout(async () => {
                const reviews = await getReviews(productId);
                renderSummary(reviews);
                renderList(reviews);
                // Replace form with thank you
                el.innerHTML = `
                    <div class="review-thank-you">
                        <span class="review-thank-icon">&#10003;</span>
                        <p>Merci pour votre avis ! Il est maintenant visible par tous.</p>
                    </div>`;
            }, 500);
        });
    }

    // ========================
    // Init
    // ========================
    async function init() {
        const productId = window.PRODUCT_PAGE_ID || parseInt(new URLSearchParams(window.location.search).get('id'));
        if (!productId) return;

        const reviews = await getReviews(productId);
        renderSummary(reviews);
        renderList(reviews);

        // Check if user already reviewed, show form or "already reviewed" message
        const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
        if (user) {
            const alreadyReviewed = await hasUserReviewed(productId, user.id);
            if (alreadyReviewed) {
                const formContainer = document.getElementById('review-form-container');
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div class="review-thank-you">
                            <span class="review-thank-icon">&#10003;</span>
                            <p>Vous avez deja donne votre avis sur ce produit.</p>
                        </div>`;
                }
                return;
            }
        }

        renderForm(productId);
    }

    document.addEventListener('DOMContentLoaded', init);

    return { getReviews, saveReview, hasUserReviewed };
})();
