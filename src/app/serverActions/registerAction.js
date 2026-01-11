"use server"

import DBConnection from "../utils/config/db"
import UserModel from "../utils/models/User"
import verificationStore from "../utils/verificationStore"

export async function registerAction(registerDetails){
    try {
        await DBConnection()
        
        console.log("regAction details:", registerDetails)

        // Check if phone number is verified
        if (!verificationStore.isVerified(registerDetails.phone)) {
            return { success: false, message: "Phone number not verified. Please verify your phone number first." }
        }

        // Check if user already exists by phone number
        const existingUser = await UserModel.findOne({ phone: registerDetails.phone })
        if (existingUser) {
            // User already exists (created during OTP verification), just return success
            console.log("✅ User already exists, registration complete:", existingUser._id)
            return { success: true, message: "User registration confirmed" }
        }

        // Create user with phone-only registration
        const newUser = await UserModel.create({
            phone: registerDetails.phone,
            name: "User", // Default name
            username: "User", // Default username   
            isPhoneVerified: true, // Mark as phone verified
            isVerified: true // Mark as verified since phone is verified
        })
        
        console.log("✅ User created successfully:", newUser._id)

        // Remove verification from store after successful registration
        verificationStore.removeVerification(registerDetails.phone)
        
        return { success: true, message: "User registered successfully" }
    } catch (error) {
        console.log("Registration error:", error)
        return { success: false, message: "Registration failed: " + error.message }
    }
}