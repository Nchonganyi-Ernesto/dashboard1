document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileDropMenu = document.getElementById('mobileDropMenu');

    if (hamburger && mobileDropMenu) {
        hamburger.addEventListener('click', () => {
            mobileDropMenu.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
    }
});
