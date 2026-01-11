import { NextResponse } from "next/server";
import DBConnection from "../../../utils/config/db";
import VendorModel from "../../../utils/models/Vendor";
import nodemailer from "nodemailer";

// Ensure this route runs in the nodejs environment
export const runtime = "nodejs";

export async function POST(req) {
  try {
    await DBConnection();

    const { vendorId, action, rejectionReason } = await req.json();

    if (!vendorId || !action) {
      return NextResponse.json({
        success: false,
        error: "Vendor ID and action are required"
      }, { status: 400 });
    }

    // Find the vendor
    const vendor = await VendorModel.findById(vendorId);

    if (!vendor) {
      return NextResponse.json({
        success: false,
        error: "Vendor not found"
      }, { status: 404 });
    }

    let updatedVendor;

    if (action === "approve") {
      // Update vendor approval status to approved
      updatedVendor = await VendorModel.findByIdAndUpdate(
        vendorId,
        {
          approvalStatus: "approved",
          status: "active"
        },
        { new: true }
      );

      // Send approval email
      try {
        // Check if we're in development mode with bypass flag enabled
        const bypassEnabled = process.env.ENABLE_OTP_BYPASS === 'true';

        // If bypass is enabled, don't send real email
        if (bypassEnabled) {
          console.log("📧 Development mode - bypassing email send for vendor approval");
        } else {
          // Create transporter using Gmail with proper configuration (same as OTP system)
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          // Verify transporter configuration
          try {
            await transporter.verify();
          } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError.message);
            throw new Error(`Email service configuration error: ${verifyError.message}`);
          }

          const mailOptions = {
            from: `"Rights Diagnostics" <${process.env.EMAIL_USER}>`,
            to: vendor.contactEmail,
            subject: "Rights Diagnostics Vendor Onboarding Approved",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Rights Diagnostics Vendor Onboarding Approved</h2>
                <p>Hello ${vendor.labName},</p>
                <p>Congratulations! Your onboarding to Rights Diagnostics has been successfully approved.</p>
                <p>You can now access your vendor dashboard using the following credentials:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Email:</strong> ${vendor.email}</p>
                  <p><strong>Password:</strong> [The password you set during registration]</p>
                </div>
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/vendor/login" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Vendor Dashboard</a></p>
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br>The Rights Diagnostics Team</p>
              </div>
            `
          };

          // Send email
          await transporter.sendMail(mailOptions);
          console.log(`📧 Approval email sent successfully to ${vendor.contactEmail}`);
        }
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // We don't return an error here because we still want to approve the vendor even if email fails
      }

      return NextResponse.json({
        success: true,
        message: "Vendor approved successfully",
        vendor: updatedVendor
      });
    }
    else if (action === "reject") {
      if (!rejectionReason) {
        return NextResponse.json({
          success: false,
          error: "Rejection reason is required"
        }, { status: 400 });
      }

      // Send rejection email before deleting
      try {
        // Check if we're in development mode with bypass flag enabled
        const bypassEnabled = process.env.ENABLE_OTP_BYPASS === 'true';

        // If bypass is enabled, don't send real email
        if (bypassEnabled) {
          console.log("📧 Development mode - bypassing email send for vendor rejection");
        } else {
          // Create transporter using Gmail with proper configuration (same as OTP system)
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          // Verify transporter configuration
          try {
            await transporter.verify();
          } catch (verifyError) {
            console.error('Email transporter verification failed:', verifyError.message);
            throw new Error(`Email service configuration error: ${verifyError.message}`);
          }

          const mailOptions = {
            from: `"Rights Diagnostics" <${process.env.EMAIL_USER}>`,
            to: vendor.contactEmail,
            subject: "Rights Diagnostics Vendor Onboarding Rejected",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Rights Diagnostics Vendor Onboarding Rejected</h2>
                <p>Hello ${vendor.labName},</p>
                <p>We regret to inform you that your onboarding to Rights Diagnostics has been rejected by the admin.</p>
                <p><strong>Reason:</strong> ${rejectionReason}</p>
                <p>If you believe this was an error, please contact our support team for further assistance.</p>
                <p>Best regards,<br>The Rights Diagnostics Team</p>
              </div>
            `
          };

          // Send email
          await transporter.sendMail(mailOptions);
          console.log(`📧 Rejection email sent successfully to ${vendor.contactEmail}`);
        }
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
        // We don't return an error here because we still want to reject the vendor even if email fails
      }

      // Delete the vendor
      await VendorModel.findByIdAndDelete(vendorId);

      return NextResponse.json({
        success: true,
        message: "Vendor rejected and deleted successfully"
      });
    }
    else {
      return NextResponse.json({
        success: false,
        error: "Invalid action. Use 'approve' or 'reject'"
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Error processing vendor approval:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process vendor approval",
      message: error.message
    }, { status: 500 });
  }
}