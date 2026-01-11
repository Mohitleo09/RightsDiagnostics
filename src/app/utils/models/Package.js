import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: [true, "Package name is required"],
  },
  category: {
    type: [{
      type: String
    }],
    required: [true, "At least one category is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
  },
  discount: {
    type: Number,
    default: 0,
  },
  includedTests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, "At least one test must be included"],
  }],
  isPopular: {
    type: Boolean,
    default: false,
  },
  overview: {
    type: String,
    default: '',
  },
  testPreparation: [{
    type: String,
  }],
  importance: [{
    type: String,
  }],
  youtubeLinks: [{
    type: String,
  }],
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
PackageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Remove the existing model if it exists to avoid caching issues
if (mongoose.models.Package) {
  delete mongoose.models.Package;
}

const Package = mongoose.model("Package", PackageSchema);

export default Package;