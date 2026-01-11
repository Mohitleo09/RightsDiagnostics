import mongoose from 'mongoose';

const SlotLockSchema = new mongoose.Schema(
    {
        labName: {
            type: String,
            required: true,
            index: true,
        },
        appointmentDate: {
            type: String,
            required: true, // Format: YYYY-MM-DD
        },
        appointmentTime: {
            type: String, // Format: HH:MM
            required: true,
        },
        userId: {
            type: String, // User ID or Session ID
            required: true,
        },
        lockedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index: document is deleted when expiresAt is reached
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure unique lock for a specific slot at a specific lab
SlotLockSchema.index({ labName: 1, appointmentDate: 1, appointmentTime: 1 }, { unique: true });

const SlotLock = mongoose.models.SlotLock || mongoose.model('SlotLock', SlotLockSchema);

export default SlotLock;
