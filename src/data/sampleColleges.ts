// Sample college data for StudentVerse
// This will be uploaded to Firestore

export const sampleColleges = [
    {
        id: 'iit-delhi',
        name: 'Indian Institute of Technology Delhi',
        shortName: 'IIT Delhi',
        location: 'New Delhi',
        state: 'Delhi',
        type: 'Government',
        category: 'IIT',
        established: 1961,
        description: 'IIT Delhi is one of the premier engineering institutions in India, known for its excellence in research and education.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 120,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 150,
                        ews: 250,
                        obc: 350,
                        sc: 800,
                        st: 1200
                    },
                    {
                        year: '2023',
                        general: 180,
                        ews: 280,
                        obc: 380,
                        sc: 850,
                        st: 1250
                    }
                ]
            },
            {
                name: 'Electrical Engineering',
                branchCode: 'EE',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 450,
                        ews: 650,
                        obc: 850,
                        sc: 1500,
                        st: 2000
                    }
                ]
            },
            {
                name: 'Mechanical Engineering',
                branchCode: 'ME',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 800,
                        ews: 1000,
                        obc: 1200,
                        sc: 2000,
                        st: 2500
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '25 LPA',
                highestPackage: '1.2 Cr',
                medianPackage: '20 LPA',
                placementPercentage: 95,
                topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Goldman Sachs', 'Uber']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Research Labs',
            'Auditorium',
            'Medical Center'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://home.iitd.ac.in/',
        images: [],
        ranking: {
            nirf: 2,
            indiaToday: 1
        }
    },
    {
        id: 'iit-bombay',
        name: 'Indian Institute of Technology Bombay',
        shortName: 'IIT Bombay',
        location: 'Mumbai',
        state: 'Maharashtra',
        type: 'Government',
        category: 'IIT',
        established: 1958,
        description: 'IIT Bombay is the top-ranked engineering institute in India, renowned for its cutting-edge research and innovation.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 110,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 66,
                        ews: 120,
                        obc: 180,
                        sc: 500,
                        st: 800
                    }
                ]
            },
            {
                name: 'Electrical Engineering',
                branchCode: 'EE',
                seats: 95,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 250,
                        ews: 400,
                        obc: 550,
                        sc: 1200,
                        st: 1600
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '28 LPA',
                highestPackage: '1.5 Cr',
                medianPackage: '22 LPA',
                placementPercentage: 96,
                topRecruiters: ['Microsoft', 'Google', 'Amazon', 'Apple', 'Meta']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Research Centers',
            'Auditorium',
            'Hospital'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.iitb.ac.in/',
        images: [],
        ranking: {
            nirf: 1,
            indiaToday: 2
        }
    },
    {
        id: 'nit-trichy',
        name: 'National Institute of Technology Tiruchirappalli',
        shortName: 'NIT Trichy',
        location: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        type: 'Government',
        category: 'NIT',
        established: 1964,
        description: 'NIT Trichy is one of the premier NITs in India, known for its academic excellence and vibrant campus life.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 110,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 2500,
                        ews: 3500,
                        obc: 4500,
                        sc: 8000,
                        st: 10000
                    }
                ]
            },
            {
                name: 'Electronics and Communication Engineering',
                branchCode: 'ECE',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 4000,
                        ews: 5000,
                        obc: 6000,
                        sc: 10000,
                        st: 12000
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '15 LPA',
                highestPackage: '45 LPA',
                medianPackage: '12 LPA',
                placementPercentage: 92,
                topRecruiters: ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Labs',
            'Auditorium'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.nitt.edu/',
        images: [],
        ranking: {
            nirf: 9,
            indiaToday: 8
        }
    },
    {
        id: 'iiit-hyderabad',
        name: 'International Institute of Information Technology Hyderabad',
        shortName: 'IIIT Hyderabad',
        location: 'Hyderabad',
        state: 'Telangana',
        type: 'Deemed',
        category: 'IIIT',
        established: 1998,
        description: 'IIIT Hyderabad is a premier research-focused institute specializing in IT and Computer Science.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 120,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 1200,
                        ews: 1800,
                        obc: 2200,
                        sc: 4000,
                        st: 5000
                    }
                ]
            },
            {
                name: 'Electronics and Communication Engineering',
                branchCode: 'ECE',
                seats: 80,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 2500,
                        ews: 3200,
                        obc: 3800,
                        sc: 6000,
                        st: 7000
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '32 LPA',
                highestPackage: '74 LPA',
                medianPackage: '25 LPA',
                placementPercentage: 98,
                topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Adobe', 'Qualcomm']
            }
        ],
        facilities: [
            'Research Labs',
            'Library',
            'Sports Facilities',
            'Hostels',
            'Innovation Center'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.iiit.ac.in/',
        images: [],
        ranking: {
            nirf: 62,
            indiaToday: 15
        }
    },
    {
        id: 'bits-pilani',
        name: 'Birla Institute of Technology and Science Pilani',
        shortName: 'BITS Pilani',
        location: 'Pilani',
        state: 'Rajasthan',
        type: 'Deemed',
        category: 'Deemed',
        established: 1964,
        description: 'BITS Pilani is one of India\'s top private engineering institutes, known for its rigorous academics and industry connections.',
        courses: [
            {
                name: 'Computer Science',
                branchCode: 'CS',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 150,
                        ews: 200,
                        obc: 250,
                        sc: 400,
                        st: 500
                    }
                ]
            },
            {
                name: 'Electrical and Electronics Engineering',
                branchCode: 'EEE',
                seats: 90,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 250,
                        ews: 320,
                        obc: 380,
                        sc: 550,
                        st: 650
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '30 LPA',
                highestPackage: '60 LPA',
                medianPackage: '25 LPA',
                placementPercentage: 94,
                topRecruiters: ['Microsoft', 'Amazon', 'Google', 'Flipkart', 'Oracle']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Innovation Labs',
            'Auditorium'
        ],
        accreditation: ['NAAC A', 'NBA'],
        website: 'https://www.bits-pilani.ac.in/',
        images: [],
        ranking: {
            nirf: 25,
            indiaToday: 12
        }
    },
    {
        id: 'iit-madras',
        name: 'Indian Institute of Technology Madras',
        shortName: 'IIT Madras',
        location: 'Chennai',
        state: 'Tamil Nadu',
        type: 'Government',
        category: 'IIT',
        established: 1959,
        description: 'IIT Madras is India\'s top-ranked engineering institute, known for its research excellence and innovation in technology.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 90,
                        ews: 150,
                        obc: 220,
                        sc: 550,
                        st: 850
                    }
                ]
            },
            {
                name: 'Electrical Engineering',
                branchCode: 'EE',
                seats: 90,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 300,
                        ews: 450,
                        obc: 600,
                        sc: 1300,
                        st: 1700
                    }
                ]
            },
            {
                name: 'Mechanical Engineering',
                branchCode: 'ME',
                seats: 95,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 900,
                        ews: 1100,
                        obc: 1300,
                        sc: 2200,
                        st: 2700
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '27 LPA',
                highestPackage: '1.8 Cr',
                medianPackage: '21 LPA',
                placementPercentage: 97,
                topRecruiters: ['Microsoft', 'Google', 'Amazon', 'Intel', 'Qualcomm']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Research Centers',
            'Innovation Lab',
            'Medical Center'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.iitm.ac.in/',
        images: [],
        ranking: {
            nirf: 1,
            indiaToday: 1
        }
    },
    {
        id: 'iit-kanpur',
        name: 'Indian Institute of Technology Kanpur',
        shortName: 'IIT Kanpur',
        location: 'Kanpur',
        state: 'Uttar Pradesh',
        type: 'Government',
        category: 'IIT',
        established: 1959,
        description: 'IIT Kanpur is renowned for its academic rigor and pioneering research in engineering and sciences.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 105,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 200,
                        ews: 300,
                        obc: 400,
                        sc: 900,
                        st: 1300
                    }
                ]
            },
            {
                name: 'Electrical Engineering',
                branchCode: 'EE',
                seats: 95,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 550,
                        ews: 750,
                        obc: 950,
                        sc: 1700,
                        st: 2200
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '24 LPA',
                highestPackage: '1.1 Cr',
                medianPackage: '19 LPA',
                placementPercentage: 94,
                topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Samsung', 'Oracle']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Research Labs',
            'Auditorium',
            'Hospital'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.iitk.ac.in/',
        images: [],
        ranking: {
            nirf: 4,
            indiaToday: 3
        }
    },
    {
        id: 'nit-warangal',
        name: 'National Institute of Technology Warangal',
        shortName: 'NIT Warangal',
        location: 'Warangal',
        state: 'Telangana',
        type: 'Government',
        category: 'NIT',
        established: 1959,
        description: 'NIT Warangal is one of the oldest and most prestigious NITs, known for its excellent placement record and academic standards.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 120,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 2200,
                        ews: 3200,
                        obc: 4200,
                        sc: 7500,
                        st: 9500
                    }
                ]
            },
            {
                name: 'Electronics and Communication Engineering',
                branchCode: 'ECE',
                seats: 110,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 3800,
                        ews: 4800,
                        obc: 5800,
                        sc: 9500,
                        st: 11500
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '16 LPA',
                highestPackage: '52 LPA',
                medianPackage: '13 LPA',
                placementPercentage: 93,
                topRecruiters: ['Amazon', 'Microsoft', 'TCS', 'Infosys', 'Wipro']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Labs',
            'Auditorium',
            'Medical Center'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://www.nitw.ac.in/',
        images: [],
        ranking: {
            nirf: 19,
            indiaToday: 10
        }
    },
    {
        id: 'iiit-bangalore',
        name: 'International Institute of Information Technology Bangalore',
        shortName: 'IIIT Bangalore',
        location: 'Bangalore',
        state: 'Karnataka',
        type: 'Government',
        category: 'IIIT',
        established: 1999,
        description: 'IIIT Bangalore is a premier research institute focused on IT and allied areas, with strong industry collaborations.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 100,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 1500,
                        ews: 2000,
                        obc: 2500,
                        sc: 4500,
                        st: 5500
                    }
                ]
            },
            {
                name: 'Electronics and Communication Engineering',
                branchCode: 'ECE',
                seats: 80,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 2800,
                        ews: 3500,
                        obc: 4200,
                        sc: 6500,
                        st: 7500
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '28 LPA',
                highestPackage: '65 LPA',
                medianPackage: '23 LPA',
                placementPercentage: 96,
                topRecruiters: ['Amazon', 'Microsoft', 'Google', 'Flipkart', 'Adobe']
            }
        ],
        facilities: [
            'Research Labs',
            'Library',
            'Sports Facilities',
            'Hostels',
            'Innovation Center',
            'Cafeteria'
        ],
        accreditation: ['NAAC A', 'NBA'],
        website: 'https://www.iiitb.ac.in/',
        images: [],
        ranking: {
            nirf: 75,
            indiaToday: 20
        }
    },
    {
        id: 'vit-vellore',
        name: 'Vellore Institute of Technology',
        shortName: 'VIT Vellore',
        location: 'Vellore',
        state: 'Tamil Nadu',
        type: 'Private',
        category: 'Deemed',
        established: 1984,
        description: 'VIT Vellore is one of India\'s leading private universities, known for its modern infrastructure and excellent placement opportunities.',
        courses: [
            {
                name: 'Computer Science and Engineering',
                branchCode: 'CSE',
                seats: 300,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 5000,
                        ews: 6000,
                        obc: 7000,
                        sc: 12000,
                        st: 15000
                    }
                ]
            },
            {
                name: 'Electronics and Communication Engineering',
                branchCode: 'ECE',
                seats: 250,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 8000,
                        ews: 9500,
                        obc: 11000,
                        sc: 15000,
                        st: 18000
                    }
                ]
            },
            {
                name: 'Mechanical Engineering',
                branchCode: 'ME',
                seats: 200,
                duration: '4 years',
                cutoffs: [
                    {
                        year: '2024',
                        general: 12000,
                        ews: 14000,
                        obc: 16000,
                        sc: 20000,
                        st: 23000
                    }
                ]
            }
        ],
        placements: [
            {
                year: '2023-24',
                averagePackage: '9.5 LPA',
                highestPackage: '75 LPA',
                medianPackage: '7.5 LPA',
                placementPercentage: 88,
                topRecruiters: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture']
            }
        ],
        facilities: [
            'Central Library',
            'Sports Complex',
            'Hostels',
            'Labs',
            'Auditorium',
            'Hospital',
            'Shopping Complex'
        ],
        accreditation: ['NAAC A++', 'NBA'],
        website: 'https://vit.ac.in/',
        images: [],
        ranking: {
            nirf: 11,
            indiaToday: 14
        }
    }
];
