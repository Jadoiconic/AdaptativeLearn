import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { SubscriptionModel, PaymentModel } from '@/database/models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [subscription, payments] = await Promise.all([
      SubscriptionModel.findOne({ userId: session.user.id }).lean(),
      PaymentModel.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return NextResponse.json({ success: true, subscription, payments });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
