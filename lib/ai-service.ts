// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  metadata: {
    moduleTitle: string;
    generatedAt: string;
    provider: string;
    model: string;
  };
}

export interface LevelAssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'interest';
  points: number;
}

export interface GeneratedLevelAssessment {
  title: string;
  description: string;
  questions: LevelAssessmentQuestion[];
  timeLimit?: number;
  metadata: {
    domain: string;
    generatedAt: string;
    provider: string;
    model: string;
  };
}

export interface GeneratedCourseMetadata {
  skillTags: string[];
  internshipReadinessOutcomes: string[];
  roadmapSuggestions: string[];
}

export interface CourseMetadataInput {
  title: string;
  description: string;
  category: string;
  difficulty: string;
}

export interface ModuleAssistInput {
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
}

export interface GeneratedModuleAssist {
  objectives: string[];
  skillsCovered: string[];
  internshipOutcome: string;
  estimatedTime: string;
}

// ─── Skill Gap Analysis interfaces ────────────────────────────────────────────

export interface SkillGapInput {
  track: string;
  trackDescription: string;
  requiredSkills: string[];
  currentSkills: string[];
  careerGoal?: string;
  assessmentScore?: number;
}

export interface SkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedHours: number;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  skills: string[];
  topics: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ReadinessScores {
  technicalSkills: number;
  practicalReadiness: number;
  internshipReadiness: number;
  overall: number;
}

export interface SkillGapAnalysisResult {
  skillGaps: SkillGap[];
  masteredSkills: string[];
  roadmap: RoadmapPhase[];
  readinessScores: ReadinessScores;
  estimatedDuration: string;
  nextSteps: string[];
  aiNotes: string;
}

export interface AIProvider {
  name: string;
  generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz>;
  generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment>;
  generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata>;
  generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist>;
  generateSkillGapAnalysis(input: SkillGapInput): Promise<SkillGapAnalysisResult>;
}

export interface ModuleContent {
  title: string;
  description: string;
  lessons?: Array<{ title: string; content?: string }>;
  category?: string;
  materials?: string[];
}

// ─── Custom errors ─────────────────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  constructor(public readonly provider: string) {
    super(`${provider} API quota exceeded (429) — switching to fallback provider`);
    this.name = 'QuotaExceededError';
  }
}

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

// ─── Shared prompt builders ────────────────────────────────────────────────────

function buildQuizPrompt(content: ModuleContent): string {
  return `You are an expert educational content creator. Generate a professional assessment quiz.

Module Title: ${content.title}
Description: ${content.description}
Category: ${content.category || 'General'}
${content.lessons ? `Lessons: ${content.lessons.map(l => l.title).join(', ')}` : ''}

Return ONLY valid JSON with this structure:
{
  "title": "Assessment Quiz for ${content.title}",
  "description": "Evaluate your knowledge",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct",
      "difficulty": "easy",
      "points": 10
    }
  ],
  "passingScore": 70,
  "timeLimit": 30
}

Requirements: 10 questions (3 easy, 4 medium, 3 hard), mix types, 70% passing, return ONLY JSON.`;
}

function buildLevelAssessmentPrompt(domain: string): string {
  return `You are designing a skill-level placement test for the domain: ${domain}.

Generate exactly 12 questions: 4 beginner, 4 intermediate, 4 advanced.

Return ONLY valid JSON:
{
  "title": "Skill Level Placement Assessment",
  "description": "Evaluate your current skill level in ${domain}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explanation",
      "level": "beginner",
      "points": 10
    }
  ],
  "timeLimit": 30
}

Requirements: 12 questions total, 4 per level (beginner/intermediate/advanced), mostly multiple-choice/true-false, return ONLY JSON.`;
}

function buildCourseMetadataPrompt(course: CourseMetadataInput): string {
  return `You are an expert curriculum designer for an internship training platform.

Course: ${course.title}
Description: ${course.description}
Category: ${course.category}
Difficulty: ${course.difficulty}

Return ONLY valid JSON:
{
  "skillTags": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "internshipReadinessOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "roadmapSuggestions": ["Step 1", "Step 2", "Step 3"]
}`;
}

function buildModuleAssistPrompt(input: ModuleAssistInput): string {
  return `You are an expert curriculum designer for an internship training platform.

Module Title: ${input.title}
Description: ${input.description}
Category: ${input.category || 'General'}
Difficulty: ${input.difficulty || 'beginner'}

Return ONLY valid JSON:
{
  "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
  "skillsCovered": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "internshipOutcome": "One sentence about internship readiness.",
  "estimatedTime": "2 hours"
}`;
}

