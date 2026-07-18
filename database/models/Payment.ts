import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'paid' | 'open' | 'void' | 'uncollectible';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripeInvoiceId: string;
  stripeSubscriptionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentIntent?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    stripeInvoiceId: {
      type: String,
      required: [true, 'Stripe invoice ID is required'],
      unique: true,
    },
    stripeSubscriptionId: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
    },
    status: {
      type: String,
      enum: ['paid', 'open', 'void', 'uncollectible'],
      required: [true, 'Status is required'],
    },
    paymentIntent: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
