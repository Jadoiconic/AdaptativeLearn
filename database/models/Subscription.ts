import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionPlan = 'starter' | 'pro' | 'pro_annual';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, 'Stripe customer ID is required'],
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: [true, 'Stripe subscription ID is required'],
      unique: true,
    },
    stripePriceId: {
      type: String,
      required: [true, 'Stripe price ID is required'],
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'pro_annual'],
      required: [true, 'Plan is required'],
    },
    status: {
      type: String,
      enum: [
        'active',
        'trialing',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused',
      ],
      required: [true, 'Status is required'],
    },
    currentPeriodEnd: {
      type: Date,
      required: [true, 'Current period end is required'],
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