function buildSkillGapPrompt(input: SkillGapInput): string {
  const currentList = input.currentSkills.length > 0 ? input.currentSkills.join(', ') : 'None reported';
  return `You are an AI career counselor for a technology internship training platform. Perform a skill gap analysis.

Track: ${input.track}
Domain: ${input.trackDescription}
Required Skills for Internship Readiness: ${input.requiredSkills.join(', ')}
Student's Current Skills: ${currentList}
Career Goal: ${input.careerGoal || 'Not specified'}
Placement Assessment Score: ${input.assessmentScore != null ? input.assessmentScore + '%' : 'Not available'}

Generate a comprehensive skill gap analysis and personalized learning roadmap. Return ONLY valid JSON:
{
  "skillGaps": [
    {
      "skill": "JavaScript",
      "priority": "high",
      "reason": "Foundation required for React and Node.js",
      "estimatedHours": 40
    }
  ],
  "masteredSkills": ["HTML", "CSS"],
  "roadmap": [
    {
      "phase": 1,
      "title": "Web Fundamentals",
      "description": "Master the core building blocks",
      "skills": ["HTML", "CSS"],
      "topics": ["HTML Semantics", "CSS Layouts", "Responsive Design"],
      "estimatedDuration": "2 weeks",
      "difficulty": "beginner"
    }
  ],
  "readinessScores": {
    "technicalSkills": 20,
    "practicalReadiness": 15,
    "internshipReadiness": 10,
    "overall": 15
  },
  "estimatedDuration": "4 months",
  "nextSteps": [
    "Start with JavaScript fundamentals immediately",
    "Practice 2 hours daily for best results"
  ],
  "aiNotes": "You have a solid foundation but need to focus on programming logic."
}

Requirements:
- skillGaps must list only skills the student is MISSING from requiredSkills
- masteredSkills must list only skills the student ALREADY HAS from requiredSkills
- roadmap must have 4-6 phases covering the full learning journey
- readinessScores must be 0-100 based on skill coverage and assessment score
- Return ONLY JSON, no markdown or explanation`;
}

// ─── Shared response parsers ───────────────────────────────────────────────────

function parseJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in response');
  return JSON.parse(match[0]);
}

function parseQuizResponse(text: string, content: ModuleContent, provider: string, model: string): GeneratedQuiz {
  const data = parseJson(text);
  return {
    title: data.title || `Assessment for ${content.title}`,
    description: data.description || 'Evaluate your knowledge',
    questions: Array.isArray(data.questions) ? data.questions : [],
    passingScore: data.passingScore || 70,
    timeLimit: data.timeLimit || 30,
    metadata: { moduleTitle: content.title, generatedAt: new Date().toISOString(), provider, model },
  };
}

function parseLevelAssessmentResponse(text: string, domain: string, provider: string, model: string): GeneratedLevelAssessment {
  const data = parseJson(text);
  const questions: LevelAssessmentQuestion[] = Array.isArray(data.questions) ? data.questions : [];
  const counts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const q of questions) {
    if (q.level === 'beginner' || q.level === 'intermediate' || q.level === 'advanced') counts[q.level]++;
  }
  if (counts.beginner === 0 || counts.intermediate === 0 || counts.advanced === 0) {
    throw new Error('Assessment is missing one or more skill levels');
  }
  return {
    title: data.title || 'Skill Level Placement Assessment',
    description: data.description || `Evaluate your skill level in ${domain}`,
    questions,
    timeLimit: data.timeLimit || 30,
    metadata: { domain, generatedAt: new Date().toISOString(), provider, model },
  };
}

function parseCourseMetadataResponse(text: string): GeneratedCourseMetadata {
  const data = parseJson(text);
  return {
    skillTags: Array.isArray(data.skillTags) ? data.skillTags : [],
    internshipReadinessOutcomes: Array.isArray(data.internshipReadinessOutcomes) ? data.internshipReadinessOutcomes : [],
    roadmapSuggestions: Array.isArray(data.roadmapSuggestions) ? data.roadmapSuggestions : [],
  };
}

function parseSkillGapResponse(text: string): SkillGapAnalysisResult {
  const data = parseJson(text);
  return {
    skillGaps: Array.isArray(data.skillGaps) ? data.skillGaps : [],
    masteredSkills: Array.isArray(data.masteredSkills) ? data.masteredSkills : [],
    roadmap: Array.isArray(data.roadmap) ? data.roadmap : [],
    readinessScores: {
      technicalSkills: data.readinessScores?.technicalSkills ?? 0,
      practicalReadiness: data.readinessScores?.practicalReadiness ?? 0,
      internshipReadiness: data.readinessScores?.internshipReadiness ?? 0,
      overall: data.readinessScores?.overall ?? 0,
    },
    estimatedDuration: typeof data.estimatedDuration === 'string' ? data.estimatedDuration : '3 months',
    nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps : [],
    aiNotes: typeof data.aiNotes === 'string' ? data.aiNotes : '',
  };
}

