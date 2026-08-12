// ============================================================
//  HOME PAGE SEARCH & AD BIDDING RANKING ENGINE - ksearch
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAuthSync();
    initSearchEngine();
    initGlobalClickTracker();
    initRecentSearchesFeed();
    loadTrendingHighestPaidAds();
    initHomepageSessionTracker();
});

// --- User Session & Ad Click Tracker ---
let currentSessionDocId = null;

function getFirestoreDb() {
    if (typeof getDb === 'function') {
        const d = getDb();
        if (d) return d;
    }
    if (typeof db !== 'undefined' && db) return db;
    if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
        return firebase.firestore();
    }
    return null;
}

function initHomepageSessionTracker() {
    const dbInstance = getFirestoreDb();
    if (!dbInstance) return;
    console.log('[ksearch Analytics] Homepage session tracker active. Sessions are recorded strictly when visiting ad websites from homepage clicks.');
}

// --- Recent Searches Feed (User Search History) ---
function initRecentSearchesFeed() {
    renderRecentSearchesFeed();

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('ksearch_recent_searches');
            renderRecentSearchesFeed();
        });
    }
}

function getRecentSearches() {
    try {
        const stored = localStorage.getItem('ksearch_recent_searches');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveRecentSearch(query) {
    if (!query || query.trim().length === 0) return;
    const cleanQuery = query.trim();

    let searches = getRecentSearches();
    // Remove if already exists to move to top
    searches = searches.filter(s => s.toLowerCase() !== cleanQuery.toLowerCase());
    // Prepend new search
    searches.unshift(cleanQuery);
    // Keep max 6 recent searches
    if (searches.length > 6) searches = searches.slice(0, 6);

    localStorage.setItem('ksearch_recent_searches', JSON.stringify(searches));
    renderRecentSearchesFeed();
}

function renderRecentSearchesFeed() {
    const listContainer = document.getElementById('recentSearchesList');
    const clearBtn = document.getElementById('clearHistoryBtn');
    const searchInput = document.getElementById('searchInput');

    if (!listContainer) return;

    const searches = getRecentSearches();

    if (searches.length === 0) {
        listContainer.innerHTML = `<span style="font-size: 13px; color: #94a3b8; font-weight: 300;">No recent searches yet.</span>`;
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-block';

    listContainer.innerHTML = searches.map(term => `
        <span class="recent-search-chip" data-query="${escapeHtml(term)}">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 10px; color: #6366f1;"></i>
            <span>${escapeHtml(term)}</span>
        </span>
    `).join('');

    // Click handler for recent search chips
    listContainer.querySelectorAll('.recent-search-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const query = this.getAttribute('data-query');
            if (query && searchInput) {
                searchInput.value = query;
                if (typeof window.triggerHomeSearch === 'function') {
                    window.triggerHomeSearch(query, 'suggestions_tags');
                }
            }
        });
    });
}

function prepareAdTargetUrl(baseUrl, adId) {
    if (!baseUrl || baseUrl === '#') return '#';
    const sessionId = 'ks_sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    
    // Create site_session record in Firestore synchronously triggered
    const dbInstance = getFirestoreDb();
    if (dbInstance && adId) {
        dbInstance.collection('ad_campaigns').doc(adId).update({
            clicks: firebase.firestore.FieldValue.increment(1)
        }).catch(() => {});

        dbInstance.collection('site_sessions').doc(sessionId).set({
            sessionId: sessionId,
            adId: adId,
            src: 'homepage_ad',
            durationSeconds: 0,
            pageClicks: 0,
            visitedAd: true,
            createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) 
                ? firebase.firestore.FieldValue.serverTimestamp() 
                : new Date()
        }).then(() => {
            console.log(`[ksearch Analytics] Session ${sessionId} successfully created for ad ${adId}`);
        }).catch(err => {
            console.error('Error creating site_sessions record:', err);
        });
    }

    try {
        const urlObj = new URL(baseUrl, window.location.href);
        urlObj.searchParams.set('campaign_id', adId);
        urlObj.searchParams.set('session_id', sessionId);
        urlObj.searchParams.set('src', 'homepage_ad');
        return urlObj.toString();
    } catch (e) {
        const sep = baseUrl.includes('?') ? '&' : '?';
        return baseUrl + sep + 'campaign_id=' + encodeURIComponent(adId) + '&session_id=' + encodeURIComponent(sessionId) + '&src=homepage_ad';
    }
}

