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

export interface AIProvider {
  name: string;
  generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz>;
  generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment>;
  generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata>;
  generateModuleAssist(input: ModuleAssistInput): Promise<GeneratedModuleAssist>;
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
}

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

  getProviderNames(): string[] {
    return this.providers.map((p) => p.name);
  }
}

export const aiService = new AIService();
