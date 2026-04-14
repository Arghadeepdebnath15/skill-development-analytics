import { STUDENTS } from './student-data.js';

function getStudentId() {
    return new URLSearchParams(window.location.search).get('id');
}

let currentHubMetric = 'gd'; // State for the bar chart metric
let currentWeeklySem = 0; // State for weekly tests (Semester Index 0-9)
let pulseM1 = 'gd'; // Mode A for Trajectory
let pulseM2 = 'mip'; // Mode B for Trajectory

function init() {
    const sId = getStudentId();
    const student = STUDENTS.find(s => s.id === sId);
    if (!student) return;

    renderSaaSLayout(student);
    animateSaaSCharts();
    renderBarProgression(student);

    // Event Listeners for Bar Toggles
    document.querySelectorAll('.bar-toggle-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.bar-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHubMetric = btn.dataset.metric;
            renderBarProgression(student);
        };
    });

    // Event Listeners for Pulse Hub Custom Dropdowns
    const m1Select = document.getElementById('pulseM1Select');
    const m2Select = document.getElementById('pulseM2Select');
    if (m1Select && m2Select) {
        m1Select.onchange = (e) => { pulseM1 = e.target.value; renderPulseChart(student); };
        m2Select.onchange = (e) => { pulseM2 = e.target.value; renderPulseChart(student); };
    }

    // Weekly Test Semester Dropdown
    const wtSelect = document.getElementById('wtSemesterSelect');
    if (wtSelect) {
        wtSelect.onchange = (e) => {
            currentWeeklySem = parseInt(e.target.value);
            renderWeeklyTestBars(student);
        };
    }

    // Assessment Modal Logic
    const assessBtn = document.getElementById('viewAllAssessmentsBtn');
    const assessModal = document.getElementById('assessmentsModal');
    const assessClose = document.getElementById('closeAssessmentsModal');
    if (assessBtn && assessModal && assessClose) {
        assessBtn.onclick = () => { assessModal.style.display = 'flex'; };
        assessClose.onclick = () => { assessModal.style.display = 'none'; };
        assessModal.onclick = (e) => { if (e.target === assessModal) assessModal.style.display = 'none'; };
    }

    // Resume Modal Logic
    const resumeBtn = document.getElementById('viewResumeHistoryBtn');
    const resModal = document.getElementById('resumeModal');
    const resClose = document.getElementById('closeResumeModal');
    if (resumeBtn && resModal && resClose) {
        resumeBtn.onclick = () => { resModal.style.display = 'flex'; };
        resClose.onclick = () => { resModal.style.display = 'none'; };
        resModal.onclick = (e) => { if (e.target === resModal) resModal.style.display = 'none'; };
    }

    // Weekly Test Modal Logic
    const wtCard = document.getElementById('weeklyTestCard');
    const wtModal = document.getElementById('weeklyTestModal');
    const wtClose = document.getElementById('closeWTModal');
    if (wtCard && wtModal && wtClose) {
        wtCard.onclick = (e) => {
            if (e.target.tagName === 'SELECT') return; // Don't trigger modal on dropdown change
            renderWeeklyTestModalDetail(student);
            wtModal.style.display = 'flex';
        };
        wtClose.onclick = () => { wtModal.style.display = 'none'; };
        wtModal.onclick = (e) => { if (e.target === wtModal) wtModal.style.display = 'none'; };
    }

    // Diagnostic Detail Viewers
    document.querySelectorAll('.view-assessment-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            renderAssessmentDetailModal(student, btn.dataset.type);
        };
    });

    // Video & Upload Logic
    document.querySelectorAll('.watch-video-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            const url = type === 'gd' ? student.gdVideo : student.mipVideo;
            openVideoPlayer(url, type === 'gd' ? 'Group Discussion' : 'Mock Interview');
        };
    });
}

