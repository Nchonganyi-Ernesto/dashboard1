// ============================================================
//  DASHBOARD DATA  — edit these objects to change the charts
// ============================================================

// Traffic by channel (populates in real-time from search_events)
const channelData = [
    { label: 'mobile search',      value: 30.00, color: '#f2795a' },
    { label: 'desktop search',     value: 30.00, color: '#17b8b0' },
    { label: 'featured events',    value: 20.00, color: '#7c5cd0' },
    { label: 'suggestions & tags', value: 20.00, color: '#4ade80' },
];

// Native ksearch Daily Ad Spend Category
const ksearchDailySpendCategory = [
    { key: 'total_spend', label: 'Total Daily Ad Spend (FCFA)', cssClass: 'bar-daily-spend', dotClass: 'legend-dot-total-spend' }
];

// External Ad platforms shared by CPC chart
const adPlatforms = [
    { key: 'bing',      label: 'Bing ads',     cssClass: 'bar-bing',       dotClass: 'legend-dot-bing'       },
    { key: 'googleads', label: 'Google ads',   cssClass: 'bar-googleads',  dotClass: 'legend-dot-googleads'  },
    { key: 'linkedin',  label: 'Linkedin ads', cssClass: 'bar-linkedinads',dotClass: 'legend-dot-linkedinads'},
    { key: 'meta',      label: 'Meta ads',     cssClass: 'bar-metaads',    dotClass: 'legend-dot-metaads'    },
];

// Single-bar daily ad spend dataset — Days of the Week (Mon - Sun) in FCFA
// Computed from Clicks (300 FCFA/click) + Impressions (0.5 FCFA/view)
// Single-bar daily ad spend dataset — Days of the Week (Mon - Sun) in FCFA
// Computed dynamically from Clicks (300 FCFA/click) + Impressions (0.5 FCFA/view)
const spendData = {
    dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [[0], [0], [0], [0], [0], [0], [0]],
    breakdowns: [
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 },
        { clicksCost: 0, impressionsCost: 0 }
    ],
    maxValue: 1000,
    gridLabels: ['1,000 FCFA', '500 FCFA', '0 FCFA'],
};

// Native ksearch Daily Click Revenue Category
const ksearchDailyCpcCategory = [
    { key: 'click_revenue', label: 'Total Click Revenue (FCFA)', cssClass: 'bar-daily-cpc', dotClass: 'legend-dot-daily-cpc' }
];

// Single-bar daily click revenue dataset — Days of the Week (Mon - Sun) in FCFA
// Computed dynamically from Clicks (300 FCFA/click)
const cpcData = {
    dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [[0], [0], [0], [0], [0], [0], [0]],
    breakdowns: [
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 },
        { clicksCount: 0, revenue: 0 }
    ],
    maxValue: 1000,
    gridLabels: ['1,000 FCFA', '500 FCFA', '0 FCFA'],
};




