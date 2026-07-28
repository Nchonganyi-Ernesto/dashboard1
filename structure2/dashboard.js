// ============================================================
//  DASHBOARD DATA  — edit these objects to change the charts
// ============================================================

// Traffic by channel  (values must sum to 100)
const channelData = [
    { label: 'linkedin',     value: 16.63, color: '#1a3a6b' },
    { label: 'bing ads',     value: 16.08, color: '#17b8b0' },
    { label: 'snapchat ads', value: 15.42, color: '#7c5cd0' },
    { label: 'facebook',     value: 14.96, color: '#e0508f' },
    { label: 'tiktok',       value: 14.66, color: '#f2795a' },
    { label: 'twitter ads',  value: 14.48, color: '#4fc3f7' },
    { label: 'google ads',   value:  7.76, color: '#4ade80' },
];

// Ad platforms shared by both bar charts
const adPlatforms = [
    { key: 'bing',      label: 'Bing ads',     cssClass: 'bar-bing',       dotClass: 'legend-dot-bing'       },
    { key: 'googleads', label: 'Google ads',   cssClass: 'bar-googleads',  dotClass: 'legend-dot-googleads'  },
    { key: 'linkedin',  label: 'Linkedin ads', cssClass: 'bar-linkedinads',dotClass: 'legend-dot-linkedinads'},
    { key: 'meta',      label: 'Meta ads',     cssClass: 'bar-metaads',    dotClass: 'legend-dot-metaads'    },
];

// Weekly ad spend — actual $ values per week per platform
// Each inner array = [bing, googleads, linkedin, meta]
const spendData = {
    weeks: ['Apr W1','Apr W2','Apr W3','Apr W4','May W1','May W2','May W3','May W4','May W5'],
    values: [
        [32,  28,  24,  20],
        [40,  32,  28,  24],
        [44,  36,  30,  26],
        [48,  38,  32,  28],
        [46,  36,  30,  26],
        [42,  34,  28,  24],
        [38,  30,  26,  22],
        [28,  22,  18,  16],
        [12,  10,   8,   6],
    ],
    maxValue: 200,   // top of the Y axis
    gridLabels: ['200', '100', '0'],
    monthLabels: ['Apr 2025', 'May 2025'],
};

// Weekly CPC — actual CPC values per week per platform
// Each inner array = [bing, googleads, linkedin, meta]
const cpcData = {
    weeks: ['Apr W1','Apr W2','Apr W3','Apr W4','May W1','May W2','May W3','May W4','May W5','May W10','May W11','May W12','May W13'],
    values: [
        [0.275, 0.160, 0.340, 0.220],
        [0.190, 0.300, 0.225, 0.350],
        [0.310, 0.200, 0.150, 0.275],
        [0.225, 0.375, 0.250, 0.175],
        [0.350, 0.240, 0.300, 0.200],
        [0.165, 0.260, 0.210, 0.325],
        [0.290, 0.180, 0.360, 0.240],
        [0.205, 0.320, 0.190, 0.280],
        [0.330, 0.220, 0.265, 0.150],
        [0.180, 0.290, 0.235, 0.340],
        [0.365, 0.250, 0.170, 0.310],
        [0.240, 0.350, 0.280, 0.190],
        [0.270, 0.170, 0.320, 0.225],
    ],
    maxValue: 0.5,   // top of the Y axis
    gridLabels: ['0.5', '0.0'],
    monthLabels: ['Apr 2025', 'May 2025'],
};


// ============================================================
//  RENDER — Traffic by Channel (donut + SVG lines + labels)
// ============================================================
function renderChannelChart() {
    const wrap  = document.getElementById('channel-chart-wrap');
    const donut = document.getElementById('channel-donut');
    const svg   = document.getElementById('channel-lines');
    if (!wrap || !donut || !svg) return;

    // --- conic-gradient ---
    let gradient = '';
    let cumulative = 0;
    channelData.forEach((seg, i) => {
        const start = cumulative;
        const end   = cumulative + seg.value;
        gradient += `${seg.color} ${start}% ${end}%`;
        if (i < channelData.length - 1) gradient += ', ';
        cumulative = end;
    });
    donut.style.background = `conic-gradient(${gradient})`;

    // Donut geometry (must match CSS sizes)
    const cx = 140, cy = 110;   // SVG viewBox centre (280x220)
    const outerR = 74;          // half of donut width:148px
    const lineR  = 86;          // line start (just outside donut edge)
    const lineEndR = 98;        // line end (tip of connector)

    // Remove old lines and labels
    svg.innerHTML = '';
    wrap.querySelectorAll('.channel-label').forEach(el => el.remove());

    let angle = 0;
    channelData.forEach(seg => {
        const midAngle = angle + seg.value / 2;
        const rad = (midAngle / 100) * 2 * Math.PI - Math.PI / 2;

        // Line start (on donut rim)
        const x1 = cx + lineR   * Math.cos(rad);
        const y1 = cy + lineR   * Math.sin(rad);
        // Line end
        const x2 = cx + lineEndR * Math.cos(rad);
        const y2 = cy + lineEndR * Math.sin(rad);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1.toFixed(1));
        line.setAttribute('y1', y1.toFixed(1));
        line.setAttribute('x2', x2.toFixed(1));
        line.setAttribute('y2', y2.toFixed(1));
        svg.appendChild(line);

        // Label position (% of wrap dimensions 280x220, mapped to px)
        const lx = x2 / 280 * 100;
        const ly = y2 / 220 * 100;

        const label = document.createElement('div');
        label.className = 'channel-label';

        const offsetX = Math.cos(rad) >= 0 ? 1 : -1;
        const offsetY = Math.sin(rad) >= 0 ? 1 : -1;

        label.style.position   = 'absolute';
        label.style.left       = `${lx + offsetX * 1}%`;
        label.style.top        = `${ly + offsetY * 1}%`;
        label.style.transform  = Math.cos(rad) < 0 ? 'translateX(-100%)' : 'none';
        label.style.whiteSpace = 'nowrap';
        label.innerHTML = `${seg.label} <b>${seg.value.toFixed(2)}%</b>`;

        wrap.appendChild(label);
        angle += seg.value;
    });
}


