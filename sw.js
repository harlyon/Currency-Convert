// register cache name
var appCacheName = 'static-v1';
var appCacheAssets = [
	'/',
	'css/app.css',
	'js/app.js',
	'manifest.json',
	'https://fonts.googleapis.com/css?family=Oranienbaum',
	'https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css',
	'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.0/umd/popper.min.js',
	'https://maxcdn.bootstrapcdn.com/bootstrap/4.1.0/js/bootstrap.min.js',
	'https://free.currencyconverterapi.com/api/v5/currencies',
	'https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js'
];

// on install state
self.addEventListener('install', e => {
	console.log('[ServiceWorker] Install');
	e.waitUntil(
	  caches.open(cacheName).then(cache => {
		console.log('[ServiceWorker] Caching app shell');
		return cache.addAll(appCacheAssets);
	  }),
	);
  });
  

// on activate state
self.addEventListener('activate', e => {
	console.log('[ServiceWorker] Activate');
	e.waitUntil(
	  caches.keys().then(keyList =>
		Promise.all(
		  keyList.map(key => {
			if (key !== cacheName) {
			  return caches.delete(key);
			}
		  }),
		),
	  ),
	);
  });

// on fetch state
self.addEventListener('fetch', event => {
	const dataUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
  
	// If contacting API, fetch and then cache the new data
	if (event.request.url.indexOf(dataUrl) === 0) {
	  event.respondWith(
		fetch(event.request).then(response =>
		  caches.open(dataCacheName).then(cache => {
			cache.put(event.request.url, response.clone());
			return response;
		  }),
		),
	  );
	} else {
	  // Respond with cached content if they are matched
	  event.respondWith(
		caches
		  .match(event.request)
		  .then(response => response || fetch(event.request)),
	  );
	}
  });