// ============================================================
//  RENDER — Traffic by Channel (donut + SVG lines + labels)
// ============================================================
function renderChannelChart(customData) {
    const wrap  = document.getElementById('channel-chart-wrap');
    const donut = document.getElementById('channel-donut');
    const svg   = document.getElementById('channel-lines');
    if (!wrap || !donut || !svg) return;

    const dataToRender = customData !== undefined ? customData : channelData;

    // Remove old lines and labels
    svg.innerHTML = '';
    wrap.querySelectorAll('.channel-label, .empty-channel-msg').forEach(el => el.remove());

    if (!dataToRender || dataToRender.length === 0) {
        donut.style.background = 'rgba(255,255,255,0.08)';
        const msg = document.createElement('div');
        msg.className = 'empty-channel-msg';
        msg.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:rgba(255,255,255,0.4); font-size:11px; font-weight:500; text-align:center; white-space:nowrap; pointer-events:none;';
        msg.innerText = 'No Search Events Yet';
        wrap.appendChild(msg);
        return;
    }

    // --- conic-gradient ---
    let gradient = '';
    let cumulative = 0;
    dataToRender.forEach((seg, i) => {
        const start = cumulative;
        const end   = cumulative + seg.value;
        gradient += `${seg.color} ${start}% ${end}%`;
        if (i < dataToRender.length - 1) gradient += ', ';
        cumulative = end;
    });
    donut.style.background = `conic-gradient(${gradient})`;

    // Donut geometry (must match CSS sizes)
    const cx = 140, cy = 110;   // SVG viewBox centre (280x220)
    const outerR = 74;          // half of donut width:148px
    const lineR  = 86;          // line start (just outside donut edge)
    const lineEndR = 98;        // line end (tip of connector)

    let angle = 0;
    dataToRender.forEach(seg => {
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
//  REAL-TIME SEARCH EVENTS CHANNEL TRACKER
// ============================================================
function initRealtimeChannelTracker() {
    const dbInstance = (typeof getDb === 'function' ? getDb() : null) || (typeof db !== 'undefined' && db ? db : null) || (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function' ? firebase.firestore() : null);
    if (!dbInstance) return;

    dbInstance.collection('search_events').onSnapshot(snapshot => {
        if (snapshot.empty) {
            console.log('[ksearch Admin] No search events in database yet. Showing empty state.');
            renderChannelChart([]);
            return;
        }

        const counts = {
            mobile_search: 0,
            desktop_search: 0,
            featured_events: 0,
            suggestions_tags: 0
        };

        let total = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const ch = data.channel || '';
            const dev = data.device || '';

            if (ch === 'mobile_search' || dev === 'mobile') {
                counts.mobile_search++;
            } else if (ch === 'featured_events' || ch === 'trending_insights') {
                counts.featured_events++;
            } else if (ch === 'suggestions_tags' || ch === 'category_tag' || ch === 'recent_chip') {
                counts.suggestions_tags++;
            } else {
                counts.desktop_search++;
            }

            total++;
        });

        if (total === 0) {
            renderChannelChart([]);
            return;
        }

        const liveChannelData = [
            { label: 'mobile search',      value: (counts.mobile_search / total) * 100,      color: '#f2795a' },
            { label: 'desktop search',     value: (counts.desktop_search / total) * 100,     color: '#17b8b0' },
            { label: 'featured events',    value: (counts.featured_events / total) * 100,    color: '#7c5cd0' },
            { label: 'suggestions & tags', value: (counts.suggestions_tags / total) * 100,  color: '#4ade80' },
        ].filter(seg => seg.value > 0);

        renderChannelChart(liveChannelData);
        console.log(`[ksearch Admin] Real-Time Channel Donut Chart updated with ${total} live search events!`, liveChannelData);
    }, err => {
        console.error('Error listening to search_events:', err);
    });
}



// ============================================================
//  RENDER — Bar chart helper  (shared by spend + CPC)
// ============================================================
// ============================================================
//  RENDER — Bar chart helper  (shared by spend + CPC)
// ============================================================
function renderBarChart({ barsId, legendId, gridlinesId, monthsId, data, barClass, categories }) {
    const barsEl      = document.getElementById(barsId);
    const legendEl    = document.getElementById(legendId);
    const gridEl      = document.getElementById(gridlinesId);
    const monthsEl    = document.getElementById(monthsId);
    if (!barsEl || !data) return;

    const catsToUse = categories || (barClass === 'spend-bar' ? ksearchDailySpendCategory : ksearchDailyCpcCategory);

    // Legend
    if (legendEl) {
        legendEl.innerHTML = catsToUse.map(p =>
            `<span class="legend-dot-item">
                <span class="legend-dot ${p.dotClass}"></span>${p.label}
            </span>`
        ).join('');
    }

    // Gridlines
    if (gridEl && data.gridLabels) {
        gridEl.innerHTML = data.gridLabels.map(l => `<span>${l}</span>`).join('');
    }

    // Days / Month labels
    if (monthsEl) {
        const labels = data.dayLabels || data.monthLabels || data.weeks || [];
        monthsEl.innerHTML = labels.map(m => `<span>${m}</span>`).join('');
    }

    // Bars — height is expressed as % of maxValue
    if (data.values) {
        barsEl.innerHTML = data.values.map((groupValues, idx) => {
            const dayName = (data.dayLabels || data.monthLabels || data.weeks || [])[idx] || `Day ${idx + 1}`;
            const val = Array.isArray(groupValues) ? groupValues[0] : (groupValues || 0);
            const safeVal = Number(val || 0);
            const pct = Math.min(100, Math.max(0, (safeVal / (data.maxValue || 1) * 100))).toFixed(1);

            const bd = (data.breakdowns && data.breakdowns[idx]) ? data.breakdowns[idx] : null;

            let tooltipHTML = '';

            if (barClass === 'spend-bar') {
                const clicksCost = bd && bd.clicksCost !== undefined ? Number(bd.clicksCost) : 0;
                const impCost = bd && bd.impressionsCost !== undefined ? Number(bd.impressionsCost) : 0;
                const clickText = `<br><span style="font-size:10px; color:#cbd5e1;">Clicks: ${clicksCost.toLocaleString()} FCFA</span>`;
                const impText = `<br><span style="font-size:10px; color:#cbd5e1;">Views: ${impCost.toLocaleString()} FCFA</span>`;
                tooltipHTML = `
                    <div class="spend-tooltip">
                        <strong>${dayName}: ${safeVal.toLocaleString()} FCFA</strong>
                        ${clickText}${impText}
                    </div>
                `;
            } else {
                const count = bd && bd.clicksCount !== undefined ? Number(bd.clicksCount) : 0;
                tooltipHTML = `
                    <div class="spend-tooltip">
                        <strong>${dayName} Click Revenue: ${safeVal.toLocaleString()} FCFA</strong>
                        <br><span style="font-size:10px; color:#cbd5e1;">${count} Click${count === 1 ? '' : 's'} @ 300 FCFA/click</span>
                    </div>
                `;
            }

            const bars = catsToUse.map(p => {
                return `<div class="${barClass} ${p.cssClass}" style="height:${pct}%" title="${dayName}: ${safeVal.toLocaleString()} FCFA"></div>`;
            }).join('');

            const groupClass = barClass === 'spend-bar' ? 'spend-bar-group' : 'cpc-bar-group';

            return `
                <div class="${groupClass}" data-day="${dayName}">
                    ${bars}
                    ${tooltipHTML}
                </div>
            `;
        }).join('');
    }

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
        console.warn('Firestore users listener error (check security rules):', error.message);
        if (usersValEl) usersValEl.innerText = '0';
    });

}


