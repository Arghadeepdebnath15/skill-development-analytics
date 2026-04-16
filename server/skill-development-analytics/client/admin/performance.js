import { STUDENTS } from './student-data.js';

function getStudentId() {
    return new URLSearchParams(window.location.search).get('id');
}

function init() {
    const sId = getStudentId();
    const student = STUDENTS.find(s => s.id === sId);
    if (!student) return;

    renderSaaSLayout(student);
    animateSaaSCharts();
}

function renderSaaSLayout(s) {
    const container = document.getElementById('performanceContent');
    container.innerHTML = `
        <div class="flex-between mb-1">
            <div>
                <h1 style="font-size: 2rem; font-weight: 900; color: var(--primary);">${s.name} Analytics</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">Performance Snapshot • ${s.department}</p>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary">Export Data</button>
                <button class="btn btn-primary">Performance Review</button>
            </div>
        </div>

        <!-- Top Row Grid -->
        <div class="performance-grid-top">
            <!-- Multi-Ring Card -->
            <div class="card">
                <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 2rem;">Overview Mastery</h4>
                <div class="ring-chart-container">
                    <svg class="ring-svg" width="200" height="200" viewBox="0 0 100 100">
                        ${s.skills.map((skill, i) => {
        const radius = 40 - (i * 10);
        const circum = 2 * Math.PI * radius;
        return `
                                <circle class="ring-path" cx="50" cy="50" r="${radius}" 
                                    stroke="var(--ring-${i + 1})" 
                                    stroke-dasharray="${circum}" 
                                    stroke-dashoffset="${circum}"
                                    data-val="${skill.level}" data-c="${circum}" />
                            `;
    }).join('')}
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 900;">${s.gpa}</div>
                        <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 800;">GPA INDEX</div>
                    </div>
                </div>
                <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${s.skills.slice(0, 4).map(skill => `
                        <div style="font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 1.5rem; background: var(--secondary); border-radius: 4px; display: block;"></span>
                            ${skill.name}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Wave Chart Card -->
            <div class="card">
                <div class="flex-between">
                    <h4 style="font-size: 0.9rem; font-weight: 800;">Growth Overview</h4>
                    <span class="badge" style="background: var(--secondary);">+ 12% GROWTH</span>
                </div>
                <div class="wave-container">
                    <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color: var(--success); stop-opacity: 0.3" />
                                <stop offset="100%" style="stop-color: white; stop-opacity: 0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,100 Q40,40 100,80 T200,30 T300,60 V120 H0 Z" fill="url(#waveGrad)" />
                        <path id="wavePath" d="M0,100 Q40,40 100,80 T200,30 T300,60" fill="none" stroke="var(--success)" stroke-width="3" />
                    </svg>
                    <div style="display: flex; gap: 2rem; margin-top: 1.5rem;">
                        <div><div style="font-weight: 900; font-size: 1.1rem;">A+</div><div style="font-size: 0.6rem; color: var(--text-muted);">Current Grade</div></div>
                        <div><div style="font-weight: 900; font-size: 1.1rem;">Top 5%</div><div style="font-size: 0.6rem; color: var(--text-muted);">Institutional Rank</div></div>
                    </div>
                </div>
            </div>

            <!-- Split Bar Card -->
            <div class="card">
                <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 1.5rem;">Academic Engagement</h4>
                <div class="split-bar-group">
                    ${[0.8, 0.9, 0.75, 0.65, 0.85, 0.95].map((v, i) => `
                        <div class="split-bar-wrapper">
                            <div class="bar-top" style="height: 0%;" data-h="${v * 60}%"></div>
                            <div style="height: 4px;"></div>
                            <div class="bar-bottom" style="height: 0%;" data-h="${(1 - v) * 50}%"></div>
                            <div style="margin-top: 8px; font-size: 0.6rem; color: var(--text-muted); font-weight: 800;">W${i + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- KPI Row -->
        <div class="performance-kpi-row">
            <div class="card">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">CREDITS EARNED</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">48.5</div>
                <svg class="pulse-svg" viewBox="0 0 100 30"><path d="M0,20 L10,15 L20,25 L30,5 L40,25 L50,15 L60,20 L70,5 L80,25 L100,10" /></svg>
            </div>
            <div class="card">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">ATTENDANCE</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.attendance}%</div>
                <svg class="pulse-svg" viewBox="0 0 100 30"><path d="M0,10 L10,20 L20,10 L30,20 L40,10 L50,20 L60,10 L70,20 L80,10 L100,20" style="stroke: #ff9800" /></svg>
            </div>
            <div class="card">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">ACHIEVEMENTS</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">12</div>
                <svg class="pulse-svg" viewBox="0 0 100 30"><path d="M0,25 Q25,5 50,25 T100,5" style="stroke: #4caf50" /></svg>
            </div>
            <div class="card">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">SESSION TIME</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${(s.attendance / 10).toFixed(1)}h</div>
                <svg class="pulse-svg" viewBox="0 0 100 30"><path d="M0,5 L100,25" style="stroke: #1a237e" /></svg>
            </div>
        </div>

        <!-- Bottom Feed Row -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem;">
            <!-- Assessment Feed -->
            <div class="card">
                <h4 style="font-size: 1rem; font-weight: 800; margin-bottom: 2rem;">Recent Assessments & Review</h4>
                ${s.performance.slice(0, 3).map(p => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="background: var(--secondary); padding: 10px; border-radius: 8px;">📊</div>
                            <div>
                                <div style="font-weight: 800; font-size: 0.9rem;">${p.category}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${p.notes.substring(0, 40)}...</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 900; color: var(--primary);">${p.score}%</div>
                            <span class="badge" style="background: rgba(76, 175, 80, 0.1); color: var(--success);">APPROVED</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Rising Star Card -->
            <div class="card" style="background: #fff8e1; border-color: #ffe082;">
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem;">
                    <img src="../assets/star-illustration.png" style="width: 150px; height: auto;">
                    <div>
                        <h4 style="font-weight: 900; color: #f57c00; font-size: 1.2rem;">Rising Academy Star</h4>
                        <p style="font-size: 0.8rem; color: #ff9800; font-weight: 800; margin-top: 5px;">A+ ACADEMIC TRACK</p>
                    </div>
                    <button class="btn btn-primary" style="background: #f57c00; width: 100%;">Share Accomplishment</button>
                </div>
            </div>
        </div>
    `;
}

function animateSaaSCharts() {
    setTimeout(() => {
        // Rings
        document.querySelectorAll('.ring-path').forEach(path => {
            const val = path.getAttribute('data-val');
            const circum = parseFloat(path.getAttribute('data-c'));
            const offset = circum - (val / 100) * circum;
            path.style.strokeDashoffset = offset;
        });

        // Split Bars
        document.querySelectorAll('.bar-top, .bar-bottom').forEach(bar => {
            bar.style.height = bar.getAttribute('data-h');
        });

        // Pulse Paths
        document.querySelectorAll('.pulse-svg path').forEach(path => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)';
            path.getBoundingClientRect();
            path.style.strokeDashoffset = 0;
        });
    }, 200);
}

init();
