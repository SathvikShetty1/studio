
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// CRITICAL: Your web app's Firebase configuration.
// These values MUST be stored in a .env.local file in the root of your project.
// This file is NOT committed to version control.
//
// Example .env.local content:
// NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYourActualApiKey
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
// NEXT_PUBLIC_FIREBASE_APP_ID=1:your-app-id:web:your-web-app-identifier
//
// Obtain these values from your Firebase project settings:
// Project Settings (gear icon) > General tab > Your apps > Web app > SDK setup and configuration (Config).
//
// IMPORTANT: After creating or modifying the .env.local file, you MUST restart your Next.js development server
// for the changes to take effect (e.g., stop `npm run dev` and run it again).

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  // This error will be thrown when this module is first imported (e.g., on server start or client load)
  // if any of the required Firebase environment variables are missing.
  // This helps catch configuration issues early.
  let missingKeys = [];
  if (!apiKey) missingKeys.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!authDomain) missingKeys.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!projectId) missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!storageBucket) missingKeys.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!messagingSenderId) missingKeys.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!appId) missingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  throw new Error(
    `CRITICAL FIREBASE CONFIG ERROR: The following Firebase environment variables are missing: ${missingKeys.join(", ")}. ` +
    "Please ensure they are correctly defined in a .env.local file in your project root. " +
    "Obtain these values from your Firebase project settings (Project Settings > General > Your apps > Web app > SDK setup and configuration). " +
    "After adding or modifying .env.local, restart your Next.js development server."
  );
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
