export const SCHOOLS = [
    'SSBT', 'SSCSE', 'SSLAWS', 'SSET', 'SSME', 'SSBCA'
];

const SECTIONS = [
    'B.Tech BT VI-A', 'B.Tech BT VI-B', 'B.Tech CSE VI-K', 'LLB VI-A', 'LLB VI-B', 'B.Tech ET VI-A', 'B.Tech ET VI-B'
];

const firstNames = ['Aamir', 'Aditya', 'Alia', 'Ananya', 'Arun', 'Ayushmann', 'Deepika', 'Disha', 'Hrithik', 'Aiswarya', 'Amitabh', 'Ranveer', 'Katrina', 'Shahrukh', 'Kareena'];
const lastNames = ['Khan', 'Reddy', 'Bhatt', 'Singh', 'Kumar', 'Khurrana', 'Padukone', 'Patani', 'Roshan', 'Rai', 'Bachchan', 'Singh', 'Kaif', 'Khan', 'Kapoor'];

const generateStudents = () => {
    const students = [];
    // Generate 40 students like in the screenshot
    for (let i = 0; i < 40; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const name = `${firstName} ${lastName}`;
        const id = (i + 1).toString();
        const school = SCHOOLS[i % SCHOOLS.length];
        const section = SECTIONS[i % SECTIONS.length];
        
        // Random scores inspired by screenshot
        const resume = Math.floor(Math.random() * 10);
        const gd = Math.floor(Math.random() * 40);
        const mip = Math.floor(Math.random() * 40);
        const wt1 = Math.floor(Math.random() * 20);
        const wt2 = Math.floor(Math.random() * 20);
        const wt3 = Math.floor(Math.random() * 20);
        const va = Math.floor(Math.random() * 50);
        const qa = Math.floor(Math.random() * 50);
        const lr = Math.floor(Math.random() * 50);
        const commOral = Math.floor(Math.random() * 20 + 30); // 30-50
        const commWritten = Math.floor(Math.random() * 20 + 30);
        const basicEng = Math.floor(Math.random() * 10 + 40); // 40-50
        
        const gpa = (Math.random() * 1.5 + 2.5).toFixed(2);
        const attendance = Math.floor(Math.random() * 25 + 75);

        // Generate Semester Progression (1-10)
        const progression = {
            resume: Array.from({ length: 10 }, (_, j) => Math.min(10, Math.max(0, (j + 1) * 0.8 + Math.random() * 2))),
            gd: Array.from({ length: 10 }, (_, j) => Math.min(40, Math.max(0, (j + 1) * 3 + Math.random() * 8))),
            mip: Array.from({ length: 10 }, (_, j) => Math.min(40, Math.max(0, (j + 1) * 3.5 + Math.random() * 6))),
            weeklyTests: Array.from({ length: 10 }, () => 
                Array.from({ length: 8 }, () => Math.floor(Math.random() * 30 + 20)) // 8 tests per sem, score 20-50
            )
        };

        const resumeHistory = [
            { version: 'v1.0', date: 'Sept 12, 2025', score: 4.5, file: 'resume_draft_v1.pdf' },
            { version: 'v2.1', date: 'Oct 05, 2025', score: 6.2, file: 'resume_revised_v2.pdf' },
            { version: 'v3.0 (Active)', date: 'Nov 20, 2025', score: resume, file: 'resume_final_standard.pdf' }
        ];

        students.push({
            id,
            name,
            email: `${firstName.toLowerCase()}@sharda.ac.in`,
            department: school,
            school,
            section,
            resume,
            attendance,
            gpa,
            va,
            qa,
            lr,
            commOral,
            commWritten,
            basicEng,
            gd,
            mip,
            gdVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
            mipVideo: 'https://www.w3schools.com/html/movie.mp4',
            gdDetails: [
                { name: 'Topic Knowledge', score: Math.floor(Math.random() * 3 + 7) },
                { name: 'Communication', score: Math.floor(Math.random() * 3 + 6) },
                { name: 'Group Coordination', score: Math.floor(Math.random() * 4 + 5) },
                { name: 'Body Language', score: Math.floor(Math.random() * 3 + 7) }
            ],
            previousGdDetails: [
                { name: 'Topic Knowledge', score: 6 },
                { name: 'Communication', score: 5 },
                { name: 'Group Coordination', score: 5 },
                { name: 'Body Language', score: 6 }
            ],
            mipDetails: [
                { name: 'Subject Expertise', score: Math.floor(Math.random() * 3 + 7) },
                { name: 'Confidence', score: Math.floor(Math.random() * 3 + 6) },
                { name: 'Problem Solving', score: Math.floor(Math.random() * 4 + 5) },
                { name: 'Dress Code', score: 9 }
            ],
            previousMipDetails: [
                { name: 'Subject Expertise', score: 6 },
                { name: 'Confidence', score: 5 },
                { name: 'Problem Solving', score: 4 },
                { name: 'Dress Code', score: 8 }
            ],
            wt1,
            wt2,
            wt3,
            progression,
            resumeHistory,
            profileImage: `https://i.pravatar.cc/150?u=${id}`,
            skills: [
                { name: 'Analytics', level: 85 },
                { name: 'Communication', level: 92 }
            ],
            softSkills: {
                mip,
                gd,
                weeklyTests: [wt1, wt2, wt3],
                topics: [
                    { name: 'Language', score: va },
                    { name: 'Technical', score: qa },
                    { name: 'Logical', score: lr }
                ],
                feedback: "Good potential. Focus on quantitative aptitude and verbal readiness."
            },
            performance: [
                { category: 'Weekly Test 1', type: 'Quiz', phase: 'PRE', score: wt1 * 5, notes: 'Initial assessment.' },
                { category: 'Weekly Test 2', type: 'Quiz', phase: 'MID', score: wt2 * 5, notes: 'Follow-up assessment.' },
                { category: 'MIP Session 1', type: 'Diag', phase: 'MID', score: mip * 2.5, notes: 'Confidence and subjects.' },
                { category: 'GD Session 1', type: 'Diag', phase: 'POST', score: gd * 2.5, notes: 'Group coordination focus.' }
            ]
        });
    }
    return students;
};

export const STUDENTS = generateStudents();
export const DEPARTMENTS = SCHOOLS; // For filter compatibility
