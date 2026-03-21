/**
 * Tests for products.js — Product database and helpers
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockLocalStorage() {
    const store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
}

function loadProductsModule(localStorage) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'products.js'), 'utf8');
    // Replace const/let with var so they are accessible in the sandbox context
    const patchedCode = code.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ').replace(/^function /gm, 'var _fn_ = function ');
    // Actually, simpler: just wrap in a function that returns everything
    const wrappedCode = code + `
;({
    DEFAULT_PRODUCTS: DEFAULT_PRODUCTS,
    PRODUCTS: PRODUCTS,
    PRODUCTS_STORAGE_KEY: PRODUCTS_STORAGE_KEY,
    loadProducts: loadProducts,
    saveProducts: saveProducts,
    formatPrice: formatPrice,
    generateStars: generateStars,
    createProductCard: createProductCard
});
`;
    const sandbox = { localStorage };
    vm.createContext(sandbox);
    return vm.runInContext(wrappedCode, sandbox);
}

describe('DEFAULT_PRODUCTS', () => {
    let mod;

    beforeEach(() => {
        mod = loadProductsModule(createMockLocalStorage());
    });

    test('should have 12 products', () => {
        expect(mod.DEFAULT_PRODUCTS.length).toBe(12);
    });

    test('each product has required fields', () => {
        const required = ['id', 'slug', 'name', 'category', 'categoryLabel', 'price', 'emoji', 'description', 'features'];
        mod.DEFAULT_PRODUCTS.forEach(product => {
            required.forEach(field => {
                expect(product).toHaveProperty(field);
            });
        });
    });

    test('each product has a unique id', () => {
        const ids = mod.DEFAULT_PRODUCTS.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('each product has a unique slug', () => {
        const slugs = mod.DEFAULT_PRODUCTS.map(p => p.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    test('all prices are positive numbers', () => {
        mod.DEFAULT_PRODUCTS.forEach(p => {
            expect(p.price).toBeGreaterThan(0);
            expect(typeof p.price).toBe('number');
        });
    });

    test('products with oldPrice have valid discount', () => {
        mod.DEFAULT_PRODUCTS.filter(p => p.oldPrice).forEach(p => {
            expect(p.oldPrice).toBeGreaterThan(p.price);
            expect(p.discount).toBeGreaterThan(0);
            expect(p.discount).toBeLessThan(100);
        });
    });
});

describe('formatPrice', () => {
    let mod;

    beforeEach(() => {
        mod = loadProductsModule(createMockLocalStorage());
    });

    test('formats price with comma separator and euro sign', () => {
        expect(mod.formatPrice(89.99)).toBe('89,99 €');
        expect(mod.formatPrice(0)).toBe('0,00 €');
        expect(mod.formatPrice(100)).toBe('100,00 €');
        expect(mod.formatPrice(1234.5)).toBe('1234,50 €');
    });
});

describe('generateStars', () => {
    let mod;

    beforeEach(() => {
        mod = loadProductsModule(createMockLocalStorage());
    });

    test('generates correct star string', () => {
        const result = mod.generateStars(4.8);
        expect(result).toContain('★');
        expect(result).toContain('(4.8)');
    });

    test('generates half stars when applicable', () => {
        const result = mod.generateStars(3.5);
        expect(result).toContain('½');
        expect(result).toContain('(3.5)');
    });

    test('generates correct star count for perfect 5', () => {
        const result = mod.generateStars(5);
        expect(result).toContain('★★★★★');
        expect(result).not.toContain('☆');
    });
});

describe('createProductCard', () => {
    let mod;

    beforeEach(() => {
        mod = loadProductsModule(createMockLocalStorage());
    });

    test('returns HTML with product name', () => {
        const product = mod.DEFAULT_PRODUCTS[0];
        const html = mod.createProductCard(product);
        expect(html).toContain(product.name);
    });

    test('includes product price', () => {
        const product = mod.DEFAULT_PRODUCTS[0];
        const html = mod.createProductCard(product);
        expect(html).toContain(mod.formatPrice(product.price));
    });

    test('includes discount badge when product has discount', () => {
        const product = mod.DEFAULT_PRODUCTS.find(p => p.discount);
        const html = mod.createProductCard(product);
        expect(html).toContain(`-${product.discount}%`);
    });

    test('uses basePath for links', () => {
        const product = mod.DEFAULT_PRODUCTS[0];
        const html = mod.createProductCard(product, '../../');
        expect(html).toContain(`../../pages/products/${product.slug}.html`);
    });

    test('shows image tag when product has image URL', () => {
        const product = { ...mod.DEFAULT_PRODUCTS[0], image: 'https://example.com/img.jpg' };
        const html = mod.createProductCard(product);
        expect(html).toContain('<img');
        expect(html).toContain('https://example.com/img.jpg');
    });

    test('shows emoji when product has no image', () => {
        const product = mod.DEFAULT_PRODUCTS[0];
        const html = mod.createProductCard(product);
        expect(html).toContain(product.emoji);
    });
});

describe('loadProducts / saveProducts (localStorage)', () => {
    test('returns default products when localStorage is empty', () => {
        const mod = loadProductsModule(createMockLocalStorage());
        expect(mod.PRODUCTS.length).toBe(12);
        expect(mod.PRODUCTS[0].name).toBe(mod.DEFAULT_PRODUCTS[0].name);
    });

    test('saves and loads modified products', () => {
        const ls = createMockLocalStorage();
        let mod = loadProductsModule(ls);

        const modified = [...mod.DEFAULT_PRODUCTS];
        modified[0] = { ...modified[0], price: 59.99 };
        mod.saveProducts(modified);

        // Reload
        mod = loadProductsModule(ls);
        expect(mod.PRODUCTS[0].price).toBe(59.99);
    });

    test('preserves new products added by admin', () => {
        const ls = createMockLocalStorage();
        let mod = loadProductsModule(ls);

        const custom = [...mod.DEFAULT_PRODUCTS, {
            id: 99, slug: 'custom-product', name: 'Custom Product',
            category: 'gadgets', categoryLabel: 'Gadgets IA',
            price: 42, emoji: '🎯', description: 'Test', features: []
        }];
        mod.saveProducts(custom);

        mod = loadProductsModule(ls);
        expect(mod.PRODUCTS.length).toBe(13);
        expect(mod.PRODUCTS.find(p => p.id === 99)).toBeTruthy();
    });
});
