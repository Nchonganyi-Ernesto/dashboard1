const dashboardData = {
    visitorsLine: [40, 68, 50, 80, 87, 60, 78, 66, 70, 54, 64, 57],
    barsTop:      [12, 14, 18, 22, 28, 32, 34, 36, 33, 35, 30, 24],
    barsBottom:   [18, 20, 26, 34, 42, 48, 52, 55, 50, 53, 45, 36],
    visitorsCount:  59156,
    buyersCount:    28287,
    returningCount: 11073,
    donut: {
        buyers:      48,  
        newVisitors: 19,  
    },

    salesByMonth:     [52, 60, 56, 70, 84, 92, 108, 114, 100, 94, 80, 88],
    purchasesByMonth: [48, 56, 52, 66, 78, 86, 100, 108,  96, 88, 74, 82],
    salesTotalLabel:     '$562.6K',
    purchasesTotalLabel: '$536.5K',
};
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];


function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function renderMonthLabels(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = MONTHS.map(m => `<span>${m}</span>`).join('');
}

function renderVisitorsBuyersChart() {
    const d = dashboardData;
    const VB_W = 480, VB_H = 160;
    const n = d.visitorsLine.length;
    const xPad = 20;
    const yPad = 15;
    const step = (VB_W - xPad * 2) / (n - 1);
    const maxVal = Math.max(...d.visitorsLine);
    const minVal = Math.min(...d.visitorsLine);

    const points = d.visitorsLine.map((v, i) => ({
        x: Math.round(xPad + i * step),
        y: Math.round(mapRange(v, minVal, maxVal, VB_H - yPad, yPad)),
    }));

    
    document.getElementById('vb-line').setAttribute(
        'points', points.map(p => `${p.x},${p.y}`).join(' ')
    );

    const dotsGroup = document.getElementById('vb-dots');
    dotsGroup.innerHTML = '';
    points.forEach(p => {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p.x);
        c.setAttribute('cy', p.y);
        c.setAttribute('r', '3.5');
        c.setAttribute('fill', '#f2795a');
        dotsGroup.appendChild(c);
    });

    const barsContainer = document.getElementById('vb-bars');
    barsContainer.innerHTML = '';
    d.barsTop.forEach((topPct, i) => {
        const botPct = d.barsBottom[i];
        const group = document.createElement('div');
        group.className = 'bar-group';
        group.innerHTML = `
            <div class="bar-segment bar-segment-top"    style="height:${topPct}%"></div>
            <div class="bar-segment bar-segment-bottom" style="height:${botPct}%"></div>`;
        barsContainer.appendChild(group);
    });

    document.getElementById('vb-legend-visitors').textContent  = d.visitorsCount;
    document.getElementById('vb-legend-buyers').textContent    = d.buyersCount;
    document.getElementById('vb-legend-returning').textContent = d.returningCount;

    renderMonthLabels('vb-months');
}

function renderDonut() {
    const { buyers, newVisitors } = dashboardData.donut;
    document.getElementById('donut-chart').style.background = `conic-gradient(
        #14b8a6 0% ${buyers}%,
        #3b82f6 ${buyers}% ${buyers + newVisitors}%,
        #f2994a ${buyers + newVisitors}% 100%
    )`;

    document.getElementById('donut-value').textContent   = buyers + '%';
    document.getElementById('donut-new-pct').textContent = newVisitors + '%';
}

function renderSalesVolumeChart() {
    const d = dashboardData;
    const VB_W = 480, VB_H = 140;
    const n = d.salesByMonth.length;
    const xPad = 20;
    const yPad = 10;
    const step = (VB_W - xPad * 2) / (n - 1);
    const Y_MAX_K = 100; 

    function toY(kVal) {
        return Math.round(mapRange(kVal, 0, Y_MAX_K, VB_H - yPad, yPad));
    }

    const salesPts    = d.salesByMonth.map((v, i)    => ({ x: Math.round(xPad + i * step), y: toY(v) }));
    const purchasePts = d.purchasesByMonth.map((v, i) => ({ x: Math.round(xPad + i * step), y: toY(v) }));

    const salesStr    = salesPts.map(p => `${p.x},${p.y}`).join(' ');
    const purchaseStr = purchasePts.map(p => `${p.x},${p.y}`).join(' ');

    const areaStr = `${salesStr} ${salesPts[n - 1].x},${VB_H} ${salesPts[0].x},${VB_H}`;

    document.getElementById('sv-area').setAttribute('points', areaStr);
    document.getElementById('sv-sales-line').setAttribute('points', salesStr);
    document.getElementById('sv-purchase-line').setAttribute('points', purchaseStr);


    document.getElementById('sv-total-sales').textContent     = d.salesTotalLabel;
    document.getElementById('sv-total-purchases').textContent = d.purchasesTotalLabel;

    renderMonthLabels('sv-months');
}

function initSidebar() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar      = document.getElementById('sidebar');
    const overlay      = document.getElementById('sidebarOverlay');

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

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    overlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) closeSidebar();
        });
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
    window.addEventListener('resize',   () => { if (window.innerWidth > MOBILE_BREAKPOINT) closeSidebar(); });
}

document.addEventListener('DOMContentLoaded', () => {
    renderVisitorsBuyersChart();
    renderDonut();
    renderSalesVolumeChart();
    initSidebar();
});
