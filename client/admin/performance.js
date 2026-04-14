import { STUDENTS } from './student-data.js';

function getStudentId() {
    return new URLSearchParams(window.location.search).get('id');
}

let currentHubMetric = 'gd'; // State for the bar chart metric
let currentWeeklySem = 0; // State for weekly tests (Semester Index 0-9)
let pulseM1 = 'gd'; // Mode A for Trajectory
let pulseM2 = 'mip'; // Mode B for Trajectory
let pulseResolution = 'semester'; // Resolution for Trajectory (Spec 3.3)

function init() {
    const sId = getStudentId();
    const student = STUDENTS.find(s => s.id === sId);
    if (!student) return;

    renderSaaSLayout(student);
    animateSaaSCharts();
    renderBarProgression(student);

    // Helper functions for modal opening
    const openSpectrum = () => { renderSkillSpectrumModal(student); document.getElementById('spectrumDetailModal').style.display = 'flex'; };
    const openResume = () => { renderPremiumResumeModal(student); document.getElementById('resumeModal').style.display = 'flex'; };
    const openWT = () => { renderWeeklyTestModalDetail(student); document.getElementById('weeklyTestModal').style.display = 'flex'; };
    const openAssessments = () => { renderPremiumAssessmentsModal(student); document.getElementById('assessmentsModal').style.display = 'flex'; };
    const openAD = (type) => { renderAssessmentDetailModal(student, type); document.getElementById('assessmentDetailModal').style.display = 'flex'; };

    // GLOBAL EVENT DELEGATION
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Modal Selectors
        if (target.closest('#viewSpectrumBtn') || target.closest('#skillSpectrumCard')) {
            openSpectrum();
        } else if (target.closest('#viewResumeBtn') || target.closest('#viewResumeHistoryBtn')) {
            openResume();
        } else if (target.closest('#viewWTBtn') || target.closest('#weeklyTestCard')) {
            if (target.tagName !== 'SELECT') openWT();
        } else if (target.closest('#viewAllAssessmentsBtn')) {
            openAssessments();
        } else if (target.closest('.view-assessment-btn')) {
            e.stopPropagation();
            const type = target.closest('.view-assessment-btn').dataset.type;
            openAD(type);
        } else if (target.closest('.watch-video-btn')) {
            e.stopPropagation();
            const btn = target.closest('.watch-video-btn');
            const type = btn.dataset.type;
            const url = type === 'gd' ? student.gdVideo : student.mipVideo;
            openVideoPlayer(url, type === 'gd' ? 'Group Discussion' : 'Mock Interview');
        }

        // Close Logic
        if (target.id === 'closeSpectrumModal' || target.id === 'spectrumDetailModal') document.getElementById('spectrumDetailModal').style.display = 'none';
        if (target.id === 'closeResumeModal' || target.id === 'resumeModal') document.getElementById('resumeModal').style.display = 'none';
        if (target.id === 'closeWTModal' || target.id === 'weeklyTestModal') document.getElementById('weeklyTestModal').style.display = 'none';
        if (target.id === 'closeAssessmentsModal' || target.id === 'assessmentsModal') document.getElementById('assessmentsModal').style.display = 'none';
        if (target.id === 'closeADModal' || target.id === 'closeAssessDetail' || target.id === 'assessmentDetailModal') document.getElementById('assessmentDetailModal').style.display = 'none';
        if (target.id === 'closeVideoModal' || target.id === 'videoModal') {
            const player = document.getElementById('playerNode');
            if (player) player.pause();
            document.getElementById('videoModal').style.display = 'none';
        }
        if (target.id === 'closeUploadModal' || target.id === 'uploadModal') document.getElementById('uploadModal').style.display = 'none';
    });

    // Event Listeners for Bar Toggles (Static Elements)
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

    // Resolution Toggle Logic (Spec 3.3)
    const resSem = document.getElementById('pulseResSem');
    const resYear = document.getElementById('pulseResYear');
    if (resSem && resYear) {
        resSem.onclick = () => {
            pulseResolution = 'semester';
            resSem.classList.add('active');
            resYear.classList.remove('active');
            renderPulseChart(student);
        };
        resYear.onclick = () => {
            pulseResolution = 'year';
            resYear.classList.add('active');
            resSem.classList.remove('active');
            renderPulseChart(student);
        };
    }
}

