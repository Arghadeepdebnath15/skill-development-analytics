import { STUDENTS, DEPARTMENTS } from './student-data.js';

let filteredStudents = [...STUDENTS];

function init() {
    console.log('Initializing Modern Student Audit...');
    
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
        tableBody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 4rem; color: #9ca3af; font-weight: 800;">No students found matching your criteria.</td></tr>`;
        return;
    }

    // Modern Score Coloring (Vibrant)
    const getScoreColor = (val, max) => {
        if (val === 0) return '#ef4444'; // Bright Red
        if (val > (max * 0.7)) return '#22c55e'; // Vibrant Green
        if (val > (max * 0.4)) return '#f59e0b'; // Amber
        return '#f87171'; // Soft Red
    };

    // Render Rows
    tableBody.innerHTML = students.map((s, idx) => `
        <tr class="anim-row" style="animation-delay: ${idx * 0.01}s">
            <td style="color: #9ca3af; font-weight: 700; font-size: 0.75rem;">#${s.id}</td>
            <td>
                <div class="student-name">${s.name}</div>
                <div style="font-size: 0.65rem; color: #9ca3af; font-weight: 600;">${s.email}</div>
            </td>
            <td style="color: #6b7280; font-weight: 700;">${s.school}</td>
            <td style="color: #6b7280; font-weight: 700;">${s.section}</td>
            <td class="score-value" style="color: ${getScoreColor(s.resume, 10)}">${s.resume}</td>
            <td class="score-value" style="color: ${getScoreColor(s.gd, 40)}">${s.gd}</td>
            <td class="score-value" style="color: ${getScoreColor(s.mip, 40)}">${s.mip}</td>
            <td class="score-value" style="color: ${getScoreColor(s.wt1, 20)}">${s.wt1}</td>
            <td class="score-value" style="color: ${getScoreColor(s.wt2, 20)}">${s.wt2}</td>
            <td class="score-value" style="color: ${getScoreColor(s.wt3, 20)}">${s.wt3}</td>
            <td class="score-value" style="color: ${getScoreColor(s.va, 50)}">${s.va}</td>
            <td class="score-value" style="color: ${getScoreColor(s.qa, 50)}">${s.qa}</td>
            <td class="score-value" style="color: ${getScoreColor(s.lr, 50)}">${s.lr}</td>
            <td>
                <button class="btn-view" onclick="window.showPerformance('${s.id}')">
                    Analyze
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
    const schoolFilter = document.getElementById('deptFilter');

    if (!search || !schoolFilter) return;

    const filterHandler = () => {
        const searchTerm = search.value.toLowerCase();
        const schoolTerm = schoolFilter.value;

        filteredStudents = STUDENTS.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
            const matchesSchool = schoolTerm === "" || s.school === schoolTerm;
            return matchesSearch && matchesSchool;
        });

        renderStudentTable(filteredStudents);
    };

    search.oninput = filterHandler;
    schoolFilter.onchange = filterHandler;
}

init();
