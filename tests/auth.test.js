/**
 * Tests for auth.js — Authentication and admin role system
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

function loadAuthModule(localStorage) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
    // Only load the Auth IIFE, skip the DOMContentLoaded listener
    const iifeEnd = code.indexOf('// Update account link');
    const iifeCode = iifeEnd > 0 ? code.substring(0, iifeEnd) : code;

    const wrappedCode = iifeCode + '\n;Auth;';

    const sandbox = {
        localStorage,
        Date,
        JSON,
        console,
        document: { addEventListener: () => {}, getElementById: () => null }
    };
    vm.createContext(sandbox);
    return vm.runInContext(wrappedCode, sandbox);
}

describe('Auth — Admin account', () => {
    let Auth;

    beforeEach(() => {
        Auth = loadAuthModule(createMockLocalStorage());
    });

    test('admin login with correct credentials', () => {
        const result = Auth.login('admin@skynetstore.com', 'admin123');
        expect(result.ok).toBe(true);
        expect(result.user.role).toBe('admin');
        expect(result.user.firstName).toBe('Admin');
    });

    test('admin login with wrong password fails', () => {
        const result = Auth.login('admin@skynetstore.com', 'wrongpassword');
        expect(result.ok).toBe(false);
        expect(result.error).toBeTruthy();
    });

    test('isAdmin returns true after admin login', () => {
        Auth.login('admin@skynetstore.com', 'admin123');
        expect(Auth.isAdmin()).toBe(true);
    });

    test('isAdmin returns false when not logged in', () => {
        expect(Auth.isAdmin()).toBeFalsy();
    });
});

describe('Auth — Customer registration', () => {
    let Auth;

    beforeEach(() => {
        Auth = loadAuthModule(createMockLocalStorage());
    });

    test('register a new customer', () => {
        const result = Auth.register({
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@test.com',
            password: 'test123'
        });
        expect(result.ok).toBe(true);
        expect(result.user.firstName).toBe('Jean');
        expect(result.user.role).toBe('customer');
        expect(result.user.password).toBeUndefined();
    });

    test('cannot register with existing email', () => {
        Auth.register({
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean@test.com',
            password: 'test123'
        });
        const result = Auth.register({
            firstName: 'Jean2',
            lastName: 'Dupont2',
            email: 'jean@test.com',
            password: 'test456'
        });
        expect(result.ok).toBe(false);
    });

    test('cannot register with admin email', () => {
        const result = Auth.register({
            firstName: 'Fake',
            lastName: 'Admin',
            email: 'admin@skynetstore.com',
            password: 'hacker'
        });
        expect(result.ok).toBe(false);
    });
});

describe('Auth — Customer login', () => {
    let Auth;

    beforeEach(() => {
        Auth = loadAuthModule(createMockLocalStorage());
    });

    test('login with registered customer', () => {
        Auth.register({
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie@test.com',
            password: 'pass123'
        });
        Auth.logout();

        const result = Auth.login('marie@test.com', 'pass123');
        expect(result.ok).toBe(true);
        expect(result.user.firstName).toBe('Marie');
        expect(result.user.role).toBe('customer');
    });

    test('login with wrong password fails', () => {
        Auth.register({
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie@test.com',
            password: 'pass123'
        });
        Auth.logout();

        const result = Auth.login('marie@test.com', 'wrong');
        expect(result.ok).toBe(false);
    });

    test('isAdmin returns false for customer', () => {
        Auth.register({
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie@test.com',
            password: 'pass123'
        });
        expect(Auth.isAdmin()).toBe(false);
    });
});

describe('Auth — Session management', () => {
    let Auth;

    beforeEach(() => {
        Auth = loadAuthModule(createMockLocalStorage());
    });

    test('getCurrentUser returns null when not logged in', () => {
        expect(Auth.getCurrentUser()).toBeNull();
    });

    test('isLoggedIn returns false when not logged in', () => {
        expect(Auth.isLoggedIn()).toBe(false);
    });

    test('logout clears session', () => {
        Auth.login('admin@skynetstore.com', 'admin123');
        expect(Auth.isLoggedIn()).toBe(true);
        Auth.logout();
        expect(Auth.isLoggedIn()).toBe(false);
        expect(Auth.getCurrentUser()).toBeNull();
    });

    test('session does not include password', () => {
        Auth.login('admin@skynetstore.com', 'admin123');
        const user = Auth.getCurrentUser();
        expect(user.password).toBeUndefined();
    });
});

describe('Auth — Profile update', () => {
    let Auth;

    beforeEach(() => {
        Auth = loadAuthModule(createMockLocalStorage());
    });

    test('update profile fields', () => {
        Auth.register({
            firstName: 'Pierre',
            lastName: 'Durand',
            email: 'pierre@test.com',
            password: 'pass'
        });

        const result = Auth.updateProfile({ firstName: 'Pedro', city: 'Paris' });
        expect(result.ok).toBe(true);
        expect(result.user.firstName).toBe('Pedro');
        expect(result.user.city).toBe('Paris');
    });

    test('update fails when not logged in', () => {
        const result = Auth.updateProfile({ firstName: 'Hacker' });
        expect(result.ok).toBe(false);
    });
});
