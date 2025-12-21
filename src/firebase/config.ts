
// The value of `firebaseConfig` is provided by the Firebase tooling
// and is based on the project that you are connected to.
export const firebaseConfig = {
  "projectId": "studio-4192523715-e9157",
  "appId": "1:571984618219:web:0999dad4f308c30b3fd4ae",
  "apiKey": "AIzaSyAEg_0nlpD5n28dv37zOXWQt70UC9aUJWQ",
  "authDomain": "studio-4192523715-e9157.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "571984618219"
};

// Add project ID to environment variables for server-side access if needed
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = firebaseConfig.projectId;