// Global state variables for ROAS real-time sync
let currentTotalRevenue = 0;
let currentAdDeliveredCost = 0;

function updateROAS() {
    const roasValEl = document.getElementById('adminROASVal');
    if (!roasValEl) return;

    if (currentAdDeliveredCost > 0) {
        const roas = ((currentTotalRevenue / currentAdDeliveredCost) * 100).toFixed(2);
        roasValEl.innerText = `${roas}%`;
    } else {
        roasValEl.innerText = currentTotalRevenue > 0 ? '100.00%' : '0.00%';
    }
}

// ============================================================
//  REAL-TIME AD IMPRESSIONS, CLICKS, CTR, CPM & CPC TRACKER
// ============================================================
function initRealtimeAdMetricsTracker() {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    const dbInstance = firebase.firestore();
    const impressionsValEl = document.getElementById('adminTotalImpressions');
    const clicksValEl = document.getElementById('adminTotalClicks');
    const ctrValEl = document.getElementById('adminCTRVal');
    const cpmValEl = document.getElementById('adminCPMVal');
    const cpcValEl = document.getElementById('adminCPCVal');
    const tableBodyEl = document.getElementById('adminAdSourceTableBody');

    // Real-time listener for ad_campaigns collection
    dbInstance.collection('ad_campaigns').onSnapshot(snapshot => {
        let totalClicks = 0;
        let totalImpressions = 0;
        let totalSpend = 0;
        const campaigns = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const impressions = Number(data.impressions || 0);
            const clicks = Number(data.clicks || 0);
            const budget = Number(data.budget || 0);

            totalImpressions += impressions;
            totalClicks += clicks;
            totalSpend += budget;

            campaigns.push({
                id: doc.id,
                name: data.campaignName || 'Untitled Campaign',
                budget: budget,
                impressions: impressions,
                clicks: clicks
            });
        });

        // 1. Render Impressions KPI
        if (impressionsValEl) {
            impressionsValEl.innerText = totalImpressions >= 1000 
                ? (totalImpressions / 1000).toFixed(1) + 'K' 
                : totalImpressions;
        }

        // 2. Render Clicks KPI
        if (clicksValEl) {
            clicksValEl.innerText = totalClicks >= 1000 
                ? (totalClicks / 1000).toFixed(1) + 'K' 
                : totalClicks;
        }

        // 3. Render CTR KPI
        if (ctrValEl) {
            let rawCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
            if (rawCtr > 100) rawCtr = 100; // Cap at 100% for realistic metrics
            ctrValEl.innerText = `${rawCtr.toFixed(2)}%`;
        }

        // 4. Dynamic Impression Cost KPI based on live database impressions (500 FCFA per 1,000 impressions = 0.5 FCFA per view)
        const impressionCost = totalImpressions * 0.5;

        if (cpmValEl) {
            cpmValEl.innerText = `${impressionCost.toFixed(2)} FCFA`;
        }

        // 5. Dynamic CPC KPI based on live database clicks (300 FCFA per click)
        const clickCost = totalClicks * 300;

        if (cpcValEl) {
            cpcValEl.innerText = `${clickCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA`;
        }

        // Update delivered ad cost for ROAS
        currentAdDeliveredCost = impressionCost + clickCost;
        updateROAS();

        // 6. Compute Real-Time Daily Ad Spend & Daily Click Revenue Buckets from live campaigns
        const daySpendBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const clickCostBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const impCostBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const clickCountBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        snapshot.forEach(doc => {
            const data = doc.data();
            const impressions = Number(data.impressions || 0);
            const clicks = Number(data.clicks || 0);

            let dayIndex = 1; // Default Mon
            if (data.createdAt && data.createdAt.seconds) {
                dayIndex = new Date(data.createdAt.seconds * 1000).getDay();
            } else if (data.createdAt instanceof Date) {
                dayIndex = data.createdAt.getDay();
            }
            const dayKey = dayKeys[dayIndex] || 'Mon';

            const cCost = clicks * 300;
            const iCost = impressions * 0.5;

            clickCountBuckets[dayKey] += clicks;
            clickCostBuckets[dayKey] += cCost;
            impCostBuckets[dayKey] += iCost;
            daySpendBuckets[dayKey] += (cCost + iCost);
        });

        const liveDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // --- Render Daily Ad Spend Chart (Real-Time Only) ---
        const maxSpendInWeek = Math.max(...liveDays.map(d => daySpendBuckets[d] || 0), 1000);
        const dynamicSpendMax = Math.ceil(maxSpendInWeek / 1000) * 1000 || 1000;

        spendData.values = liveDays.map(d => [daySpendBuckets[d] || 0]);
        spendData.breakdowns = liveDays.map(d => ({
            clicksCost: clickCostBuckets[d] || 0,
            impressionsCost: impCostBuckets[d] || 0
        }));
        spendData.maxValue = dynamicSpendMax;
        spendData.gridLabels = [
            `${dynamicSpendMax.toLocaleString()} FCFA`,
            `${Math.round(dynamicSpendMax / 2).toLocaleString()} FCFA`,
            '0 FCFA'
        ];

        renderBarChart({
            barsId: 'spend-bars',
            legendId: 'spend-legend',
            gridlinesId: 'spend-gridlines',
            monthsId: 'spend-months',
            data: spendData,
            barClass: 'spend-bar',
            categories: ksearchDailySpendCategory
        });

        // --- Render Daily Click Revenue Chart (Real-Time Only) ---
        const maxClickRevInWeek = Math.max(...liveDays.map(d => clickCostBuckets[d] || 0), 1000);
        const dynamicClickMax = Math.ceil(maxClickRevInWeek / 1000) * 1000 || 1000;

        cpcData.values = liveDays.map(d => [clickCostBuckets[d] || 0]);
        cpcData.breakdowns = liveDays.map(d => ({
            clicksCount: clickCountBuckets[d] || 0,
            revenue: clickCostBuckets[d] || 0
        }));
        cpcData.maxValue = dynamicClickMax;
        cpcData.gridLabels = [
            `${dynamicClickMax.toLocaleString()} FCFA`,
            `${Math.round(dynamicClickMax / 2).toLocaleString()} FCFA`,
            '0 FCFA'
        ];

        renderBarChart({
            barsId: 'cpc-bars',
            legendId: 'cpc-legend',
            gridlinesId: 'cpc-gridlines',
            monthsId: 'cpc-months',
            data: cpcData,
            barClass: 'cpc-bar',
            categories: ksearchDailyCpcCategory
        });


        // 7. Render Real-Time Ad Source Data Table

        if (tableBodyEl && campaigns.length > 0) {
            tableBodyEl.innerHTML = campaigns.map(c => {
                const campaignImpressionCost = (c.impressions || 0) * 0.5;
                const campaignClickCost = (c.clicks || 0) * 300;
                const cpc = `${campaignClickCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FCFA`;
                const cpm = `${campaignImpressionCost.toFixed(2)} FCFA`;
                let rowCtrRaw = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                if (rowCtrRaw > 100) rowCtrRaw = 100;
                const ctr = `${rowCtrRaw.toFixed(2)}%`;
                const impFormatted = c.impressions >= 1000 ? (c.impressions / 1000).toFixed(1) + 'K' : c.impressions;
                const clicksFormatted = c.clicks >= 1000 ? (c.clicks / 1000).toFixed(1) + 'K' : c.clicks;

                return `
                    <tr>
                        <td class="col-source"><span class="expand-icon">+</span>${escapeHtml(c.name)}</td>
                        <td><span class="cell-pill pill-purple-4">${c.budget.toLocaleString()}</span></td>
                        <td><span class="cell-pill pill-blue-3">${impFormatted}</span></td>
                        <td><span class="cell-pill pill-green-3">${clicksFormatted}</span></td>
                        <td><span class="cell-pill pill-gray-1">${cpc}</span></td>
                        <td><span class="cell-pill pill-pink-3">${cpm}</span></td>
                        <td><span class="cell-pill pill-teal-2">${ctr}</span></td>
                    </tr>
                `;
            }).join('');
        }

        console.log(`Real-Time Admin Ad Metrics Updated: ${totalImpressions} impressions, ${totalClicks} clicks`);
    }, error => {
        console.error('Error listening to ad_campaigns for ad metrics:', error);
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

    // 1. Listen to site_sessions collection (Homepage Ad Sessions Only)
    dbInstance.collection('site_sessions').onSnapshot(snapshot => {
        let validHomepageSessions = 0;
        let totalDurationSeconds = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.src === 'homepage_ad' || data.visitedAd || data.adId) {
                validHomepageSessions++;
                totalDurationSeconds += Number(data.durationSeconds || 0);
            }
        });

        currentSessionsCount = validHomepageSessions;
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

    // 2. Listen to site_purchases collection (Homepage Ad Purchases Only)
    dbInstance.collection('site_purchases').onSnapshot(snapshot => {
        let validHomepagePurchases = 0;
        let totalRevenue = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.src === 'homepage_ad' || data.src === 'direct_site' || data.sessionId || data.campaignId) {
                validHomepagePurchases++;
                totalRevenue += Number(data.amountFCFA || data.amount || 0);
            }
        });

        currentPurchasesCount = validHomepagePurchases;
        currentTotalRevenue = totalRevenue;

        if (totalPurchasesValEl) {
            totalPurchasesValEl.innerText = currentPurchasesCount >= 1000 ? (currentPurchasesCount / 1000).toFixed(1) + 'K' : currentPurchasesCount;
        }

        if (totalRevenueValEl) {
            totalRevenueValEl.innerText = totalRevenue.toLocaleString('en-US') + ' FCFA';
        }

        updatePurchaseRate();
        updateROAS();
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
//  INIT & UTILITIES
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

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
    initRealtimeAdMetricsTracker();
    initRealtimeSessionsAndPurchasesTracker();
    initRealtimeChannelTracker();

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

