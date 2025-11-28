const admin = require('firebase-admin');

// Fix private key - handle both escaped \n and missing newlines
function fixPrivateKey(key) {
  if (!key) {
    console.error('❌ FIREBASE_PRIVATE_KEY is not set!');
    return null;
  }
  
  // First, replace escaped \n with actual newlines
  let fixed = key.replace(/\\n/g, '\n');
  
  // If key doesn't have proper newlines after header, it needs fixing
  if (!fixed.includes('-----BEGIN PRIVATE KEY-----\n')) {
    // The key is all on one line, need to add newlines
    fixed = fixed.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
    fixed = fixed.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
  }
  
  console.log('🔑 Private key processed, length:', fixed.length);
  return fixed;
}

// Check required env vars
const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing Firebase env vars:', missing.join(', '));
}

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: fixPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

console.log('🔥 Initializing Firebase with project:', process.env.FIREBASE_PROJECT_ID);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
console.log('✅ Firebase Admin initialized');

module.exports = { admin, db };
