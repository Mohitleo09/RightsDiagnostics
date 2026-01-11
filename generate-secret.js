const crypto = require('crypto');

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString('hex');
console.log('Generated NEXTAUTH_SECRET:', secret);

// Also generate a SESSION_SECRET
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('Generated SESSION_SECRET:', sessionSecret);