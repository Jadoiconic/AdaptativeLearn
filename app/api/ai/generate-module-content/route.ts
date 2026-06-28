import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface ModuleContentResult {
  learningObjectives: string[];
  skillsCovered: string[];
  internshipOutcomes: string[];
  estimatedTime: string;
  difficulty: string;
  quizTopics: string[];
}

const PROMPT = (title: string, description: string) => `You are an educational AI assistant for an internship training platform.

Based on the module title and description below, generate structured learning content.

Module Title: ${title}
Module Description: ${description}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "learningObjectives": [
    "Understand the core concepts of the topic",
    "Apply knowledge to practical scenarios",
    "Configure and troubleshoot real-world problems",
    "Demonstrate competency in lab environments"
  ],
  "skillsCovered": [
    "Skill 1",
    "Skill 2",
    "Skill 3",
    "Skill 4"
  ],
  "internshipOutcomes": [
    "Outcome 1 describing job/internship readiness",
    "Outcome 2",
    "Outcome 3"
  ],
  "estimatedTime": "2 hours",
  "difficulty": "beginner",
  "quizTopics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4"
  ]
}

Requirements:
- learningObjectives: 4-5 items starting with action verbs (Understand, Configure, Implement, Analyze, Demonstrate)
- skillsCovered: 4-6 specific technical skills gained
- internshipOutcomes: 3-4 statements on how this prepares for real internship/employment
- estimatedTime: realistic estimate like "45 minutes", "2 hours", "1 day"
- difficulty: exactly one of "beginner", "intermediate", or "advanced"
- quizTopics: 4-5 specific topics that should be tested in a quiz
- Return ONLY raw JSON, absolutely no additional text or markdown formatting`;

function safeParseJSON(text: string): ModuleContentResult | null {
  try {
    // Strip markdown code blocks if present
    const stripped = text
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    // Extract first JSON object
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    return {
      learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives.filter((s: any) => typeof s === 'string') : [],
      skillsCovered: Array.isArray(parsed.skillsCovered) ? parsed.skillsCovered.filter((s: any) => typeof s === 'string') : [],
      internshipOutcomes: Array.isArray(parsed.internshipOutcomes) ? parsed.internshipOutcomes.filter((s: any) => typeof s === 'string') : [],
      estimatedTime: typeof parsed.estimatedTime === 'string' ? parsed.estimatedTime : '1 hour',
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'beginner',
      quizTopics: Array.isArray(parsed.quizTopics) ? parsed.quizTopics.filter((s: any) => typeof s === 'string') : [],
    };
  } catch {
    return null;
  }
}

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational curriculum designer. Always respond with valid JSON only — no markdown, no explanation, no code blocks.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message ?? res.statusText;
    throw new Error(`OpenAI API error (${res.status}): ${msg}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const model = 'gemini-1.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message ?? res.statusText;
    throw new Error(`Gemini API error (${res.status}): ${msg}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Module title and description are required.' },
        { status: 400 }
      );
    }

    const prompt = PROMPT(title.trim(), description.trim());
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const preferredProvider = process.env.AI_PROVIDER ?? 'openai';

    let rawContent = '';
    let lastError = '';

    // Try preferred provider first, then fallback
    const attempts: Array<() => Promise<string>> = [];

    if (preferredProvider === 'gemini' && geminiKey) {
      attempts.push(() => callGemini(geminiKey, prompt));
    }

    if (openaiKey) {
      // Try gpt-4o-mini first (most universally available), then gpt-4o
      attempts.push(() => callOpenAI(openaiKey, 'gpt-4o-mini', prompt));
      attempts.push(() => callOpenAI(openaiKey, 'gpt-4o', prompt));
      attempts.push(() => callOpenAI(openaiKey, 'gpt-3.5-turbo', prompt));
    }

    if (geminiKey && preferredProvider !== 'gemini') {
      attempts.push(() => callGemini(geminiKey, prompt));
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No AI API key is configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in your environment variables.',
        },
        { status: 503 }
      );
    }

    for (const attempt of attempts) {
      try {
        rawContent = await attempt();
        if (rawContent) break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error('[generate-module-content] attempt failed:', lastError);
      }
    }

    if (!rawContent) {
      return NextResponse.json(
        {
          success: false,
          error: `Unable to generate module content at the moment. ${lastError ? `Details: ${lastError}` : 'Please check your API configuration or try again.'}`,
        },
        { status: 502 }
      );
    }

    const parsed = safeParseJSON(rawContent);
    if (!parsed) {
      console.error('[generate-module-content] Failed to parse AI response:', rawContent);
      return NextResponse.json(
        {
          success: false,
          error: 'The AI returned an unexpected response format. Please try again.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-module-content] Unexpected error:', msg);
    return NextResponse.json(
      { success: false, error: `Unexpected error: ${msg}` },
      { status: 500 }
    );
  }
}
