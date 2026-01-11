import mongoose from 'mongoose';

// Delete existing model to force reload
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  referenceId: {
    type: String, // For linking to bookings, refunds, etc.
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Create indexes for faster queries
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export default Transaction;