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
});
