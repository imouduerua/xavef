// This file is intentionally left almost empty.
// It's used as the entry point for the Firebase service worker.
// The Firebase SDK will handle the rest.
// See: https://firebase.google.com/docs/cloud-messaging/js/client#handle-messages-when-your-app-is-in-the-background

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// IMPORTANT: Replace with your project's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEg_0nlpD5n28dv37zOXWQt70UC9aUJWQ",
  authDomain: "studio-4192523715-e9157.firebaseapp.com",
  projectId: "studio-4192523715-e9157",
  storageBucket: "studio-4192523715-e9157.appspot.com",
  messagingSenderId: "571984618219",
  appId: "1:571984618219:web:0999dad4f308c30b3fd4ae"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// If you want to customize the background notification handling, you can do so here.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
