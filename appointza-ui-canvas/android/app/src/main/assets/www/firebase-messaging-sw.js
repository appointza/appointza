// Firebase Service Worker for Push Notifications
// This file must be in the public directory to be accessible as a service worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (Web App)
const firebaseConfig = {
  apiKey: "AIzaSyD2MwVwLi7u100omxM6WkCc3as9awOUuPg",
  authDomain: "appointza-a0d00.firebaseapp.com",
  projectId: "appointza-a0d00",
  storageBucket: "appointza-a0d00.firebasestorage.app",
  messagingSenderId: "1029193730608",
  appId: "1:1029193730608:web:a536c6ea39532d72a7bbf5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Appointza';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
    badge: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
    data: payload.data || {},
    tag: payload.data?.type || 'default',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event.notification);
  
  event.notification.close();

  // Determine navigation URL based on notification type
  let urlToOpen = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    const type = data.type;
    
    // Navigate based on notification type
    switch (type) {
      case 'appointment_success':
      case 'appointment_reminder':
      case 'appointment_cancelled':
      case 'appointment_rescheduled':
        urlToOpen = '/user/appointments';
        break;
      case 'payment_success':
        urlToOpen = '/user/dashboard';
        break;
      case 'test_notification':
      case 'test_notification_admin':
        urlToOpen = '/user/dashboard';
        break;
      default:
        // If URL is provided in data, use it
        if (data.url) {
          urlToOpen = data.url;
        } else {
          urlToOpen = '/user/dashboard';
        }
    }
  }

  // Open or focus the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === self.location.origin + urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