function parseModuleAssistResponse(text: string): GeneratedModuleAssist {
  const data = parseJson(text);
  return {
    objectives: Array.isArray(data.objectives) ? data.objectives : [],
    skillsCovered: Array.isArray(data.skillsCovered) ? data.skillsCovered : [],
    internshipOutcome: typeof data.internshipOutcome === 'string' ? data.internshipOutcome : '',
    estimatedTime: typeof data.estimatedTime === 'string' ? data.estimatedTime : '',
  };
}

// ─── OpenAI Provider ───────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  name = 'openai';
  private model: string;

  constructor(private apiKey: string, model = 'gpt-4o-mini') {
    this.model = model;
  }

  private async call(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.json().catch(() => ({})) as any;
      const message = body?.error?.message || response.statusText;
      console.error(`[AI][openai] HTTP ${status}: ${message}`);
      if (status === 429) throw new QuotaExceededError('openai');
      throw new Error(`OpenAI API error (${status}): ${message}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content as string;
  }

  async generateQuiz(content: ModuleContent): Promise<GeneratedQuiz> {
    const text = await this.call(
      'You are an expert educational content creator. Return only valid JSON.',
      buildQuizPrompt(content),
      2000
    );
    return parseQuizResponse(text, content, 'openai', this.model);
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const text = await this.call(
      'You are an expert assessment designer. Return only valid JSON.',
      buildLevelAssessmentPrompt(domain),
      2500
    );
    return parseLevelAssessmentResponse(text, domain, 'openai', this.model);
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    const text = await this.call(
      'You are an expert curriculum designer. Return only valid JSON.',
      buildCourseMetadataPrompt(course),
      1000
    );
    return parseCourseMetadataResponse(text);
  }

  async generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist> {
    const text = await this.call(
      'You are an expert curriculum designer. Return only valid JSON.',
      buildModuleAssistPrompt(input),
      800
    );
    return parseModuleAssistResponse(text);
  }

  async generateSkillGapAnalysis(input: SkillGapInput): Promise<SkillGapAnalysisResult> {
    const text = await this.call(
      'You are an AI career counselor for a technology training platform. Return only valid JSON.',
      buildSkillGapPrompt(input),
      3000
    );
    return parseSkillGapResponse(text);
  }
}

// ─── Gemini Provider ───────────────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  name = 'gemini';
  private model: string;

  constructor(private apiKey: string, model = 'gemini-1.5-flash') {
    this.model = model;
  }

  private async call(prompt: string, maxTokens = 2000): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.json().catch(() => ({})) as any;
      const message = body?.error?.message || response.statusText;
      console.error(`[AI][gemini] HTTP ${status}: ${message}`);
      if (status === 429) throw new QuotaExceededError('gemini');
      throw new Error(`Gemini API error (${status}): ${message}`);
    }

    const data = await response.json() as any;
    return data.candidates[0].content.parts[0].text as string;
  }

  async generateQuiz(content: ModuleContent): Promise<GeneratedQuiz> {
    const text = await this.call(buildQuizPrompt(content), 2000);
    return parseQuizResponse(text, content, 'gemini', this.model);
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const text = await this.call(buildLevelAssessmentPrompt(domain), 2500);
    return parseLevelAssessmentResponse(text, domain, 'gemini', this.model);
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    const text = await this.call(buildCourseMetadataPrompt(course), 1000);
    return parseCourseMetadataResponse(text);
  }

  async generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist> {
    const text = await this.call(buildModuleAssistPrompt(input), 800);
    return parseModuleAssistResponse(text);
  }

  async generateSkillGapAnalysis(input: SkillGapInput): Promise<SkillGapAnalysisResult> {
    const text = await this.call(buildSkillGapPrompt(input), 3000);
    return parseSkillGapResponse(text);
  }
}

// ─── Static data for LocalTemplateProvider skill gap analysis ─────────────────

const SKILL_HOURS: Record<string, number> = {
  HTML: 15, CSS: 20, JavaScript: 60, 'React.js': 50, 'Node.js': 45, 'REST APIs': 30,
  MongoDB: 30, Authentication: 20, 'Git/GitHub': 15, Deployment: 20,
  'OSI Model': 15, 'TCP/IP': 20, 'IP Addressing': 20, Subnetting: 25,
  'Router Configuration': 30, 'Switch Configuration': 30, VLANs: 25,
  'Wireless Networking': 20, 'Cisco IOS CLI': 35, 'Network Troubleshooting': 25,
  'Camera Types (Analog/IP)': 10, 'DVR/NVR Setup': 20, 'Cable Installation': 15,
  'IP Camera Networking': 20, 'PoE Technology': 10, 'Video Compression': 15,
  'ONVIF Standard': 10, 'Remote Monitoring': 15, 'Storage Planning': 15, 'Security Compliance': 10,
  'Microcontroller Architecture': 25, 'Embedded C': 50, 'GPIO Programming': 20,
  'PWM & ADC': 20, 'I2C Protocol': 15, 'SPI Protocol': 15, 'UART Communication': 15,
  Arduino: 30, 'Raspberry Pi': 30, 'RTOS Basics': 35,
};

const TRACK_ROADMAPS: Record<string, RoadmapPhase[]> = {
  'Software Development (Full Stack)': [
    { phase: 1, title: 'Web Fundamentals', description: 'Master the core building blocks of the web', skills: ['HTML', 'CSS'], topics: ['HTML Semantics & Structure', 'CSS Layouts & Flexbox', 'Responsive Design', 'CSS Grid'], estimatedDuration: '2 weeks', difficulty: 'beginner' },
    { phase: 2, title: 'JavaScript Core', description: 'Learn the programming language of the web', skills: ['JavaScript'], topics: ['Variables & Data Types', 'Functions & Scope', 'DOM Manipulation', 'ES6+ Features', 'Async/Await & Promises'], estimatedDuration: '4 weeks', difficulty: 'beginner' },
    { phase: 3, title: 'Frontend Framework', description: 'Build modern, component-based user interfaces', skills: ['React.js'], topics: ['React Components', 'State & Props', 'Hooks (useState, useEffect)', 'React Router', 'State Management'], estimatedDuration: '3 weeks', difficulty: 'intermediate' },
    { phase: 4, title: 'Backend Development', description: 'Build server-side APIs and services', skills: ['Node.js', 'REST APIs', 'Authentication'], topics: ['Node.js & Express', 'RESTful API Design', 'JWT Authentication', 'Middleware', 'Error Handling'], estimatedDuration: '3 weeks', difficulty: 'intermediate' },
    { phase: 5, title: 'Database & Storage', description: 'Store and manage application data', skills: ['MongoDB'], topics: ['MongoDB CRUD', 'Mongoose ODM', 'Database Schema Design', 'Indexing & Queries'], estimatedDuration: '2 weeks', difficulty: 'intermediate' },
    { phase: 6, title: 'DevOps & Deployment', description: 'Ship your applications to production', skills: ['Git/GitHub', 'Deployment'], topics: ['Git Workflow', 'GitHub Collaboration', 'CI/CD Pipelines', 'Cloud Deployment', 'Environment Configuration'], estimatedDuration: '2 weeks', difficulty: 'advanced' },
  ],
  'Networking (Cisco Basics)': [
    { phase: 1, title: 'Network Fundamentals', description: 'Understand how modern networks work', skills: ['OSI Model', 'TCP/IP'], topics: ['OSI 7-Layer Model', 'TCP/IP Protocol Stack', 'Network Topologies', 'Ethernet Standards'], estimatedDuration: '2 weeks', difficulty: 'beginner' },
    { phase: 2, title: 'IP Addressing', description: 'Master IP addressing and subnetting', skills: ['IP Addressing', 'Subnetting'], topics: ['IPv4 Addressing', 'Subnet Masks', 'CIDR Notation', 'VLSM', 'IPv6 Basics'], estimatedDuration: '3 weeks', difficulty: 'beginner' },
    { phase: 3, title: 'Network Devices', description: 'Configure routers and switches', skills: ['Router Configuration', 'Switch Configuration'], topics: ['Cisco IOS Basics', 'Router Setup', 'Switch Port Configuration', 'DHCP & DNS', 'Static Routing'], estimatedDuration: '3 weeks', difficulty: 'intermediate' },
    { phase: 4, title: 'Advanced Networking', description: 'Implement VLANs and wireless networks', skills: ['VLANs', 'Wireless Networking'], topics: ['VLAN Configuration', '802.1Q Trunking', 'Inter-VLAN Routing', 'Wi-Fi Standards', 'Wireless Security'], estimatedDuration: '2 weeks', difficulty: 'intermediate' },
    { phase: 5, title: 'Cisco CLI Mastery', description: 'Advanced Cisco IOS configuration', skills: ['Cisco IOS CLI'], topics: ['Privileged EXEC Mode', 'OSPF Configuration', 'ACLs', 'NAT/PAT', 'Spanning Tree Protocol'], estimatedDuration: '3 weeks', difficulty: 'advanced' },
    { phase: 6, title: 'Security & Troubleshooting', description: 'Secure and maintain networks', skills: ['Network Troubleshooting'], topics: ['Network Security Fundamentals', 'Troubleshooting Methodology', 'Packet Analysis', 'Network Monitoring', 'Incident Response'], estimatedDuration: '2 weeks', difficulty: 'advanced' },
  ],
  'CCTV & Security Systems': [
    { phase: 1, title: 'Security Systems Basics', description: 'Understand camera types and recording systems', skills: ['Camera Types (Analog/IP)', 'DVR/NVR Setup'], topics: ['Analog vs IP Cameras', 'DVR & NVR Architecture', 'Camera Specifications', 'Recording Modes', 'System Planning'], estimatedDuration: '2 weeks', difficulty: 'beginner' },
    { phase: 2, title: 'Physical Installation', description: 'Install cables and hardware correctly', skills: ['Cable Installation', 'PoE Technology'], topics: ['RG-59 Coaxial Cabling', 'CAT5e/6 Cabling', 'PoE Standards (IEEE 802.3af/at)', 'Cable Termination', 'Camera Mounting'], estimatedDuration: '2 weeks', difficulty: 'beginner' },
    { phase: 3, title: 'IP Camera Systems', description: 'Configure networked camera systems', skills: ['IP Camera Networking', 'ONVIF Standard'], topics: ['IP Camera Configuration', 'ONVIF Integration', 'Network Setup for CCTV', 'Remote Access Setup', 'Bandwidth Management'], estimatedDuration: '2 weeks', difficulty: 'intermediate' },
    { phase: 4, title: 'Video Technology', description: 'Understand video formats and monitoring', skills: ['Video Compression', 'Remote Monitoring'], topics: ['H.264 & H.265 Compression', 'Resolution & Bitrate', 'VMS Software', 'Remote Monitoring Setup', 'Mobile Access'], estimatedDuration: '2 weeks', difficulty: 'intermediate' },
    { phase: 5, title: 'System Design & Storage', description: 'Plan and size CCTV deployments', skills: ['Storage Planning'], topics: ['Storage Calculation Formula', 'NAS & SAN Storage', 'RAID Configurations', 'Retention Policies', 'Scalable System Design'], estimatedDuration: '2 weeks', difficulty: 'intermediate' },
    { phase: 6, title: 'Security & Compliance', description: 'Secure systems and meet legal requirements', skills: ['Security Compliance'], topics: ['Cybersecurity for CCTV', 'Privacy Laws & Compliance', 'Password Management', 'Network Segmentation', 'Audit & Maintenance'], estimatedDuration: '1 week', difficulty: 'advanced' },
  ],
  'Embedded Systems': [
    { phase: 1, title: 'Hardware Fundamentals', description: 'Understand microcontroller architecture', skills: ['Microcontroller Architecture', 'GPIO Programming'], topics: ['Microcontroller Architecture', 'GPIO Concepts', 'Digital I/O', 'Pull-up/Pull-down Resistors', 'Logic Levels'], estimatedDuration: '3 weeks', difficulty: 'beginner' },
    { phase: 2, title: 'Embedded Programming', description: 'Write efficient low-level code', skills: ['Embedded C', 'PWM & ADC'], topics: ['Embedded C Syntax', 'Memory Management', 'PWM Generation', 'ADC Reading', 'Timers & Interrupts'], estimatedDuration: '3 weeks', difficulty: 'beginner' },
    { phase: 3, title: 'Communication Protocols', description: 'Interface with sensors and peripherals', skills: ['UART Communication', 'I2C Protocol', 'SPI Protocol'], topics: ['UART Serial Communication', 'I2C Master/Slave', 'SPI Full-Duplex', 'Sensor Interfacing', 'Protocol Debugging'], estimatedDuration: '3 weeks', difficulty: 'intermediate' },
    { phase: 4, title: 'Development Platforms', description: 'Build projects with Arduino and Raspberry Pi', skills: ['Arduino', 'Raspberry Pi'], topics: ['Arduino IDE & Libraries', 'Raspberry Pi Setup', 'GPIO with Python', 'Sensor Projects', 'IoT Connectivity'], estimatedDuration: '3 weeks', difficulty: 'intermediate' },
    { phase: 5, title: 'Real-Time Systems', description: 'Build reliable embedded applications', skills: ['RTOS Basics'], topics: ['RTOS Concepts', 'Task Scheduling', 'Semaphores & Mutexes', 'FreeRTOS', 'Watchdog Timers'], estimatedDuration: '3 weeks', difficulty: 'advanced' },
    { phase: 6, title: 'IoT & Capstone Projects', description: 'Build end-to-end embedded IoT systems', skills: [], topics: ['MQTT Protocol', 'Cloud Connectivity', 'Power Optimisation', 'OTA Updates', 'End-to-End IoT Projects'], estimatedDuration: '3 weeks', difficulty: 'advanced' },
  ],
};

// ─── Local Template Provider (last-resort fallback) ───────────────────────────

class LocalTemplateProvider implements AIProvider {
  name = 'local-template';

  async generateQuiz(content: ModuleContent): Promise<GeneratedQuiz> {
    const cat = content.category || 'technology';
    return {
      title: `Assessment: ${content.title}`,
      description: `Test your foundational knowledge of ${content.title}.`,
      questions: [
        {
          id: 'lt-q1', type: 'multiple-choice',
          question: `What is the primary purpose of ${content.title}?`,
          options: ['To manage systems', 'To configure networks', 'To apply concepts in real scenarios', 'To document processes'],
          correctAnswer: 'To apply concepts in real scenarios',
          explanation: 'Practical application is the core goal of any technology training module.',
          difficulty: 'easy', points: 10,
        },
        {
          id: 'lt-q2', type: 'true-false',
          question: `${content.title} is relevant to modern ${cat} careers.`,
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: `Skills in ${cat} are highly sought after in today's internship market.`,
          difficulty: 'easy', points: 10,
        },
        {
          id: 'lt-q3', type: 'multiple-choice',
          question: 'Which approach best describes effective learning in technology fields?',
          options: ['Memorisation only', 'Hands-on practice combined with theory', 'Reading documentation alone', 'Watching videos without practise'],
          correctAnswer: 'Hands-on practice combined with theory',
          explanation: 'Combining theory with practice is the most effective way to retain and apply technical skills.',
          difficulty: 'medium', points: 10,
        },
        {
          id: 'lt-q4', type: 'true-false',
          question: 'Documentation and troubleshooting skills are important in technology roles.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Documentation and problem-solving are core professional competencies in any technical role.',
          difficulty: 'medium', points: 10,
        },
        {
          id: 'lt-q5', type: 'short-answer',
          question: `Describe one real-world application of ${content.title}.`,
          correctAnswer: 'Any relevant real-world use case',
          explanation: 'Applying knowledge to real scenarios demonstrates understanding beyond memorisation.',
          difficulty: 'hard', points: 10,
        },
      ],
      passingScore: 70,
      timeLimit: 30,
      metadata: {
        moduleTitle: content.title,
        generatedAt: new Date().toISOString(),
        provider: 'local-template',
        model: 'template-v1',
      },
    };
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const beginner: LevelAssessmentQuestion[] = [
      {
        id: 'lt-b1', type: 'multiple-choice', level: 'beginner', points: 10,
        question: `What is ${domain}?`,
        options: ['A programming language', 'A field of technology study', 'A type of hardware', 'A network protocol'],
        correctAnswer: 'A field of technology study',
        explanation: `${domain} encompasses a broad area of technology skills and knowledge.`,
      },
      {
        id: 'lt-b2', type: 'true-false', level: 'beginner', points: 10,
        question: `Prior experience is required to begin learning ${domain}.`,
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Most technology fields are accessible to beginners with the right structured learning path.',
      },
      {
        id: 'lt-b3', type: 'multiple-choice', level: 'beginner', points: 10,
        question: 'Which is considered the best starting point when learning a new technology?',
        options: ['Advanced projects', 'Fundamentals and theory', 'Expert-level certifications', 'Industry conferences'],
        correctAnswer: 'Fundamentals and theory',
        explanation: 'A strong foundation in fundamentals is essential before advancing to complex topics.',
      },
      {
        id: 'lt-b4', type: 'true-false', level: 'beginner', points: 10,
        question: 'Documentation is an important skill in technology careers.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Clear documentation is essential for collaboration and maintenance in all tech roles.',
      },
    ];

    const intermediate: LevelAssessmentQuestion[] = [
      {
        id: 'lt-i1', type: 'multiple-choice', level: 'intermediate', points: 10,
        question: `Which approach is most effective for troubleshooting problems in ${domain}?`,
        options: ['Random trial and error', 'Systematic isolation and testing', 'Restarting everything', 'Ignoring the issue'],
        correctAnswer: 'Systematic isolation and testing',
        explanation: 'A methodical approach to isolating variables is the professional standard for troubleshooting.',
      },
      {
        id: 'lt-i2', type: 'true-false', level: 'intermediate', points: 10,
        question: `Security considerations are only relevant to advanced ${domain} practitioners.`,
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Security awareness is important at every skill level and must be built in from the start.',
      },
      {
        id: 'lt-i3', type: 'multiple-choice', level: 'intermediate', points: 10,
        question: 'What distinguishes an intermediate practitioner from a beginner?',
        options: [
          'Memorising more facts',
          'Applying knowledge to solve real problems independently',
          'Knowing more theory',
          'Using more expensive tools',
        ],
        correctAnswer: 'Applying knowledge to solve real problems independently',
        explanation: 'The ability to independently solve real-world problems marks the transition to intermediate level.',
      },
      {
        id: 'lt-i4', type: 'short-answer', level: 'intermediate', points: 10,
        question: `Describe a scenario where ${domain} skills would be applied in a workplace internship.`,
        correctAnswer: 'Any relevant workplace application',
        explanation: 'Connecting technical skills to real workplace scenarios demonstrates applied understanding.',
      },
    ];

    const advanced: LevelAssessmentQuestion[] = [
      {
        id: 'lt-a1', type: 'multiple-choice', level: 'advanced', points: 10,
        question: `When designing a solution in ${domain}, which factor should be prioritised first?`,
        options: ['Cost', 'Requirements and constraints', 'Speed of implementation', 'Latest technology'],
        correctAnswer: 'Requirements and constraints',
        explanation: 'Understanding requirements and constraints before choosing a solution is a hallmark of advanced practice.',
      },
      {
        id: 'lt-a2', type: 'true-false', level: 'advanced', points: 10,
        question: `Optimisation in ${domain} always improves performance without tradeoffs.`,
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Optimisation always involves tradeoffs — improving one metric often affects another.',
      },
      {
        id: 'lt-a3', type: 'multiple-choice', level: 'advanced', points: 10,
        question: 'What is the most important quality of a robust technical architecture?',
        options: ['Using the newest tools', 'Minimising initial cost', 'Scalability and maintainability', 'Maximum feature count'],
        correctAnswer: 'Scalability and maintainability',
        explanation: 'Systems that scale and can be maintained over time deliver the most long-term value.',
      },
      {
        id: 'lt-a4', type: 'short-answer', level: 'advanced', points: 10,
        question: `How would you evaluate and compare two competing approaches to solving a ${domain} problem?`,
        correctAnswer: 'Any systematic evaluation methodology',
        explanation: 'Advanced practitioners evaluate solutions using structured criteria including performance, cost, and maintainability.',
      },
    ];

    return {
      title: `${domain} Skill Level Placement Assessment`,
      description: `Evaluate your current skill level in ${domain} to receive a personalised learning roadmap.`,
      questions: [...beginner, ...intermediate, ...advanced],
      timeLimit: 30,
      metadata: {
        domain,
        generatedAt: new Date().toISOString(),
        provider: 'local-template',
        model: 'template-v1',
      },
    };
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    return {
      skillTags: [`${course.category} fundamentals`, 'Problem solving', 'Technical documentation', 'Professional practice', 'Industry standards'],
      internshipReadinessOutcomes: [
        `Apply ${course.title} skills in a real workplace setting`,
        'Communicate technical concepts clearly to team members',
        'Troubleshoot and resolve issues independently',
        'Follow industry best practices and standards',
      ],
      roadmapSuggestions: [
        `Advanced ${course.category} specialisation`,
        'Industry certification preparation',
        'Capstone project and portfolio building',
      ],
    };
  }

  async generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist> {
    return {
      objectives: [
        `Understand the core concepts of ${input.title}`,
        `Apply ${input.title} principles in practical scenarios`,
        'Identify and troubleshoot common issues',
        'Demonstrate competency through hands-on exercises',
      ],
      skillsCovered: [
        `${input.title} fundamentals`,
        'Technical problem solving',
        'Industry best practices',
        'Documentation and reporting',
      ],
      internshipOutcome: `Graduates will demonstrate practical proficiency in ${input.title}, meeting the expectations of entry-level technology roles and internship positions.`,
      estimatedTime: '2 hours',
    };
  }

  async generateSkillGapAnalysis(input: SkillGapInput): Promise<SkillGapAnalysisResult> {
    const currentSet = new Set(input.currentSkills.map((s) => s.toLowerCase().trim()));
    const masteredSkills = input.requiredSkills.filter((s) => currentSet.has(s.toLowerCase().trim()));
    const gapSkills = input.requiredSkills.filter((s) => !currentSet.has(s.toLowerCase().trim()));

    const coverageRatio = masteredSkills.length / Math.max(input.requiredSkills.length, 1);
    const assessmentBonus = input.assessmentScore != null ? input.assessmentScore * 0.2 : 0;
    const technicalSkills = Math.min(100, Math.round(coverageRatio * 80 + assessmentBonus));
    const practicalReadiness = Math.min(100, Math.round(coverageRatio * 60 + assessmentBonus * 0.5));
    const internshipReadiness = Math.min(100, Math.round(coverageRatio * 70 + assessmentBonus * 0.3));
    const overall = Math.round((technicalSkills + practicalReadiness + internshipReadiness) / 3);

    const skillGaps: SkillGap[] = gapSkills.map((skill, idx) => ({
      skill,
      priority:
        idx < Math.ceil(gapSkills.length * 0.4)
          ? 'high'
          : idx < Math.ceil(gapSkills.length * 0.7)
          ? 'medium'
          : 'low',
      reason: `${skill} is a core requirement for the ${input.track} track`,
      estimatedHours: SKILL_HOURS[skill] ?? 20,
    }));

    const roadmap = TRACK_ROADMAPS[input.track] ?? TRACK_ROADMAPS['Software Development (Full Stack)'];

    const totalWeeks = roadmap
      .filter((p) => p.skills.some((s) => gapSkills.includes(s)))
      .reduce((sum, p) => {
        const m = p.estimatedDuration.match(/(\d+)/);
        return sum + (m ? parseInt(m[1]) : 2);
      }, 0) || roadmap.reduce((sum, p) => {
        const m = p.estimatedDuration.match(/(\d+)/);
        return sum + (m ? parseInt(m[1]) : 2);
      }, 0);

    const months = Math.ceil(totalWeeks / 4);
    const firstGap = skillGaps.find((g) => g.priority === 'high') ?? skillGaps[0];

    return {
      skillGaps,
      masteredSkills,
      roadmap,
      readinessScores: { technicalSkills, practicalReadiness, internshipReadiness, overall },
      estimatedDuration: months <= 1 ? `${totalWeeks} weeks` : `${months} month${months !== 1 ? 's' : ''}`,
      nextSteps:
        gapSkills.length === 0
          ? [
              'Pursue advanced practical projects to strengthen your portfolio',
              'Complete all available assessments to confirm your mastery',
              'Explore industry certifications to boost your credibility',
              'Apply for internship positions — you are ready!',
            ]
          : [
              firstGap ? `Start with ${firstGap.skill} — it is the highest priority gap` : 'Review all high-priority skill gaps',
              'Dedicate at least 2 focused hours of practice per day',
              'Complete the module quizzes to reinforce each concept',
              'Revisit your roadmap weekly to update your skill self-assessment',
            ],
      aiNotes:
        gapSkills.length === 0
          ? `Excellent! You already possess all ${input.requiredSkills.length} required skills for the ${input.track} track. Focus on building real-world projects and refining your portfolio to maximise internship readiness.`
          : `You have mastered ${masteredSkills.length} of ${input.requiredSkills.length} required skills (${Math.round(coverageRatio * 100)}% coverage). Prioritise the ${skillGaps.filter((g) => g.priority === 'high').length} high-priority gaps to make the fastest progress toward internship readiness.`,
    };
  }
}

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', provider: string, operation: string, message: string, durationMs?: number) {
  const ts = new Date().toISOString();
  const dur = durationMs !== undefined ? ` (${durationMs}ms)` : '';
  const prefix = `[AI][${ts}][${provider}][${operation}]`;
  if (level === 'info') console.log(`${prefix} ${message}${dur}`);
  else if (level === 'warn') console.warn(`${prefix} ${message}${dur}`);
  else console.error(`${prefix} ${message}${dur}`);
}

