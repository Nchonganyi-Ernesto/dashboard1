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

    // Apply for Ads CTA Guard
    const applyAdsCta = document.getElementById('applyAdsCta');
    if (applyAdsCta) {
        applyAdsCta.addEventListener('click', (e) => {
            e.preventDefault();
            requireAuth(() => {
                window.location.href = 'ads-dashboard.html#apply-section';
            });
        });
    }

    // Dynamic Auth Navigation Sync
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const authButtonsContainer = document.querySelector('.auth-buttons');
            const footerAuthButtons = document.querySelector('.footer-auth-buttons');

            if (user) {
                const displayName = user.displayName || user.email.split('@')[0];
                if (authButtonsContainer) {
                    authButtonsContainer.innerHTML = `
                        <button class="sign-up-btn" onclick="window.location.href='ads-dashboard.html'">
                            <i class="fa-solid fa-gauge"></i> My Dashboard (${escapeHtml(displayName)})
                        </button>
                    `;
                }
                if (footerAuthButtons) {
                    footerAuthButtons.innerHTML = `
                        <a href="ads-dashboard.html" class="footer-btn signup">My Dashboard</a>
                    `;
                }
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
});