// ============================================================
//  RENDER — Bar chart helper  (shared by spend + CPC)
// ============================================================
function renderBarChart({ barsId, legendId, gridlinesId, monthsId, data, barClass, gridType }) {
    const barsEl      = document.getElementById(barsId);
    const legendEl    = document.getElementById(legendId);
    const gridEl      = document.getElementById(gridlinesId);
    const monthsEl    = document.getElementById(monthsId);
    if (!barsEl) return;

    // Legend
    if (legendEl) {
        legendEl.innerHTML = adPlatforms.map(p =>
            `<span class="legend-dot-item">
                <span class="legend-dot ${p.dotClass}"></span>${p.label}
            </span>`
        ).join('');
    }

    // Gridlines
    if (gridEl) {
        gridEl.innerHTML = data.gridLabels.map(l => `<span>${l}</span>`).join('');
    }

    // Month labels
    if (monthsEl) {
        monthsEl.innerHTML = data.monthLabels.map(m => `<span>${m}</span>`).join('');
    }

    // Bars — height is expressed as % of maxValue
    barsEl.innerHTML = data.values.map(week => {
        const bars = adPlatforms.map((p, i) => {
            const pct = (week[i] / data.maxValue * 100).toFixed(1);
            return `<div class="${barClass} ${p.cssClass}" style="height:${pct}%"></div>`;
        }).join('');
        const groupClass = barClass === 'spend-bar' ? 'spend-bar-group' : 'cpc-bar-group';
        return `<div class="${groupClass}">${bars}</div>`;
    }).join('');
}


// ============================================================
//  HAMBURGER MENU
// ============================================================
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const headerNav = document.getElementById('header-nav');
    if (!hamburger) return;

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        headerNav.classList.toggle('active');
    });

    headerNav.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            hamburger.classList.remove('active');
            headerNav.classList.remove('active');
        });
    });

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.header')) {
            hamburger.classList.remove('active');
            headerNav.classList.remove('active');
        }
    });
}


// ============================================================
//  REAL-TIME TOTAL USERS TRACKER (EXCLUDING ADMIN)
// ============================================================
function initRealtimeUsersTracker() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    const dbInstance = firebase.firestore();
    const usersValEl = document.getElementById('totalUsersCount');
    if (!usersValEl) return;

    // Real-time listener for 'users' collection
    dbInstance.collection('users').onSnapshot(snapshot => {
        const uniqueUserIds = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            const email = (data.email || '').toLowerCase();
            const isAdmin = data.role === 'admin' || data.isAdmin === true || email.includes('admin');

            // Exclude Admin accounts
            if (!isAdmin) {
                uniqueUserIds.add(data.uid || doc.id);
            }
        });

        // Also check ad_campaigns for registered user IDs
        dbInstance.collection('ad_campaigns').get().then(campaignSnap => {
            campaignSnap.forEach(cdoc => {
                const cdata = cdoc.data();
                const cEmail = (cdata.userEmail || '').toLowerCase();
                const isCAdmin = cdata.role === 'admin' || cEmail.includes('admin');

                if (!isCAdmin && cdata.userId) {
                    uniqueUserIds.add(cdata.userId);
                }
            });

            const count = uniqueUserIds.size;
            usersValEl.innerText = count >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;
            console.log(`Real-Time Total Users (Excluding Admin): ${count}`);
        }).catch(() => {
            const count = uniqueUserIds.size;
            usersValEl.innerText = count >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;
        });

    }, error => {
        console.error('Error listening to users collection:', error);
    });
}


