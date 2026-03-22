/* ============================
   SkynetStore — Bandeau Cookies RGPD
   ============================ */
(function() {
    'use strict';

    var COOKIE_NAME = 'skynet_cookie_consent';
    var COOKIE_DURATION = 395; // 13 mois en jours

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
    }

    function createBanner() {
        var banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Gestion des cookies');
        banner.innerHTML =
            '<div class="cookie-banner-inner">' +
                '<div class="cookie-banner-text">' +
                    '<strong>Respect de votre vie privee</strong>' +
                    '<p>Ce site utilise des cookies fonctionnels pour assurer son bon fonctionnement ' +
                    '(panier, session, preferences). Aucun cookie publicitaire n\'est utilise. ' +
                    '<a href="' + getLegalLink('politique-confidentialite.html#cookies') + '">En savoir plus</a></p>' +
                '</div>' +
                '<div class="cookie-banner-actions">' +
                    '<button class="btn btn-primary cookie-btn-accept" id="cookie-accept">Accepter</button>' +
                    '<button class="btn btn-outline cookie-btn-refuse" id="cookie-refuse">Refuser</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', function() {
            setCookie(COOKIE_NAME, 'accepted', COOKIE_DURATION);
            banner.classList.add('cookie-banner-hidden');
            setTimeout(function() { banner.remove(); }, 400);
        });

        document.getElementById('cookie-refuse').addEventListener('click', function() {
            setCookie(COOKIE_NAME, 'refused', COOKIE_DURATION);
            banner.classList.add('cookie-banner-hidden');
            setTimeout(function() { banner.remove(); }, 400);
        });
    }

    function getLegalLink(page) {
        // Detect if we're in pages/ or root
        var path = window.location.pathname;
        if (path.indexOf('/pages/') !== -1 || path.match(/\/pages\/[^/]+$/)) {
            return page;
        }
        return 'pages/' + page;
    }

    // Only show banner if no consent cookie exists
    if (!getCookie(COOKIE_NAME)) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createBanner);
        } else {
            createBanner();
        }
    }
})();
