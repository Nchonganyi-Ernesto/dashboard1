// ============================================================
//  AUTHENTICATION & AUTHORIZATION GUARDS - ksearch
// ============================================================

/**
 * Checks the current Firebase authentication state.
 * Performs automatic redirects for protected or guest-only pages.
 */
(function initAuthGuard() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn('Firebase Auth SDK is not loaded on this page.');
        return;
    }

    firebase.auth().onAuthStateChanged(function (user) {
        const currentPath = window.location.pathname.toLowerCase();

        const isAuthPage = currentPath.includes('signin.html') || currentPath.includes('signup.html');
        const isUserDashboard = currentPath.includes('ads-dashboard.html');
        // 'dashboard.html' (excluding 'ads-dashboard.html')
        const isAdminDashboard = currentPath.includes('dashboard.html') && !currentPath.includes('ads-dashboard.html');

        if (user) {
            console.log('User authenticated:', user.email);

            // Fetch role from Firestore gateway
            checkFirebaseUserRole(user, function (isAdmin) {
                if (isAdmin) {
                    console.log('Admin role confirmed for:', user.email);
                    // Admin should be on dashboard.html
                    if (isAuthPage || isUserDashboard) {
                        console.log('Redirecting Admin to Admin PPC Dashboard (dashboard.html)...');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    console.log('Advertiser role confirmed for:', user.email);
                    // Advertiser should be on ads-dashboard.html
                    if (isAuthPage || isAdminDashboard) {
                        console.log('Redirecting Advertiser to User Ads Dashboard (ads-dashboard.html)...');
                        window.location.href = 'ads-dashboard.html';
                    }
                }
            });

        } else {
            console.log('User signed out / unauthenticated');

            // Protect both Admin Dashboard and User Dashboard
            if (isAdminDashboard || isUserDashboard) {
                sessionStorage.setItem('redirectAfterLogin', isAdminDashboard ? 'dashboard.html' : 'ads-dashboard.html');
                window.location.href = 'signin.html';
            }
        }
    });
})();

/**
 * Helper to check user role via Firestore gateway or Auth claims
 */
function checkFirebaseUserRole(user, callback) {
    if (!user) {
        callback(false);
        return;
    }

    const userEmail = (user.email || '').toLowerCase();

    // 1. Direct email check (e.g. admin@google.com)
    if (userEmail.includes('admin')) {
        callback(true);
        return;
    }

    // 2. Check Firebase Auth Custom Claims
    user.getIdTokenResult().then(tokenResult => {
        if (tokenResult && tokenResult.claims && (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin')) {
            callback(true);
            return;
        }

        // 3. Check Firestore 'users' collection (by UID or Email query)
        if (typeof db !== 'undefined' && db) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && (doc.data().role === 'admin' || doc.data().isAdmin === true)) {
                    callback(true);
                } else {
                    db.collection('users').where('email', '==', user.email).get().then(snap => {
                        let isFound = false;
                        snap.forEach(d => {
                            const data = d.data();
                            if (data && (data.role === 'admin' || data.isAdmin === true)) isFound = true;
                        });
                        callback(isFound);
                    }).catch(() => callback(false));
                }
            }).catch(() => callback(false));
        } else {
            callback(false);
        }
    }).catch(() => callback(false));
}

/**
 * Ensures user is authenticated before triggering an action.
 */
function requireAuth(onSuccess) {
    const user = firebase.auth() ? firebase.auth().currentUser : null;
    if (user) {
        if (typeof onSuccess === 'function') onSuccess(user);
    } else {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'signin.html';
    }
}