function renderBarProgression(s) {
    const container = document.getElementById('barProgressionChart');
    if (!container) return;

    const metricData = s.progression[currentHubMetric];
    const maxVal = currentHubMetric === 'resume' ? 10 : 40;
    const barColor = '#7c3aed'; // Vibrant Indigo from screenshot

    container.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 100%; gap: 15px; padding-top: 30px;">
            ${metricData.map((val, i) => {
        const heightPercent = (val / maxVal) * 100;
        return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; height: 100%; justify-content: flex-end;">
                        <div style="font-size: 0.75rem; font-weight: 800; color: ${barColor};">${val.toFixed(1)}</div>
                        <div class="progression-bar" style="width: 100%; height: ${heightPercent}%; background: ${barColor}; border-radius: 8px; transition: height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0.85; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);"></div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: #64748b;">S${i + 1}</div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function renderWeeklyTestBars(s) {
    const container = document.getElementById('weeklyTestContainer');
    if (!container) return;

    const scores = s.progression.weeklyTests[currentWeeklySem];
    
    container.innerHTML = scores.map((v, i) => {
        const h = (v / 50) * 100;
        const color = v >= 25 ? '#4f46e5' : '#ef4444'; // Color choice based on baseline
        return `
            <div style="min-width: 45px; flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 10px; height: 100%; justify-content: flex-end;">
                <div style="font-size: 0.6rem; font-weight: 800; color: ${color}; opacity: 0.9;">${v.toFixed(0)}</div>
                <div class="engagement-bar-anim" style="width: 20px; background: ${color}; border-radius: 4px; transition: height 1s cubic-bezier(0.165, 0.84, 0.44, 1); height: 0%; opacity: 0.8;" data-h="${h}%"></div>
                <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 800; letter-spacing: 0.5px;">W${i + 1}</div>
            </div>
        `;
    }).join('');

    // Trigger animation
    setTimeout(() => {
        container.querySelectorAll('.engagement-bar-anim').forEach(bar => {
            bar.style.height = bar.getAttribute('data-h');
        });
    }, 50);
}

function renderSaaSLayout(s) {
    const container = document.getElementById('performanceContent');
    container.innerHTML = `
        <div class="flex-between mb-2">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <!-- Profile Avatar -->
                <div style="position: relative;">
                    <img src="${s.profileImage || 'https://i.pravatar.cc/150'}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <div style="position: absolute; bottom: 0; right: 0; width: 22px; height: 22px; background: #4caf50; border: 3px solid white; border-radius: 50%;"></div>
                </div>
                
                <!-- Student Metadata (Premium Redesign) -->
                <div>
                    <h1 style="font-size: 2.6rem; font-weight: 900; background: linear-gradient(to right, #0f172a, #334155); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.04em; line-height: 1; margin-bottom: 8px;">
                        ${s.name}
                    </h1>
                    <div style="display: flex; gap: 0.8rem; align-items: center;">
                        <span style="font-size: 0.7rem; font-weight: 900; color: white; background: #4f46e5; padding: 3px 10px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px;">SYSTEM ID: ${s.id}</span>
                        <span style="width: 4px; height: 4px; background: #cbd5e1; border-radius: 50%;"></span>
                        <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">${s.email}</span>
                        <span style="width: 4px; height: 4px; background: #cbd5e1; border-radius: 50%;"></span>
                        <span style="font-size: 0.85rem; font-weight: 700; color: #94a3b8;">${s.department} • Semester ${currentWeeklySem + 1}</span>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary">Export Dossier</button>
                <button class="btn btn-primary" style="box-shadow: 0 10px 25px rgba(79, 70, 229, 0.25);">Performance Review</button>
            </div>
        </div>

        <!-- Top Row Grid - Equalized 3-column layout -->
        <div class="performance-grid-top" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <!-- LSRW Skill Rings -->
            <div class="card" style="position: relative; width: 100%; min-width: 0;">
                <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 2rem;">LSRW Skills Mastery</h4>
                <div class="ring-chart-container" style="position: relative; width: 100%; max-width: 220px; height: 220px; margin: 0 auto;">
                    <svg class="ring-svg" width="100%" height="100%" viewBox="0 0 100 100">
                        ${[
            { name: 'Language', val: s.va, color: '#4f46e5' },
            { name: 'Technical', val: s.qa, color: '#10b981' },
            { name: 'Logical', val: s.lr, color: '#8b5cf6' }
        ].map((skill, i) => {
            const radius = 42 - (i * 10);
            const circum = 2 * Math.PI * radius;
            return `
                                <circle class="ring-path" cx="50" cy="50" r="${radius}" 
                                    stroke="${skill.color}" 
                                    stroke-dasharray="${circum}" 
                                    stroke-dashoffset="${circum}"
                                    data-val="${skill.val * 2}" data-c="${circum}" fill="none" stroke-width="6" stroke-linecap="round" />
                                <text x="50" y="${50 - radius - 2}" font-size="3" font-weight="900" text-anchor="middle" fill="${skill.color}">${skill.val}/50</text>
                            `;
        }).join('')}
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">${((s.va + s.qa + s.lr) / 3).toFixed(1)}</div>
                        <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 800;">AVG SCORE / 50</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <div style="font-size: 0.65rem; font-weight: 800; text-align: center;"><span style="color: #4f46e5;">●</span> Lang</div>
                    <div style="font-size: 0.65rem; font-weight: 800; text-align: center;"><span style="color: #10b981;">●</span> Tech</div>
                    <div style="font-size: 0.65rem; font-weight: 800; text-align: center;"><span style="color: #8b5cf6;">●</span> Logic</div>
                </div>
            </div>

            <!-- Competency snapshot (GD/MIP) -->
            <div class="card" style="width: 100%; min-width: 0; position: relative;">
                <div class="flex-between">
                    <h4 style="font-size: 0.9rem; font-weight: 800;">Competency snapshot (GD/MIP)</h4>
                    <span class="badge" style="background: var(--secondary);">ELITE STATUS</span>
                </div>
                <div class="wave-container" style="height: 180px; position: relative; margin-top: 1rem;">
                    <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color: var(--primary); stop-opacity: 0.2" />
                                <stop offset="100%" style="stop-color: white; stop-opacity: 0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,100 Q40,${100 - s.gd * 2} 100,${100 - s.mip * 2} T200,${120 - s.gd * 2.5} T300,50 V120 H0 Z" fill="url(#waveGrad)" />
                        <path id="wavePath" d="M0,100 Q40,${100 - s.gd * 2} 100,${100 - s.mip * 2} T200,${120 - s.gd * 2.5} T300,50" fill="none" stroke="var(--primary)" stroke-width="3" />
                        
                        <!-- Marker points with labels -->
                        <circle cx="100" cy="${100 - s.mip * 2}" r="4" fill="var(--primary)" />
                        <text x="100" y="${90 - s.mip * 2}" font-size="8" font-weight="900" text-anchor="middle" fill="var(--primary)">${s.mip}/50</text>
                        
                        <circle cx="200" cy="${120 - s.gd * 2.5}" r="4" fill="#10b981" />
                        <text x="200" y="${110 - s.gd * 2.5}" font-size="8" font-weight="900" text-anchor="middle" fill="#10b981">${s.gd}/50</text>
                    </svg>
                    <div style="display: flex; gap: 2rem; margin-top: 5px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div><div style="font-weight: 900; font-size: 1rem; color: var(--primary);">${s.gd}</div><div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 800;">GD SCORE</div></div>
                            <button class="watch-video-btn" data-type="gd" style="background: #eef2ff; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--primary)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div><div style="font-weight: 900; font-size: 1rem; color: #10b981;">${s.mip}</div><div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 800;">MIP SCORE</div></div>
                            <button class="watch-video-btn" data-type="mip" style="background: #ecfdf5; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="#10b981"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Academic Engagement - Bottom-Up Bars -->
            <div class="card" id="weeklyTestCard" style="min-height: 280px; min-width: 0; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; this.style.borderColor='var(--primary-light)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow)'; this.style.borderColor='var(--border)';">
                <div class="flex-between mb-2">
                    <h4 style="font-size: 0.9rem; font-weight: 800;">Weekly Test Engagement</h4>
                    <select id="wtSemesterSelect" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 6px; font-size: 0.7rem; font-weight: 800; padding: 4px 8px; color: var(--primary); outline: none; cursor: pointer; backdrop-filter: blur(10px);">
                        ${Array.from({length: 10}).map((_, i) => `<option value="${i}">Semester ${i+1}</option>`).join('')}
                    </select>
                </div>
                <div id="weeklyTestWrapper" style="overflow-x: auto; padding-bottom: 20px; margin-top: 1rem; position: relative;">
                    <!-- Baseline -->
                    <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed rgba(0,0,0,0.1); z-index: 1;">
                        <span style="position: absolute; right: 10px; top: -12px; font-size: 0.55rem; color: var(--text-muted); font-weight: 800; background: var(--glass-bg); padding: 2px 6px; border-radius: 4px;">BATCH AVG (25)</span>
                    </div>
                    
                    <div id="weeklyTestContainer" style="display: flex; align-items: flex-end; justify-content: flex-start; height: 160px; gap: 20px; padding: 0 10px; position: relative; z-index: 2;">
                        <!-- Bars injected by renderWeeklyTestBars -->
                    </div>
                </div>
                <!-- Inline function call to populate initial state -->
                ${setTimeout(() => renderWeeklyTestBars(s), 0) || ''}
            </div>
        </div>

        <!-- KPI Row - Refocused Assessment Suite -->
        <div class="performance-kpi-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 1.5rem;">
            <!-- Resume Card -->
            <div class="card" id="viewResumeHistoryBtn" style="position: relative; cursor: pointer; transition: transform 0.2s; background: white;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow)'">
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">RESUME V1</div>
                    <div style="display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.resume} / 10</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: var(--primary); fill: none; stroke-width: 2;"><path d="M0,20 L10,15 L20,25 L30,5 L40,25 L50,15 L60,20 L70,5 L80,25 L100,10" /></svg>
            </div>

            <!-- MIP Card (Mock Interview Prep) -->
            <div class="card view-assessment-btn" data-type="mip" style="position: relative; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">MIP SCORE</div>
                    <button style="background: var(--secondary); border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.55rem; font-weight: 900; color: var(--primary);">VIEW MORE</button>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.mip} / 50</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #10b981; fill: none; stroke-width: 2;"><path d="M0,10 L10,20 L20,10 L30,20 L40,10 L50,20 L60,10 L70,20 L80,10 L100,20" /></svg>
            </div>

            <!-- Weekly Tests Avg Card -->
            <div class="card">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">WEEKLY TESTS AVG</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${((s.wt1 + s.wt2 + s.wt3) / 3).toFixed(1)}</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #8b5cf6; fill: none; stroke-width: 2;"><path d="M0,25 Q25,5 50,25 T100,5" /></svg>
            </div>

            <!-- GD Card (Group Discussion) -->
            <div class="card view-assessment-btn" data-type="gd" style="position: relative; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">GD SCORE</div>
                    <button style="background: var(--secondary); border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.55rem; font-weight: 900; color: var(--primary);">VIEW MORE</button>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.gd} / 50</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #4f46e5; fill: none; stroke-width: 2;"><path d="M0,5 L10,15 L25,5 L40,20 L60,10 L80,25 L100,5" /></svg>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Line Progression Hub -->
            <div class="card" style="padding: 2.5rem; position: relative; overflow: hidden; height: 100%;">
                <div class="flex-between mb-2">
                    <div>
                        <h4 style="font-size: 1.1rem; font-weight: 900; color: var(--primary);">Skill Pulse Hub</h4>
                        <p style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">Custom longitudinal trajectory.</p>
                    </div>
                    <!-- Custom Multi-Select Toggles -->
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="pulseM1Select" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.7rem; font-weight: 800; padding: 6px 10px; color: #4f46e5; cursor: pointer;">
                            <option value="gd" ${pulseM1 === 'gd' ? 'selected' : ''}>GD Score</option>
                            <option value="mip" ${pulseM1 === 'mip' ? 'selected' : ''}>MIP Score</option>
                            <option value="resume" ${pulseM1 === 'resume' ? 'selected' : ''}>Resume Rating</option>
                            <option value="attendance" ${pulseM1 === 'attendance' ? 'selected' : ''}>Attendance</option>
                        </select>
                        <span style="font-size: 0.7rem; font-weight: 900; color: #94a3b8;">VS</span>
                        <select id="pulseM2Select" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.7rem; font-weight: 800; padding: 6px 10px; color: #10b981; cursor: pointer;">
                            <option value="gd" ${pulseM2 === 'gd' ? 'selected' : ''}>GD Score</option>
                            <option value="mip" ${pulseM2 === 'mip' ? 'selected' : ''}>MIP Score</option>
                            <option value="resume" ${pulseM2 === 'resume' ? 'selected' : ''}>Resume Rating</option>
                            <option value="attendance" ${pulseM2 === 'attendance' ? 'selected' : ''}>Attendance</option>
                        </select>
                    </div>
                </div>
                
                <!-- Large Scrollable Chart Area -->
                <div style="width: 100%; overflow-x: auto; padding-bottom: 15px; margin-top: 1rem;" id="pulseScrollContainer">
                    <div id="pulseChartWrapper" style="width: 1800px; height: 220px; position: relative;">
                        <!-- SVG injected by renderPulseChart -->
                    </div>
                </div>
                
                <!-- Initial Load -->
                ${setTimeout(() => renderPulseChart(s), 0) || ''}
            </div>

            <!-- New Skill-Specific Bar Analysis Section -->
            <div class="card" style="padding: 2rem;">
                <div class="flex-between mb-2">
                    <div>
                        <h4 style="font-size: 1rem; font-weight: 900; color: var(--primary);">Historical Bar Analysis</h4>
                        <p style="color: var(--text-muted); font-size: 0.7rem; font-weight: 700;">Deep-dive into individual parameter progression.</p>
                    </div>
                    <div style="display: flex; background: var(--secondary); padding: 4px; border-radius: 8px; gap: 4px;">
                        <button class="bar-toggle-btn active" data-metric="gd" style="padding: 4px 8px; border: none; border-radius: 4px; font-size: 0.6rem; font-weight: 800; cursor: pointer; background: transparent; transition: all 0.2s;">GD</button>
                        <button class="bar-toggle-btn" data-metric="mip" style="padding: 4px 8px; border: none; border-radius: 4px; font-size: 0.6rem; font-weight: 800; cursor: pointer; background: transparent; transition: all 0.2s;">MIP</button>
                        <button class="bar-toggle-btn" data-metric="resume" style="padding: 4px 8px; border: none; border-radius: 4px; font-size: 0.6rem; font-weight: 800; cursor: pointer; background: transparent; transition: all 0.2s;">Resume</button>
                    </div>
                </div>
                <div id="barProgressionChart" style="height: 220px; position: relative;">
                    <!-- SVG Bars injected by renderBarProgression -->
                </div>
            </div>
        </div>

        <!-- Bottom Feed Row -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.5rem;">
            <!-- Assessment Feed -->
            <div class="card">
                <div class="flex-between mb-2">
                    <h4 style="font-size: 1rem; font-weight: 800;">Recent Assessments & Review</h4>
                    <button id="viewAllAssessmentsBtn" style="background: none; border: none; color: var(--primary); font-size: 0.7rem; font-weight: 800; cursor: pointer; text-decoration: underline;">View All</button>
                </div>
                <div id="assessmentsSummary" style="margin-top: 1rem;">
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
            </div>

            <!-- Full Assessments Modal -->
            <div id="assessmentsModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); z-index: 10000; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; padding: 2.5rem; animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <div class="flex-between mb-2">
                        <h2 style="font-weight: 950; color: var(--primary); letter-spacing: -0.02em;">Assessment History</h2>
                        <button id="closeAssessmentsModal" style="background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-weight: 900; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 2rem; font-weight: 600;">Comprehensive audit of professional evaluations.</p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${s.performance.map(p => `
                            <div class="assessment-entry" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 20px; background: white; transition: all 0.2s;">
                                <div style="display: flex; align-items: center; gap: 1.2rem;">
                                    <div style="background: #f8fafc; padding: 12px; border-radius: 12px; font-size: 1.5rem;">📊</div>
                                    <div>
                                        <div style="font-weight: 900; color: #0f172a; font-size: 1.05rem;">${p.category}</div>
                                        <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-top: 2px;">${p.notes}</div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.35rem; font-weight: 950; color: var(--primary);">${p.score}%</div>
                                    <div style="font-size: 0.6rem; font-weight: 900; color: #10b981; text-transform: uppercase; margin-top: 4px; padding: 2px 8px; background: #ecfdf5; border-radius: 99px; display: inline-block;">Verified</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Resume History Modal (Elite Redesign) -->
            <div id="resumeModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(16px); z-index: 10001; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 550px; padding: 3rem; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.2);">
                    <div class="flex-between mb-2">
                        <h2 style="font-weight: 950; color: var(--primary); letter-spacing: -0.03em; font-size: 2rem;">Resume Evolution</h2>
                        <button id="closeResumeModal" style="background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-weight: 900; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2.5rem; font-weight: 700;">Trace the progression of your professional narrative.</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 2rem; position: relative;">
                        <!-- Modern dashed timeline -->
                        <div style="position: absolute; left: 19px; top: 15px; bottom: 15px; width: 3px; background: repeating-linear-gradient(to bottom, #e2e8f0, #e2e8f0 8px, transparent 8px, transparent 16px);"></div>
                        
                        ${s.resumeHistory.map(r => `
                            <div style="display: flex; gap: 2rem; position: relative; z-index: 1;">
                                <div style="width: 40px; height: 40px; background: white; border: 4px solid ${r.version.includes('Active') ? 'var(--primary)' : '#e2e8f0'}; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                                    <div style="width: 10px; height: 10px; background: ${r.version.includes('Active') ? 'var(--primary)' : '#cbd5e1'}; border-radius: 50%;"></div>
                                </div>
                                <div style="flex: 1; background: rgba(255,255,255,0.8); padding: 1.5rem; border-radius: 24px; border: 1.5px solid #f1f5f9; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                                    <div class="flex-between mb-2">
                                        <div style="font-weight: 950; color: #0f172a; font-size: 1.1rem; letter-spacing: -0.01em;">${r.version}</div>
                                        <div style="font-weight: 900; color: var(--primary); background: #f5f3ff; padding: 5px 12px; border-radius: 12px; font-size: 0.8rem; border: 1px solid rgba(79, 70, 229, 0.1);">${r.score}/10 Rank</div>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 14px;">📅</span> Published on ${r.date}
                                    </div>
                                    <div style="margin-top: 18px; padding-top: 15px; border-top: 1.5px solid #f8fafc; display: flex; align-items: center; gap: 10px;">
                                        <div style="background: var(--primary); padding: 7px; border-radius: 10px; opacity: 0.08;"></div>
                                        <button onclick="alert('Viewing: ${r.file}');" style="background: var(--primary); color: white; border: none; padding: 10px 18px; border-radius: 12px; font-size: 0.8rem; font-weight: 850; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">
                                            View Source Document
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- New Weekly Test Deep-Dive Modal -->
            <div id="weeklyTestModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); z-index: 10002; align-items: center; justify-content: center;">
                <div class="card" id="wtModalContainer" style="width: 95%; max-width: 900px; padding: 3rem; animation: slideUp 0.4s ease; box-shadow: 0 50px 100px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);">
                    <!-- Content injected by renderWeeklyTestModalDetail -->
                </div>
            </div>

            <!-- Assessment Detail Deep-Dive Modal -->
            <div id="assessmentDetailModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(25px); z-index: 10005; align-items: center; justify-content: center;">
                <div class="card" id="assessmentDetailContainer" style="width: 90%; max-width: 800px; padding: 3rem; animation: slideUp 0.4s ease; box-shadow: 0 50px 100px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
                    <!-- Content injected by renderAssessmentDetailModal -->
                </div>
            </div>

            <!-- Video Player Modal -->
            <div id="videoModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); z-index: 10003; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 800px; padding: 2rem; background: #0f172a; border-color: rgba(255,255,255,0.1);">
                    <div class="flex-between mb-2">
                        <h2 id="videoModalTitle" style="color: white; font-weight: 900;">Session Recording</h2>
                        <button id="closeVideoModal" style="background: rgba(255,255,255,0.1); color: white; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;">✕</button>
                    </div>
                    <div style="aspect-ratio: 16/9; background: black; border-radius: 12px; overflow: hidden; margin-top: 1rem;">
                        <video id="playerNode" controls style="width: 100%; height: 100%;">
                            <source src="" type="video/mp4">
                        </video>
                    </div>
                </div>
            </div>

            <!-- Upload Modal -->
            <div id="uploadModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(15px); z-index: 10004; align-items: center; justify-content: center;">
                <div class="card" style="width: 90%; max-width: 450px; padding: 3rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem;">☁️</div>
                    <h2 style="font-weight: 950; color: var(--primary); margin-bottom: 0.5rem;">Upload Performance</h2>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 2.5rem;">Select a file to attach to this student's competency log.</p>
                    
                    <div style="border: 2px dashed #e2e8f0; border-radius: 20px; padding: 3rem; margin-bottom: 2rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='#e2e8f0'">
                        <div style="font-weight: 800; color: #64748b; font-size: 0.9rem;">Drop Video Here</div>
                        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 5px;">Supports MP4, MOV up to 500MB</div>
                    </div>

                    <button class="btn btn-primary" onclick="alert('Upload started...'); document.getElementById('uploadModal').style.display='none';" style="width: 100%; padding: 1rem; border-radius: 12px; font-weight: 900;">Select Files</button>
                    <button id="closeUploadModal" style="background: none; border: none; color: #94a3b8; font-weight: 800; font-size: 0.85rem; margin-top: 1.5rem; cursor: pointer;">Cancel</button>
                </div>
            </div>

            <!-- Rising Star Card -->
            <div class="card" style="background: #fff8e1; border-color: #ffe082;">
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem;">
                    <div style="font-size: 4rem;">🌟</div>
                    <div>
                        <h4 style="font-weight: 900; color: #f57c00; font-size: 1.2rem;">Rising Academy Star</h4>
                        <p style="font-size: 0.8rem; color: #ff9800; font-weight: 800; margin-top: 5px;">ELITE ACADEMIC TRACK</p>
                    </div>
                    <button class="btn btn-primary" style="background: #f57c00; width: 100%;">Share Accomplishment</button>
                </div>
            </div>
        </div>
    <style>
        .bar-toggle-btn.active {
            background: white !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            color: var(--primary);
        }
        .progression-bar:hover {
            opacity: 1 !important;
            transform: scaleX(1.1) translateY(-4px);
            filter: brightness(1.2);
        }
        .engagement-bar-anim:hover {
            transform: scaleX(1.1) translateY(-4px);
            opacity: 0.9;
            filter: brightness(1.2);
        }
        #weeklyTestWrapper::-webkit-scrollbar {
            height: 6px;
        }
        #weeklyTestWrapper::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }
        #weeklyTestWrapper::-webkit-scrollbar-thumb {
            background: var(--primary-light);
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
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

        // Bottom-up Bars (Engagement)
        document.querySelectorAll('.engagement-bar-anim').forEach(bar => {
            bar.style.height = bar.getAttribute('data-h');
        });

        // Pulse Paths
        document.querySelectorAll('.pulse-svg path').forEach(path => {
            const length = path.getTotalLength();
            if (length === 0) return;
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.style.transition = 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)';
            path.getBoundingClientRect();
            path.style.strokeDashoffset = 0;
        });
    }, 200);
}

function renderPulseChart(s) {
    const wrapper = document.getElementById('pulseChartWrapper');
    if (!wrapper) return;

    // Define Metric Metadata
    const config = {
        gd: { color: '#4f46e5', label: 'GD Score', max: 40 },
        mip: { color: '#10b981', label: 'MIP Score', max: 40 },
        resume: { color: '#f59e0b', label: 'Resume Rating', max: 10 },
        attendance: { color: '#ef4444', label: 'Attendance %', max: 100 }
    };

    const metrics = [
        { key: pulseM1, ...config[pulseM1] },
        { key: pulseM2, ...config[pulseM2] }
    ];

    const width = 1800; // Large width for scrolling as requested
    const height = 180;
    const padding = 40;

    // Helper for data fetching (incl. mock for attendance if needed)
    const getData = (key) => {
        if (key === 'attendance') {
            // Stability mock for trend if actual progression not in data
            return Array.from({length: 10}, (_, i) => 75 + Math.sin(i) * 5 + Math.random() * 10);
        }
        return s.progression[key] || Array(10).fill(0);
    };

    wrapper.innerHTML = `
        <svg width="${width}" height="${height + padding}" viewBox="0 0 ${width} ${height + padding}" style="overflow: visible;">
            <!-- Background Grid Lines -->
            ${[0, 25, 50, 75, 100].map(y => `
                <line x1="0" y1="${height - (y/100 * height)}" x2="${width}" y2="${height - (y/100 * height)}" stroke="#f1f5f9" stroke-width="1" />
            `).join('')}
            
            <!-- X-Axis Labels (Semesters) - Spread across 1800px -->
            ${Array.from({length: 10}).map((_, i) => `
                <text x="${(i * (width / 9))}" y="${height + 25}" font-size="11" font-weight="900" fill="#94a3b8" text-anchor="middle">SEMESTER ${i+1}</text>
            `).join('')}

            <!-- Data Lines and Markers -->
            ${metrics.map(m => {
                const dataPoints = getData(m.key);
                const points = dataPoints.map((val, i) => {
                    const x = i * (width / 9);
                    // Normalize Y based on max value of metric
                    const y = height - ((val / m.max) * height);
                    return {x, y, val};
                });
                
                const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
                
                return `
                    <path d="${pathD}" fill="none" stroke="${m.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));" />
                    ${points.map(p => `
                        <circle cx="${p.x}" cy="${p.y}" r="5" fill="white" stroke="${m.color}" stroke-width="3" />
                        <text x="${p.x}" y="${p.y - 12}" font-size="9" font-weight="900" fill="${m.color}" text-anchor="middle">${p.val.toFixed(1)}</text>
                    `).join('')}
                `;
            }).join('')}
        </svg>
    `;
}

function renderWeeklyTestModalDetail(s) {
    const container = document.getElementById('wtModalContainer');
    const scores = s.progression.weeklyTests[currentWeeklySem];
    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const best = Math.max(...scores);
    
    container.innerHTML = `
        <div class="flex-between mb-3">
            <div>
                <h2 style="font-weight: 950; color: var(--primary); font-size: 2.2rem; letter-spacing: -0.04em; margin-bottom: 8px;">Semester ${currentWeeklySem + 1} Deep-Dive</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: #64748b;">Academic Performance Analysis</span>
                    <span style="width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%;"></span>
                    <span style="font-size: 0.85rem; font-weight: 900; color: #10b981;">STATUS: TRENDING UPWARS</span>
                </div>
            </div>
            <button id="closeWTModal" style="background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; font-weight: 900; transition: all 0.2s;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 3rem; margin-top: 3rem;">
            <!-- Detailed Bar Chart -->
            <div>
                <div style="height: 300px; display: flex; align-items: flex-end; justify-content: space-between; gap: 15px; background: rgba(248, 250, 252, 0.5); padding: 40px; border-radius: 32px; border: 1px solid #f1f5f9; position: relative;">
                    <!-- Avg Line -->
                    <div style="position: absolute; top: 50%; left: 0; right: 0; border-top: 2px dashed rgba(79, 70, 229, 0.1); z-index: 1;">
                         <span style="position: absolute; left: 20px; top: -25px; font-size: 0.65rem; font-weight: 900; color: var(--primary); opacity: 0.6;">BATCH THRESHOLD (25)</span>
                    </div>
                    
                    ${scores.map((v, i) => {
                        const h = (v / 50) * 100;
                        const color = v >= 25 ? 'var(--primary)' : '#ef4444';
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 15px; height: 100%; z-index: 2;">
                                <div style="font-size: 0.9rem; font-weight: 950; color: ${color};">${v}</div>
                                <div style="width: 100%; max-width: 40px; background: ${color}; border-radius: 12px; height: ${h}%; transition: all 1s ease; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);"></div>
                                <div style="font-size: 0.75rem; font-weight: 900; color: #94a3b8;">WEEK ${i + 1}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Stats Column -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="stat-card" style="background: #eef2ff; padding: 2rem; border-radius: 28px; border: 1px solid rgba(79, 70, 229, 0.1);">
                    <div style="font-size: 0.8rem; font-weight: 900; color: #4338ca; opacity: 0.7; margin-bottom: 8px;">SEMESTER AVERAGE</div>
                    <div style="font-size: 2.2rem; font-weight: 1000; color: #1e1b4b;">${avg}</div>
                    <div style="font-size: 0.7rem; font-weight: 800; color: #4f46e5; margin-top: 5px;">+4.2 pts from Batch Avg</div>
                </div>
                
                <div class="stat-card" style="background: #ecfdf5; padding: 2rem; border-radius: 28px; border: 1px solid rgba(16, 185, 129, 0.1);">
                    <div style="font-size: 0.8rem; font-weight: 900; color: #065f46; opacity: 0.7; margin-bottom: 8px;">PEAK PERFORMANCE</div>
                    <div style="font-size: 2.2rem; font-weight: 1000; color: #064e3b;">${best}</div>
                    <div style="font-size: 0.7rem; font-weight: 800; color: #10b981; margin-top: 5px;">High standard achieved</div>
                </div>

                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9;">
                    <div style="font-size: 0.75rem; font-weight: 900; color: #64748b; margin-bottom: 10px;">FACULTY NOTES</div>
                    <p style="font-size: 0.85rem; color: #0f172a; font-weight: 600; line-height: 1.5;">Student has shown exponential growth in the mid-term evaluations. Consistency is high.</p>
                </div>
            </div>
        </div>
    `;

    // Re-bind close event because we just overwrote the container
    document.getElementById('closeWTModal').onclick = () => {
        document.getElementById('weeklyTestModal').style.display = 'none';
    };
}

function openVideoPlayer(url, title) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('playerNode');
    const titleNode = document.getElementById('videoModalTitle');
    
    titleNode.innerText = title + ' Recording';
    player.src = url;
    modal.style.display = 'flex';
    player.play();

    document.getElementById('closeVideoModal').onclick = () => {
        player.pause();
        modal.style.display = 'none';
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            player.pause();
            modal.style.display = 'none';
        }
    };
}

function renderAssessmentDetailModal(s, type) {
    const modal = document.getElementById('assessmentDetailModal');
    const container = document.getElementById('assessmentDetailContainer');
    const details = type === 'gd' ? s.gdDetails : s.mipDetails;
    const title = type === 'gd' ? 'Group Discussion' : 'Mock Interview Prep';
    const videoUrl = type === 'gd' ? s.gdVideo : s.mipVideo;
    const score = type === 'gd' ? s.gd : s.mip;

    container.innerHTML = `
        <div class="flex-between mb-3">
            <div>
                <h2 style="font-weight: 950; color: var(--primary); font-size: 2.2rem; letter-spacing: -0.04em; margin-bottom: 8px;">${title} Details</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 0.85rem; font-weight: 800; color: #64748b;">Comprehensive Skill Assessment</span>
                    <span style="width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%;"></span>
                    <span style="font-size: 0.85rem; font-weight: 900; color: #10b981;">TOTAL SCORE: ${score}/50</span>
                </div>
            </div>
            <button id="closeADModal" style="background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; font-weight: 900;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 3rem; margin-top: 3rem;">
            <!-- Parameters Table -->
            <div>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2.5px solid #f1f5f9;">
                            <th style="padding: 1.2rem 0; font-size: 0.75rem; color: #64748b; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase;">Diagnostic Parameter</th>
                            <th style="padding: 1.2rem 0; font-size: 0.75rem; color: #64748b; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; text-align: right;">Evaluation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.map(d => `
                            <tr style="border-bottom: 1.5px solid #f8fafc;">
                                <td style="padding: 1.2rem 0; font-weight: 700; color: #1e293b; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary); opacity: 0.4;"></div>
                                    ${d.name}
                                </td>
                                <td style="padding: 1.2rem 0; text-align: right;">
                                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 1rem;">
                                        <div style="flex: 1; min-width: 120px; height: 10px; background: #f1f5f9; border-radius: 99px; overflow: hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);">
                                            <div style="width: ${d.score * 10}%; height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 99px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative;">
                                                <div style="position: absolute; top: 0; left: 0; right: 0; height: 30%; background: rgba(255,255,255,0.2); border-radius: 99px;"></div>
                                            </div>
                                        </div>
                                        <span style="font-weight: 950; font-size: 1rem; color: var(--primary); font-variant-numeric: tabular-nums;">${d.score}/10</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Action Controls -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Video Link -->
                <div style="background: #f8fafc; border-radius: 28px; padding: 2rem; border: 1.5px solid #eef2ff; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">📽️</div>
                    <div style="font-weight: 950; color: #0f172a; font-size: 1.1rem;">Session Recording</div>
                    <p style="color: #64748b; font-size: 0.75rem; margin-top: 5px; font-weight: 650;">Review the recorded performance of this assessment.</p>
                    <button onclick="openVideoPlayer('${videoUrl}', '${title}');" style="width: 100%; margin-top: 1.5rem; background: var(--primary); color: white; border: none; padding: 1rem; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        WATCH RECORDING
                    </button>
                </div>

                <!-- Shared Admin Upload (Moved Here) -->
                <div onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='#e2e8f0'" style="cursor: pointer; border: 2.5px dashed #e2e8f0; border-radius: 28px; padding: 1.5rem; text-align: center; transition: all 0.2s;" onclick="document.getElementById('uploadModal').style.display='flex'">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📁</div>
                    <div style="font-weight: 900; color: #64748b; font-size: 0.8rem;">Upload New Tape</div>
                    <div style="font-size: 0.6rem; color: #94a3b8; font-weight: 700; margin-top: 4px;">Update session file</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.getElementById('closeADModal').onclick = () => { modal.style.display = 'none'; };
}

init();

