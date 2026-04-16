export const QUIZZES = [
    {
        id: 'qz_001',
        title: 'Institutional Logic Assessment',
        type: 'live',
        duration: 20, // minutes
        questions: 15,
        status: 'live',
        createdAt: '2026-04-10'
    },
    {
        id: 'qz_002',
        title: 'Applied Engineering Ethics',
        type: 'form',
        duration: null,
        questions: 10,
        status: 'draft',
        createdAt: '2026-04-12'
    },
    {
        id: 'qz_003',
        title: 'Leadership & Management Principles',
        type: 'live',
        duration: 45,
        questions: 30,
        status: 'closed',
        createdAt: '2026-04-05'
    }
];

export const LIVE_SCORES = [
    { studentId: 'std_1_0', studentName: 'Aditya Raj', score: 85, progress: 100, status: 'completed' },
    { studentId: 'std_1_1', studentName: 'Priya Sharma', score: 92, progress: 100, status: 'completed' },
    { studentId: 'std_1_2', studentName: 'Rahul Verma', score: null, progress: 65, status: 'ongoing' }
];
