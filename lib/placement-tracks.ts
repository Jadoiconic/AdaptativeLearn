export type RecommendedTrack = 'networking' | 'embedded-systems' | 'cctv' | 'software-development';

export const TRACK_TO_CATEGORY: Record<RecommendedTrack, string> = {
  networking: 'Networking',
  'embedded-systems': 'Embedded Systems',
  cctv: 'CCTV & Security',
  'software-development': 'Software Development',
};

export const TRACK_LABELS: Record<RecommendedTrack, string> = {
  networking: 'Networking (Cisco Basics)',
  'embedded-systems': 'Embedded Systems',
  cctv: 'CCTV & Security Systems',
  'software-development': 'Software Development (Full Stack)',
};

// Domain strings fed to the AI to generate course-specific placement assessments.
export const TRACK_ASSESSMENT_DOMAIN: Record<RecommendedTrack, string> = {
  networking:
    'Computer Networking — OSI model, TCP/IP stack, IP addressing and subnetting, routing and switching concepts, Cisco router and switch configuration, VLANs, wireless networking, and network troubleshooting',
  'embedded-systems':
    'Embedded Systems and IoT — microcontroller architecture, embedded C programming, Arduino and Raspberry Pi, sensor and actuator interfacing, serial communication (UART, I2C, SPI), real-time system concepts, and hardware debugging',
  cctv:
    'CCTV and Surveillance Systems — analog vs IP camera types, DVR/NVR setup and configuration, coaxial and CAT-5/6 cable installation, IP camera networking and addressing, remote surveillance monitoring, and security best practices',
  'software-development':
    'Full Stack Web Development — HTML/CSS/JavaScript fundamentals, React component-based UIs, Node.js backend development, REST API design and authentication, MongoDB and relational database basics, Git/GitHub workflow, and deployment',
};

export interface CourseOption {
  track: RecommendedTrack;
  title: string;
  shortTitle: string;
  description: string;
  careerPaths: string[];
  skills: string[];
  colorClass: string;
  gradientFrom: string;
  gradientTo: string;
}

export const COURSE_OPTIONS: CourseOption[] = [
  {
    track: 'networking',
    title: 'Networking (Cisco Basics)',
    shortTitle: 'Networking',
    description:
      'Master computer networking fundamentals using Cisco equipment. Learn IP addressing, routing, switching, and how to configure and troubleshoot real network infrastructure.',
    careerPaths: ['Network Technician', 'IT Support Specialist', 'Junior Network Administrator'],
    skills: ['Router & Switch Configuration', 'IP Addressing & Subnetting', 'Network Troubleshooting', 'VLAN Setup', 'Wireless Networking'],
    colorClass: 'blue',
    gradientFrom: '#2563EB',
    gradientTo: '#1D4ED8',
  },
  {
    track: 'cctv',
    title: 'CCTV Camera Installation & Security Systems',
    shortTitle: 'CCTV & Security',
    description:
      'Learn to install, configure, and maintain professional surveillance systems. Cover both analog and IP-based cameras, DVR/NVR setup, and enterprise monitoring solutions.',
    careerPaths: ['CCTV Technician', 'Security Systems Installer', 'Surveillance Support Technician'],
    skills: ['CCTV Installation', 'DVR/NVR Configuration', 'IP Camera Networking', 'Cable Installation', 'Security Monitoring'],
    colorClass: 'slate',
    gradientFrom: '#475569',
    gradientTo: '#1E293B',
  },
  {
    track: 'embedded-systems',
    title: 'Embedded Systems',
    shortTitle: 'Embedded Systems',
    description:
      'Build intelligent hardware-software systems with microcontrollers and IoT devices. Program Arduino and Raspberry Pi, interface sensors, and develop real-time embedded applications.',
    careerPaths: ['Embedded Systems Developer', 'IoT Technician', 'Hardware Support Engineer'],
    skills: ['Embedded C Programming', 'Arduino & Raspberry Pi', 'Sensor Integration', 'IoT Development', 'Hardware Interfacing'],
    colorClass: 'emerald',
    gradientFrom: '#059669',
    gradientTo: '#065F46',
  },
  {
    track: 'software-development',
    title: 'Software Development (Full Stack)',
    shortTitle: 'Software Development',
    description:
      'Build complete web applications from frontend to backend. Learn React, Node.js, REST APIs, databases, and modern deployment — including AI API integration.',
    careerPaths: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Software Engineer'],
    skills: ['React & Next.js', 'Node.js & REST APIs', 'MongoDB & PostgreSQL', 'Authentication & Security', 'AI API Integration'],
    colorClass: 'violet',
    gradientFrom: '#7C3AED',
    gradientTo: '#5B21B6',
  },
];

