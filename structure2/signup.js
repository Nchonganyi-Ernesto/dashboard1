// ============================================================
//  SIGN UP INTERACTIVITY & FIREBASE REGISTRATION - ksearch
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Password toggle logic
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

    // Confirm Password toggle logic
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    if (confirmPasswordInput && toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            const isPassword = confirmPasswordInput.type === 'password';
            confirmPasswordInput.type = isPassword ? 'text' : 'password';
            toggleConfirmPassword.classList.toggle('fa-eye-slash', !isPassword);
            toggleConfirmPassword.classList.toggle('fa-eye', isPassword);
        });
    }

    // Firebase Registration Form Handling
    const signupForm = document.getElementById('signupForm');
    const authError = document.getElementById('authError');
    const submitBtn = document.getElementById('submitBtn');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('nameInput')?.value.trim();
            const email = document.getElementById('emailInput')?.value.trim();
            const password = document.getElementById('passwordInput')?.value;
            const confirmPassword = document.getElementById('confirmPasswordInput')?.value;

            // Clear previous error
            if (authError) {
                authError.style.display = 'none';
                authError.innerText = '';
            }

            // Password confirmation check
            if (password !== confirmPassword) {
                showError('Passwords do not match. Please try again.');
                return;
            }

            // Disable submit button during call
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Creating Account...';
            }

            try {
                // Firebase Create User Call
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update Display Name
                if (fullName) {
                    await user.updateProfile({
                        displayName: fullName
                    });
                }

                // Write User Record to Firestore 'users' collection
                if (typeof db !== 'undefined' && db) {
                    try {
                        await db.collection('users').doc(user.uid).set({
                            uid: user.uid,
                            displayName: fullName || email.split('@')[0],
                            email: email,
                            role: 'user',
                            isAdmin: false,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (e) {
                        console.warn('Could not store user record in Firestore:', e);
                    }
                }

                console.log('Account created successfully:', user.email);

                // Redirect directly to Ads Dashboard
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = 'ads-dashboard.html';

            } catch (error) {
                console.error('Registration Error:', error.code, error.message);
                showError(getErrorMessage(error));

                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Create Account';
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
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Please Sign In.';
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            default:
                return error.message || 'Failed to create account. Please check your credentials.';
        }
    }
});