// ─── AI Service (with fallback chain) ─────────────────────────────────────────

export class AIService {
  private providers: AIProvider[] = [];

  constructor() {
    // Primary: OpenAI (gpt-4o-mini is cost-effective and reliable)
    if (process.env.OPENAI_API_KEY) {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      this.providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY, model));
      log('info', 'openai', 'init', `Registered as provider #${this.providers.length} (model: ${model})`);
    }

    // Secondary: Gemini (generous free tier, great for dev/testing)
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      this.providers.push(new GeminiProvider(process.env.GEMINI_API_KEY, model));
      log('info', 'gemini', 'init', `Registered as provider #${this.providers.length} (model: ${model})`);
    }

    // Always available: local template (no API required)
    this.providers.push(new LocalTemplateProvider());
    log('info', 'local-template', 'init', `Registered as provider #${this.providers.length} (fallback)`);

    if (this.providers.length === 1) {
      log('warn', 'system', 'init', 'No API keys configured. Only local templates will be used. Set OPENAI_API_KEY or GEMINI_API_KEY in .env');
    }
  }

  private async withFallback<T>(
    operation: string,
    fn: (provider: AIProvider) => Promise<T>
  ): Promise<T> {
    let lastError: Error = new AIUnavailableError('No providers available');

    for (const provider of this.providers) {
      const start = Date.now();
      try {
        const result = await fn(provider);
        log('info', provider.name, operation, 'Success', Date.now() - start);
        return result;
      } catch (err: any) {
        const duration = Date.now() - start;

        if (err instanceof QuotaExceededError) {
          log('warn', provider.name, operation, `Quota exceeded — trying next provider`, duration);
          lastError = err;
          continue;
        }

        // Non-quota errors: log and still try next provider (network blip, parse error, etc.)
        log('error', provider.name, operation, `Failed: ${err.message}`, duration);
        lastError = err;

        // Don't fall through to local template for parse errors on real providers —
        // local template is always last in the list so it will run naturally.
        if (provider.name === 'local-template') break;
        continue;
      }
    }

    throw new AIUnavailableError(
      'AI generation is temporarily unavailable. All providers failed. ' +
      `Last error: ${lastError.message}`
    );
  }

  async generateQuiz(content: ModuleContent): Promise<GeneratedQuiz> {
    return this.withFallback('generateQuiz', (p) => p.generateQuiz(content));
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    return this.withFallback('generateLevelAssessment', (p) => p.generateLevelAssessment(domain));
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    return this.withFallback('generateCourseMetadata', (p) => p.generateCourseMetadata(course));
  }

  async generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist> {
    return this.withFallback('generateModuleAssist', (p) => p.generateModuleAssist(input));
  }

  async generateSkillGapAnalysis(input: SkillGapInput): Promise<SkillGapAnalysisResult> {
    return this.withFallback('generateSkillGapAnalysis', (p) => p.generateSkillGapAnalysis(input));
  }

  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }
}

export const aiService = new AIService();
