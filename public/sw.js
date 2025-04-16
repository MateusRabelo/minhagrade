const CACHE_NAME = 'meus-horarios-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação do service worker e cache dos recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Estratégia de cache: tentar da rede primeiro, depois do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Limpeza de caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Push - Quando receber uma notificação push
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'Meus Horários';
  const options = {
    body: data.body || 'Você recebeu uma notificação!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Receber mensagens da aplicação
self.addEventListener('message', event => {
  console.log('Service worker recebeu mensagem:', event.data);
  
  if (event.data && event.data.type === 'PUSH_TEST') {
    // Simular um evento push com os dados recebidos
    const title = event.data.title || 'Meus Horários';
    const options = {
      body: event.data.body || 'Você recebeu uma notificação push!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: event.data.url || '/',
        source: 'message'
      }
    };
    
    self.registration.showNotification(title, options);
  }
});

// Evento de clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
      // Verifica se já existe uma janela aberta e foca nela
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existir, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}); 