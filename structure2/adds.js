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

    // Active Nav Item Toggle on Click for ALL Nav Elements
    const allNavItems = document.querySelectorAll('.nav-item');
    allNavItems.forEach(item => {
        item.addEventListener('click', function() {
            allNavItems.forEach(link => link.classList.remove('active'));
            this.classList.add('active');

            // Close mobile menu on link click
            if (mobileDropMenu) {
                mobileDropMenu.classList.remove('open');
            }
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });

    // Scroll-Spy for smooth navigation & active link highlights on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.pill-nav .nav-item[href^="#"]');

    function highlightNavOnScroll() {
        let scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 150;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavOnScroll);
});
