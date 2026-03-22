/**
 * SkynetStore — Authentication & Account Management
 * Gestion des comptes clients et administrateur (localStorage)
 */
const Auth = (() => {
    const STORAGE_KEY = 'skynet-users';
    const SESSION_KEY = 'skynet-session';

    // Default admin account
    const ADMIN_ACCOUNT = {
        id: 1,
        firstName: 'Admin',
        lastName: 'SkynetStore',
        email: 'admin@skynetstore.com',
        password: 'admin123',
        phone: '',
        address: '',
        city: '',
        postal: '',
        country: 'FR',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z'
    };

    function getUsers() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        // Ensure admin account always exists
        if (!users.find(u => u.email === ADMIN_ACCOUNT.email)) {
            users.unshift({ ...ADMIN_ACCOUNT });
            saveUsers(users);
        }
        return users;
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    function getSession() {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    }

    function saveSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    function register(data) {
        const users = getUsers();
        if (users.find(u => u.email === data.email)) {
            return { ok: false, error: 'Un compte avec cet email existe déjà.' };
        }
        const user = {
            id: Date.now(),
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            postal: data.postal || '',
            country: data.country || 'FR',
            role: 'customer',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        saveUsers(users);
        const sessionUser = { ...user };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    function login(email, password) {
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return { ok: false, error: 'Email ou mot de passe incorrect.' };
        }
        const sessionUser = { ...user };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
    }

    function getCurrentUser() {
        return getSession();
    }

    function isAdmin() {
        const user = getSession();
        return user && user.role === 'admin';
    }

    function updateProfile(data) {
        const session = getSession();
        if (!session) return { ok: false, error: 'Non connecté.' };
        const users = getUsers();
        const idx = users.findIndex(u => u.id === session.id);
        if (idx === -1) return { ok: false, error: 'Utilisateur introuvable.' };
        const updatable = ['firstName', 'lastName', 'phone', 'address', 'city', 'postal', 'country'];
        updatable.forEach(key => {
            if (data[key] !== undefined) users[idx][key] = data[key];
        });
        saveUsers(users);
        const sessionUser = { ...users[idx] };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    function isLoggedIn() {
        return getSession() !== null;
    }

    return { register, login, logout, getCurrentUser, updateProfile, isLoggedIn, isAdmin };
})();

// Update account link in header + show admin link if admin
document.addEventListener('DOMContentLoaded', () => {
    const accountLink = document.getElementById('account-link');
    if (accountLink) {
        const user = Auth.getCurrentUser();
        if (user) {
            const isInPages = window.location.pathname.includes('/pages/');
            const isInProducts = window.location.pathname.includes('/pages/products/');
            accountLink.href = isInProducts ? '../mon-compte.html' : (isInPages ? 'mon-compte.html' : 'pages/mon-compte.html');
            accountLink.textContent = user.firstName;
            accountLink.title = 'Mon Compte';

            // Add admin link in nav if user is admin
            if (user.role === 'admin') {
                const nav = document.getElementById('nav');
                if (nav) {
                    const adminLink = document.createElement('a');
                    adminLink.className = 'nav-link';
                    adminLink.style.color = 'var(--accent)';
                    adminLink.textContent = 'Admin';
                    adminLink.href = isInProducts ? '../../admin/index.html' : (isInPages ? '../admin/index.html' : 'admin/index.html');
                    nav.appendChild(adminLink);
                }
            }
        }
    }
});