// ============================================================
//  REAL-TIME AD CLICKS & CTR TRACKER
// ============================================================
function initRealtimeClicksTracker() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    const dbInstance = firebase.firestore();
    const clicksValEl = document.getElementById('adminTotalClicks');
    const ctrValEl = document.getElementById('adminCTRVal');

    if (!clicksValEl) return;

    // Real-time listener for ad_campaigns collection clicks
    dbInstance.collection('ad_campaigns').onSnapshot(snapshot => {
        let totalClicks = 0;
        let totalImpressions = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalClicks += Number(data.clicks || 0);
            totalImpressions += Number(data.impressions || 0);
        });

        // Render Clicks KPI
        clicksValEl.innerText = totalClicks >= 1000 ? (totalClicks / 1000).toFixed(1) + 'K' : totalClicks;

        // Render CTR KPI
        if (ctrValEl) {
            const ctr = totalImpressions > 0 
                ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
                : (totalClicks > 0 ? '100.00' : '0.00');
            ctrValEl.innerText = `${ctr}%`;
        }

        console.log(`Real-Time Admin Clicks Update: ${totalClicks} total clicks`);
    }, error => {
        console.error('Error listening to ad_campaigns for clicks:', error);
    });
}


// ============================================================
//  REAL-TIME FIRESTORE SESSIONS, PURCHASES & REVENUE TRACKER
// ============================================================
function initRealtimeSessionsAndPurchasesTracker() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    const dbInstance = firebase.firestore();
    const sessionsValEl = document.getElementById('totalSessionsCount');
    const avgTimeValEl = document.getElementById('avgEngagementTime');
    const purchaseRateValEl = document.getElementById('purchaseRateVal');
    const totalPurchasesValEl = document.getElementById('totalPurchasesVal');
    const totalRevenueValEl = document.getElementById('totalRevenueVal');

    let currentSessionsCount = 0;
    let currentPurchasesCount = 0;

    function updatePurchaseRate() {
        if (purchaseRateValEl) {
            const rate = currentSessionsCount > 0 
                ? ((currentPurchasesCount / currentSessionsCount) * 100).toFixed(2) 
                : '0.00';
            purchaseRateValEl.innerText = `${rate}%`;
        }
    }

    // 1. Listen to site_sessions collection
    dbInstance.collection('site_sessions').onSnapshot(snapshot => {
        currentSessionsCount = snapshot.docs.length;
        let totalDurationSeconds = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalDurationSeconds += Number(data.durationSeconds || 0);
        });

        const avgSeconds = currentSessionsCount > 0 ? Math.round(totalDurationSeconds / currentSessionsCount) : 0;
        const formattedAvgTime = formatSecondsToHHMMSS(avgSeconds);

        if (sessionsValEl) {
            sessionsValEl.innerText = currentSessionsCount >= 1000 ? (currentSessionsCount / 1000).toFixed(1) + 'K' : currentSessionsCount;
        }

        if (avgTimeValEl) {
            avgTimeValEl.innerText = formattedAvgTime;
        }

        updatePurchaseRate();
    }, error => {
        console.error('Error listening to site_sessions:', error);
    });

    // 2. Listen to site_purchases collection
    dbInstance.collection('site_purchases').onSnapshot(snapshot => {
        currentPurchasesCount = snapshot.docs.length;
        let totalRevenue = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRevenue += Number(data.amountFCFA || 0);
        });

        if (totalPurchasesValEl) {
            totalPurchasesValEl.innerText = currentPurchasesCount >= 1000 ? (currentPurchasesCount / 1000).toFixed(1) + 'K' : currentPurchasesCount;
        }

        if (totalRevenueValEl) {
            totalRevenueValEl.innerText = totalRevenue.toLocaleString('en-US') + ' FCFA';
        }

        updatePurchaseRate();
    }, error => {
        console.error('Error listening to site_purchases:', error);
    });
}

function formatSecondsToHHMMSS(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = num => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    renderChannelChart();

    renderBarChart({
        barsId:      'spend-bars',
        legendId:    'spend-legend',
        gridlinesId: 'spend-gridlines',
        monthsId:    'spend-months',
        data:        spendData,
        barClass:    'spend-bar',
    });

    renderBarChart({
        barsId:      'cpc-bars',
        legendId:    'cpc-legend',
        gridlinesId: 'cpc-gridlines',
        monthsId:    'cpc-months',
        data:        cpcData,
        barClass:    'cpc-bar',
    });

    initHamburger();
    initRealtimeUsersTracker();
    initRealtimeClicksTracker();
    initRealtimeSessionsAndPurchasesTracker();

    const adminSignOutBtn = document.getElementById('adminSignOutBtn');
    if (adminSignOutBtn) {
        adminSignOutBtn.addEventListener('click', function () {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'signin.html';
                });
            }
        });
    }
});
