import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    default: 'razorpay',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

export default Payment;
