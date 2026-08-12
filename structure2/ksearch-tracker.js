// ============================================================
//  KSEARCH ADVERTISER TRACKING SNIPPET (ksearch-tracker.js)
//  Self-contained tracking script for external advertiser websites
// ============================================================

(function () {
    'use strict';

    // Firebase Configuration for ksearch
    const firebaseConfig = {
        apiKey: "AIzaSyCzmfMyGTGHLjlf8MnVSTf9Fm0QJ_GYoXA",
        authDomain: "zentra-b30e4.firebaseapp.com",
        projectId: "zentra-b30e4",
        storageBucket: "zentra-b30e4.firebasestorage.app",
        messagingSenderId: "54263072036",
        appId: "1:54263072036:web:6add8cf81e71843f1e9fb1",
        measurementId: "G-YJ3TEEFC4V"
    };

    // Auto-initialize Firebase if CDN script is loaded
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
        } catch (e) {
            console.warn('[ksearch-tracker] Firebase init check:', e);
        }
    }

    // 1. Extract Tracking Parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlSrc = urlParams.get('src');
    const urlSessionId = urlParams.get('session_id');
    const urlCampaignId = urlParams.get('campaign_id');

    // 2. Persist in sessionStorage so session survives multi-page navigation on advertiser site
    if (urlSrc === 'homepage_ad' && urlSessionId) {
        sessionStorage.setItem('ks_src', 'homepage_ad');
        sessionStorage.setItem('ks_session_id', urlSessionId);
        if (urlCampaignId) sessionStorage.setItem('ks_campaign_id', urlCampaignId);
        if (!sessionStorage.getItem('ks_session_start')) {
            sessionStorage.setItem('ks_session_start', Date.now().toString());
        }
    }

    // 3. Strict Origin Guard: Only track if visitor originated from ksearch homepage
    const activeSrc = sessionStorage.getItem('ks_src');
    const activeSessionId = sessionStorage.getItem('ks_session_id');
    const activeCampaignId = sessionStorage.getItem('ks_campaign_id');

    if (activeSrc !== 'homepage_ad' || !activeSessionId) {
        console.log('[ksearch-tracker] Visitor did not originate from homepage ad click. Tracking disabled.');
        window.KSearchTracker = {
            trackPayment: function () {
                console.warn('[ksearch-tracker] Payment not recorded: Session did not originate from ksearch homepage ad click.');
                return Promise.resolve(null);
            }
        };
        return;
    }

    console.log(`[ksearch-tracker] Active ksearch homepage session confirmed: ${activeSessionId}`);

    // 4. Get Firestore instance
    function getFirestore() {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            return firebase.firestore();
        }
        return null;
    }

    // 5. Update Session Duration & Page Clicks in Firestore
    let pageClickCount = 0;

    function syncSessionMetrics() {
        const db = getFirestore();
        if (!db || !activeSessionId) return;

        const startTime = Number(sessionStorage.getItem('ks_session_start') || Date.now());
        const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

        db.collection('site_sessions').doc(activeSessionId).set({
            sessionId: activeSessionId,
            adId: activeCampaignId || null,
            src: 'homepage_ad',
            durationSeconds: durationSeconds,
            pageClicks: pageClickCount,
            visitedAd: true,
            updatedAt: (firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) 
                ? firebase.firestore.FieldValue.serverTimestamp() 
                : new Date()
        }, { merge: true }).catch(err => {
            console.warn('[ksearch-tracker] Error syncing session duration:', err);
        });
    }

    // Listen for user clicks on advertiser website
    document.addEventListener('click', function () {
        pageClickCount++;
        syncSessionMetrics();
    });

    // Sync on unload and tab hide
    window.addEventListener('beforeunload', syncSessionMetrics);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            syncSessionMetrics();
        }
    });

    // Initial sync
    syncSessionMetrics();

    // 6. Global Payment Tracker API for Advertiser Website
    window.KSearchTracker = {
        trackPayment: function (paymentData) {
            const db = getFirestore();
            if (!db) {
                console.error('[ksearch-tracker] Firebase Firestore SDK not available to record payment.');
                return Promise.reject('Firestore unavailable');
            }

            const amountFCFA = Number(paymentData.amountFCFA || paymentData.amount || 0);
            const orderId = paymentData.orderId || ('ord_' + Date.now());
            const itemNames = paymentData.itemNames || paymentData.items || 'Ad Conversion Purchase';

            const purchaseRecord = {
                sessionId: activeSessionId,
                campaignId: activeCampaignId || null,
                amountFCFA: amountFCFA,
                orderId: orderId,
                items: itemNames,
                src: 'homepage_ad',
                createdAt: (firebase.firestore && firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) 
                    ? firebase.firestore.FieldValue.serverTimestamp() 
                    : new Date()
            };

            return db.collection('site_purchases').add(purchaseRecord).then(docRef => {
                console.log(`[ksearch-tracker] Payment recorded successfully! Transaction ID: ${docRef.id}, Amount: ${amountFCFA} FCFA`);
                
                // Also update campaign total revenue if possible
                if (activeCampaignId) {
                    db.collection('ad_campaigns').doc(activeCampaignId).update({
                        totalRevenueFCFA: firebase.firestore.FieldValue.increment(amountFCFA),
                        purchasesCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(() => {});
                }

                return docRef;
            }).catch(err => {
                console.error('[ksearch-tracker] Failed to record payment in Firestore:', err);
                throw err;
            });
        }
    };

})();
