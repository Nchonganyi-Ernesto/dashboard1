document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburgerMenu');
    const authDropMenu = document.getElementById('authDropMenu');

    if (hamburger && authDropMenu) {
        hamburger.addEventListener('click', () => {
            authDropMenu.classList.toggle('open');
        });
    }

    // Firebase Auth State Sync in Top Menu
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const navLinksContainer = document.querySelector('.auth-menu .nav-links');
            if (!navLinksContainer) return;

            if (user) {
                const displayName = user.displayName || user.email.split('@')[0];
                navLinksContainer.innerHTML = `
                    <a href="ads.html" class="nav-link">
                        <i class="fa-solid fa-bullhorn"></i>
                        <span>Apply for Ads</span>
                    </a>
                    <a href="ads-dashboard.html" class="nav-link">
                        <i class="fa-solid fa-gauge"></i>
                        <span>My Dashboard (${escapeHtml(displayName)})</span>
                    </a>
                    <a href="#" class="nav-link" id="homeLogoutBtn">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Sign Out</span>
                    </a>
                `;

                const homeLogoutBtn = document.getElementById('homeLogoutBtn');
                if (homeLogoutBtn) {
                    homeLogoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        firebase.auth().signOut().then(() => {
                            window.location.reload();
                        });
                    });
                }
            } else {
                navLinksContainer.innerHTML = `
                    <a href="ads.html" class="nav-link">
                        <i class="fa-solid fa-bullhorn"></i>
                        <span>Apply for Ads</span>
                    </a>
                `;
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
});