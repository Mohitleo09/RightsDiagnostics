import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Delete existing model to force schema reload
// But only if mongoose is already defined (server side)
if (typeof window === 'undefined' && mongoose.models && mongoose.models.Admin) {
  delete mongoose.models.Admin;
}

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'support', 'other'],
    default: 'admin',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deactivated'],
    default: 'active',
  },
  name: {
    type: String,
    required: false,
  },
  // Verification fields
  isVerified: {
    type: Boolean,
    default: true, // Admins are automatically verified
  },
  verifyToken: {
    type: String,
  },
  verifyTokenExpire: {
    type: Date,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

AdminSchema.methods.getVerificationToken = function () {
  // Generate the token
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Hash the token
  this.verifyToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.verifyTokenExpire = new Date(Date.now() + 30 * 60 * 1000);

  return verificationToken;
};

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;