// ============================================================
//  USER ADS DASHBOARD INTERACTIVITY & FIRESTORE REAL-TIME SYNC
// ============================================================

let unsubscribeCampaigns = null;

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initProfileDropdown();
    initMobileMenu();
    initAdForm();
    initSettingsForm();
    initAuthAndFirestoreSync();
    initSignOut();
});

// --- Sync Authenticated User & Real-time Firestore Listener ---
function initAuthAndFirestoreSync() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            const email = user.email;

            // Sync User Profile in Header & Settings
            updateUserProfileUI(displayName, email);

            // Listen to Real-time Firestore Ad Campaigns for this User
            setupRealtimeCampaignsListener(user);
        } else {
            // Unsubscribe if signed out
            if (unsubscribeCampaigns) {
                unsubscribeCampaigns();
                unsubscribeCampaigns = null;
            }
        }
    });
}

function updateUserProfileUI(displayName, email) {
    const welcomeHeading = document.querySelector('.welcome-text h1');
    if (welcomeHeading) welcomeHeading.innerText = `Welcome ${displayName}`;

    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.innerText = displayName;

    const userDisplayNameEl = document.querySelector('.user-display-name');
    if (userDisplayNameEl) userDisplayNameEl.innerText = displayName;

    const userEmailEl = document.querySelector('.user-email');
    if (userEmailEl) userEmailEl.innerText = email;

    const profileCardName = document.querySelector('.profile-card-name');
    if (profileCardName) profileCardName.innerText = displayName;

    const profileCardEmail = document.querySelector('.profile-card-email');
    if (profileCardEmail) profileCardEmail.innerText = email;

    const settingFullName = document.getElementById('settingFullName');
    if (settingFullName) settingFullName.value = displayName;

    const settingEmail = document.getElementById('settingEmail');
    if (settingEmail) settingEmail.value = email;
}

// --- Real-time Firestore Listener ---
function setupRealtimeCampaignsListener(user) {
    if (!db) {
        console.warn('Firestore instance not available.');
        return;
    }

    // Unsubscribe previous listener if exists
    if (unsubscribeCampaigns) {
        unsubscribeCampaigns();
    }

    const historyTableBody = document.getElementById('historyTableBody');

    // Subscribe to user's campaigns sorted by creation date
    unsubscribeCampaigns = db.collection('ad_campaigns')
        .where('userId', '==', user.uid)
        .onSnapshot(snapshot => {
            console.log('Real-time Firestore snapshot received:', snapshot.docs.length, 'campaigns');

            let totalApplied = 0;
            let activeCount = 0;
            let totalClicks = 0;

            const campaigns = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                campaigns.push({ id: doc.id, ...data });

                totalApplied++;
                if (data.status === 'Active' || !data.status) activeCount++;
                totalClicks += Number(data.clicks || 0);
            });

            // Sort newest first
            campaigns.sort((a, b) => {
                const timeA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
                const timeB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
                return timeB - timeA;
            });

            // Render History Table
            renderHistoryTable(campaigns);

            // Update Real-Time KPIs
            updateUserKPIs(totalApplied, activeCount, totalClicks);

        }, error => {
            console.error('Firestore Real-time Listener Error:', error);
        });
}

