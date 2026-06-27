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

export interface AIProvider {
  name: string;
  generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz>;
  generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment>;
  generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata>;
}

function buildCourseMetadataPrompt(course: CourseMetadataInput): string {
  return `You are an expert curriculum designer for an AI-powered internship training platform.

Generate structured metadata for this course:
Title: ${course.title}
Description: ${course.description}
Category: ${course.category}
Difficulty: ${course.difficulty}

Return ONLY valid JSON with this exact structure:
{
  "skillTags": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "internshipReadinessOutcomes": [
    "Outcome 1 describing what interns will be capable of",
    "Outcome 2",
    "Outcome 3",
    "Outcome 4"
  ],
  "roadmapSuggestions": [
    "Step 1 in the learning progression",
    "Step 2",
    "Step 3"
  ]
}

Requirements:
- skillTags: 5-8 specific, industry-relevant skills from this course
- internshipReadinessOutcomes: 4-6 concrete outcomes demonstrating internship readiness
- roadmapSuggestions: 3-5 next steps or related courses for continued growth
- All content must relate to internship and employment readiness
- Return ONLY valid JSON, no additional text`;
}

function parseCourseMetadataResponse(content: string): GeneratedCourseMetadata {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  const data = JSON.parse(jsonMatch[0]);
  return {
    skillTags: Array.isArray(data.skillTags) ? data.skillTags : [],
    internshipReadinessOutcomes: Array.isArray(data.internshipReadinessOutcomes) ? data.internshipReadinessOutcomes : [],
    roadmapSuggestions: Array.isArray(data.roadmapSuggestions) ? data.roadmapSuggestions : [],
  };
}

function buildLevelAssessmentPrompt(domain: string): string {
  return `You are designing a skill-level placement test for a learner entering an internship readiness platform, in the domain of: ${domain}.

Generate exactly 12 questions structured in three tiers that genuinely discriminate skill level:
- 4 "beginner" questions: fundamental concepts and terminology
- 4 "intermediate" questions: applied problem-solving, common patterns
- 4 "advanced" questions: deeper reasoning, edge cases, optimization/design tradeoffs

Each tier must get progressively harder so that a learner who only knows the basics will answer beginner questions correctly but struggle with intermediate/advanced ones, and a learner who is already advanced will answer all three tiers correctly.

Return ONLY valid JSON with this exact structure:
{
  "title": "Skill Level Placement Assessment",
  "description": "Short description of what this assessment measures",
  "questions": [
    {
      "id": "unique-id",
      "type": "multiple-choice" | "true-false" | "short-answer",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer",
      "explanation": "Why this is correct",
      "level": "beginner" | "intermediate" | "advanced",
      "points": 10
    }
  ],
  "timeLimit": 30
}

Requirements:
- 12 questions total: exactly 4 beginner, 4 intermediate, 4 advanced (use the "level" field, not "difficulty")
- Mix of question types across the set: mostly multiple-choice and true-false, at most 2 short-answer
- Each question worth 10 points
- Time limit: 30 minutes
- Include clear, educational explanations for correct answers
- Questions must be self-contained and not reference any course material
- Return ONLY valid JSON, no additional text`;
}

function parseLevelAssessmentResponse(
  content: string,
  domain: string,
  provider: string,
  model: string
): GeneratedLevelAssessment {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const data = JSON.parse(jsonMatch[0]);
  const questions: LevelAssessmentQuestion[] = Array.isArray(data.questions) ? data.questions : [];

  const counts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const q of questions) {
    if (q.level === 'beginner' || q.level === 'intermediate' || q.level === 'advanced') {
      counts[q.level]++;
    }
  }
  if (counts.beginner === 0 || counts.intermediate === 0 || counts.advanced === 0) {
    throw new Error('Generated assessment is missing one or more skill levels');
  }

  return {
    title: data.title || 'Skill Level Placement Assessment',
    description: data.description || `Evaluate your current skill level in ${domain}`,
    questions,
    timeLimit: data.timeLimit || 30,
    metadata: {
      domain,
      generatedAt: new Date().toISOString(),
      provider,
      model,
    },
  };
}

