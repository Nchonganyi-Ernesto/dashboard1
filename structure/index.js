document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!hamburgerBtn || !sidebar || !overlay) return;

    const MOBILE_BREAKPOINT = 900;

    const openSidebar = () => {
        sidebar.classList.add('open');
        overlay.classList.add('visible');
        hamburgerBtn.classList.add('active');
        document.body.classList.add('no-scroll');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        hamburgerBtn.classList.remove('active');
        document.body.classList.remove('no-scroll');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    };

    const toggleSidebar = () => {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    };

    hamburgerBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close the sidebar automatically when a nav link is tapped on mobile
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                closeSidebar();
            }
        });
    });

    // Close with the Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSidebar();
        }
    });

    // Keep state clean when resizing back to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            closeSidebar();
        }
    });
});
