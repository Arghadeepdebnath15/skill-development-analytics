import { STUDENTS, DEPARTMENTS } from './student-data.js';

let filteredStudents = [...STUDENTS];

function init() {
    console.log('Initializing Student Audit Table...');
    
    if (!STUDENTS || STUDENTS.length === 0) {
        console.error('Critical Error: No student data found.');
        return;
    }

    populateDeptFilter();
    renderStudentTable(filteredStudents);
    setupFilters();
}

function populateDeptFilter() {
    const filter = document.getElementById('deptFilter');
    if (!filter) return;
    
    filter.innerHTML = '<option value="">All schools</option>' + 
        DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('');
}

function renderStudentTable(students) {
    const tableBody = document.getElementById('studentTableBody');
    const studentCount = document.getElementById('studentCount');
    const avgGd = document.getElementById('avgGd');
    const avgMip = document.getElementById('avgMip');
    const avgLsrw = document.getElementById('avgLsrw');
    
    if (!tableBody) return;

    // Update Stats Summary
    if (studentCount) studentCount.innerText = students.length;
    
    if (students.length > 0) {
        const totalGd = students.reduce((acc, s) => acc + s.gd, 0);
        const totalMip = students.reduce((acc, s) => acc + s.mip, 0);
        const totalLsrw = students.reduce((acc, s) => acc + (s.va + s.qa + s.lr) / 3, 0);
        
        if (avgGd) avgGd.innerText = (totalGd / students.length).toFixed(1);
        if (avgMip) avgMip.innerText = (totalMip / students.length).toFixed(1);
        if (avgLsrw) avgLsrw.innerText = (totalLsrw / students.length).toFixed(1);
    }

    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 3rem; color: var(--text-muted);">No matching students.</td></tr>`;
        return;
    }

    // Helper for coloring scores
    const getScoreColor = (val, max) => {
        if (val === 0) return '#ff5252'; // Red for Zero
        if (val > (max * 0.7)) return '#4caf50'; // Green for High
        return '#ffcf2a'; // Yellow for mid
    };

    // Render Rows
    tableBody.innerHTML = students.map((s, idx) => `
        <tr class="anim-row" style="animation-delay: ${idx * 0.02}s; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="color: var(--text-muted); font-size: 0.8rem;">${s.id}</td>
            <td style="font-weight: 800; color: white;">${s.name}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${s.school}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${s.section}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.resume, 10)}">${s.resume}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.gd, 40)}">${s.gd}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.mip, 40)}">${s.mip}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.wt1, 20)}">${s.wt1}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.wt2, 20)}">${s.wt2}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.wt3, 20)}">${s.wt3}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.va, 50)}">${s.va}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.qa, 50)}">${s.qa}</td>
            <td style="font-weight: 900; color: ${getScoreColor(s.lr, 50)}">${s.lr}</td>
            <td>
                <button class="btn btn-secondary" onclick="window.showPerformance('${s.id}')" style="font-size: 0.65rem; font-weight: 800; padding: 6px 12px; background: transparent; border: 1px solid var(--primary-light); color: white;">
                    VIEW ›
                </button>
            </td>
        </tr>
    `).join('');
}

window.showPerformance = (id) => {
    window.location.href = `student-performance.html?id=${id}`;
};

function setupFilters() {
    const search = document.getElementById('globalSearch');
    const school = document.getElementById('deptFilter');

    if (!search || !school) return;

    const filterHandler = () => {
        const searchTerm = search.value.toLowerCase();
        const schoolTerm = school.value;

        filteredStudents = STUDENTS.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
            const matchesSchool = schoolTerm === "" || s.school === schoolTerm;
            return matchesSearch && matchesSchool;
        });

        renderStudentTable(filteredStudents);
    };

    search.oninput = filterHandler;
    school.onchange = filterHandler;
}

init();
