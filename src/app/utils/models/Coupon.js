import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null // For percentage discounts
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableFor: {
    type: String,
    enum: ['all', 'new_users', 'existing_users'],
    default: 'all'
  },
  // Add vendorId to associate coupons with specific vendors
  vendorId: {
    type: String,
    required: false // Make it optional for now, but can be required in future
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);

export default Coupon;