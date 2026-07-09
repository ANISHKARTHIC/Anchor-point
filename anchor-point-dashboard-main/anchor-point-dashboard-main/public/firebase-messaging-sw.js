importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyD_gum-0sNnK64pcYDY_pKD74gI6R6jEd8",
  authDomain: "anchorpoint-8ac26.firebaseapp.com",
  projectId: "anchorpoint-8ac26",
  storageBucket: "anchorpoint-8ac26.appspot.com",
  messagingSenderId: "239873402377",
  appId: "1:239873402377:web:e8a944ae74e43f110bbad8",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const promiseChain = self.clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        windowClient.postMessage(payload);
      }
    })
    .then(() => {
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
      };
      return self.registration.showNotification(
        notificationTitle,
        notificationOptions,
      );
    });
  return promiseChain;
});
