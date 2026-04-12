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
        
        const gpa = (Math.random() * 1.5 + 2.5).toFixed(2);
        const attendance = Math.floor(Math.random() * 25 + 75);

        students.push({
            id,
            name,
            email: `${firstName.toLowerCase()}@sharda.ac.in`,
            department: school, // Mapping school to department for existing compatibility
            school,
            section,
            resume,
            gd,
            mip,
            wt1,
            wt2,
            wt3,
            va,
            qa,
            lr,
            gpa,
            attendance,
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
                { category: 'Weekly Test 1', type: 'Quiz', score: wt1 * 5, notes: 'Initial assessment.' },
                { category: 'Weekly Test 2', type: 'Quiz', score: wt2 * 5, notes: 'Follow-up assessment.' }
            ]
        });
    }
    return students;
};

export const STUDENTS = generateStudents();
export const DEPARTMENTS = SCHOOLS; // For filter compatibility
