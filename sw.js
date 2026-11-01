// Recibe los avisos (push) y los muestra; al tocarlos abre la web. El nombre del jugador lo guarda la pagina (mensaje "nombre") para ponerlo en el aviso
self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function(e) {
  var d = e.data; if (!d || d.bk !== 'nombre') return;
  e.waitUntil(caches.open('bk').then(function(c) { return c.put('nombre', new Response(String(d.n || ''))); }));
});
self.addEventListener('push', function(e) {
  e.waitUntil(caches.open('bk').then(function(c) { return c.match('nombre'); }).then(function(r) { return r ? r.text() : ''; }).catch(function() { return ''; }).then(function(n) {
    return self.registration.showNotification('BARKINIELA', {
      body: (n ? n + ', aste' : 'Aste') + ' hontako apustua osatu gabe do!',
      icon: 'icon-192.png', badge: 'icon-192.png', tag: 'apuesta', renotify: true, vibrate: [250, 120, 250, 120, 250], timestamp: Date.now(), data: { u: self.registration.scope + '?aviso=1' }   // aviso=1: la web se abre en la jornada de los avisos
    });
  }));
});
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var u = (e.notification.data && e.notification.data.u) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(l) {
    for (var i = 0; i < l.length; i++) { if ('navigate' in l[i] && 'focus' in l[i]) return l[i].navigate(u).then(function(c) { return c ? c.focus() : self.clients.openWindow(u); }).catch(function() { return self.clients.openWindow(u); }); }
    return self.clients.openWindow(u);
  }));
});