function renderSkillSpectrumModal(s) {
    const container = document.getElementById('spectrumDetailContainer');
    const skills = [
        { name: 'Verbal (VA)', val: s.va, color: '#4f46e5', icon: '🗣️' },
        { name: 'Quant (QA)', val: s.qa, color: '#10b981', icon: '🔢' },
        { name: 'Logical (LR)', val: s.lr, color: '#8b5cf6', icon: '🧠' },
        { name: 'Oral Comm', val: s.commOral, color: '#f59e0b', icon: '🎤' },
        { name: 'Written Comm', val: s.commWritten, color: '#ef4444', icon: '✍️' },
        { name: 'Basic English', val: s.basicEng, color: '#06b6d4', icon: '📚' }
    ];

    // Radar Chart Constants
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;
    const angleStep = (Math.PI * 2) / skills.length;

    // Calculate Coordinates
    const getPoint = (val, i, r) => {
        const factor = (val / 50) * r;
        const angle = i * angleStep - Math.PI / 2;
        return {
            x: center + factor * Math.cos(angle),
            y: center + factor * Math.sin(angle)
        };
    };

    // Generate Background Hexagons
    const bgLevels = [0.2, 0.4, 0.6, 0.8, 1].map(lvl => {
        const points = skills.map((_, i) => {
            const p = getPoint(50 * lvl, i, radius);
            return `${p.x},${p.y}`;
        }).join(' ');
        return `<polygon points="${points}" fill="none" stroke="#f1f5f9" stroke-width="1" />`;
    }).join('');

    // Generate Data Polygon
    const dataPoints = skills.map((skill, i) => {
        const p = getPoint(skill.val, i, radius);
        return `${p.x},${p.y}`;
    }).join(' ');

    container.innerHTML = `
        <div class="flex-between mb-4">
            <div>
                <h2 style="font-weight: 1000; color: var(--primary); font-size: 2.22rem; letter-spacing: -0.04em;">Competency Radar</h2>
                <p style="font-size: 0.9rem; font-weight: 700; color: #64748b;">Pictorial Skill Distribution & Balance Analysis</p>
            </div>
            <button id="closeSpectrumModal" style="background: #f1f5f9; border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-weight: 950; font-size: 1.2rem;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 4rem; margin-top: 2rem; align-items: center;">
            <!-- Radar Chart Section -->
            <div style="background: #fafafa; padding: 2rem; border-radius: 40px; position: relative;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow: visible;">
                    ${bgLevels}
                    <!-- Axis Lines -->
                    ${skills.map((_, i) => {
                        const p = getPoint(50, i, radius);
                        return `<line x1="${center}" y1="${center}" x2="${p.x}" y2="${p.y}" stroke="#f1f5f9" stroke-width="1.5" />`;
                    }).join('')}
                    <!-- Data Polygon -->
                    <polygon points="${dataPoints}" fill="rgba(79, 70, 229, 0.15)" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" />
                    <!-- Labels -->
                    ${skills.map((skill, i) => {
                        const p = getPoint(60, i, radius); // Push labels outside
                        return `<text x="${p.x}" y="${p.y}" font-size="10" font-weight="900" text-anchor="middle" fill="#64748b">${skill.name}</text>`;
                    }).join('')}
                    <!-- Data Vertices -->
                    ${skills.map((skill, i) => {
                        const p = getPoint(skill.val, i, radius);
                        return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="white" stroke="${skill.color}" stroke-width="2" />`;
                    }).join('')}
                </svg>
            </div>

            <!-- Detailed Cards Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                ${skills.map(skill => `
                    <div style="background: white; padding: 1.5rem; border: 1.5px solid #f1f5f9; border-radius: 24px; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                        <div class="flex-between mb-2">
                            <span style="font-size: 1.2rem;">${skill.icon}</span>
                            <span style="font-weight: 950; font-size: 1.1rem; color: ${skill.color};">${skill.val}/50</span>
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 850; color: #1e293b; margin-bottom: 8px;">${skill.name}</div>
                        <div style="height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;">
                            <div style="width: ${(skill.val / 50) * 100}%; height: 100%; background: ${skill.color}; border-radius: 99px;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="margin-top: 3rem; background: #fdf2f2; padding: 1.5rem; border-radius: 20px; border: 1px solid #fee2e2; margin-bottom: 2.5rem;">
            <div style="font-size: 0.75rem; font-weight: 900; color: #ef4444; margin-bottom: 5px;">STRATEGIC INSIGHT</div>
            <p style="font-size: 0.9rem; color: #991b1b; font-weight: 600; line-height: 1.5;">
                The student shows an <span style="font-weight: 900;">Optimized Soft-Skill Core</span>. Quantitative and Verbal abilities are tracking in parallel, indicating a balanced cognitive profile suitable for <span style="font-weight: 900;">Management & High-Level Engineering</span> roles.
            </p>
        </div>

        <!-- Sorted Proficiency Ranking (New Feature) -->
        <div>
            <div style="font-size: 0.75rem; font-weight: 900; color: var(--text-muted); margin-bottom: 1.5rem; letter-spacing: 0.1em; text-transform: uppercase;">Proficiency Ranking (Top to Low %)</div>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${[...skills].sort((a,b) => b.val - a.val).map(skill => {
                    const percentage = (skill.val / 50 * 100).toFixed(0);
                    return `
                        <div style="display: grid; grid-template-columns: 180px 1fr 60px; align-items: center; gap: 1.5rem;">
                            <div style="font-size: 0.85rem; font-weight: 850; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                                <span style="opacity: 0.7;">${skill.icon}</span> ${skill.name}
                            </div>
                            <div style="height: 10px; background: #f1f5f9; border-radius: 99px; overflow: hidden; position: relative;">
                                <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${skill.color}, ${skill.color}cc); border-radius: 99px; transition: width 1s ease;">
                                    <div style="position: absolute; top:0; left:0; right:0; bottom:0; background: linear-gradient(rgba(255,255,255,0.2), transparent);"></div>
                                </div>
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 950; color: ${skill.color}; text-align: right;">${percentage}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    document.getElementById('closeSpectrumModal').onclick = () => {
        document.getElementById('spectrumDetailModal').style.display = 'none';
    };
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
            <!-- SLR & Communication Mastery (Spec 3.3) -->
            <div class="card" id="skillSpectrumCard" style="position: relative; width: 100%; min-width: 0; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 2rem; display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--primary);">💠</span> Comprehensive Skill Spectrum
                </h4>
                <div class="ring-chart-container" style="position: relative; width: 100%; max-width: 240px; height: 240px; margin: 0 auto;">
                    <svg class="ring-svg" width="100%" height="100%" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                        ${[
        { name: 'Verbal (VA)', val: s.va, color: '#4f46e5' },
        { name: 'Quant (QA)', val: s.qa, color: '#10b981' },
        { name: 'Logcial (LR)', val: s.lr, color: '#8b5cf6' },
        { name: 'Oral Comm', val: s.commOral, color: '#f59e0b' },
        { name: 'Written Comm', val: s.commWritten, color: '#ef4444' },
        { name: 'Basic English', val: s.basicEng, color: '#06b6d4' }
    ].map((skill, i) => {
        const radius = 45 - (i * 7); // Tighter circles for 6 metrics
        const circum = 2 * Math.PI * radius;
        return `
            <circle cx="50" cy="50" r="${radius}" 
                stroke="#f1f5f9" stroke-width="4.5" fill="none" />
            <circle class="ring-path" cx="50" cy="50" r="${radius}" 
                stroke="${skill.color}" 
                stroke-dasharray="${circum}" 
                stroke-dashoffset="${circum}"
                data-val="${(skill.val / 50) * 100}" data-c="${circum}" fill="none" stroke-width="4.5" stroke-linecap="round" />
        `;
    }).join('')}
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 900; color: var(--primary);">${((s.va + s.qa + s.lr + s.commOral + s.commWritten + s.basicEng) / 6).toFixed(1)}</div>
                        <div style="font-size: 0.5rem; color: var(--text-muted); font-weight: 850; letter-spacing: 0.05em;">SPECTRUM AVG</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #4f46e5;">●</span> VA</div>
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #10b981;">●</span> QA</div>
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #8b5cf6;">●</span> LR</div>
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #f59e0b;">●</span> Oral</div>
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #ef4444;">●</span> Written</div>
                    <div style="font-size: 0.55rem; font-weight: 800;"><span style="color: #06b6d4;">●</span> English</div>
                </div>
                <!-- Premium View Details Button -->
                <button id="viewSpectrumBtn" style="position: absolute; bottom: 2rem; right: 2.5rem; background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 15px 30px rgba(79, 70, 229, 0.3)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 20px rgba(79, 70, 229, 0.2)'">
                    View Details
                </button>
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
                <!-- Premium View Details Button - Combined Snapshot -->
                <button class="view-assessment-btn" data-type="mip" style="position: absolute; bottom: 1.5rem; right: 2.5rem; background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    View Details
                </button>
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
                <!-- Premium View Details Button -->
                <button id="viewWTBtn" style="position: absolute; bottom: 1.5rem; right: 2.5rem; background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    View Details
                </button>
            </div>
        </div>

        <!-- KPI Row - Refocused Assessment Suite -->
        <div class="performance-kpi-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 1.5rem;">
            <!-- Resume Card -->
            <div class="card" id="viewResumeHistoryBtn" style="position: relative; cursor: pointer; transition: transform 0.2s; background: white;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow)'">
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">PROFESSIONAL V1</div>
                    <div style="font-size: 0.65rem; font-weight: 900; color: #10b981; background: #f0fdf4; padding: 2px 8px; border-radius: 4px;">GROWTH: +3.5</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.resume} / 10</div>
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700;">Score Leap from 4.5 Draft</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: var(--primary); fill: none; stroke-width: 2; margin-top: 10px;"><path d="M0,20 L10,15 L20,25 L30,5 L40,25 L50,15 L60,20 L70,5 L80,25 L100,10" /></svg>
                <!-- Premium View Details Button -->
                <button id="viewResumeBtn" style="position: absolute; bottom: 1rem; right: 1.5rem; background: var(--primary); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    View Details
                </button>
            </div>

            <!-- MIP Card (Mock Interview Prep) -->
            ${(() => {
        const current = s.progression.mip[9];
        const prev = s.progression.mip[8];
        const delta = ((current - prev) / prev * 100).toFixed(0);
        const tier = current > 35 ? 'ELITE' : current > 25 ? 'SILVER' : 'BRONZE';
        const tierColor = tier === 'ELITE' ? '#f59e0b' : tier === 'SILVER' ? '#94a3b8' : '#b45309';
        return `
            <div class="card view-assessment-btn" data-type="mip" style="position: relative; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="position: absolute; top: 10px; right: 10px; opacity: 0.4;">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="${tierColor}"><path d="M12 15l-2 5 2-1 2 1-2-5zm0-13C7.03 2 3 6.03 3 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                </div>
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">MIP SCORE</div>
                    <div style="font-size: 0.65rem; font-weight: 900; color: #10b981;">▲ ${delta}%</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.mip} / 50</div>
                <div style="font-size: 0.6rem; font-weight: 850; color: ${tierColor}; text-transform: uppercase;">TIER: ${tier}</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #10b981; fill: none; stroke-width: 2;"><path d="M0,10 L10,20 L20,10 L30,20 L40,10 L50,20 L60,10 L70,20 L80,10 L100,20" /></svg>
                <!-- Premium View Details Button -->
                <button style="position: absolute; bottom: 1rem; right: 1.5rem; background: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    View Details
                </button>
            </div>`;
    })()}

            <!-- Weekly Tests Avg Card -->
            <div class="card" style="position: relative;">
                 <div style="position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 950;">L2</div>
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">WEEKLY TESTS AVG</div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${((s.wt1 + s.wt2 + s.wt3) / 3).toFixed(1)}</div>
                <div style="font-size: 0.65rem; font-weight: 900; color: #8b5cf6;">Consistently Above Avg</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #8b5cf6; fill: none; stroke-width: 2;"><path d="M0,25 Q25,5 50,25 T100,5" /></svg>
            </div>

            <!-- GD Card (Group Discussion) -->
            ${(() => {
        const current = s.progression.gd[9];
        const prev = s.progression.gd[8];
        const delta = ((current - prev) / prev * 100).toFixed(0);
        const tier = current > 35 ? 'ELITE' : 'GOLD';
        const tierColor = tier === 'ELITE' ? '#4f46e5' : '#f59e0b';
        return `
            <div class="card view-assessment-btn" data-type="gd" style="position: relative; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="position: absolute; top: 10px; right: 10px; opacity: 0.4;">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="${tierColor}"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 18c-3.75-1-6.5-4.83-6.5-9V6.3l6.5-2.88 6.5 2.88V10c0 4.17-2.75 8-6.5 9z"/></svg>
                </div>
                <div class="flex-between">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">GD SCORE</div>
                    <div style="font-size: 0.65rem; font-weight: 900; color: #4f46e5;">▲ ${delta}%</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 900; margin: 5px 0;">${s.gd} / 50</div>
                 <div style="font-size: 0.6rem; font-weight: 850; color: ${tierColor}; text-transform: uppercase;">TIER: ${tier}</div>
                <svg class="pulse-svg" viewBox="0 0 100 30" style="height: 30px; width: 100%; stroke: #4f46e5; fill: none; stroke-width: 2;"><path d="M0,5 L10,15 L25,5 L40,20 L60,10 L80,25 L100,5" /></svg>
                <!-- Premium View Details Button -->
                <button class="view-assessment-btn" data-type="gd" style="position: absolute; bottom: 1rem; right: 1.5rem; background: #4f46e5; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.65rem; font-weight: 900; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    View Details
                </button>
            </div>`;
    })()}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Line Progression Hub -->
            <div class="card" style="padding: 3rem; position: relative; overflow: hidden; height: 100%; box-shadow: var(--shadow-xl);">
                <div class="flex-between mb-4" style="align-items: flex-start;">
                    <div>
                        <h4 style="font-size: 1.4rem; font-weight: 1000; color: #1e293b; letter-spacing: -0.03em; line-height: 1.1;">Skill Pulse <br><span style="color: var(--primary);">Trajectory Hub</span></h4>
                        <p style="color: var(--text-muted); font-size: 0.8rem; font-weight: 700; margin-top: 8px;">Longitudinal competency mapping.</p>
                    </div>
                    <!-- Custom Multi-Select Toggles -->
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <!-- Resolution Toggle (Spec 3.3) -->
                        <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px;">
                            <button id="pulseResSem" class="pulse-res-btn active" style="padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.65rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">SEMESTERS</button>
                            <button id="pulseResYear" class="pulse-res-btn" style="padding: 4px 10px; border: none; border-radius: 6px; font-size: 0.65rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">YEARS</button>
                        </div>
                        <div style="width: 1px; height: 20px; background: #e2e8f0;"></div>
                        <select id="pulseM1Select" style="background: transparent; border: none; font-size: 0.7rem; font-weight: 800; padding: 6px 10px; color: #4f46e5; cursor: pointer;">
                            <option value="gd" ${pulseM1 === 'gd' ? 'selected' : ''}>GD Score</option>
                            <option value="mip" ${pulseM1 === 'mip' ? 'selected' : ''}>MIP Score</option>
                            <option value="resume" ${pulseM1 === 'resume' ? 'selected' : ''}>Resume Rating</option>
                            <option value="attendance" ${pulseM1 === 'attendance' ? 'selected' : ''}>Attendance</option>
                        </select>
                        <span style="font-size: 0.7rem; font-weight: 900; color: #94a3b8;">VS</span>
                        <select id="pulseM2Select" style="background: transparent; border: none; font-size: 0.7rem; font-weight: 800; padding: 6px 10px; color: #10b981; cursor: pointer;">
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
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 1rem; position: relative; overflow: hidden;">
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${p.phase === 'PRE' ? '#64748b' : p.phase === 'MID' ? '#3b82f6' : '#10b981'};"></div>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="background: var(--secondary); padding: 10px; border-radius: 8px;">📊</div>
                                <div>
                                    <div style="font-weight: 800; font-size: 0.9rem;">${p.category} <span style="font-size: 0.6rem; vertical-align: middle; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; margin-left: 5px;">${p.phase}</span></div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${p.notes.substring(0, 40)}...</div>
                                </div>
                            </div>
                            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                <div style="font-weight: 900; color: var(--primary);">${p.score}%</div>
                                <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.65rem; border-radius: 6px;">View Details</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Rising Star Card (Restored) -->
            <div class="card" style="background: #fff8e1; border-color: #ffe082; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; padding: 2.5rem;">
                <div style="font-size: 4rem;">🌟</div>
                <div>
                    <h4 style="font-weight: 900; color: #f57c00; font-size: 1.2rem;">Rising Academy Star</h4>
                    <p style="font-size: 0.8rem; color: #ff9800; font-weight: 800; margin-top: 5px;">ELITE ACADEMIC TRACK</p>
                </div>
                <button class="btn btn-primary" style="background: #f57c00; width: 100%; border: none; padding: 12px; border-radius: 12px; color: white; font-weight: 900; cursor: pointer;">Share Accomplishment</button>
            </div>
        </div>
    <style>
        .pulse-res-btn.active {
            background: white !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            color: var(--primary);
        }
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
        let baseData = [];
        if (key === 'attendance') {
            baseData = Array.from({length: 10}, (_, i) => 75 + Math.sin(i) * 5 + Math.random() * 10);
        } else {
            baseData = s.progression[key] || Array(10).fill(0);
        }

        // Aggregate by Year if needed (Spec 3.3)
        if (pulseResolution === 'year') {
            const yearlyData = [];
            for (let i = 0; i < baseData.length; i += 2) {
                // Average the 2 semesters of the year
                yearlyData.push((baseData[i] + (baseData[i+1] || baseData[i])) / 2);
            }
            return yearlyData;
        }
        return baseData;
    };

    const datasets = metrics.map(m => getData(m.key));
    const labels = pulseResolution === 'semester' 
        ? Array.from({length: 10}, (_, i) => `SEMESTER ${i+1}`)
        : Array.from({length: 5}, (_, i) => `YEAR ${i+1}`);

    const chartWidth = pulseResolution === 'semester' ? 1800 : 900;
    const stepX = (chartWidth - padding * 2) / (labels.length - 1);
    const chartHeight = height + 60; // Extra room for staggered labels
    
    wrapper.style.width = `${chartWidth}px`;

    let paths = '';
    datasets.forEach((data, dIdx) => {
        const m = metrics[dIdx];
        let d = 'M';
        data.forEach((val, i) => {
            const x = padding + (i * stepX);
            const y = height - padding - (val / m.max) * (height - padding * 2);
            d += `${i === 0 ? '' : ' L'}${x},${y}`;
        });
        
        paths += `<path class="pulse-path-anim" d="${d}" fill="none" stroke="${m.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${dIdx === 0 ? 1 : 0.4}; filter: drop-shadow(0 4px 12px ${m.color}33);" />`;
        
        // Marker dots and values
        data.forEach((val, i) => {
            const x = padding + (i * stepX);
            const y = height - padding - (val / m.max) * (height - padding * 2);
            
            // Staggered Positioning (Spec: Correct display)
            const isOverlapRisk = i > 0 && Math.abs(data[i] - data[i-1]) < 2;
            const labelYOffset = (i % 2 === 0) ? -18 : 22; // Alternate top/bottom
            const dotColor = dIdx === 0 ? m.color : '#cbd5e1';

            paths += `<circle cx="${x}" cy="${y}" r="6" fill="white" stroke="${dotColor}" stroke-width="3" />`;
            paths += `<text x="${x}" y="${y + labelYOffset}" font-size="10" font-weight="1000" fill="${m.color}" text-anchor="middle" style="text-shadow: 0 0 10px white;">${val.toFixed(1)}</text>`;
        });
    });

    wrapper.innerHTML = `
        <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="overflow: visible;">
            <!-- Grid Lines -->
            ${labels.map((lbl, i) => {
                const x = padding + (i * stepX);
                return `
                    <line x1="${x}" y1="${padding}" x2="${x}" y2="${height-padding}" stroke="#f1f5f9" stroke-width="2" />
                    <text x="${x}" y="${height + 35}" font-size="11" font-weight="900" fill="#64748b" text-anchor="middle" style="letter-spacing: 0.05em;">${lbl}</text>
                `;
            }).join('')}
            ${paths}
        </svg>
    `;
}

