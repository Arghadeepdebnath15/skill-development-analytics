import { STUDENTS } from '../admin/student-data.js';

function getStudentId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function init() {
    const studentId = getStudentId();
    // Default to first student if none provided for testing
    const student = STUDENTS.find(s => s.id === studentId) || STUDENTS[0];

    if (!student) {
        document.getElementById('studentName').innerText = 'Student Not Found';
        return;
    }

    renderProfile(student);
    animateFill();
}

function renderProfile(student) {
    // Header Info
    document.getElementById('studentName').innerText = student.name;
    document.getElementById('studentDept').innerText = student.department;
    document.getElementById('studentId').innerText = `ID: ${student.id}`;
    document.getElementById('studentGpa').innerText = student.gpa;
    
    // Images
    const avatars = ['topAvatar', 'heroAvatar'];
    avatars.forEach(id => {
        const img = document.getElementById(id);
        if (img) img.src = student.profileImage;
    });

    // Skills
    const skillsList = document.getElementById('skillsList');
    if (skillsList) {
        skillsList.innerHTML = student.skills.map(s => `
            <div style="margin-bottom: 1.5rem;">
                <div class="flex-between" style="font-weight: 800; font-size: 0.85rem; color: var(--text-main); margin-bottom: 6px;">
                    <span>${s.name.toUpperCase()}</span>
                    <span style="color: var(--primary);">${s.level}%</span>
                </div>
                <div class="skill-meter">
                    <div class="skill-meter-fill" style="width: 0%;" data-w="${s.level}%"></div>
                </div>
            </div>
        `).join('');
    }

    // Performance History
    const logList = document.getElementById('performanceLogs');
    if (logList) {
        logList.innerHTML = student.performance.map((p, idx) => `
            <div class="card mb-1" style="background: #f8fafc; border-left: 4px solid var(--primary); padding: 1.2rem; transform: scale(0.98); opacity: 0; animation: fadeInUp 0.5s ease forwards; animation-delay: ${idx * 0.1}s;">
                <div class="flex-between">
                    <div style="font-weight: 800; color: var(--primary); font-size: 0.9rem;">${p.category}</div>
                    <div class="badge" style="background: white; color: var(--primary); font-weight: 800; font-size: 0.7rem; border: 1px solid var(--border);">${p.score}%</div>
                </div>
                <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">"${p.notes}"</div>
                <div style="margin-top: 10px; font-size: 0.65rem; font-weight: 800; color: var(--accent); opacity: 0.8;">OFFICIAL RECORD • SPRING 2026</div>
            </div>
        `).join('');
    }
}

function animateFill() {
    setTimeout(() => {
        document.querySelectorAll('.skill-meter-fill').forEach(fill => {
            fill.style.width = fill.getAttribute('data-w');
        });
    }, 300);
}

init();
