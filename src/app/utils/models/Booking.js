import mongoose from 'mongoose';

// Delete existing model to force reload
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    couponCode: {
      type: String,
      required: true,
    },
    // Test Information - Single test (for backward compatibility)
    testName: {
      type: String,
      required: false, // Made optional when using tests array
    },
    organ: {
      type: String,
      required: false, // Made optional when using tests array
    },
    isPackage: {
      type: Boolean,
      default: false,
    },
    price: {
      type: String,
      required: false, // Made optional when using tests array
    },
    // Multiple tests/packages support
    tests: {
      type: [{
        testName: {
          type: String,
          required: true,
        },
        organ: {
          type: String,
          required: true,
        },
        isPackage: {
          type: Boolean,
          default: false,
        },
        price: {
          type: String,
          required: true,
        },
        // Discount information for individual test
        discountApplied: {
          type: Boolean,
          default: false,
        },
        originalAmount: {
          type: Number,
          default: 0,
        },
        discountAmount: {
          type: Number,
          default: 0,
        },
        finalAmount: {
          type: Number,
          default: 0,
        },
        // Tests included in the package (if applicable)
        packageTests: {
          type: [String],
          default: [],
        },
      }],
      default: [],
    },
    // Lab Information
    labName: {
      type: String,
      required: true,
    },
    labAddress: {
      type: String,
      required: true,
    },
    labRating: {
      type: String,
      default: '4.5',
    },
    // Appointment Details
    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    formattedTime: {
      type: String,
      required: true,
    },
    // Patient Information
    bookingFor: {
      type: String,
      enum: ['self', 'family'],
      required: true,
    },
    patientDetails: {
      // Common fields
      contactNumber: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      specialInstructions: {
        type: String,
        default: '',
      },
      // Family member specific fields
      patientName: {
        type: String,
        default: '',
      },
      age: {
        type: String,
        default: '',
      },
      relation: {
        type: String,
        default: '',
      },
    },
    // Booking Status
    status: {
      type: String,
      enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
      default: 'Confirmed',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    // New fields for payment status, reports, and home sample collection
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'pending',
    },
    reports: {
      type: [String], // Array of report file paths/URLs
      default: [],
    },
    homeSampleCollection: {
      type: Boolean,
      default: false,
    },
    // Discount fields for coupon codes
    discountApplied: {
      type: Boolean,
      default: false,
    },
    originalAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'manual', 'coupon', 'mixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    manualDiscountPercentage: {
      type: Number,
      default: 0,
    },
    couponDiscountAmount: {
      type: Number,
      default: 0,
    },
    // User Reference (optional, for authenticated users)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create indexes for faster queries
BookingSchema.index({ bookingId: 1 });
BookingSchema.index({ labName: 1 });
BookingSchema.index({ appointmentDate: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'patientDetails.contactNumber': 1 });
BookingSchema.index({ 'patientDetails.email': 1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export default Booking;