export interface ModuleContent {
  title: string;
  description: string;
  lessons?: Array<{
    title: string;
    content?: string;
  }>;
  category?: string;
  materials?: string[];
}

class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz> {
    const prompt = this.buildPrompt(moduleContent);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational content creator. Generate professional assessment quizzes to evaluate student knowledge levels.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return this.parseQuizResponse(content, moduleContent);
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw new Error('Failed to generate quiz with OpenAI');
    }
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const prompt = buildLevelAssessmentPrompt(domain);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert assessment designer who builds skill-level placement tests that accurately distinguish beginner, intermediate, and advanced learners.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return parseLevelAssessmentResponse(content, domain, 'openai', this.model);
    } catch (error) {
      console.error('OpenAI level assessment generation error:', error);
      throw new Error('Failed to generate level assessment with OpenAI');
    }
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    const prompt = buildCourseMetadataPrompt(course);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert curriculum designer for internship training programs.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

      const data = await response.json();
      return parseCourseMetadataResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI course metadata generation error:', error);
      throw new Error('Failed to generate course metadata with OpenAI');
    }
  }

  private buildPrompt(content: ModuleContent): string {
    return `Based on this module content, automatically generate a professional pre-course assessment quiz to evaluate a new student's current knowledge level.

Module Title: ${content.title}
Description: ${content.description}
Category: ${content.category || 'General'}
${content.lessons ? `Lessons: ${content.lessons.map(l => l.title).join(', ')}` : ''}
${content.materials ? `Materials: ${content.materials.length} files attached` : ''}

Generate a JSON quiz with the following structure:
{
  "title": "Assessment Quiz for [Module Title]",
  "description": "Evaluate your knowledge of [topic]",
  "questions": [
    {
      "id": "unique-id",
      "type": "multiple-choice" | "true-false" | "short-answer",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer",
      "explanation": "Why this is correct",
      "difficulty": "easy" | "medium" | "hard",
      "points": 10
    }
  ],
  "passingScore": 70,
  "timeLimit": 30
}

Requirements:
- 10 questions total (3 easy, 4 medium, 3 hard)
- Mix of question types: 5 multiple-choice, 3 true-false, 2 short-answer
- Each question worth 10 points
- Passing score: 70%
- Time limit: 30 minutes
- Include clear explanations for correct answers
- Questions should test foundational knowledge, not just memorization
- Return ONLY valid JSON, no additional text`;
  }

  private parseQuizResponse(content: string, moduleContent: ModuleContent): GeneratedQuiz {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const quizData = JSON.parse(jsonMatch[0]);
      
      return {
        title: quizData.title || `Assessment for ${moduleContent.title}`,
        description: quizData.description || 'Evaluate your knowledge',
        questions: quizData.questions || [],
        passingScore: quizData.passingScore || 70,
        timeLimit: quizData.timeLimit || 30,
        metadata: {
          moduleTitle: moduleContent.title,
          generatedAt: new Date().toISOString(),
          provider: 'openai',
          model: this.model,
        },
      };
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Invalid quiz format from AI');
    }
  }
}

