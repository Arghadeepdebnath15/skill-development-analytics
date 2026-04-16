import { STUDENTS } from './student-data.js';

let currentHubMetric = 'gd';
let currentHubView = 'section';

function init() {
    console.log('Initializing Enhanced Performance Dashboard...');
    
    // Render Analytics Charts
    renderCompetencyChart();
    renderProgressionChart();
    renderProgressionHub();
    
    // Animate static elements
    animateValue('totalStudents', 0, 1957, 1500); // Updated to 1957 from screenshot
    animateSparklines();

    // Event Listeners for Hub Toggles
    document.querySelectorAll('#metricToggle .toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#metricToggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHubMetric = btn.dataset.metric;
            renderProgressionHub();
        };
    });

    document.querySelectorAll('#viewToggle .toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#viewToggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHubView = btn.dataset.view;
            renderProgressionHub();
        };
    });
}

function animateSparklines() {
    document.querySelectorAll('.sparkline path').forEach((path, idx) => {
        const length = path.getTotalLength();
        if (length === 0) return;
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.transition = `stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.2}s`;
        
        // Trigger reflow
        path.getBoundingClientRect();
        path.style.strokeDashoffset = 0;
    });
}

function renderProgressionHub() {
    const container = document.getElementById('progressionHubChart');
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 350;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate Section Averages for current metric
    const semesters = Array.from({ length: 10 }, (_, i) => i + 1);
    const sectionAvg = semesters.map((_, semIdx) => {
        const sum = STUDENTS.reduce((acc, s) => acc + s.progression[currentHubMetric][semIdx], 0);
        return sum / STUDENTS.length;
    });

    // Mock data for "Top Student" or "Comparison"
    const compareData = semesters.map((_, semIdx) => {
        if (currentHubView === 'student') {
            // Find max score in current semester
            return Math.max(...STUDENTS.map(s => s.progression[currentHubMetric][semIdx]));
        } else {
            // Random variation for section benchmark
            return sectionAvg[semIdx] * (0.8 + Math.random() * 0.4);
        }
    });

    const maxVal = Math.max(...sectionAvg, ...compareData, 10);
    const yScale = chartHeight / (maxVal * 1.1);
    const xScale = chartWidth / (semesters.length - 1);

    const getPoints = (data) => data.map((d, i) => `${padding + i * xScale},${height - padding - d * yScale}`).join(' ');

    const sectionPoints = getPoints(sectionAvg);
    const comparePoints = getPoints(compareData);

    let gridHtml = "";
    semesters.forEach((sem, i) => {
        const x = padding + i * xScale;
        gridHtml += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="rgba(255,255,255,0.03)" />`;
        gridHtml += `<text x="${x}" y="${height - 20}" font-size="9" font-weight="800" text-anchor="middle" fill="var(--text-muted)">Sem ${sem}</text>`;
    });

    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            ${gridHtml}
            
            <!-- Section Avg Line -->
            <path d="M ${sectionPoints}" fill="none" stroke="var(--primary-light)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
                <animate attributeName="stroke-dasharray" from="0,${chartWidth * 2}" to="${chartWidth * 2},0" dur="1.5s" />
            </path>
            
            <!-- Comparison Line -->
            <path d="M ${comparePoints}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="5,5" stroke-linecap="round" />
            
            <!-- Points -->
            ${sectionAvg.map((d, i) => `<circle cx="${padding + i * xScale}" cy="${height - padding - d * yScale}" r="4" fill="var(--primary-light)" stroke="white" stroke-width="2" />`).join('')}
        </svg>
    `;
}


function renderCompetencyChart() {
    const container = document.getElementById('competencyChart');
    if (!container) return;

    const sections = ['BT VI-B', 'CSE VI-J', 'CSE VI-L', 'ET VI-B', 'BS VI-B', 'LLB VI-B', 'ME VI-A', 'BCA VI-C', 'BBA VI-B'];
    const gdData = [18, 26, 21, 19, 15, 26, 18, 22, 23];
    const mipData = [23, 27, 18, 13, 22, 23, 11, 14, 18];

    const width = container.clientWidth || 600;
    const height = 250;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = 10;
    const groupGap = chartWidth / sections.length;

    let barsHtml = "";
    let labelsHtml = "";

    sections.forEach((s, i) => {
        const xBase = padding + i * groupGap + groupGap / 4;
        const gdH = (gdData[i] / 30) * chartHeight;
        const mipH = (mipData[i] / 30) * chartHeight;

        // GD Bar
        barsHtml += `
            <rect x="${xBase}" y="${height - padding - gdH}" width="${barWidth}" height="${gdH}" fill="var(--primary)" rx="4" class="chart-bar">
                <animate attributeName="height" from="0" to="${gdH}" dur="1s" fill="freeze" />
                <animate attributeName="y" from="${height - padding}" to="${height - padding - gdH}" dur="1s" fill="freeze" />
            </rect>
        `;

        // MIP Bar
        barsHtml += `
            <rect x="${xBase + barWidth + 4}" y="${height - padding - mipH}" width="${barWidth}" height="${mipH}" fill="#fbbf24" rx="4" class="chart-bar">
                <animate attributeName="height" from="0" to="${mipH}" dur="1.2s" fill="freeze" />
                <animate attributeName="y" from="${height - padding}" to="${height - padding - mipH}" dur="1.2s" fill="freeze" />
            </rect>
        `;

        labelsHtml += `<text x="${xBase + barWidth}" y="${height - 10}" font-size="7" font-weight="800" text-anchor="middle" fill="var(--text-muted)">${s}</text>`;
    });

    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
            <!-- Y-Axis Grid Lines -->
            <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.05)" />
            <line x1="${padding}" y1="${padding + chartHeight / 2}" x2="${width - padding}" y2="${padding + chartHeight / 2}" stroke="rgba(255,255,255,0.05)" />
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />
            
            ${barsHtml}
            ${labelsHtml}
            
            <text x="${padding - 10}" y="${height - padding}" font-size="7" text-anchor="end" fill="var(--text-muted)">0</text>
            <text x="${padding - 10}" y="${padding + chartHeight / 2}" font-size="7" text-anchor="end" fill="var(--text-muted)">15</text>
            <text x="${padding - 10}" y="${padding}" font-size="7" text-anchor="end" fill="var(--text-muted)">30</text>
        </svg>
    `;
}

function renderProgressionChart() {
    const container = document.getElementById('progressionChart');
    if (!container) return;

    const sections = ['BT VI-B', 'CSE VI-J', 'CSE VI-L', 'ET VI-B', 'BS VI-B', 'LLB VI-B', 'ME VI-A'];
    const scores = [4, 6, 10, 5, 8, 1, 7, 3]; // approx from image curve

    const width = container.clientWidth || 500;
    const height = 250;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const step = chartWidth / (scores.length - 1);

    let points = [];
    scores.forEach((s, i) => {
        const x = padding + i * step;
        const y = (height - padding) - (s / 12) * chartHeight;
        points.push(`${x},${y}`);
    });

    const pathD = `M ${points.join(' L ')}`;
    let dotsHtml = "";
    sections.forEach((s, i) => {
        if (points[i]) {
            const [x, y] = points[i].split(',');
            dotsHtml += `<circle cx="${x}" cy="${y}" r="4" fill="var(--primary)" stroke="white" stroke-width="2" />`;
            dotsHtml += `<text x="${x}" y="${height - 10}" font-size="7" font-weight="800" text-anchor="middle" fill="var(--text-muted)">${s}</text>`;
        }
    });

    container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
             <path d="${pathD}" fill="none" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 1000; stroke-dashoffset: 1000;">
                <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="2s" fill="freeze" />
             </path>
             ${dotsHtml}
        </svg>
    `;
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const startTime = performance.now();
    
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * (end - start) + start);
        obj.innerText = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

init();

