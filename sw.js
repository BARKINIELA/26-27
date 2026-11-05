// Recibe los avisos (push) y los muestra; al tocarlos abre la web. El nombre del jugador lo guarda la pagina (mensaje "nombre") para ponerlo en el aviso
self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function(e) {
  var d = e.data; if (!d || (d.bk !== 'nombre' && d.bk !== 'jor' && d.bk !== 'base')) return;
  e.waitUntil(caches.open('bk').then(function(c) { return c.put(d.bk === 'jor' ? 'jor' : (d.bk === 'base' ? 'base' : 'nombre'), new Response(String(d.n || ''))); }));   // nombre del jugador y numero de jornada, para el aviso
});
// acuse de recibo: cuando le llega un aviso al movil, el movil avisa al servidor; asi la hoja sabe si los avisos le estan llegando de verdad
var BASE0 = "https://script.google.com/macros/s/AKfycbxCI6odh8LvQgJRUC7D172DEzcvVydZksn-ia9R61rD37MkHKngCWjvbymc8b9dJkMR2A/exec?token=barkiniela2026secreto&accion=tabla";   // direccion de la hoja: se usa si la pagina todavia no se la ha pasado
function acuse() {
  return Promise.all([caches.open('bk').then(function(c) { return c.match('base'); }).then(function(r) { return r ? r.text() : ''; }).catch(function() { return ''; }), self.registration.pushManager.getSubscription()]).then(function(v) {
    var base = v[0] || BASE0;
    if (!v[1]) return '';
    // la respuesta dice "s" si este aviso es un sondeo; si no se puede leer la respuesta (o falla) se trata como un aviso normal
    return fetch(base.replace(/accion=[^&]*/, 'accion=ack') + '&e=' + encodeURIComponent(v[1].endpoint), { redirect: 'follow', cache: 'no-store' }).then(function(r) { return r.text(); }).catch(function() { return ''; });
  }).catch(function() { return ''; });
}
self.addEventListener('push', function(e) {
  e.waitUntil(acuse().then(function(resp) {
    var pr = String(resp).trim().split('|'), jrS = Number(pr[1]) || 0;   // "ok|12": la jornada pendiente la dice la hoja en el momento del aviso
    if (pr[0] === 's') {   // sondeo: se muestra lo minimo que exige iOS y se cierra al instante
      return self.registration.showNotification(' ', { body: '', tag: 'sondeo', silent: true, renotify: false, icon: 'icon-192.png' }).then(function() { return self.registration.getNotifications({ tag: 'sondeo' }); }).then(function(l) { l.forEach(function(n) { n.close(); }); });
    }
    if (pr[0] === 'ok' && pr[2]) {   // aviso de aciertos: el texto personal lo manda la hoja ("ok|jornada|texto")
      var tx = ''; try { tx = decodeURIComponent(pr[2]); } catch (x) { tx = pr[2]; }
      return self.registration.showNotification(jrS ? 'JORNADA ' + jrS : 'JORNADA', { body: tx, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'aciertos', renotify: true, vibrate: [250, 120, 250, 120, 250], timestamp: Date.now(), data: { u: self.registration.scope } });
    }
    return caches.open('bk').then(function(c) { return Promise.all([c.match('nombre'), c.match('jor')]); }).then(function(rs) { return Promise.all([rs[0] ? rs[0].text() : '', rs[1] ? rs[1].text() : '']); }).catch(function() { return ['', '']; }).then(function(v) {
      var n = v[0], jr = jrS;   // si la hoja no contesta, el titulo es solo JORNADA: nunca se pone una jornada vieja recordada
      return self.registration.showNotification(jr ? 'JORNADA ' + jr : 'JORNADA', {   /* titulo: la jornada (iOS anade debajo "from" + nombre de la app, eso no se puede quitar) */
        body: '😡 ' + (n ? n + ', aste' : 'Aste') + ' hontako apustua osatu gabe do! 😡',
        icon: 'icon-192.png', badge: 'icon-192.png', tag: 'apuesta', renotify: true, vibrate: [250, 120, 250, 120, 250, 120, 250, 120, 250, 120, 250, 120, 250, 120, 250, 120, 250, 120, 250], timestamp: Date.now(), data: { u: self.registration.scope + '?aviso=1' }   // aviso=1: la web se abre en la jornada de los avisos
      });
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
