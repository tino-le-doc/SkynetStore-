/**
 * Tests for HTML pages — Structure validation
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
const productsDir = path.join(pagesDir, 'products');

describe('Individual product pages', () => {
    const expectedPages = [
        'echo-ai-pro', 'neurolens-ar', 'sentinelcam-360', 'companionbot-mini',
        'sonicbuds-ai', 'linguavox', 'novadrone-x1', 'pulsewatch-ai',
        'auralight', 'mindkey-ai', 'voxbox-pro', 'scangenius'
    ];

    test('all 12 product pages exist', () => {
        expectedPages.forEach(slug => {
            const filePath = path.join(productsDir, `${slug}.html`);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    expectedPages.forEach(slug => {
        describe(`${slug}.html`, () => {
            let html;

            beforeAll(() => {
                html = fs.readFileSync(path.join(productsDir, `${slug}.html`), 'utf8');
            });

            test('has valid HTML structure', () => {
                expect(html).toContain('<!DOCTYPE html>');
                expect(html).toContain('<html lang="fr">');
                expect(html).toContain('</html>');
            });

            test('has a title tag', () => {
                expect(html).toMatch(/<title>.+— SkynetStore<\/title>/);
            });

            test('has meta description', () => {
                expect(html).toMatch(/<meta name="description"/);
            });

            test('sets PRODUCT_PAGE_ID', () => {
                expect(html).toMatch(/window\.PRODUCT_PAGE_ID\s*=\s*\d+/);
            });

            test('loads required scripts', () => {
                expect(html).toContain('products.js');
                expect(html).toContain('cart.js');
                expect(html).toContain('auth.js');
                expect(html).toContain('product-detail.js');
            });

            test('has product detail section', () => {
                expect(html).toContain('id="product-detail"');
                expect(html).toContain('id="product-name"');
                expect(html).toContain('id="product-price"');
                expect(html).toContain('id="product-description"');
            });

            test('has add to cart button', () => {
                expect(html).toContain('id="add-to-cart-btn"');
                expect(html).toContain('Ajouter au Panier');
            });

            test('has quantity selector', () => {
                expect(html).toContain('id="qty-input"');
                expect(html).toContain('id="qty-minus"');
                expect(html).toContain('id="qty-plus"');
            });

            test('has related products section', () => {
                expect(html).toContain('id="related-products"');
            });

            test('has cart sidebar', () => {
                expect(html).toContain('id="cart-sidebar"');
            });

            test('uses correct relative paths (../../)', () => {
                expect(html).toContain('../../css/style.css');
                expect(html).toContain('../../js/products.js');
                expect(html).toContain('../../index.html');
            });
        });
    });
});

describe('Admin page', () => {
    let html;

    beforeAll(() => {
        html = fs.readFileSync(path.join(pagesDir, 'admin.html'), 'utf8');
    });

    test('admin.html exists', () => {
        expect(fs.existsSync(path.join(pagesDir, 'admin.html'))).toBe(true);
    });

    test('has valid HTML structure', () => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="fr">');
    });

    test('has product management table', () => {
        expect(html).toContain('id="admin-products-table"');
        expect(html).toContain('id="admin-products-body"');
    });

    test('has add product button', () => {
        expect(html).toContain('id="add-product-btn"');
    });

    test('has product edit modal with all fields', () => {
        expect(html).toContain('id="product-modal"');
        expect(html).toContain('id="edit-name"');
        expect(html).toContain('id="edit-price"');
        expect(html).toContain('id="edit-description"');
        expect(html).toContain('id="edit-image"');
        expect(html).toContain('id="edit-features"');
        expect(html).toContain('id="edit-category"');
    });

    test('has delete confirmation modal', () => {
        expect(html).toContain('id="delete-modal"');
        expect(html).toContain('id="delete-confirm"');
    });

    test('loads admin.js', () => {
        expect(html).toContain('admin.js');
    });

    test('loads auth.js for authentication', () => {
        expect(html).toContain('auth.js');
    });
});

describe('Core pages exist', () => {
    const corePages = ['catalog.html', 'account.html', 'checkout.html', 'product.html', 'admin.html'];

    corePages.forEach(page => {
        test(`${page} exists`, () => {
            expect(fs.existsSync(path.join(pagesDir, page))).toBe(true);
        });
    });
});
