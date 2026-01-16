# Google Login Implementation Guide (Manual Flow)

This guide documents the implementation of a secure "Continue with Google" login flow using Google Identity Services (GIS) and a custom backend for verification and JWT issuance. This approach provides full control over user creation and authentication state.

## 1. Prerequisites
- A Google Cloud Project with OAuth 2.0 Credentials.
- Authorized JavaScript Origins: `http://localhost:3000` (and `http://localhost`).
- **Required Packages**:
  ```bash
  npm install google-auth-library jsonwebtoken
  ```

## 2. Environment Variables
Ensure your `.env.local` contains:
```env
# Google Client ID (From Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# JWT Secret for signing tokens
JWT_SECRET=your_super_secure_secret
```

---

## 3. Database Schema Update
Add `googleId` and `authProvider` fields to your User model to track Google users.

**File:** `src/app/utils/models/User.js`
```javascript
const UserSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // New fields for tracking Google Login
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null for non-Google users
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google', 'otp'],
    default: 'credentials',
  },
}, { timestamps: true });
```

---

## 4. Frontend Implementation
Render the Google Button and handle the callback manually.

**File:** `src/app/LoginRegister/UserLogin.jsx`

### A. Load Script & Initialize
```javascript
import Script from 'next/script';

// Inside your component
<Script
  src="https://accounts.google.com/gsi/client"
  strategy="afterInteractive"
  onLoad={() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback, // Defined below
      });
      // Render the button
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInBtn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }}
/>
<div id="googleSignInBtn"></div>
```

### B. Handle Callback (Send Token to Backend)
```javascript
const handleGoogleCallback = async (response) => {
  const googleToken = response.credential;
  
  // Send to YOUR backend
  const res = await fetch('/api/auth/google-login', {
    method: 'POST',
    body: JSON.stringify({ token: googleToken }),
  });
  
  const data = await res.json();
  
  if (data.success) {
    // Store YOUR custom JWT
    localStorage.setItem('authToken', data.token);
    // Redirect user
    window.location.href = '/dashboard';
  }
};
```

---

## 5. Backend Implementation
Verify the token, find/create the user, and issue your own JWT.

**File:** `src/app/api/auth/google-login/route.js`
```javascript
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req) {
  const { token } = await req.json();

  // 1. Verify Google Token
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, name, sub: googleId, picture } = ticket.getPayload();

  // 2. Find or Create User
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name, 
      email, 
      googleId, 
      authProvider: 'google',
      profileImage: picture
    });
  } else if (!user.googleId) {
    // Link existing account
    user.googleId = googleId;
    user.authProvider = 'google';
    await user.save();
  }

  // 3. Issue Custom JWT
  const appToken = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // 4. Return Token & Set Cookie (for Middleware compatibility)
  const response = NextResponse.json({ success: true, token: appToken });
  
  // Setting cookie allows middleware to protect routes
  response.cookies.set('authToken', appToken, {
    path: '/',
    httpOnly: false, // Accessible if needed
    maxAge: 30 * 24 * 60 * 60
  });

  return response;
}
```

---

## 6. Middleware Configuration (Optional but Recommended)
Ensure your middleware respects the custom `authToken` cookie so Google users can access protected routes.

**File:** `src/middleware.js`
```javascript
export async function middleware(request) {
  // Check for NextAuth token OR our custom authToken cookie
  const token = await getToken({ req: request });
  const customCookie = request.cookies.get('authToken');

  if (!token && !customCookie && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## Summary of Flow
1. **User clicks Google Button** → Google returns **ID Token**.
2. **Frontend** sends ID Token to `/api/auth/google-login`.
3. **Backend** verifies token with Google servers.
4. **Backend** finds/creates user in MongoDB.
5. **Backend** creates a **new JWT** (App Token).
6. **Backend** sends JWT to Frontend AND sets it as a **Cookie**.
7. **Frontend** saves JWT in `localStorage` and redirects.
8. **Middleware** sees the Cookie and allows access to Dashboard.
