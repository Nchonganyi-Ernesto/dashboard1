// ============================================================
//  SIGN IN INTERACTIVITY & FIREBASE AUTHENTICATION - ksearch
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Password visibility toggle
    const passwordInput = document.getElementById('passwordInput');
    const togglePassword = document.getElementById('togglePassword');

    if (passwordInput && togglePassword) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            togglePassword.classList.toggle('fa-eye-slash', !isPassword);
            togglePassword.classList.toggle('fa-eye', isPassword);
        });
    }

    // Firebase Sign In Form Handling
    const signinForm = document.getElementById('signinForm');
    const authError = document.getElementById('authError');
    const submitBtn = document.getElementById('submitBtn');

    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('emailInput')?.value.trim();
            const password = document.getElementById('passwordInput')?.value;

            // Clear previous error
            if (authError) {
                authError.style.display = 'none';
                authError.innerText = '';
            }

            // Disable submit button during authentication call
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Signing In...';
            }

            try {
                // Firebase Sign In Call
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                console.log('Firebase Auth authenticated user:', user.email);

                // Pure Firebase Gateway Role Check (Custom Claims or Firestore User Role)
                const isAdmin = await checkAdminRole(user);

                // Auto-backfill user document in Firestore for pre-existing accounts
                if (typeof db !== 'undefined' && db && user) {
                    try {
                        const userDocRef = db.collection('users').doc(user.uid);
                        const docSnap = await userDocRef.get();
                        if (!docSnap.exists) {
                            await userDocRef.set({
                                uid: user.uid,
                                displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
                                email: user.email,
                                role: isAdmin ? 'admin' : 'user',
                                isAdmin: isAdmin,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            console.log('Pre-existing user document auto-backfilled in Firestore:', user.email);
                        }
                    } catch (e) {
                        console.warn('Could not auto-backfill user document:', e);
                    }
                }

                sessionStorage.removeItem('redirectAfterLogin');

                if (isAdmin) {
                    console.log('Firebase Gateway: Admin role confirmed. Redirecting to dashboard.html...');
                    window.location.href = 'dashboard.html';
                } else {
                    console.log('Firebase Gateway: Advertiser role confirmed. Redirecting to ads-dashboard.html...');
                    window.location.href = 'ads-dashboard.html';
                }

            } catch (error) {
                console.error('Sign In Error:', error.code, error.message);
                showError(getErrorMessage(error));

                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Sign In';
                }
            }
        });
    }

    function showError(msg) {
        if (authError) {
            authError.innerText = msg;
            authError.style.display = 'block';
        } else {
            alert(msg);
        }
    }

    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password. Please check your credentials.';
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-disabled':
                return 'This user account has been disabled.';
            case 'auth/too-many-requests':
                return 'Access blocked due to many failed login attempts. Try again later.';
            default:
                return error.message || 'Failed to sign in. Please try again.';
        }
    }
});

async function checkAdminRole(user) {
    if (!user) return false;

    const userEmail = (user.email || '').toLowerCase();

    // 1. Direct check for admin email address (e.g. admin@google.com)
    if (userEmail.includes('admin')) {
        return true;
    }

    // 2. Check Firebase Auth Token Custom Claims
    try {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult && tokenResult.claims) {
            if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
                return true;
            }
        }
    } catch (e) {
        console.warn('Firebase Auth Token claim check:', e);
    }

    // 3. Check Firestore 'users' collection (by UID or Email query)
    if (typeof db !== 'undefined' && db) {
        try {
            // Check by UID
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data && (data.role === 'admin' || data.isAdmin === true)) {
                    return true;
                }
            }

            // Check by Email query (in case Document ID is auto-generated)
            const querySnap = await db.collection('users').where('email', '==', user.email).get();
            if (!querySnap.empty) {
                let foundAdmin = false;
                querySnap.forEach(doc => {
                    const data = doc.data();
                    if (data && (data.role === 'admin' || data.isAdmin === true)) {
                        foundAdmin = true;
                    }
                });
                if (foundAdmin) return true;
            }
        } catch (e) {
            console.warn('Firestore user role check:', e);
        }
    }

    return false;
}
