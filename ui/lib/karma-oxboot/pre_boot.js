// require(['gettext'], function (gettext) {
//     gettext.setLanguage(ox.language);
//     gettext.enable();
//
//     require(['io.ox/core/gettext'], function (gettext) {
//         gettext.setLanguage(ox.language);
//         ox.signin = false;
//     })
// });

// setup ox object

var root = location.pathname.replace(/\/[^\/]*$/, ''),
    jslobIds = {
        "io.ox/core": {
            tree: {folder: {
                contacts: 1
            }}
        }
    };

window.ox = {
    abs: location.protocol + '//' + location.host,
    apiRoot: root + '/api',
    base: '',
    context_id: 0,
    debug: true,
    language: 'de_DE',
    logoutLocation: 'signin',
    online: true,
    revision: '1',
    root: root,
    secretCookie: false, // auto-login
    serverConfig: {},
    version: new Date(),
    session: {
        context_id: 0,
        locale: "de_DE",
        random: "44444444444444444444444444444444",
        session: "13371337133713371337133713371337",
        user: "jan.doe",
        user_id: 1337
    },
    signin: false,
    t0: new Date().getTime(), // for profiling
    testTimeout: 10000,
    ui: { session: {} },
    user: '',
    user_id: 0,
    windowState: 'foreground'
};

// fake autologin

if (sinon) {
    sinon.FakeXMLHttpRequest.useFilters = true;
    sinon.FakeXMLHttpRequest.addFilter(function (method, url, async) {
        //don’t filter out server calls from requirejs
        return async && url.indexOf('/api/apps/load/,') === 0;
    });

    var fakeServer = sinon.fakeServer.create();
    ox.fakeServer = fakeServer;
    fakeServer.respondWith("GET", /api\/login\?action=autologin/, function (xhr) {
        var session = {
            context_id: 0,
            locale: "de_DE",
            random: "44444444444444444444444444444444",
            session: "13371337133713371337133713371337",
            user: "jan.doe",
            user_id: 1337
        };
        xhr.respond(200, {"Content-Type": "text/javascript;charset=UTF-8"}, JSON.stringify(session));
    });
    fakeServer.respondWith("GET", /api\/apps\/manifests\?action=config/, function (xhr) {
        var configData = {
            languages: {
                de_DE: 'Deutsch',
                en_US: 'English (US)'
            }
        };
        xhr.respond(200, {"Content-Type": "text/javascript;charset=UTF-8"}, JSON.stringify({
            data: configData
        }));
    });
    fakeServer.respondWith("PUT", /api\/jslob\?action=list/, function (xhr) {
        var ids = JSON.parse(xhr.requestBody),
            fakeSettings = {data: []};
        ids.forEach(function (id, index) {
            fakeSettings.data.push({
                id: id,
                meta: {},
                tree: _.has(jslobIds, id) ? jslobIds[id].tree : {}
            });
        });
        xhr.respond(200, {"Content-Type": "text/javascript;charset=UTF-8"}, JSON.stringify(fakeSettings));
    });
    fakeServer.respondWith("GET", /api\/system\?action=ping/,
                            [
                                200,
                                {"Content-Type": "text/javascript;charset=UTF-8"},
                                JSON.stringify({data: true})
                            ]
                          );
    fakeServer.respondWith("GET", /api\/recovery\/secret\?action=check/,
                            [
                                200,
                                {"Content-Type": "text/javascript;charset=UTF-8"},
                                JSON.stringify({data: {secretWorks: true}})
                            ]
                          );
    //faking a few folders
    fakeServer.respondWith('GET', /api\/folders\?action=get/, function (xhr) {
        var fakeFolder = {'1': {
                id: '1',
                folder_id: '0',
                title: 'Contacts'
            }},
            id = xhr.url.split('&').filter(function (str) {
                return str.indexOf('id=') === 0;
            })[0];
        id = id.substr(id.indexOf('=') + 1);

        xhr.respond(200, {'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify({data: fakeFolder[id] || {id: id}}));
    });
    fakeServer.autoRespond = true;
}
