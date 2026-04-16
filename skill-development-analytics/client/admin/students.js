import { STUDENTS, DEPARTMENTS } from './student-data.js';

let filteredStudents = [...STUDENTS];
let currentSort = { key: 'name', asc: true };

function init() {
    console.log('Initializing Elite Audit Hub...');
    
    populateFilters();
    renderStudentTable(filteredStudents);
    setupInteractions();
}

function populateFilters() {
    const deptFilter = document.getElementById('deptFilter');
    if (deptFilter) {
        deptFilter.innerHTML = '<option value="">All Schools</option>' + 
            DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

function renderStudentTable(students) {
    const tableBody = document.getElementById('studentTableBody');
    const studentCount = document.getElementById('studentCount');
    const avgGd = document.getElementById('avgGd');
    const avgMip = document.getElementById('avgMip');
    const avgLsrw = document.getElementById('avgLsrw');
    
    // Stats Update (Executive Bar)
    if (studentCount) studentCount.innerText = students.length;
    if (students.length > 0) {
        const totalGd = students.reduce((acc, s) => acc + s.gd, 0);
        const totalMip = students.reduce((acc, s) => acc + s.mip, 0);
        const totalLsrw = students.reduce((acc, s) => acc + (s.va + s.qa + s.lr) / 3, 0);
        if (avgGd) avgGd.innerText = (totalGd / students.length).toFixed(1);
        if (avgMip) avgMip.innerText = (totalMip / students.length).toFixed(1);
        if (avgLsrw) avgLsrw.innerText = (totalLsrw / students.length).toFixed(1);
    }

    if (!tableBody) return;

    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 10rem; color: #94a3b8; font-weight: 800;">No management records found.</td></tr>`;
        return;
    }

    const getPillClass = (val, max) => {
        const pct = val / max;
        if (pct >= 0.7) return 'pill-high';
        if (pct >= 0.4) return 'pill-mid';
        return 'pill-low';
    };

    tableBody.innerHTML = students.map((s, idx) => {
        const scores = [
            { key: 'resume', max: 10, val: s.resume },
            { key: 'gd', max: 40, val: s.gd },
            { key: 'mip', max: 40, val: s.mip },
            { key: 'wt1', max: 20, val: s.wt1 },
            { key: 'wt2', max: 20, val: s.wt2 },
            { key: 'wt3', max: 20, val: s.wt3 },
            { key: 'va', max: 50, val: s.va },
            { key: 'qa', max: 50, val: s.qa },
            { key: 'lr', max: 50, val: s.lr }
        ];

        return `
            <tr class="anim-row" style="animation-delay: ${idx * 0.015}s">
                <td style="color: #94a3b8; font-size: 0.75rem; font-weight: 800; opacity: 0.6;">#${s.id}</td>
                <td>
                    <div class="student-name">${s.name}</div>
                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">${s.email}</div>
                </td>
                <td style="color: #64748b; font-weight: 800; font-size: 0.75rem;">${s.school}</td>
                ${scores.map(score => {
                    const cls = getPillClass(score.val, score.max);
                    return `
                        <td class="heatmap-cell">
                            <span class="score-pill ${cls}">${score.val}</span>
                        </td>
                    `;
                }).join('')}
                <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-view" onclick="window.openQuickView('${s.id}')" title="Quick View">👁️</button>
                        <button class="elite-btn" onclick="window.location.href='student-performance.html?id=${s.id}'" style="padding: 10px 15px;">ANALYZE</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupInteractions() {
    const search = document.getElementById('globalSearch');
    const schoolFilter = document.getElementById('deptFilter');
    const tierFilter = document.getElementById('tierFilter');

    if (!search) return;

    const filterHandler = () => {
        const q = search.value.toLowerCase();
        const school = schoolFilter.value;
        const tier = tierFilter.value;

        filteredStudents = STUDENTS.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
            const matchesSchool = school === "" || s.school === school;
            
            let matchesTier = true;
            if (tier === 'top') matchesTier = (s.gd > 30 && s.mip > 30);
            else if (tier === 'needs-work') matchesTier = (s.resume < 3 || s.gd < 10);
            else if (tier === 'steady') matchesTier = !((s.gd > 30 && s.mip > 30) || (s.resume < 3 || s.gd < 10));

            return matchesSearch && matchesSchool && matchesTier;
        });

        sortStudents(currentSort.key, currentSort.asc);
    };

    search.oninput = filterHandler;
    schoolFilter.onchange = filterHandler;
    tierFilter.onchange = filterHandler;

    // Sort Logic
    document.querySelectorAll('.audit-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-sort');
            currentSort.asc = (currentSort.key === key) ? !currentSort.asc : true;
            currentSort.key = key;
            sortStudents(key, currentSort.asc);
        });
    });

    // 📥 Excel-Compatible CSV Export
    const exportBtn = document.getElementById('exportCsv');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const headers = ['ID', 'Student Name', 'School', 'CV (Resume)', 'GD Score', 'MIP Score', 'Weekly Test 1', 'Weekly Test 2', 'Weekly Test 3', 'Verbal Ability', 'Quantitative Aptitude', 'Logical Reasoning'];
            
            const rows = filteredStudents.map(s => [
                s.id, s.name, s.school, s.resume, s.gd, s.mip, s.wt1, s.wt2, s.wt3, s.va, s.qa, s.lr
            ]);

            const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "Sharda_Skills_Audit_Report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
    }
}

function sortStudents(key, asc) {
    filteredStudents.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else {
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
        }
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
    });
    renderStudentTable(filteredStudents);
}

window.openQuickView = (id) => {
    const student = STUDENTS.find(s => s.id === id);
    if (!student) return;

    // Header & Basic Stats
    document.getElementById('drawerName').innerText = student.name;
    document.getElementById('drawerAvatar').src = student.profileImage;
    document.getElementById('drawerMip').innerText = student.mip;
    document.getElementById('drawerGd').innerText = student.gd;
    document.getElementById('drawerFeedback').innerText = student.softSkills?.feedback || "Evaluation in progress. Focus on quantitative benchmarks and verbal consistency.";
    
    // LSRW Bar Mapping (Normalized to 100%)
    const lsrwData = [
        { label: 'L', val: (student.va / 50) * 100 },
        { label: 'S', val: (student.gd / 40) * 100 },
        { label: 'R', val: (student.va / 50) * 100 },
        { label: 'W', val: ((student.wt1 + student.wt2 + student.wt3) / 60) * 100 }
    ];

    const lsrwBars = document.getElementById('lsrwBars');
    lsrwBars.innerHTML = lsrwData.map(d => `
        <div class="lsrw-item">
            <span class="lsrw-label">${d.label}</span>
            <div class="lsrw-track">
                <div class="lsrw-fill" style="width: 0%"></div>
            </div>
        </div>
    `).join('');

    // Trigger fill animation
    setTimeout(() => {
        const fills = lsrwBars.querySelectorAll('.lsrw-fill');
        lsrwData.forEach((d, i) => {
            if (fills[i]) fills[i].style.width = `${Math.min(d.val, 100)}%`;
        });
    }, 100);

    // Radar Chart Logic
    const radarData = [
        { axis: "Confidence", value: (student.gd / 40) * 100 },
        { axis: "Clarity", value: (student.va / 50) * 100 },
        { axis: "Logic", value: (student.lr / 50) * 100 },
        { axis: "Tonality", value: (student.mip / 40) * 100 },
        { axis: "Readiness", value: (student.qa / 50) * 100 }
    ];

    drawRadarChart(radarData);

    // Comparative Benchmarking (Student vs Batch Average)
    const avgGd = STUDENTS.reduce((acc, s) => acc + s.gd, 0) / STUDENTS.length;
    const avgMip = STUDENTS.reduce((acc, s) => acc + s.mip, 0) / STUDENTS.length;
    const avgLr = STUDENTS.reduce((acc, s) => acc + s.lr, 0) / STUDENTS.length;

    const comparisonData = [
        { label: 'GD Score', student: (student.gd / 40) * 100, avg: (avgGd / 40) * 100 },
        { label: 'MIP Readiness', student: (student.mip / 40) * 100, avg: (avgMip / 40) * 100 },
        { label: 'Logical Index', student: (student.lr / 50) * 100, avg: (avgLr / 50) * 100 }
    ];

    drawComparisonBarChart(comparisonData);

    // Weekly Progress Trend
    const trendData = [
        { label: 'WT1', val: (student.wt1 / 20) * 100 },
        { label: 'WT2', val: (student.wt2 / 20) * 100 },
        { label: 'WT3', val: (student.wt3 / 20) * 100 }
    ];

    drawTrendLineChart(trendData);
    
    document.getElementById('quickViewDrawer').classList.add('open');
};

function drawComparisonBarChart(data) {
    const container = document.getElementById('comparisonBars');
    container.innerHTML = data.map(d => `
        <div class="compare-item">
            <div class="compare-label">
                <span>${d.label}</span>
                <span>${Math.round(d.student)}% vs ${Math.round(d.avg)}%</span>
            </div>
            <div class="bar-stack">
                <div class="bar-batch" style="width: ${d.avg}%"></div>
                <div class="bar-student" style="width: 0%"></div>
            </div>
        </div>
    `).join('');

    setTimeout(() => {
        const studentBars = container.querySelectorAll('.bar-student');
        data.forEach((d, i) => {
            if (studentBars[i]) studentBars[i].style.width = `${d.student}%`;
        });
    }, 100);
}

function drawTrendLineChart(data) {
    const width = 400;
    const height = 140;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const points = data.map((d, i) => {
        const x = padding + (i * (chartWidth / (data.length - 1)));
        const y = height - padding - (d.val / 100 * chartHeight);
        return { x, y, label: d.label };
    });

    const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    
    const svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <!-- Grid Lines -->
            <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" stroke="#f1f5f9" stroke-width="1" />
            
            <!-- Trend Path -->
            <path d="${pathD}" class="trend-path" />
            
            <!-- Data Points -->
            ${points.map(p => `
                <circle cx="${p.x}" cy="${p.y}" r="4" class="trend-point" />
                <text x="${p.x}" y="${height - 5}" font-size="8" font-weight="900" text-anchor="middle" fill="#94a3b8">${p.label}</text>
            `).join('')}
        </svg>
    `;

    document.getElementById('trendChart').innerHTML = svg;
}

function drawRadarChart(data) {
    const size = 200;
    const center = size / 2;
    const radius = 80;
    const angleStep = (Math.PI * 2) / data.length;

    let axesHtml = "";
    let dataPoints = [];

    data.forEach((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        
        // Grid Axis
        axesHtml += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#eef2f6" stroke-width="1" />`;
        
        // Data Multiplier
        const valR = (d.value / 100) * radius;
        const dx = center + valR * Math.cos(angle);
        const dy = center + valR * Math.sin(angle);
        dataPoints.push(`${dx},${dy}`);

        // Labels
        const lx = center + (radius + 15) * Math.cos(angle);
        const ly = center + (radius + 15) * Math.sin(angle);
        axesHtml += `<text x="${lx}" y="${ly}" font-size="8" font-weight="900" text-anchor="middle" fill="#94a3b8">${d.axis}</text>`;
    });

    const polygon = `<polygon points="${dataPoints.join(' ')}" fill="rgba(68, 138, 255, 0.2)" stroke="#448aff" stroke-width="2" />`;
    
    const svg = `
        <svg width="${size}" height="${size}" class="radar-svg">
            ${axesHtml}
            ${polygon}
        </svg>
    `;

    document.getElementById('drawerChart').innerHTML = svg;
}

window.closeQuickView = () => {
    document.getElementById('quickViewDrawer').classList.remove('open');
};

init();
