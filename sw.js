// Service worker: guarda los archivos de la app en el teléfono para que abra sin internet.
// Tus datos NO pasan por aquí: viven en localStorage (js/almacen.js).
// Si agregas un archivo nuevo a la app, súmalo a ARCHIVOS y sube el número de CACHE.

const CACHE = 'plan-fuerza-v1';

const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/estilos.css',
  'js/app.js', 'js/almacen.js', 'js/alimentos.js', 'js/calculos.js', 'js/datos-plan.js', 'js/fechas.js',
  'js/grafica.js', 'js/registro.js', 'js/temporizador.js', 'js/ui.js',
  'js/vista-hoy.js', 'js/vista-comida.js', 'js/vista-entreno.js', 'js/vista-progreso.js', 'js/vista-plan.js',
  'iconos/icon-192.png', 'iconos/icon-512.png', 'iconos/apple-touch-icon.png',
];

// Al instalarse: descarga y guarda todos los archivos de la lista.
self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS)));
  self.skipWaiting();
});

// Al activarse: borra cachés de versiones anteriores y toma el control.
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Cada petición: primero internet (así siempre ves la versión más nueva) y, si no
// hay conexión, lo guardado. `cache: 'no-cache'` obliga a preguntar al servidor si
// el archivo cambió (si no cambió, responde casi sin descargar nada).
self.addEventListener('fetch', evento => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== location.origin) return;
  evento.respondWith(
    fetch(peticion, { cache: 'no-cache' })
      .then(respuesta => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(peticion, { ignoreSearch: true });
        if (guardada) return guardada;
        if (peticion.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      })
  );
});
