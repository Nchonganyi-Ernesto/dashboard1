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
                console.log('Signed in successfully:', userCredential.user.email);

                // Redirect directly to Ads Dashboard
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = 'ads-dashboard.html';

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
