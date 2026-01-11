"use server"

import DBConnection from "../utils/config/db"
import VendorModel from "../utils/models/Vendor" // Use Vendor model instead of User model
import bcrypt from "bcryptjs"

export async function createVendorAction(vendorDetails, adminEmail){
    try {
        await DBConnection()
        
        console.log("Creating vendor:", vendorDetails)

        // Check if vendor already exists in the vendors collection
        const existingVendor = await VendorModel.findOne({ email: vendorDetails.email })
        if (existingVendor) {
            return { success: false, message: "Vendor already exists with this email" }
        }

        // Hash password
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(vendorDetails.password, saltRounds)

        // Create vendor account in the vendors collection
        const newVendor = await VendorModel.create({
            username: vendorDetails.username,
            email: vendorDetails.email,   
            password: hashedPassword,
            role: "vendor", // Vendor role
            status: "active",
            labName: vendorDetails.labName,
            ownerName: vendorDetails.ownerName,
            contactEmail: vendorDetails.contactEmail,
            phone: vendorDetails.phone,
            website: vendorDetails.website,
            address: vendorDetails.address,
            createdBy: adminEmail // Track which admin created this vendor
        })
        
        return { 
            success: true, 
            message: "Vendor account created successfully",
            vendor: {
                id: newVendor._id.toString(),
                username: newVendor.username,
                email: newVendor.email,
                role: newVendor.role
            }
        }
    } catch (error) {
        console.log("Vendor creation error:", error)
        return { success: false, message: "Vendor creation failed: " + error.message }
    }
}