// Required skills per track — used by the AI skill gap analysis engine.
export const TRACK_REQUIRED_SKILLS: Record<RecommendedTrack, string[]> = {
  'software-development': [
    'HTML',
    'CSS',
    'JavaScript',
    'React.js',
    'Node.js',
    'REST APIs',
    'MongoDB',
    'Authentication',
    'Git/GitHub',
    'Deployment',
  ],
  networking: [
    'OSI Model',
    'TCP/IP',
    'IP Addressing',
    'Subnetting',
    'Router Configuration',
    'Switch Configuration',
    'VLANs',
    'Wireless Networking',
    'Cisco IOS CLI',
    'Network Troubleshooting',
  ],
  cctv: [
    'Camera Types (Analog/IP)',
    'DVR/NVR Setup',
    'Cable Installation',
    'IP Camera Networking',
    'PoE Technology',
    'Video Compression',
    'ONVIF Standard',
    'Remote Monitoring',
    'Storage Planning',
    'Security Compliance',
  ],
  'embedded-systems': [
    'Microcontroller Architecture',
    'Embedded C',
    'GPIO Programming',
    'PWM & ADC',
    'I2C Protocol',
    'SPI Protocol',
    'UART Communication',
    'Arduino',
    'Raspberry Pi',
    'RTOS Basics',
  ],
};

// Maps each interest option text to its track slug.
// Options are always in a fixed order: networking, embedded-systems, cctv, software-development.
export const INTEREST_OPTION_TO_TRACK: Record<string, RecommendedTrack> = {
  'Computer networks, routers, and internet infrastructure': 'networking',
  'Hardware programming, microcontrollers, and IoT devices': 'embedded-systems',
  'Security cameras, surveillance systems, and physical security': 'cctv',
  'Web applications, software, and programming': 'software-development',
  'Network Technician or IT Support Specialist': 'networking',
  'Embedded Systems Developer or IoT Technician': 'embedded-systems',
  'CCTV Technician or Security Systems Installer': 'cctv',
  'Full Stack Developer or Software Engineer': 'software-development',
  'Configuring routers and setting up office networks': 'networking',
  'Programming a microcontroller to read sensor data': 'embedded-systems',
  'Installing and configuring a CCTV monitoring system': 'cctv',
  'Building a web application or REST API': 'software-development',
  'Managing network infrastructure and connectivity': 'networking',
  'Developing embedded software for IoT hardware': 'embedded-systems',
  'Maintaining surveillance systems and security setups': 'cctv',
  'Writing code for web or mobile applications': 'software-development',
};

// Static interest questions prepended to every placement assessment.
// correctAnswer is unused for interest questions (points: 0, not graded).
export const STATIC_INTEREST_QUESTIONS = [
  {
    id: 'interest_1',
    type: 'multiple-choice' as const,
    question: 'Which area of technology interests you most?',
    options: [
      'Computer networks, routers, and internet infrastructure',
      'Hardware programming, microcontrollers, and IoT devices',
      'Security cameras, surveillance systems, and physical security',
      'Web applications, software, and programming',
    ],
    correctAnswer: '',
    explanation: 'This helps us recommend the right learning track for you.',
    level: 'interest' as const,
    points: 0,
  },
  {
    id: 'interest_2',
    type: 'multiple-choice' as const,
    question: 'Which career path appeals to you most?',
    options: [
      'Network Technician or IT Support Specialist',
      'Embedded Systems Developer or IoT Technician',
      'CCTV Technician or Security Systems Installer',
      'Full Stack Developer or Software Engineer',
    ],
    correctAnswer: '',
    explanation: 'This helps us recommend the right learning track for you.',
    level: 'interest' as const,
    points: 0,
  },
  {
    id: 'interest_3',
    type: 'multiple-choice' as const,
    question: 'What type of hands-on project would you enjoy most?',
    options: [
      'Configuring routers and setting up office networks',
      'Programming a microcontroller to read sensor data',
      'Installing and configuring a CCTV monitoring system',
      'Building a web application or REST API',
    ],
    correctAnswer: '',
    explanation: 'This helps us recommend the right learning track for you.',
    level: 'interest' as const,
    points: 0,
  },
  {
    id: 'interest_4',
    type: 'multiple-choice' as const,
    question: 'In your ideal role, you would spend most of your time:',
    options: [
      'Managing network infrastructure and connectivity',
      'Developing embedded software for IoT hardware',
      'Maintaining surveillance systems and security setups',
      'Writing code for web or mobile applications',
    ],
    correctAnswer: '',
    explanation: 'This helps us recommend the right learning track for you.',
    level: 'interest' as const,
    points: 0,
  },
];
