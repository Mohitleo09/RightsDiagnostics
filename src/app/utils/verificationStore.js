// In-memory store for phone and email verification status
// In production, consider using Redis or database for persistence

class VerificationStore {
  constructor() {
    this.verifiedPhones = new Map();
    this.verifiedEmails = new Map();
    this.emailOtps = new Map();
  }

  // Mark phone as verified
  markVerified(phone) {
    this.verifiedPhones.set(phone, {
      verified: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // Increase to 15 minutes expiry
    });
  }

  // Mark email as verified
  markEmailVerified(email) {
    // Normalize email to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Marking email as verified:", normalizedEmail);
    this.verifiedEmails.set(normalizedEmail, {
      verified: true,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // Increase to 15 minutes expiry
    });
    console.log("📧 Email verification stored:", normalizedEmail);
  }

  // Check if phone is verified
  isVerified(phone) {
    const verification = this.verifiedPhones.get(phone);
    if (!verification) return false;
    
    // Check if verification has expired
    if (Date.now() > verification.expiresAt) {
      this.verifiedPhones.delete(phone);
      return false;
    }
    
    return verification.verified;
  }

  // Check if email is verified
  isEmailVerified(email) {
    // Normalize email to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Checking if email is verified:", normalizedEmail);
    const verification = this.verifiedEmails.get(normalizedEmail);
    if (!verification) {
      console.log("📧 Email not found in verified list:", normalizedEmail);
      console.log("📧 All verified emails:", Array.from(this.verifiedEmails.keys()));
      return false;
    }
    
    // Check if verification has expired
    if (Date.now() > verification.expiresAt) {
      console.log("📧 Email verification expired:", normalizedEmail);
      this.verifiedEmails.delete(normalizedEmail);
      return false;
    }
    
    console.log("📧 Email is verified:", normalizedEmail);
    return verification.verified;
  }

  // Remove phone verification (after successful registration)
  removeVerification(phone) {
    this.verifiedPhones.delete(phone);
  }

  // Remove email verification (after successful registration)
  removeEmailVerification(email) {
    // Normalize email to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Removing email verification:", normalizedEmail);
    this.verifiedEmails.delete(normalizedEmail);
  }

  // Store email OTP with 10-minute expiry
  storeEmailOtp(email, otp) {
    // Normalize email to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Storing OTP for email:", normalizedEmail, "OTP:", otp);
    console.log("📧 Email type:", typeof normalizedEmail, "Email length:", normalizedEmail.length);
    console.log("📧 OTP type:", typeof otp, "OTP length:", otp.length);
    
    this.emailOtps.set(normalizedEmail, {
      otp: otp,
      timestamp: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes expiry
    });
    console.log("📧 OTP stored for email:", normalizedEmail);
    console.log("📧 All stored emails with OTPs:", Array.from(this.emailOtps.keys()));
  }

  // Verify email OTP
  verifyEmailOtp(email, otp) {
    // Normalize email to ensure consistency
    const normalizedEmail = email.trim().toLowerCase();
    console.log("📧 Verifying OTP for email:", normalizedEmail, "OTP:", otp);
    console.log("📧 Email type:", typeof normalizedEmail, "Email length:", normalizedEmail.length);
    console.log("📧 OTP type:", typeof otp, "OTP length:", otp.length);
    
    // Log all currently stored emails for debugging
    console.log("📧 Currently stored emails with OTPs:", Array.from(this.emailOtps.keys()));
    
    // Try exact match first
    let storedOtp = this.emailOtps.get(normalizedEmail);
    
    if (!storedOtp) {
      console.log("📧 No OTP found for exact email match:", normalizedEmail);
      // Let's also check if there are any emails that are similar
      const allEmails = Array.from(this.emailOtps.keys());
      console.log("📧 All stored emails for comparison:", allEmails);
      for (const storedEmail of allEmails) {
        if (storedEmail.toLowerCase().trim() === normalizedEmail) {
          console.log("📧 Found match after normalization:", storedEmail);
          storedOtp = this.emailOtps.get(storedEmail);
          break;
        }
      }
      if (!storedOtp) {
        return false;
      }
    }
    
    console.log("📧 Stored OTP data:", storedOtp);
    console.log("📧 Stored OTP type:", typeof storedOtp.otp, "Stored OTP value:", storedOtp.otp);
    console.log("📧 Received OTP type:", typeof otp, "Received OTP value:", otp);
    
    // Check if OTP has expired
    if (Date.now() > storedOtp.expiresAt) {
      console.log("📧 OTP expired for email:", normalizedEmail);
      this.emailOtps.delete(normalizedEmail);
      return false;
    }
    
    // Check if OTP matches
    console.log("📧 Comparing OTPs - Strict equality:", storedOtp.otp === otp);
    console.log("📧 Comparing OTPs - Loose equality:", storedOtp.otp == otp);
    console.log("📧 Comparing OTPs - Both as strings:", String(storedOtp.otp) === String(otp));
    console.log("📧 Comparing OTPs - Both as numbers:", Number(storedOtp.otp) === Number(otp));
    
    // Ensure both values are strings for comparison
    const storedOtpStr = String(storedOtp.otp);
    const receivedOtpStr = String(otp);
    
    console.log("📧 Comparing as strings:", storedOtpStr === receivedOtpStr);
    
    if (storedOtpStr === receivedOtpStr) {
      console.log("📧 OTP matches for email:", normalizedEmail);
      this.emailOtps.delete(normalizedEmail);
      // Mark email as verified when OTP is successfully verified
      this.markEmailVerified(normalizedEmail);
      console.log("📧 Email marked as verified:", normalizedEmail);
      return true;
    }
    
    console.log("📧 OTP does not match for email:", normalizedEmail, "Expected:", storedOtpStr, "Received:", receivedOtpStr);
    // Don't delete the OTP on failed attempts, only on successful attempts or when expired
    return false;
  }

  // Get all verified phones (for debugging)
  getAllVerified() {
    return Array.from(this.verifiedPhones.entries());
  }

  // Get all verified emails (for debugging)
  getAllEmailVerified() {
    return Array.from(this.verifiedEmails.entries());
  }

  // Clear expired verifications
  clearExpired() {
    const now = Date.now();
    for (const [phone, verification] of this.verifiedPhones.entries()) {
      if (now > verification.expiresAt) {
        this.verifiedPhones.delete(phone);
      }
    }
    
    for (const [email, verification] of this.verifiedEmails.entries()) {
      if (now > verification.expiresAt) {
        this.verifiedEmails.delete(email);
      }
    }
    
    for (const [email, otpData] of this.emailOtps.entries()) {
      if (now > otpData.expiresAt) {
        this.emailOtps.delete(email);
      }
    }
  }
}

// Create singleton instance
const verificationStore = new VerificationStore();

// Clear expired verifications every 5 minutes
setInterval(() => {
  verificationStore.clearExpired();
}, 5 * 60 * 1000);

export default verificationStore;