import mongoose from "mongoose";

const HealthPackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  includedTests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  }],
  packageIncludes: [{
    type: String,
  }],
  isMostPopular: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field on save
HealthPackageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const HealthPackage = mongoose.models.HealthPackage || mongoose.model("HealthPackage", HealthPackageSchema);

export default HealthPackage;