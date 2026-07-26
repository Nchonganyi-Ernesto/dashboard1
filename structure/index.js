const dashboardData ={
    borderline:[48,52,30,60,70,28,30,69,30,35,56],
    bottomBar:[18,20,20,10,30,28,30,45,50,60,18,12],
    topBar:[12,30,25,30,43,33,10,25,30,20,30,12,40],
    visitorsCount:[59156],
    buyersCount:[28287],
    reviewsCount:[11073],

}
const Month=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function mapRange(value, inMin, inMax, outMin, outMax) {
return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
};
 function renderVisitorsChart(){
    const d = dashboardData;
    document.getElementById('vb-legend-visitors').innerHTML = d.visitorsCount;
    document.getElementById('vb-legend-buyers').innerHTML = d.buyersCount;
    document.getElementById('vb-legend-returning').innerHTML = d.reviewsCount;
    const width=480;
    const height=160;
    const n= d.borderline.length;
    const xpadding= 25;
    const ypadding= 20;
    const step = ((width-xpadding*2)/(n-1));
    const maxVal = Math.max(...d.borderline);  
    const minVal = Math.min(...d.borderline);  
    const barContainer = document.getElementById('vb-bars');
    barContainer.innerHTML='';
    for (let i=0;i<n;i++){
        const barHeight = mapRange(d.borderline[i],minVal,maxVal,0,height-ypadding*2);
        const bar = document.createElement('div');
        bar.classList.add('vb-bar');
        bar.style.left = `${xpadding+i*step}px`;
        bar.style.height = `${barHeight}px`;
        barContainer.appendChild(bar);
    }
    

 }
 renderVisitorsChart();
