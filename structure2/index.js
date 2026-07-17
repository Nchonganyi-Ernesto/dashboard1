// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const headerNav = document.getElementById('header-nav');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            headerNav.classList.toggle('active');
        });

        // Close menu when nav item is clicked
        const navTabs = headerNav.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                hamburger.classList.remove('active');
                headerNav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.header')) {
                hamburger.classList.remove('active');
                headerNav.classList.remove('active');
            }
        });
    }
});
