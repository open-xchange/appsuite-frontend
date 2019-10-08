/* eslint-env es6 */
const version = '<%= version %>';

self.addEventListener('install', function (event) {
    console.log('install', version);
    self.skipWaiting();

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(cacheNames.map(cacheName => caches.open(cacheName)));
        }).then(openCaches => {
            return Promise.all(openCaches.map(cache => cache.keys()));
        }).then(keyList => {
            const keys = [];
            keyList.forEach(list => {
                let prevVersion;
                list.forEach(item => {
                    const match = item.url.match(/(.*\/)v=([^/])*(.*)/);
                    item.url = `${match[1]}v=${version}${match[3]}`;
                    keys.push(item);
                    prevVersion = match[2];
                });
                console.log(`Start cache upgrade from ${prevVersion} to ${version}`);
            });
            return Promise.all(keys.map(key => fetch(key).then(response => {
                return { request: key, response };
            })));
        }).then(list => {
            return caches.open(version).then(cache => {
                return Promise.all(list.map(({ request, response }) => cache.put(request, response)));
            });
        }).then(() => {
            return console.log('Finished cache uprade');
        })
    );
});

self.addEventListener('activate', function (event) {
    console.log('Activate service worker with version: ', version);
    event.waitUntil(
        self.clients.claim()
        .then(() => caches.keys())
        .then(keys => Promise.all(
            keys.map(key => {
                if (key !== version) {
                    console.log('Delete cache ', key);
                    return caches.delete(key);
                }
            })
        ))
    );
});

self.addEventListener('fetch', function (event) {
    if (!/v=[^/]*\//.test(event.request.url)) return;
    event.respondWith(
        caches.open(version)
            .then(cache => {
                return cache.match(event.request)
                    .then(response => response || fetch(event.request))
                    .then(response => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
            })
    );
});