function handleAdClick(adId, linkEl) {
    const rawUrl = linkEl && linkEl.getAttribute ? (linkEl.getAttribute('href') || linkEl.getAttribute('data-url')) : '#';
    return prepareAdTargetUrl(rawUrl, adId);
}

// --- Global Click Tracker for All Sponsored Ad Links & Cards ---
function initGlobalClickTracker() {
    document.addEventListener('click', function (e) {
        // Track clicks on Visit Website buttons (.ad-url-link)
        const adLink = e.target.closest('.ad-url-link');
        if (adLink) {
            const adId = adLink.getAttribute('data-ad-id');
            const rawUrl = adLink.getAttribute('href');
            if (adId && rawUrl && rawUrl !== '#') {
                e.preventDefault();
                const taggedUrl = prepareAdTargetUrl(rawUrl, adId);
                window.open(taggedUrl, '_blank');
            }
        }
    });
}

// --- Fetch & Render Top Highest Paid Ads in Trending Insights ---
async function loadTrendingHighestPaidAds() {
    const trendingGrid = document.getElementById('trendingGrid');
    if (!trendingGrid) return;

    try {
        let campaigns = [];
        const dbInstance = getFirestoreDb();
        if (dbInstance) {
            const snapshot = await dbInstance.collection('ad_campaigns').get();
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.status === 'Active' || !data.status) {
                    campaigns.push({ id: doc.id, ...data });
                }
            });
        } else {
            campaigns = getSampleAds();
        }

        // Sort descending by budget (highest paid first); Tie-breaker = first submitted wins
        campaigns.sort((a, b) => {
            const budgetA = Number(a.budget || 0);
            const budgetB = Number(b.budget || 0);
            const budgetDiff = budgetB - budgetA;
            if (budgetDiff !== 0) return budgetDiff;

            const timeA = a.createdAt ? (a.createdAt.seconds || (a.createdAt.getTime ? a.createdAt.getTime() / 1000 : 0)) : 0;
            const timeB = b.createdAt ? (b.createdAt.seconds || (b.createdAt.getTime ? b.createdAt.getTime() / 1000 : 0)) : 0;
            return timeA - timeB;
        });

        // Take top 2 highest paid ads
        const topAds = campaigns.slice(0, 2);

        if (topAds.length === 0) {
            trendingGrid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 20px;">
                    No active sponsored ads available.
                </div>
            `;
            return;
        }

        trendingGrid.innerHTML = topAds.map(ad => {
            let targetUrl = ad.targetUrl || '#';
            return `
                <div class="card trending-ad-card" data-url="${escapeHtml(targetUrl)}" data-ad-id="${ad.id}">
                    <div class="card-top">
                        <i class="fa-solid fa-bolt" style="color: #4338ca;"></i>
                    </div>
                    <h3>${escapeHtml(ad.campaignName || 'Featured Promotion')}</h3>
                    <p style="font-size: 12px; color: #64748b; margin-top: 6px; font-weight: 300; line-height: 1.4;">
                        ${escapeHtml(ad.adDescription || '')}
                    </p>
                </div>
            `;
        }).join('');

        // Attach Click Tracker & Navigation Listener to Trending Ad Cards
        trendingGrid.querySelectorAll('.trending-ad-card').forEach(card => {
            card.addEventListener('click', function () {
                const adId = this.getAttribute('data-ad-id');
                const url = this.getAttribute('data-url');

                logSearchEvent('featured_events');

                if (url && url !== '#' && adId) {
                    const taggedUrl = prepareAdTargetUrl(url, adId);
                    window.open(taggedUrl, '_blank');
                }
            });
        });

    } catch (err) {
        console.error('Error loading trending ads:', err);
    }
}

// --- Record Real-Time Search-Only Impression Count in Firestore ---
const recordedSearchImpressions = new Set();

function recordAdImpressions(ads, searchQuery) {
    const dbInstance = getFirestoreDb();
    if (!ads || !Array.isArray(ads) || !dbInstance) return;

    const cleanQuery = (searchQuery || '').trim().toLowerCase();

    ads.forEach(ad => {
        if (!ad || !ad.id || (typeof ad.id === 'string' && ad.id.startsWith('sample-'))) return;

        // Ensure 1 impression per ad campaign per search query per user session
        const key = `${cleanQuery}_${ad.id}`;
        if (recordedSearchImpressions.has(key)) return;
        recordedSearchImpressions.add(key);

        dbInstance.collection('ad_campaigns').doc(ad.id).update({
            impressions: firebase.firestore.FieldValue.increment(1)
        }).then(() => {
            console.log(`Real-time search impression recorded for search "${cleanQuery}" on campaign: ${ad.id}`);
        }).catch(err => {
            console.warn('Error updating impression count in Firestore:', err);
        });
    });
}

// --- Search Event Logging for Real-Time Channel Analytics ---
function logSearchEvent(sourceType) {
    const dbInstance = getFirestoreDb();
    if (!dbInstance) {
        console.warn('Firestore instance not available for logSearchEvent');
        return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    let finalChannel = sourceType || 'direct_search';
    if (isMobile && finalChannel === 'direct_search') {
        finalChannel = 'mobile_search';
    } else if (!isMobile && finalChannel === 'direct_search') {
        finalChannel = 'desktop_search';
    }

    console.log(`[ksearch Analytics] Logging search event: channel="${finalChannel}", device="${isMobile ? 'mobile' : 'desktop'}"`);

    dbInstance.collection('search_events').add({
        channel: finalChannel,
        device: isMobile ? 'mobile' : 'desktop',
        createdAt: (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date()
    }).then(docRef => {
        console.log(`[ksearch Analytics] Search event logged successfully! ID: ${docRef.id}, Channel: ${finalChannel}`);
    }).catch(err => {
        console.error('[ksearch Analytics] Error logging search event to Firestore:', err);
    });
}


// --- Search Engine Keyword Matching & Bidding Rank Logic ---
function initSearchEngine() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const defaultHomeSections = document.getElementById('defaultHomeSections');
    const filterTags = document.querySelectorAll('.tag');

    if (!searchInput || !searchBtn) return;

    window.triggerHomeSearch = function(query, source = 'direct_search') {
        performSearch(query, source);
    };

    // Search button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) performSearch(query, 'direct_search');
    });

    // Enter key press in search bar
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) performSearch(query, 'direct_search');
        }
    });

    // Clear search
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchResults.style.display = 'none';
            if (defaultHomeSections) defaultHomeSections.style.display = 'block';
        });
    }

    // Filter tags click -> trigger search
    filterTags.forEach(tag => {
        tag.addEventListener('click', function () {
            const tagQuery = this.innerText.toLowerCase().trim();
            searchInput.value = tagQuery;
            performSearch(tagQuery, 'suggestions_tags');
        });
    });

    // Search execution function
    async function performSearch(query, source = 'direct_search') {
        if (!query) return;

        // Log search event to Firestore for real-time channel analytics
        logSearchEvent(source);

        // Save to Recent Searches Feed History
        saveRecentSearch(query);

        const lowerQuery = query.toLowerCase();

        // UI Loading state
        searchResults.style.display = 'block';
        if (defaultHomeSections) defaultHomeSections.style.display = 'none';

        resultsList.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 25px; font-size: 14px;">
                <i class="fa-solid fa-spinner fa-spin" style="color: #4338ca;"></i> Searching sponsored ad index for "${escapeHtml(query)}"...
            </div>
        `;
        if (resultsCount) resultsCount.innerText = '';

        try {
            let campaigns = [];

            // Query Firestore database
            const dbInstance = getFirestoreDb();
            if (dbInstance) {
                const snapshot = await dbInstance.collection('ad_campaigns').get();
                snapshot.forEach(doc => {
                    campaigns.push({ id: doc.id, ...doc.data() });
                });
            } else {
                console.warn('Firestore instance not found, fallback to sample ads index.');
                campaigns = getSampleAds();
            }

            // Keyword Matching Algorithm
            const matchingAds = campaigns.filter(ad => {
                const nameMatch = (ad.campaignName || '').toLowerCase().includes(lowerQuery);
                const descMatch = (ad.adDescription || '').toLowerCase().includes(lowerQuery);
                const rawKeywordsMatch = (ad.keywordsRaw || '').toLowerCase().includes(lowerQuery);

                let arrayKeywordsMatch = false;
                if (Array.isArray(ad.keywords)) {
                    arrayKeywordsMatch = ad.keywords.some(k => k.toLowerCase().includes(lowerQuery) || lowerQuery.includes(k.toLowerCase()));
                }

                return nameMatch || descMatch || rawKeywordsMatch || arrayKeywordsMatch;
            });

            // Bidding & Ranking Algorithm: Primary sort = budget descending; Tie-breaker = first submitted wins (oldest createdAt first)
            matchingAds.sort((a, b) => {
                const budgetA = Number(a.budget || 0);
                const budgetB = Number(b.budget || 0);
                const budgetDiff = budgetB - budgetA;
                if (budgetDiff !== 0) return budgetDiff;

                // Tie-breaker for equal budget: First submitted ad wins (earliest timestamp first)
                const timeA = a.createdAt ? (a.createdAt.seconds || (a.createdAt.getTime ? a.createdAt.getTime() / 1000 : 0)) : 0;
                const timeB = b.createdAt ? (b.createdAt.seconds || (b.createdAt.getTime ? b.createdAt.getTime() / 1000 : 0)) : 0;
                return timeA - timeB;
            });

            // Render Results
            renderSearchResults(query, matchingAds);

        } catch (error) {
            console.error('Search Engine Error:', error);
            resultsList.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px; font-size: 14px;">
                    Failed to perform search. Please try again.
                </div>
            `;
        }
    }

    function renderSearchResults(query, ads) {
        if (!resultsList) return;

        if (resultsCount) {
            resultsCount.innerText = `${ads.length} Ad${ads.length === 1 ? '' : 's'} Found`;
        }

        if (ads.length === 0) {
            resultsList.innerHTML = `
                <div style="text-align: center; background: #ffffff; border-radius: 16px; padding: 30px 20px; border: 1px dashed #cbd5e1;">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 28px; color: #94a3b8; margin-bottom: 10px;"></i>
                    <h4 style="font-size: 16px; color: #334155; margin-bottom: 5px;">No Sponsored Ads Match "${escapeHtml(query)}"</h4>
                    <p style="font-size: 13px; color: #64748b; font-weight: 300;">Try searching for other keywords like "tech", "AI", "fintech", or "store".</p>
                </div>
            `;
            return;
        }

        resultsList.innerHTML = ads.map((ad) => {
            const keywordsTags = Array.isArray(ad.keywords) && ad.keywords.length > 0
                ? ad.keywords.map(k => `<span class="ad-keyword-tag">#${escapeHtml(k)}</span>`).join('')
                : '';

            let targetUrl = ad.targetUrl || '#';
            if (targetUrl !== '#' && ad.id) {
                const sep = targetUrl.includes('?') ? '&' : '?';
                targetUrl = targetUrl + sep + 'campaign_id=' + encodeURIComponent(ad.id);
            }

            return `
                <div class="sponsored-ad-card">
                    <div class="ad-card-header">
                        <span class="ad-badge"><i class="fa-solid fa-bolt"></i> Sponsored</span>
                    </div>

                    <h3 class="ad-title">${escapeHtml(ad.campaignName || 'Sponsored Promotion')}</h3>
                    <p class="ad-description">${escapeHtml(ad.adDescription || 'Discover top-rated services and products tailored for your search query.')}</p>

                    ${keywordsTags ? `<div class="ad-keywords-list">${keywordsTags}</div>` : ''}

                    <div class="ad-url-bar" style="justify-content: flex-end;">
                        <a href="${escapeHtml(targetUrl)}" target="_blank" class="ad-url-link" data-ad-id="${ad.id}">
                            <span>Visit Website</span>
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // Record real-time impressions ONLY for search result ads
        recordAdImpressions(ads, query);
    }
}

// --- Navigation Toggle ---
function initNavigation() {
    const hamburger = document.getElementById('hamburgerMenu');
    const authDropMenu = document.getElementById('authDropMenu');

    if (hamburger && authDropMenu) {
        hamburger.addEventListener('click', () => {
            authDropMenu.classList.toggle('open');
        });
    }
}

// --- Firebase Auth Menu Sync ---
function initAuthSync() {
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
}

// Sample fallback ads index if Firestore offline
function getSampleAds() {
    return [
        {
            id: 'sample-1',
            campaignName: 'FinTech West Mobile Banking',
            keywords: ['fintech', 'banking', 'tech', 'money'],
            budget: 30000,
            targetUrl: 'https://example.com/fintech',
            adDescription: 'Fast, secure mobile payments and instant money transfers across West Africa.',
            userName: 'Jean-Paul MBIDA'
        },
        {
            id: 'sample-2',
            campaignName: 'NextGen Quantum AI Tools',
            keywords: ['tech', 'ai', 'quantum', 'reports'],
            budget: 20000,
            targetUrl: 'https://example.com/ai',
            adDescription: 'Automate analytical insights and dataset processing with cutting-edge AI.',
            userName: 'TechNova'
        }
    ];
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}