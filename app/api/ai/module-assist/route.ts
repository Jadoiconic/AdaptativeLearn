import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, category, difficulty } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const result = await aiService.generateModuleAssist({ title, description, category, difficulty });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Module assist error:', error);
    return NextResponse.json(
      { success: false, error: 'AI generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
