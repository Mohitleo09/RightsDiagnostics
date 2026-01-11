import mongoose from "mongoose";

// Delete existing model to force schema reload
// But only if mongoose is already defined (server side)
if (typeof window === 'undefined' && mongoose.models && mongoose.models.AdminModulePermissions) {
  delete mongoose.models.AdminModulePermissions;
}

const ModuleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
});

const AdminModulePermissionsSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['admin', 'support'],
    unique: true,
  },
  modules: {
    type: [ModuleSchema],
    required: true,
  },
}, {
  timestamps: true,
});

const AdminModulePermissions = mongoose.models.AdminModulePermissions || 
  mongoose.model('AdminModulePermissions', AdminModulePermissionsSchema);

export default AdminModulePermissions;