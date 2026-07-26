document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu toggle logic
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileDropMenu = document.getElementById('mobileDropMenu');

    if (hamburger && mobileDropMenu) {
        hamburger.addEventListener('click', () => {
            mobileDropMenu.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
    }

    // Number counting animation for stats cards
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    function animateStats() {
        if (animated) return;

        statNumbers.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            if (rect.top <= window.innerHeight && rect.bottom >= 0) {
                animated = true;
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }
        });
    }

    window.addEventListener('scroll', animateStats);
    animateStats(); // Run once on load
});
