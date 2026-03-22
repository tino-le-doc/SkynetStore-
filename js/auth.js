/**
 * SkynetStore — Authentication & Account Management
 * Uses Firebase Auth for authentication + Firestore for user profiles
 * Falls back to localStorage when Firebase is unavailable
 */
const Auth = (() => {
    const STORAGE_KEY = 'skynet-users';
    const SESSION_KEY = 'skynet-session';

    // Default admin account
    const ADMIN_ACCOUNT = {
        id: 1,
        firstName: 'Admin',
        lastName: 'SkynetStore',
        email: 'admin@skynetstore.eu',
        password: 'admin123',
        phone: '',
        address: '',
        city: '',
        postal: '',
        country: 'FR',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z'
    };

    function _useFirebase() {
        return typeof firebaseAuth !== 'undefined' &&
               typeof FirebaseDB !== 'undefined' &&
               FirebaseDB.isFirebaseReady();
    }

    // ========================
    // localStorage fallback
    // ========================
    function _getLocalUsers() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!users.find(u => u.email === ADMIN_ACCOUNT.email)) {
            users.unshift({ ...ADMIN_ACCOUNT });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        }
        return users;
    }

    function _saveLocalUsers(users) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }

    function getSession() {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    }

    function saveSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }

    // ========================
    // Register
    // ========================
    async function register(data) {
        // Try Firebase Auth first
        if (_useFirebase()) {
            try {
                const cred = await firebaseAuth.createUserWithEmailAndPassword(data.email, data.password);
                const uid = cred.user.uid;

                // Save profile in Firestore
                const profile = {
                    id: uid,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    postal: data.postal || '',
                    country: data.country || 'FR',
                    role: 'customer',
                    createdAt: new Date().toISOString()
                };
                await db.collection('users').doc(uid).set(profile);

                // Save session locally (no password)
                saveSession(profile);
                return { ok: true, user: profile };
            } catch (e) {
                // Si erreur réseau/Firebase indisponible, fallback vers localStorage
                const networkErrors = ['auth/network-request-failed', 'auth/internal-error'];
                if (networkErrors.includes(e.code) || !e.code) {
                    console.warn('Firebase Auth indisponible, fallback localStorage:', e.message);
                    // Continue vers le fallback localStorage ci-dessous
                } else {
                    const messages = {
                        'auth/email-already-in-use': 'Un compte avec cet email existe deja.',
                        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caracteres.',
                        'auth/invalid-email': 'Adresse email invalide.'
                    };
                    return { ok: false, error: messages[e.code] || e.message };
                }
            }
        }

        // Fallback: localStorage
        const users = _getLocalUsers();
        if (users.find(u => u.email === data.email)) {
            return { ok: false, error: 'Un compte avec cet email existe deja.' };
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
        _saveLocalUsers(users);
        const sessionUser = { ...user };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    // ========================
    // Login
    // ========================
    async function login(email, password) {
        // Try Firebase Auth first
        if (_useFirebase()) {
            try {
                const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
                const uid = cred.user.uid;

                // Get profile from Firestore
                const doc = await db.collection('users').doc(uid).get();
                if (doc.exists) {
                    const profile = doc.data();
                    // S'assurer que l'admin a le bon rôle
                    if (email === ADMIN_ACCOUNT.email && profile.role !== 'admin') {
                        profile.role = 'admin';
                        await db.collection('users').doc(uid).update({ role: 'admin' });
                    }
                    saveSession(profile);
                    return { ok: true, user: profile };
                }

                // Profile not found in Firestore — build from auth
                const isAdmin = email === ADMIN_ACCOUNT.email;
                const profile = {
                    id: uid,
                    firstName: isAdmin ? 'Admin' : (cred.user.displayName || email.split('@')[0]),
                    lastName: isAdmin ? 'SkynetStore' : '',
                    email: email,
                    role: isAdmin ? 'admin' : 'customer',
                    createdAt: new Date().toISOString()
                };
                await db.collection('users').doc(uid).set(profile);
                saveSession(profile);
                return { ok: true, user: profile };
            } catch (e) {
                // Si erreur réseau/Firebase indisponible, fallback vers localStorage
                const networkErrors = ['auth/network-request-failed', 'auth/internal-error', 'auth/too-many-requests'];
                if (networkErrors.includes(e.code) || !e.code) {
                    console.warn('Firebase Auth indisponible, fallback localStorage:', e.message);
                    // Continue vers le fallback localStorage ci-dessous
                } else {
                    const messages = {
                        'auth/user-not-found': 'Email ou mot de passe incorrect.',
                        'auth/wrong-password': 'Email ou mot de passe incorrect.',
                        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
                        'auth/invalid-email': 'Adresse email invalide.'
                    };
                    return { ok: false, error: messages[e.code] || 'Email ou mot de passe incorrect.' };
                }
            }
        }

        // Fallback: localStorage
        const users = _getLocalUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return { ok: false, error: 'Email ou mot de passe incorrect.' };
        }
        const sessionUser = { ...user };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    // ========================
    // Logout
    // ========================
    async function logout() {
        if (_useFirebase()) {
            try { await firebaseAuth.signOut(); } catch (e) { /* ignore */ }
        }
        localStorage.removeItem(SESSION_KEY);
    }

    // ========================
    // Session helpers
    // ========================
    function getCurrentUser() {
        return getSession();
    }

    function isAdmin() {
        const user = getSession();
        return user && user.role === 'admin';
    }

    function isLoggedIn() {
        return getSession() !== null;
    }

    // ========================
    // Update Profile
    // ========================
    async function updateProfile(data) {
        const session = getSession();
        if (!session) return { ok: false, error: 'Non connecte.' };

        const updatable = ['firstName', 'lastName', 'phone', 'address', 'city', 'postal', 'country'];

        // Update in Firebase
        if (_useFirebase()) {
            try {
                const updates = {};
                updatable.forEach(key => {
                    if (data[key] !== undefined) updates[key] = data[key];
                });
                await db.collection('users').doc(String(session.id)).update(updates);

                // Update session
                const updated = { ...session, ...updates };
                saveSession(updated);
                return { ok: true, user: updated };
            } catch (e) {
                console.warn('Firebase updateProfile error:', e);
                // Fall through to localStorage
            }
        }

        // Fallback: localStorage
        const users = _getLocalUsers();
        const idx = users.findIndex(u => u.id === session.id);
        if (idx === -1) return { ok: false, error: 'Utilisateur introuvable.' };
        updatable.forEach(key => {
            if (data[key] !== undefined) users[idx][key] = data[key];
        });
        _saveLocalUsers(users);
        const sessionUser = { ...users[idx] };
        delete sessionUser.password;
        saveSession(sessionUser);
        return { ok: true, user: sessionUser };
    }

    // ========================
    // Init admin in Firebase Auth + Firestore
    // ========================
    async function initFirebase() {
        if (!_useFirebase()) return;
        try {
            // Check if admin profile exists in Firestore
            const snapshot = await db.collection('users')
                .where('email', '==', ADMIN_ACCOUNT.email)
                .where('role', '==', 'admin')
                .limit(1).get();

            if (snapshot.empty) {
                // Try to create admin in Firebase Auth
                try {
                    const cred = await firebaseAuth.createUserWithEmailAndPassword(
                        ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password
                    );
                    const profile = { ...ADMIN_ACCOUNT, id: cred.user.uid };
                    delete profile.password;
                    await db.collection('users').doc(cred.user.uid).set(profile);
                } catch (e) {
                    if (e.code !== 'auth/email-already-in-use') {
                        console.warn('Admin init error:', e);
                    }
                }
                // Sign out so we don't auto-login as admin
                await firebaseAuth.signOut();
            }
        } catch (e) {
            console.warn('FirebaseDB admin init error:', e);
        }
    }

    // Auto-init on load
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', initFirebase);
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
