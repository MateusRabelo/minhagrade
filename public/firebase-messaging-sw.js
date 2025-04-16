// Este arquivo é necessário para que o Firebase Messaging funcione corretamente
// Ele deve ter o nome "firebase-messaging-sw.js" e estar na raiz do diretório público

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBa7cJzwcx9I0wLLYdvsdwVnplrK9B9nD0",
  authDomain: "minhagrade-85a56.firebaseapp.com",
  projectId: "minhagrade-85a56",
  storageBucket: "minhagrade-85a56.firebasestorage.app",
  messagingSenderId: "3368004201",
  appId: "1:3368004201:web:c8106c6beae413c640d0f8",
  measurementId: "G-LF73484RRC"
});

// Obtenha uma instância do messaging
const messaging = firebase.messaging();

// Configure como as notificações devem aparecer quando o app está em background
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Recebida mensagem em background', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 