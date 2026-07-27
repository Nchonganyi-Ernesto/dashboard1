// ============================================================
//  USER ADS DASHBOARD INTERACTIVITY - ksearch
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initProfileDropdown();
    initMobileMenu();
    initAdForm();
    initSettingsForm();
});

// --- Pill Navigation & Active Tab Switching ---
function initNavigation() {
    const navItems = document.querySelectorAll('.pill-nav .nav-item');
    const sections = document.querySelectorAll('.section-container');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            
            // Set active pill style
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Optional smooth scroll to target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Sync active nav item on scroll
    window.addEventListener('scroll', function() {
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navItems.forEach(item => {
                const href = item.getAttribute('href').substring(1);
                if (href === currentSectionId) {
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        }
    });

    // Quick Apply Button smooth scroll
    const quickApplyBtn = document.getElementById('quickApplyBtn');
    if (quickApplyBtn) {
        quickApplyBtn.addEventListener('click', function() {
            const navApply = document.getElementById('nav-apply');
            if (navApply) navApply.click();
        });
    }
}

// --- Profile Dropdown Toggle ---
function initProfileDropdown() {
    const btn = document.getElementById('profileDropdownBtn');
    const menu = document.getElementById('profileDropdownMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = menu.classList.contains('show');
        menu.classList.toggle('show');
        btn.classList.toggle('active');
        btn.setAttribute('aria-expanded', !isOpen);
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.profile-widget')) {
            menu.classList.remove('show');
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// --- Mobile Hamburger Menu ---
function initMobileMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileDropMenu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.dashboard-navbar')) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
}

// --- Apply for Ad Form Submission ---
function initAdForm() {
    const form = document.getElementById('applyAdForm');
    const historyTableBody = document.getElementById('historyTableBody');
    const appliedCountEl = document.getElementById('appliedCount');
    const historyBadge = document.getElementById('historyBadge');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const campaignName = document.getElementById('campaignName').value.trim();
        const budgetRaw = document.getElementById('budget').value;
        const budgetFormatted = Number(budgetRaw).toLocaleString() + ' FCFA';
        const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        // Create new table row
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><strong>${escapeHtml(campaignName)}</strong></td>
            <td>${budgetFormatted}</td>
            <td>${currentDate}</td>
            <td><span class="status-badge status-active"><i class="fa-solid fa-circle"></i> Active</span></td>
            <td>0</td>
        `;

        // Prepend to table
        if (historyTableBody) {
            historyTableBody.insertBefore(newRow, historyTableBody.firstChild);
        }

        // Update count KPIs
        if (appliedCountEl) {
            const currentCount = parseInt(appliedCountEl.innerText) || 0;
            appliedCountEl.innerText = currentCount + 1;
        }

        if (historyBadge) {
            const currentTotal = parseInt(historyBadge.innerText) || 0;
            const newTotal = currentTotal + 1;
            historyBadge.innerText = `${newTotal} Total Applied`;
        }

        // Show toast notification
        showToast(`Successfully applied for "${campaignName}"!`);

        // Reset form
        form.reset();
    });
}

// --- Save Profile Settings ---
function initSettingsForm() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function() {
        const nameVal = document.getElementById('settingFullName')?.value || 'Alex Rivera';
        
        // Update user display name across UI
        document.querySelectorAll('.user-display-name, .profile-name, .profile-card-name').forEach(el => {
            el.innerText = nameVal;
        });

        showToast('Profile settings updated successfully!');
    });
}

// --- Toast Utility ---
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;

    toastMessage.innerText = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// --- HTML Escaping Helper ---
function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