function renderWeeklyTestModalDetail(s) {
    const container = document.getElementById('wtModalContainer');
    const scores = s.progression.weeklyTests[currentWeeklySem];
    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const best = Math.max(...scores);
    
    container.innerHTML = `
        <div class="flex-between mb-4">
            <div>
                <h2 style="font-weight: 1000; color: var(--primary); font-size: 2.22rem; letter-spacing: -0.04em;">Semester ${currentWeeklySem + 1} Deep-Dive</h2>
                <p style="font-size: 0.9rem; font-weight: 700; color: #64748b;">Academic Efficiency & Quantitative Analysis</p>
            </div>
            <button id="closeWTModal" style="background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; font-weight: 950; transition: all 0.2s;">✕</button>
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
    const score = type === 'gd' ? s.gd : s.mip;

    container.innerHTML = `
        <div class="flex-between mb-4">
            <div>
                <h2 style="font-weight: 1000; color: var(--primary); font-size: 2.22rem; letter-spacing: -0.04em;">Outcome Analysis</h2>
                <p style="font-size: 0.9rem; font-weight: 700; color: #64748b;">Comparative roadmap: Pre-Interview vs. Post-Interview Performance.</p>
            </div>
            <button id="closeADModal" style="background: #f1f5f9; border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; font-weight: 950;">✕</button>
        </div>

        <div style="margin-top: 1.5rem; background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 3rem; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 1.5rem; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: rgba(0,0,0,0.08);"></span>
                    <span style="font-size: 0.75rem; font-weight: 900; color: #64748b;">PRE-INTERVIEW</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--primary);"></span>
                    <span style="font-size: 0.75rem; font-weight: 900; color: var(--primary);">POST-INTERVIEW</span>
                </div>
            </div>
             <div style="font-size: 1.8rem; font-weight: 1000; color: var(--primary);">${score}/50 Total</div>
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
                        ${details.map((d, i) => {
        const prev = type === 'gd' ? s.previousGdDetails[i] : s.previousMipDetails[i];
        const gain = d.score - prev.score;
        const color = gain >= 0 ? '#10b981' : '#ef4444';
        return `
                            <tr style="border-bottom: 1.5px solid #f8fafc;">
                                <td style="padding: 1.2rem 0; font-weight: 700; color: #1e293b; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 6px; height: 6px; border-radius: 50%; background: var(--primary); opacity: 0.4;"></div>
                                    <div>
                                        <div>${d.name}</div>
                                        <div style="font-size: 0.65rem; color: ${color}; font-weight: 900;">${gain >= 0 ? '▲' : '▼'} ${gain > 0 ? '+' : ''}${gain} pts growth</div>
                                    </div>
                                </td>
                                <td style="padding: 1.2rem 0; text-align: right;">
                                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 1rem;">
                                        <div style="flex: 1; min-width: 150px; height: 12px; background: #f1f5f9; border-radius: 99px; overflow: hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);">
                                            <!-- Ghost Bar (Historical) -->
                                            <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${prev.score * 10}%; background: rgba(0,0,0,0.05); border-radius: 99px; z-index: 1;"></div>
                                            <!-- Current Bar -->
                                            <div style="width: ${d.score * 10}%; height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 99px; transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; z-index: 2;">
                                                <div style="position: absolute; top: 0; left: 0; right: 0; height: 30%; background: rgba(255,255,255,0.2); border-radius: 99px;"></div>
                                            </div>
                                        </div>
                                        <span style="font-weight: 950; font-size: 1rem; color: var(--primary); font-variant-numeric: tabular-nums;">${d.score}/10</span>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
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

function renderPremiumResumeModal(s) {
    const container = document.getElementById('resumeModalContainer');
    const history = s.resumeHistory;
    
    // Calculate Progression Metrics
    const scores = history.map(r => r.score);
    const growth = scores[scores.length - 1] - scores[0];
    
    // SVG Path for progression line
    const width = 500;
    const height = 100;
    const stepX = width / (history.length - 1);
    const path = history.map((r, i) => `${i * stepX},${height - (r.score * 10)}`).join(' L');

    container.innerHTML = `
        <div class="flex-between mb-4">
            <div>
                <h2 style="font-weight: 1000; color: var(--primary); font-size: 2.22rem; letter-spacing: -0.04em;">Resume Evolution</h2>
                <p style="font-size: 0.9rem; font-weight: 700; color: #64748b;">Longitudinal progression of professional narrative and impact.</p>
            </div>
            <button id="closeResumeModal" style="background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-weight: 950; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; margin-top: 2rem;">
            <!-- Pictorial Selection -->
            <div>
                <div style="background: #fafafa; padding: 2.5rem; border-radius: 32px; position: relative; border: 1px solid #f1f5f9;">
                    <div style="font-size: 0.7rem; font-weight: 900; color: var(--primary); margin-bottom: 2rem; letter-spacing: 0.1em; text-transform: uppercase;">Resume Strength Trajectory</div>
                    <svg width="100%" height="120" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
                        <path d="M0,${height - (scores[0]*10)} L${path}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                        ${history.map((r, i) => `
                            <circle cx="${i * stepX}" cy="${height - (r.score * 10)}" r="6" fill="white" stroke="var(--primary)" stroke-width="3" />
                            <text x="${i * stepX}" y="${height - (r.score * 10) - 15}" font-size="10" font-weight="950" text-anchor="middle" fill="var(--primary)">${r.score}/10</text>
                        `).join('')}
                    </svg>
                    <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
                        ${history.map(r => `<span style="font-size: 0.6rem; color: #94a3b8; font-weight: 900;">${r.date.split(' ')[0].toUpperCase()}</span>`).join('')}
                    </div>
                </div>

                <div style="margin-top: 2rem; background: #eef2ff; padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(79, 70, 229, 0.1);">
                    <div style="font-size: 0.75rem; font-weight: 900; color: #4338ca; margin-bottom: 5px;">STRATEGIC NARRATIVE INSIGHT</div>
                    <p style="font-size: 0.9rem; color: #3730a3; font-weight: 600; line-height: 1.5;">
                        Current resume reflects a <span style="font-weight: 900;">${growth > 0 ? 'Superior Baseline Growth' : 'Steady Core'}</span>. The transition to Version ${history.length} shows significant optimization in keyword density and impact-driven bullet points.
                    </p>
                </div>
            </div>

            <!-- Detailed Grid -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                ${history.reverse().map((r, i) => `
                    <div style="background: white; padding: 1.5rem; border-radius: 24px; border: 1.5px solid ${i === 0 ? 'var(--primary)' : '#f1f5f9'}; box-shadow: 0 4px 12px rgba(0,0,0,0.02); position: relative;">
                        ${i === 0 ? '<div style="position: absolute; top: -10px; right: 20px; background: var(--primary); color: white; font-size: 0.55rem; font-weight: 900; padding: 4px 10px; border-radius: 8px;">ACTIVE VERSION</div>' : ''}
                        <div class="flex-between mb-2">
                            <span style="font-weight: 950; font-size: 1rem; color: #1e293b;">${r.version}</span>
                            <span style="font-weight: 1000; color: var(--primary);">${r.score}/10</span>
                        </div>
                        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 800;">📅 Published ${r.date}</div>
                        <button onclick="alert('System: Generating Secure Access for ${r.file}');" style="margin-top: 1rem; width: 100%; background: #f8fafc; color: var(--primary); border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 900; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='white';">View Artifact</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderPremiumAssessmentsModal(s) {
    const container = document.getElementById('assessmentsModalContainer');
    const assessments = s.performance;
    
    // Categorize for pictorial distribution
    const categories = {};
    assessments.forEach(a => {
        categories[a.category] = (categories[a.category] || 0) + a.score;
        categories[a.category + '_count'] = (categories[a.category + '_count'] || 0) + 1;
    });
    
    const catLabels = Object.keys(categories).filter(k => !k.includes('_count'));
    const catData = catLabels.map(l => categories[l] / categories[l + '_count']);

    container.innerHTML = `
        <div class="flex-between mb-4">
            <div>
                <h2 style="font-weight: 1000; color: var(--primary); font-size: 2.22rem; letter-spacing: -0.04em;">Competency Audit</h2>
                <p style="font-size: 0.9rem; font-weight: 700; color: #64748b;">Comprehensive history of academic and professional evaluations.</p>
            </div>
            <button id="closeAssessmentsModal" style="background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; font-weight: 950; display: flex; align-items: center; justify-content: center;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 3rem; margin-top: 2rem;">
            <!-- Category Distribution Pictorial -->
            <div>
                <div style="background: #fafafa; padding: 2rem; border-radius: 32px; border: 1px solid #f1f5f9;">
                    <div style="font-size: 0.7rem; font-weight: 900; color: var(--primary); margin-bottom: 2rem; letter-spacing: 0.1em; text-transform: uppercase;">Competency Distribution</div>
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        ${catLabels.map((l, i) => `
                            <div>
                                <div class="flex-between mb-1">
                                    <span style="font-size: 0.75rem; font-weight: 850; color: #1e293b;">${l}</span>
                                    <span style="font-size: 0.75rem; font-weight: 900; color: var(--primary);">${catData[i].toFixed(1)}%</span>
                                </div>
                                <div style="height: 6px; background: white; border-radius: 99px; overflow: hidden;">
                                    <div style="width: ${catData[i]}%; height: 100%; background: var(--primary); border-radius: 99px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-top: 2rem; background: #ecfdf5; padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.1);">
                    <div style="font-size: 0.75rem; font-weight: 900; color: #059669; margin-bottom: 5px;">GLOBAL COMPETENCY INSIGHT</div>
                    <p style="font-size: 0.9rem; color: #064e3b; font-weight: 600; line-height: 1.5;">
                        Across ${assessments.length} logged evaluations, the student maintains an aggregate proficiency of <span style="font-weight: 900;">${(catData.reduce((a,b)=>a+b,0)/catData.length).toFixed(1)}%</span>. Highest peak observed in logical reasoning cycles.
                    </p>
                </div>
            </div>

            <!-- Detailed Table Feed -->
            <div style="max-height: 600px; overflow-y: auto; padding-right: 1rem;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="text-align: left; border-bottom: 1px solid #f1f5f9;">
                            <th style="padding: 1rem 0; font-size: 0.7rem; color: #94a3b8; font-weight: 900; text-transform: uppercase;">Evaluation</th>
                            <th style="padding: 1rem 0; font-size: 0.7rem; color: #94a3b8; font-weight: 900; text-transform: uppercase;">Phase</th>
                            <th style="padding: 1rem 0; font-size: 0.7rem; color: #94a3b8; font-weight: 900; text-transform: uppercase; text-align: right;">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assessments.map(a => `
                            <tr style="border-bottom: 1px solid #f8fafc;">
                                <td style="padding: 1.5rem 0;">
                                    <div style="font-weight: 850; color: #1e293b; font-size: 0.95rem;">${a.category}</div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 650;">${a.notes.substring(0, 40)}...</div>
                                </td>
                                <td style="padding: 1.5rem 0;">
                                    <span style="font-size: 0.6rem; font-weight: 950; padding: 4px 10px; border-radius: 8px; background: ${a.phase === 'PRE' ? '#f1f5f9' : '#eef2ff'}; color: ${a.phase === 'PRE' ? '#64748b' : 'var(--primary)'};">${a.phase}</span>
                                </td>
                                <td style="padding: 1.5rem 0; text-align: right;">
                                    <div style="font-weight: 1000; color: var(--primary); font-size: 1.1rem;">${a.score}%</div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

init();

