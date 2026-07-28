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
        const isProtectedDashboard = currentPath.includes('ads-dashboard.html');

        if (user) {
            // User is signed in
            console.log('User authenticated:', user.email);

            // Redirect away from signin/signup pages to ads dashboard
            if (isAuthPage) {
                window.location.href = 'ads-dashboard.html';
            }
        } else {
            // User is signed out
            console.log('User signed out / unauthenticated');

            // Protect Ads Dashboard page
            if (isProtectedDashboard) {
                // Store intended destination before redirecting
                sessionStorage.setItem('redirectAfterLogin', 'ads-dashboard.html');
                window.location.href = 'signin.html';
            }
        }
    });
})();

/**
 * Ensures user is authenticated before triggering an action.
 * If signed out, redirects to signin.html.
 */
function requireAuth(onSuccess) {
    const user = firebase.auth().currentUser;
    if (user) {
        if (typeof onSuccess === 'function') onSuccess(user);
    } else {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'signin.html';
    }
}
