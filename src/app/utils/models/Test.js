import mongoose from "mongoose";

const TestSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
  },
  organ: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  // Modified actualPrice to support vendor-specific pricing
  actualPrice: {
    type: mongoose.Schema.Types.Mixed, // Can be string or object with vendor-specific prices
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  availableAtLabs: {
    type: String,
    default: '',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  // New fields for step 2
  overview: {
    type: String,
    default: '',
  },
  testPreparation: {
    type: [{
      point: { type: String }
    }],
    default: [],
  },
  importance: {
    type: [{
      point: { type: String }
    }],
    default: [],
  },
  youtubeLinks: {
    type: [String],
    default: [],
  },
  // Category field for demographic filtering
  category: {
    type: [{
      type: String,
      enum: ['Men', 'Women', 'Kids', 'Couples', 'Elders']
    }],
    default: [],
  },
  vendorId: {
    type: String,
    required: true,
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

// Add logging to see when the model is being used
console.log("Test model loaded");

// Delete existing model if it exists to ensure schema updates are applied
if (mongoose.models.Test) {
  delete mongoose.models.Test;
  console.log("Existing Test model deleted, will recreate with new schema");
}

const Test = mongoose.model("Test", TestSchema);

console.log("Test model initialized with String price type");

export default Test;