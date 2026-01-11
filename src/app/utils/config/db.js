import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Warn instead of throw to prevent build failures if env is missing in CI/CD
  if (process.env.NODE_ENV === 'development') {
    console.error("Please define the MONGODB_URI environment variable inside .env.local");
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const dbConnect = async () => {
  // Check if we're in a server environment (window is undefined on server)
  if (typeof window !== 'undefined') {
    console.log("MongoDB connection skipped - running in browser environment");
    return;
  }

  if (cached.conn) {
    // console.log("MongoDB already connected (cached)");
    return cached.conn;
  }

  // Helper to connect with retries/DNS fix
  const connectWithRetry = async (uri, options, isRetry = false) => {
    try {
      return await mongoose.connect(uri, options);
    } catch (err) {
      if (!isRetry && (err.code === 'ETIMEOUT' || err.syscall === 'queryTxt')) {
        console.log("⚠️ MongoDB DNS timeout detected. Attempting to use Google DNS (8.8.8.8)...");
        try {
          const dns = await import('dns');
          dns.setServers(['8.8.8.8', '8.8.4.4']);
          console.log("✅ DNS servers set to Google DNS. Retrying connection...");
          return await mongoose.connect(uri, options);
        } catch (retryErr) {
          console.error("❌ Retry with Google DNS failed:", retryErr.message);
          throw err; // Throw original error if retry fails
        }
      }
      throw err;
    }
  };

  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // default is true
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4 to avoid some ETIMEOUT DNS issues
    };

    cached.promise = connectWithRetry(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    }).catch(err => {
      console.error("❌ MongoDB connection error details:", err);
      cached.promise = null; // Reset promise so we can try again
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

// Default export for backward compatibility
export default dbConnect;