class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz> {
    const prompt = this.buildPrompt(moduleContent);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      return this.parseQuizResponse(content, moduleContent);
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error('Failed to generate quiz with Gemini');
    }
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    const prompt = buildCourseMetadataPrompt(course);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
        }
      );

      if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);

      const data = await response.json();
      return parseCourseMetadataResponse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Gemini course metadata generation error:', error);
      throw new Error('Failed to generate course metadata with Gemini');
    }
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const prompt = buildLevelAssessmentPrompt(domain);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;

      return parseLevelAssessmentResponse(content, domain, 'gemini', this.model);
    } catch (error) {
      console.error('Gemini level assessment generation error:', error);
      throw new Error('Failed to generate level assessment with Gemini');
    }
  }

  private buildPrompt(content: ModuleContent): string {
    return `You are an expert educational content creator. Generate professional assessment quizzes to evaluate student knowledge levels.

Based on this module content, automatically generate a professional pre-course assessment quiz to evaluate a new student's current knowledge level.

Module Title: ${content.title}
Description: ${content.description}
Category: ${content.category || 'General'}
${content.lessons ? `Lessons: ${content.lessons.map(l => l.title).join(', ')}` : ''}
${content.materials ? `Materials: ${content.materials.length} files attached` : ''}

Generate a JSON quiz with the following structure:
{
  "title": "Assessment Quiz for [Module Title]",
  "description": "Evaluate your knowledge of [topic]",
  "questions": [
    {
      "id": "unique-id",
      "type": "multiple-choice" | "true-false" | "short-answer",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer",
      "explanation": "Why this is correct",
      "difficulty": "easy" | "medium" | "hard",
      "points": 10
    }
  ],
  "passingScore": 70,
  "timeLimit": 30
}

Requirements:
- 10 questions total (3 easy, 4 medium, 3 hard)
- Mix of question types: 5 multiple-choice, 3 true-false, 2 short-answer
- Each question worth 10 points
- Passing score: 70%
- Time limit: 30 minutes
- Include clear explanations for correct answers
- Questions should test foundational knowledge, not just memorization
- Return ONLY valid JSON, no additional text`;
  }

  private parseQuizResponse(content: string, moduleContent: ModuleContent): GeneratedQuiz {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const quizData = JSON.parse(jsonMatch[0]);
      
      return {
        title: quizData.title || `Assessment for ${moduleContent.title}`,
        description: quizData.description || 'Evaluate your knowledge',
        questions: quizData.questions || [],
        passingScore: quizData.passingScore || 70,
        timeLimit: quizData.timeLimit || 30,
        metadata: {
          moduleTitle: moduleContent.title,
          generatedAt: new Date().toISOString(),
          provider: 'gemini',
          model: this.model,
        },
      };
    } catch (error) {
      console.error('Failed to parse quiz response:', error);
      throw new Error('Invalid quiz format from AI');
    }
  }
}

export class AIService {
  private provider: AIProvider;

  constructor() {
    const provider = process.env.AI_PROVIDER || 'openai';
    const apiKey = provider === 'gemini' 
      ? process.env.GEMINI_API_KEY 
      : process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`Missing API key for ${provider}. Set ${provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'} environment variable.`);
    }

    const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-pro' : 'gpt-4o');

    if (provider === 'gemini') {
      this.provider = new GeminiProvider(apiKey, model);
    } else {
      this.provider = new OpenAIProvider(apiKey, model);
    }
  }

  async generateQuiz(moduleContent: ModuleContent): Promise<GeneratedQuiz> {
    // Add retry logic
    const maxRetries = 3;
    let lastError: Error = new Error('Failed to generate quiz after retries');

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.provider.generateQuiz(moduleContent);
      } catch (error) {
        lastError = error as Error;
        console.error(`Quiz generation attempt ${i + 1} failed:`, error);
        
        if (i < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  async generateLevelAssessment(domain: string): Promise<GeneratedLevelAssessment> {
    const maxRetries = 3;
    let lastError: Error = new Error('Failed to generate level assessment after retries');

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.provider.generateLevelAssessment(domain);
      } catch (error) {
        lastError = error as Error;
        console.error(`Level assessment generation attempt ${i + 1} failed:`, error);

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  async generateCourseMetadata(course: CourseMetadataInput): Promise<GeneratedCourseMetadata> {
    const maxRetries = 3;
    let lastError: Error = new Error('Failed to generate course metadata after retries');

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.provider.generateCourseMetadata(course);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  getProviderName(): string {
    return this.provider.name;
  }
}

export const aiService = new AIService();
