import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CourseModel, UserModel } from '@/database/models';

// POST /api/admin/seed-courses
// Seeds the 4 core internship training courses across 3 difficulty levels (12 total).
// Admin-only. Safe to call multiple times — skips courses that already exist by title.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  // Assign courses to the first admin user as instructor.
  const instructor = await UserModel.findOne({ role: 'admin' }).select('_id');
  if (!instructor) {
    return NextResponse.json({ error: 'No admin user found to assign as instructor' }, { status: 500 });
  }

  const COURSES = [
    // ── NETWORKING ─────────────────────────────────────────────────────────────
    {
      title: 'Introduction to Networking (Cisco Basics)',
      description:
        'Learn computer networking fundamentals using Cisco-based concepts. Covers OSI and TCP/IP models, IP addressing, routing and switching basics, and hands-on Cisco router configuration.',
      category: 'Networking',
      difficulty: 'beginner',
      duration: '6 weeks',
      learningObjectives: [
        'Understand OSI and TCP/IP networking models',
        'Configure basic IP addressing and subnetting',
        'Set up and troubleshoot Cisco routers and switches',
        'Implement basic network security practices',
      ],
      skillsCovered: ['OSI Model', 'TCP/IP', 'IP Addressing', 'Subnetting', 'Cisco IOS', 'Network Security Basics'],
    },
    {
      title: 'Advanced Cisco Configuration & VLANs',
      description:
        'Deepen your networking skills with VLAN design, inter-VLAN routing, wireless networking setup, and structured troubleshooting methodologies using Cisco equipment.',
      category: 'Networking',
      difficulty: 'intermediate',
      duration: '6 weeks',
      learningObjectives: [
        'Design and configure VLANs and trunking',
        'Implement inter-VLAN routing',
        'Set up and secure wireless networks',
        'Apply systematic network troubleshooting techniques',
      ],
      skillsCovered: ['VLAN Design', 'Trunking', 'Inter-VLAN Routing', 'Wireless Networking', 'Network Troubleshooting'],
    },
    {
      title: 'Network Security & Architecture Design',
      description:
        'Master enterprise network security — firewall configuration, ACLs, VPNs, network monitoring, and best practices for securing critical infrastructure.',
      category: 'Networking',
      difficulty: 'advanced',
      duration: '8 weeks',
      learningObjectives: [
        'Design secure network architectures',
        'Configure firewalls, ACLs, and VPNs',
        'Implement network monitoring and intrusion detection',
        'Conduct network security audits',
      ],
      skillsCovered: ['Firewall Configuration', 'ACLs', 'VPN Setup', 'Network Monitoring', 'Intrusion Detection', 'Security Auditing'],
    },

    // ── CCTV & SECURITY ────────────────────────────────────────────────────────
    {
      title: 'Introduction to CCTV Systems',
      description:
        'Get started with surveillance technology. Learn the types of cameras, basic cabling, DVR/NVR setup, and the principles behind security monitoring.',
      category: 'CCTV Camera Systems',
      difficulty: 'beginner',
      duration: '4 weeks',
      learningObjectives: [
        'Identify different types of CCTV cameras and their use cases',
        'Install and connect basic CCTV equipment',
        'Configure a DVR/NVR for recording and playback',
        'Follow security best practices for surveillance setups',
      ],
      skillsCovered: ['Camera Types', 'Coaxial & UTP Cabling', 'DVR Configuration', 'NVR Setup', 'Surveillance Monitoring'],
    },
    {
      title: 'IP Camera Networking & Advanced DVR/NVR Setup',
      description:
        'Configure IP cameras over TCP/IP networks, integrate them with NVR systems, and set up remote monitoring — including port forwarding and mobile access.',
      category: 'CCTV Camera Systems',
      difficulty: 'intermediate',
      duration: '5 weeks',
      learningObjectives: [
        'Configure IP cameras and assign network addresses',
        'Set up remote access and mobile monitoring',
        'Integrate multiple cameras into an NVR system',
        'Troubleshoot common IP camera connectivity issues',
      ],
      skillsCovered: ['IP Camera Configuration', 'Network Addressing', 'Remote Access', 'Port Forwarding', 'NVR Integration'],
    },
    {
      title: 'Enterprise Surveillance System Design',
      description:
        'Design and deploy large-scale surveillance solutions: camera placement planning, bandwidth calculation, storage architecture, and compliance with privacy regulations.',
      category: 'CCTV Camera Systems',
      difficulty: 'advanced',
      duration: '6 weeks',
      learningObjectives: [
        'Plan multi-camera deployments for large facilities',
        'Calculate storage and bandwidth requirements',
        'Implement redundancy and failover for critical systems',
        'Ensure compliance with data protection regulations',
      ],
      skillsCovered: ['Camera Placement Planning', 'Bandwidth Calculation', 'Storage Architecture', 'Redundancy Design', 'Data Protection Compliance'],
    },

    // ── EMBEDDED SYSTEMS ───────────────────────────────────────────────────────
    {
      title: 'Introduction to Embedded Systems',
      description:
        'Explore the world of hardware-software integration. Learn microcontroller fundamentals, basic sensor interfacing, and write your first embedded C programs on Arduino.',
      category: 'Embedded Systems',
      difficulty: 'beginner',
      duration: '6 weeks',
      learningObjectives: [
        'Understand microcontroller architecture and peripherals',
        'Write and flash basic embedded C programs',
        'Interface LEDs, buttons, and simple sensors',
        'Read datasheets and understand pin mappings',
      ],
      skillsCovered: ['Microcontroller Architecture', 'Embedded C', 'GPIO Control', 'Sensor Interfacing', 'Datasheet Reading'],
    },
    {
      title: 'Arduino, Raspberry Pi & IoT Fundamentals',
      description:
        'Build IoT-connected devices using Arduino and Raspberry Pi. Cover serial communication protocols (UART, I2C, SPI), cloud integration, and real-time data collection.',
      category: 'Embedded Systems',
      difficulty: 'intermediate',
      duration: '7 weeks',
      learningObjectives: [
        'Use I2C and SPI to connect sensors and displays',
        'Build Raspberry Pi projects with Linux-based control',
        'Send sensor data to cloud platforms',
        'Implement basic real-time processing loops',
      ],
      skillsCovered: ['I2C Protocol', 'SPI Protocol', 'Raspberry Pi Linux', 'IoT Cloud Integration', 'Real-Time Processing'],
    },
    {
      title: 'Real-Time Systems & Hardware Design',
      description:
        'Advance to professional embedded engineering — RTOS concepts, interrupt-driven design, power management, and PCB layout fundamentals for production-ready IoT products.',
      category: 'Embedded Systems',
      difficulty: 'advanced',
      duration: '8 weeks',
      learningObjectives: [
        'Apply RTOS concepts: tasks, queues, semaphores',
        'Design interrupt-driven, low-power firmware',
        'Read and create basic schematic diagrams',
        'Evaluate trade-offs in embedded system design',
      ],
      skillsCovered: ['RTOS', 'Interrupt-Driven Design', 'Power Management', 'PCB Layout', 'Embedded System Architecture'],
    },

    // ── SOFTWARE DEVELOPMENT ───────────────────────────────────────────────────
    {
      title: 'Full Stack Web Development — Frontend Fundamentals',
      description:
        'Build responsive, modern web interfaces using HTML, CSS, JavaScript, and React. Learn component-based UI design with Tailwind CSS and state management basics.',
      category: 'Software Development',
      difficulty: 'beginner',
      duration: '8 weeks',
      learningObjectives: [
        'Structure web pages with semantic HTML5',
        'Style layouts using CSS and Tailwind CSS',
        'Write interactive JavaScript (ES6+)',
        'Build component-based UIs with React',
      ],
      skillsCovered: ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'React', 'Component-Based Design'],
    },
    {
      title: 'Backend Development with Node.js & REST APIs',
      description:
        'Create production-ready backends using Node.js, Express, and MongoDB. Cover authentication, REST API design, database integration, and deployment fundamentals.',
      category: 'Software Development',
      difficulty: 'intermediate',
      duration: '8 weeks',
      learningObjectives: [
        'Build and document REST APIs with Express',
        'Implement JWT authentication and authorization',
        'Model data with Mongoose/MongoDB',
        'Deploy a Node.js application to a cloud platform',
      ],
      skillsCovered: ['Node.js', 'Express.js', 'REST API Design', 'JWT Authentication', 'MongoDB', 'Cloud Deployment'],
    },
    {
      title: 'Advanced Full Stack with AI Integration',
      description:
        'Bring full-stack projects to the next level — Next.js App Router, NestJS microservices, PostgreSQL, AI API integration (OpenAI/Claude), testing, and CI/CD pipelines.',
      category: 'Software Development',
      difficulty: 'advanced',
      duration: '10 weeks',
      learningObjectives: [
        'Architect full-stack applications with Next.js App Router',
        'Integrate AI APIs to build intelligent features',
        'Write unit and integration tests',
        'Set up CI/CD pipelines with GitHub Actions',
      ],
      skillsCovered: ['Next.js App Router', 'NestJS', 'PostgreSQL', 'AI API Integration', 'Testing', 'CI/CD Pipelines'],
    },
  ];

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const course of COURSES) {
    try {
      const exists = await CourseModel.findOne({ title: course.title });
      if (exists) {
        results.skipped++;
        continue;
      }
      await CourseModel.create({
        ...course,
        instructorId: instructor._id,
        isPublished: true,
      });
      results.created++;
    } catch (err) {
      results.errors.push(`${course.title}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Seeding complete. Created: ${results.created}, Skipped (already exist): ${results.skipped}`,
    errors: results.errors,
  });
}
