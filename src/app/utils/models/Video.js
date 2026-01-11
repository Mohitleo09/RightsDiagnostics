import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  videoLink: {
    type: String,
    required: true,
    trim: true
  },
  categories: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Inactive']
  }
}, {
  timestamps: true
});

const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

export default Video;