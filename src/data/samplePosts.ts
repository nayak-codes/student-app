// Sample posts data for Chitki community feed

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userExam: string;
    content: string;
    videoLink?: string;
    tags: string[];
    likes: number;
    comments: number;
    createdAt: Date;
}

export const samplePosts: Omit<Post, 'id'>[] = [
    {
        userId: 'sample_user_1',
        userName: 'Rahul Sharma',
        userExam: 'JEE',
        content: '🎯 Just solved 50 questions on Rotational Motion today! The key is understanding the parallel axis theorem. Anyone struggling with this topic?',
        tags: ['Physics', 'JEE', 'Study Tips'],
        likes: 45,
        comments: 12,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
        userId: 'sample_user_2',
        userName: 'Priya Menon',
        userExam: 'NEET',
        content: 'Best resources for NEET Biology? 📚 I\'ve been using NCERT + Trueman\'s Biology. What else would you recommend for genetics and ecology?',
        tags: ['Biology', 'NEET', 'Resources'],
        likes: 78,
        comments: 24,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
        userId: 'sample_user_3',
        userName: 'Aditya Kumar',
        userExam: 'JEE',
        content: 'Check out this amazing explanation of Integration by Parts! 🔥',
        videoLink: 'https://www.youtube.com/watch?v=2I-_SV8cwsw',
        tags: ['Maths', 'JEE', 'Calculus'],
        likes: 156,
        comments: 34,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
        userId: 'sample_user_4',
        userName: 'Sneha Reddy',
        userExam: 'EAPCET',
        content: '💡 Pro tip: Make formula sheets for each chapter. I made one for Thermodynamics and it helped me solve problems 2x faster!',
        tags: ['Chemistry', 'Study Tips', 'EAPCET'],
        likes: 92,
        comments: 18,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
        userId: 'sample_user_5',
        userName: 'Vikram Patel',
        userExam: 'JEE',
        content: 'Anyone else finding Organic Chemistry reactions overwhelming? I started making a reaction flowchart and it\'s really helping! 🧪',
        tags: ['Chemistry', 'Organic', 'JEE'],
        likes: 67,
        comments: 29,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
        userId: 'sample_user_6',
        userName: 'Anjali Singh',
        userExam: 'NEET',
        content: 'Mock test strategy that worked for me:\n1. Take test in exam conditions\n2. Analyze mistakes immediately\n3. Revise weak topics\n4. Repeat weekly\n\nJumped from 550 to 630! 🚀',
        tags: ['NEET', 'Strategy', 'Mock Tests'],
        likes: 234,
        comments: 56,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
        userId: 'sample_user_7',
        userName: 'Karthik Iyer',
        userExam: 'JEE',
        content: 'Electromagnetism made easy! This YouTube series is gold ✨',
        videoLink: 'https://www.youtube.com/watch?v=OZ3yL7fl3lI',
        tags: ['Physics', 'JEE', 'Electromagnetism'],
        likes: 189,
        comments: 45,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
        userId: 'sample_user_8',
        userName: 'Divya Nair',
        userExam: 'NEET',
        content: 'Remember: Consistency > Intensity\n\nStudying 6 hours daily consistently is better than 12 hours for 2 days and then burning out. Trust the process! 💪',
        tags: ['Motivation', 'Study Tips', 'NEET'],
        likes: 312,
        comments: 67,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
    {
        userId: 'sample_user_9',
        userName: 'Rohan Gupta',
        userExam: 'JEE',
        content: 'IIT Bombay vs IIT Delhi for CSE? Looking for honest opinions from current students or alumni. Considering placement, campus life, and location. 🤔',
        tags: ['College', 'IIT', 'Advice'],
        likes: 145,
        comments: 89,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
        userId: 'sample_user_10',
        userName: 'Meera Krishnan',
        userExam: 'NEET',
        content: 'Just finished my revision of Human Physiology! 📖 Key topics:\n- Digestive system\n- Respiratory system\n- Circulatory system\n- Nervous system\n\nNCERT diagrams are super important!',
        tags: ['Biology', 'NEET', 'Physiology'],
        likes: 98,
        comments: 23,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    },
];
