import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import dbConnect from '@/app/utils/config/db';
import User from '@/app/utils/models/User';

// Hardcoded ID as fallback to ensure consistency with Frontend and prevent Env Var errors
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "812227745202-1oe4d5egbaisvu0dvls5bjqkcvg9q8tj.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(req) {
    console.log("🔹 STEP 4 (Backend): Received Google Login Request");

    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ success: false, message: 'Google token is required' }, { status: 400 });
        }

        // STEP 5: Backend verifies token with Google
        // This prevents fake tokens and confirms the token is for OUR app
        console.log("🔹 STEP 5: Verifying token with Google for Client ID:", GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Google sends us these details
        const { email, name, picture, sub: googleId } = payload;

        console.log("✅ Token Verified. User:", email);

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email not found in Google token' }, { status: 400 });
        }

        // Connect to MongoDB
        await dbConnect();

        // STEP 6: Backend finds or creates user
        // We use email as the unique identifier
        console.log("🔹 STEP 6: Finding or creating user in DB...");
        let user = await User.findOne({ email });

        if (!user) {
            console.log("🆕 User not found. Creating new user:", email);

            // Generate unique username based on email
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}_${counter}`;
                counter++;
            }

            // Create new user record
            user = new User({
                name: name,
                username: username,
                email: email,
                role: 'user', // Default role
                isVerified: true, // Google verified
                isPhoneVerified: false,
                profileImage: picture || '',
                googleId: googleId,   // Store Google ID
                authProvider: 'google', // Mark as Google User
            });

            await user.save();
            console.log("✅ New User Saved:", user._id);
        } else {
            console.log("👤 Existing User found:", user._id);

            // Update existing user with Google details if missing (Linking account)
            let updated = false;

            if (!user.googleId) {
                console.log("🔗 Linking Google ID to existing user");
                user.googleId = googleId;
                user.authProvider = 'google';
                updated = true;
            }

            // Update profile image if missing
            if (!user.profileImage && picture) {
                user.profileImage = picture;
                updated = true;
            }

            if (updated) {
                await user.save();
                console.log("✅ User Updated");
            }
        }

        // STEP 7: Backend issues ITS OWN JWT
        // This JWT controls access to our APIs
        console.log("🔹 STEP 7: Issuing App JWT...");
        const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "rk12345";

        const jwtToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                username: user.username
            },
            secret,
            { expiresIn: '30d' }
        );

        // Success Response
        const responseData = {
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                profileImage: user.profileImage,
                dob: user.dob,
                gender: user.gender
            }
        };

        const response = NextResponse.json(responseData);

        // EXTRA: Set cookie for Middleware Compatibility
        // This ensures protected routes (checked by middleware) allow this user to pass
        response.cookies.set({
            name: 'authToken',
            value: jwtToken,
            httpOnly: false, // Allow client access if needed, mainly for Middleware
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        console.log("✅ Login Successful, Token Sent");
        return response;

    } catch (error) {
        console.error("❌ Google Login Implementation Error:", error);
        return NextResponse.json(
            { success: false, message: 'Google login failed', error: error.message },
            { status: 500 }
        );
    }
}
