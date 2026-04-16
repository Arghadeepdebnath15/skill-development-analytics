import { STUDENTS } from './student-data.js';

function init() {
    console.log('Initializing Dribbble-Style Dashboard...');
    
    // Aggregated stats
    const totalStudents = STUDENTS.length;
    const avgGpa = (STUDENTS.reduce((acc, s) => acc + s.gpa, 0) / totalStudents).toFixed(2);
    
    // Count up animations
    animateValue('totalStudents', 0, totalStudents, 1500);
    
    // Render Charts
    renderDeptBars();
    animateSparklines();
    animatePie();
}

function animatePie() {
    const s1 = document.getElementById('pieSlice1');
    const s2 = document.getElementById('pieSlice2');
    if (!s1 || !s2) return;

    setTimeout(() => {
        // Engineering 65%
        s1.style.strokeDasharray = "65 100";
        // Applied Sci 20% (offset by the first slice)
        s2.style.strokeDasharray = "20 100";
        s2.style.strokeDashoffset = "-65";
    }, 500);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const startTime = performance.now();
    
    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
        const current = Math.floor(ease * (end - start) + start);
        obj.innerText = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function renderDeptBars() {
    const deptBars = document.getElementById('deptBars');
    if (!deptBars) return;

    // Static fake data for the "Dribbble" aesthetic benchmark
    const depts = [
        { name: 'ENG', val: 85 },
        { name: 'SCI', val: 65 },
        { name: 'BUS', val: 78 },
        { name: 'ART', val: 45 },
        { name: 'MED', val: 92 },
        { name: 'LAW', val: 55 }
    ];

    deptBars.innerHTML = depts.map(d => `
        <div style="text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div class="bar" style="height: 0%;" data-h="${d.val}%"></div>
            <span style="font-size: 0.6rem; font-weight: 800; color: var(--text-muted); opacity: 0.8;">${d.name}</span>
        </div>
    `).join('');

    // Trigger height animation
    setTimeout(() => {
        document.querySelectorAll('.bar').forEach(bar => {
            bar.style.height = bar.getAttribute('data-h');
        });
    }, 200);
}

function animateSparklines() {
    document.querySelectorAll('.sparkline path').forEach((path, idx) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        path.style.transition = `stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.2}s`;
        
        // Trigger reflow
        path.getBoundingClientRect();
        path.style.strokeDashoffset = 0;
    });
}

init();
