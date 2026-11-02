// Recibe los avisos (push) y los muestra; al tocarlos abre la web. El nombre del jugador lo guarda la pagina (mensaje "nombre") para ponerlo en el aviso
self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function(e) {
  var d = e.data; if (!d || (d.bk !== 'nombre' && d.bk !== 'jor' && d.bk !== 'base')) return;
  e.waitUntil(caches.open('bk').then(function(c) { return c.put(d.bk === 'jor' ? 'jor' : (d.bk === 'base' ? 'base' : 'nombre'), new Response(String(d.n || ''))); }));   // nombre del jugador y numero de jornada, para el aviso
});
// acuse de recibo: cuando le llega un aviso al movil, el movil avisa al servidor; asi la hoja sabe si los avisos le estan llegando de verdad
function acuse() {
  return Promise.all([caches.open('bk').then(function(c) { return c.match('base'); }).then(function(r) { return r ? r.text() : ''; }), self.registration.pushManager.getSubscription()]).then(function(v) {
    if (!v[0] || !v[1]) return;
    return fetch(v[0].replace(/accion=[^&]*/, 'accion=ack') + '&e=' + encodeURIComponent(v[1].endpoint), { mode: 'no-cors' });
  }).catch(function() {});
}
self.addEventListener('push', function(e) {
  e.waitUntil(acuse());
  e.waitUntil(caches.open('bk').then(function(c) { return Promise.all([c.match('nombre'), c.match('jor')]); }).then(function(rs) { return Promise.all([rs[0] ? rs[0].text() : '', rs[1] ? rs[1].text() : '']); }).catch(function() { return ['', '']; }).then(function(v) {
    var n = v[0], jr = Number(v[1]) || 0;
    return self.registration.showNotification(jr ? 'JORNADA ' + jr : '', {   /* titulo: la jornada (iOS anade debajo "from" + nombre de la app, eso no se puede quitar) */
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