function renderHistoryTable(campaigns) {
    const historyTableBody = document.getElementById('historyTableBody');
    if (!historyTableBody) return;

    if (campaigns.length === 0) {
        historyTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5); padding: 25px;">
                    No ad applications submitted yet. Click "Apply for New Ad" to get started!
                </td>
            </tr>
        `;
        return;
    }

    historyTableBody.innerHTML = campaigns.map(ad => {
        const budgetFormatted = Number(ad.budget || 30000).toLocaleString() + ' FCFA';
        const dateStr = ad.createdAt && ad.createdAt.seconds 
            ? new Date(ad.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            : (ad.date || 'Just now');
        
        const statusClass = (ad.status === 'Active' || !ad.status) ? 'status-active' : 'status-pending';
        const statusLabel = ad.status || 'Active';

        return `
            <tr>
                <td><strong>${escapeHtml(ad.campaignName || 'Untitled Campaign')}</strong></td>
                <td>${budgetFormatted}</td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${statusClass}"><i class="fa-solid fa-circle"></i> ${escapeHtml(statusLabel)}</span></td>
                <td>${Number(ad.clicks || 0).toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

function updateUserKPIs(appliedCount, activeCount, clicksCount) {
    // Applied count KPI
    const appliedCountEl = document.getElementById('appliedCount');
    if (appliedCountEl) appliedCountEl.innerText = appliedCount;

    // History badge count
    const historyBadge = document.getElementById('historyBadge');
    if (historyBadge) historyBadge.innerText = `${appliedCount} Total Applied`;

    // History badge count in menu dropdown
    const countBadge = document.querySelector('.count-badge');
    if (countBadge) countBadge.innerText = `${activeCount} Active`;

    // Active Campaigns KPI card (2nd card in KPI grid)
    const kpiCards = document.querySelectorAll('.kpi-card');
    if (kpiCards.length >= 2) {
        const activeValEl = kpiCards[1].querySelector('.kpi-value');
        if (activeValEl) activeValEl.innerText = activeCount;
    }

    // Total Clicks KPI card (3rd card in KPI grid)
    if (kpiCards.length >= 3) {
        const clicksValEl = kpiCards[2].querySelector('.kpi-value');
        if (clicksValEl) clicksValEl.innerText = clicksCount.toLocaleString();
    }
}

// --- Submit Ad Application to Firestore ---
function initAdForm() {
    const form = document.getElementById('applyAdForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            showToast('You must be signed in to submit an ad application.');
            window.location.href = 'signin.html';
            return;
        }

        const campaignName = document.getElementById('campaignName').value.trim();
        const keywordsRaw = document.getElementById('keywords').value.trim();
        const budget = Number(document.getElementById('budget').value);
        const targetUrl = document.getElementById('targetUrl').value.trim();
        const adDescription = document.getElementById('adDescription').value.trim();

        // Convert keywords input to clean array
        const keywordsArray = keywordsRaw.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);

        const submitBtn = form.querySelector('.btn-submit-ad');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
        }

        const adData = {
            campaignName: campaignName,
            keywords: keywordsArray,
            keywordsRaw: keywordsRaw,
            budget: budget,
            targetUrl: targetUrl,
            adDescription: adDescription,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || currentUser.email,
            status: 'Active',
            clicks: 0,
            impressions: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
        };

        try {
            if (db) {
                // Save document to Firestore collection 'ad_campaigns'
                await db.collection('ad_campaigns').add(adData);
                console.log('Ad campaign successfully written to Firestore!');
            } else {
                console.warn('Firestore instance not available, saving locally fallback.');
            }

            showToast(`Successfully applied for "${campaignName}"!`);
            form.reset();

        } catch (error) {
            console.error('Error submitting ad campaign to Firestore:', error);
            showToast('Failed to submit ad application. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Submit Ad Application</span>';
            }
        }
    });
}

// --- Firebase Sign Out ---
function initSignOut() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        try {
            if (unsubscribeCampaigns) {
                unsubscribeCampaigns();
                unsubscribeCampaigns = null;
            }
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            window.location.href = 'signin.html';
        } catch (err) {
            console.error('Sign Out Error:', err);
            window.location.href = 'signin.html';
        }
    });
}

// --- Pill Navigation & Active Tab Switching ---
function initNavigation() {
    const navItems = document.querySelectorAll('.pill-nav .nav-item');
    const sections = document.querySelectorAll('.section-container');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

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

// --- Save Profile Settings ---
function initSettingsForm() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async function() {
        const nameVal = document.getElementById('settingFullName')?.value.trim() || 'Advertiser';
        
        document.querySelectorAll('.user-display-name, .profile-name, .profile-card-name').forEach(el => {
            el.innerText = nameVal;
        });

        if (typeof firebase !== 'undefined' && firebase.auth) {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                try {
                    await currentUser.updateProfile({ displayName: nameVal });
                    console.log('Firebase Profile Updated');
                } catch (err) {
                    console.error('Failed to update Firebase profile name:', err);
                }
            }
        }

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
