import NextAuth from "next-auth"
import CredentialProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import UserModel from "./utils/models/User"
import VendorModel from "./utils/models/Vendor"
import AdminModel from "./utils/models/Admin" // Import Admin model
import bcrypt from "bcryptjs"
import DBConnection from "./utils/config/db"

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
    providers: [
        CredentialProvider({
            name: 'credentials',

            async authorize(credentials) {
                try {
                    // Ensure database connection before using models
                    await DBConnection()

                    // 1. Secure Bypass for Server Actions
                    // If the caller provides the correct secret (only available on server),
                    // we trust the provided user object.
                    const secret = process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY || "rk12345";
                    if (credentials?.bypass_secret === secret && credentials?.user_json) {
                        try {
                            const user = JSON.parse(credentials.user_json);
                            console.log('Authorize: Using secure bypass for user:', user.email);
                            return user;
                        } catch (e) {
                            console.error('Authorize: Failed to parse user_json', e);
                            return null;
                        }
                    }

                    // 2. Standard Credentials Login (for client-side calls)
                    console.log('Authorize callback started for:', credentials?.email);

                    // Support login with email, phone, or username
                    let user = null;

                    // First check in User collection
                    if (credentials?.email) {
                        // Check if it's a phone number (starts with +)
                        if (credentials.email.startsWith('+')) {
                            user = await UserModel.findOne({ phone: credentials.email })
                        }
                        // Check if it's an email
                        else if (credentials.email.includes('@')) {
                            user = await UserModel.findOne({ email: credentials.email })
                        }
                        // Otherwise treat it as username
                        else {
                            user = await UserModel.findOne({ username: credentials.email })
                        }
                    }

                    // If not found in User collection, check in Vendor collection
                    if (!user) {
                        // Check if it's a phone number (starts with +)
                        if (credentials?.email.startsWith('+')) {
                            user = await VendorModel.findOne({ phone: credentials.email })
                        }
                        // Check if it's an email
                        else if (credentials?.email.includes('@')) {
                            user = await VendorModel.findOne({ email: credentials.email })
                        }
                        // Otherwise treat it as username
                        else {
                            user = await VendorModel.findOne({ username: credentials.email })
                        }

                        // If user is a vendor, check approval status
                        if (user && user.role === 'vendor') {
                            if (user.approvalStatus !== 'approved') {
                                console.log('Vendor login attempt while pending approval for:', credentials.email);
                                return null;
                            }
                        }
                    }

                    // If not found in Vendor collection, check in Admin collection
                    if (!user) {
                        // Check if it's an email
                        if (credentials?.email.includes('@')) {
                            user = await AdminModel.findOne({ email: credentials.email })
                        }
                        // Otherwise treat it as username
                        else {
                            user = await AdminModel.findOne({ username: credentials.email })
                        }
                    }

                    if (!user) {
                        console.log('Authorize: User not found');
                        return null;
                    }

                    // Compare password with hashed password
                    const isPasswordValid = await bcrypt.compare(credentials?.password, user.password)
                    if (!isPasswordValid) {
                        console.log('Authorize: Invalid password');
                        return null;
                    }

                    console.log('Authorize: Success for user:', user.email, user.role);

                    // Return user object with appropriate fields
                    return {
                        id: user._id.toString(),
                        name: user.name || user.username,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        username: user.username,
                        labName: user.labName, // Include labName for vendors
                        approvalStatus: user.approvalStatus // Include approvalStatus for vendors
                    }
                } catch (error) {
                    console.error("Auth error in authorize callback:", error)
                    // Return specific error message for vendor approval issues
                    if (error.message === 'Your account is not yet approved. Please wait for admin approval.') {
                        throw error;
                    }
                    return null;
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        })
    ],
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET_KEY || "rk12345",
    session: {
        strategy: "jwt",
    },
    trustHost: true,
    pages: {
        signIn: '/login',
        error: '/login'
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // console.log('JWT callback - token:', token, 'user:', user);
            if (user) {
                token.userId = user.id;
                token.username = user.username || user.name; // Use username if available, otherwise name
                token.role = user.role;
                token.email = user.email;
                token.phone = user.phone;
                token.labName = user.labName; // Include labName for vendors
                token.approvalStatus = user.approvalStatus; // Include approvalStatus for vendors
            }
            if (account) {
                token.accessToken = account.access_token;
            }
            return token
        },
        async session({ session, token }) {
            // console.log('Session callback - session:', session, 'token:', token);
            if (token) {
                session.userId = token.userId;
                session.username = token.username;
                session.role = token.role;
                session.email = token.email;
                session.phone = token.phone;
                session.accessToken = token.accessToken;
                // Add complete user object for better compatibility
                session.user = {
                    ...session.user,
                    id: token.userId,
                    name: token.username,
                    username: token.username,
                    email: token.email,
                    phone: token.phone,
                    role: token.role,
                    labName: token.labName, // Include labName for vendors
                    approvalStatus: token.approvalStatus // Include approvalStatus for vendors
                };
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            console.log('SignIn callback - user:', user.email, 'provider:', account?.provider);
            // Handle Google sign-in and user creation
            if (account.provider === "google") {
                try {
                    await DBConnection();

                    // Check if user already exists
                    let existingUser = await UserModel.findOne({ email: user.email });

                    // If user doesn't exist, create a new one
                    if (!existingUser) {
                        // Generate a username from the email
                        const baseUsername = user.email.split('@')[0];

                        // Check if username already exists and generate a unique one if needed
                        let username = baseUsername;
                        let counter = 1;
                        while (await UserModel.findOne({ username: username })) {
                            username = `${baseUsername}_${counter}`;
                            counter++;
                        }

                        // Use the name from Google profile
                        const googleName = user.name || profile.name || profile.given_name || profile.family_name ?
                            `${profile.given_name || ''} ${profile.family_name || ''}`.trim() :
                            user.email.split('@')[0];

                        existingUser = new UserModel({
                            name: googleName,
                            username: username,
                            email: user.email,
                            phone: '', // Will be added later by user
                            role: 'user',
                            isVerified: true, // Google users are automatically verified for email
                            profileImage: user.image || profile.picture || null
                        });

                        await existingUser.save();
                    }

                    // Update user info if needed
                    user.id = existingUser._id.toString();
                    user.role = existingUser.role;
                    user.username = existingUser.username;
                    user.phone = existingUser.phone;

                    // Use the name from Google profile
                    const googleName = profile.name || profile.given_name || profile.family_name ?
                        `${profile.given_name || ''} ${profile.family_name || ''}`.trim() :
                        existingUser.name;
                    user.name = googleName;

                    // Set verification status for Google users
                    user.isVerified = true; // Google users are automatically verified for email
                    user.isPhoneVerified = existingUser.isPhoneVerified || false; // Keep existing phone verification status

                    console.log('Google sign-in successful for user:', user.email);
                    return true;
                } catch (error) {
                    console.error("Google sign-in error:", error);
                    return false;
                }
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Check if baseUrl exists
            const base = baseUrl || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

            // Allow Google OAuth to complete without redirecting
            if (url?.startsWith("https://accounts.google.com")) {
                return url;
            }

            // Handle Google callback
            if (url?.includes("/api/auth/callback/google")) {
                return url;
            }

            // Check if there's a callback URL specified
            try {
                if (url) {
                    const urlObj = url.startsWith('http') ? new URL(url) : new URL(url, base);
                    const callbackUrl = urlObj.searchParams.get("callbackUrl");
                    if (callbackUrl) {
                        return callbackUrl;
                    }
                }
            } catch (error) {
                console.log("Error parsing URL in redirect callback:", error);
            }

            // Redirect users to patient dashboard after login
            // Ensure we return an absolute URL if possible, or at least a safe relative one
            if (url?.startsWith(base)) return url;
            if (url?.startsWith("/")) return `${base}${url}`;
            return `${base}/Patients/Dashboard`;
        }
    }
})