require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

async function test() {
  console.log("Original env length:", process.env.FIREBASE_PRIVATE_KEY?.length);
  
  // What admin.ts does
  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  console.log("Processed key starts with:", key?.substring(0, 30));
  console.log("Processed key ends with:", key?.substring(key.length - 30));
  
  try {
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key
      })
    });
    
    await getAuth(app).createSessionCookie('dummy', { expiresIn: 3600000 });
  } catch (e) {
    if (e.message.includes('Invalid JWT Signature')) {
      console.log('ERROR: Invalid JWT Signature');
    } else {
      console.log('Got error (expected since token is dummy):', e.message);
    }
  }
}

test();
