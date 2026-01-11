import mongoose from "mongoose";

const AdvertisementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['Home Page', 'Content'],
    default: 'Home Page',
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
});

export default mongoose.models.Advertisement || mongoose.model('Advertisement', AdvertisementSchema);