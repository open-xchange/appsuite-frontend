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
    base: '/base',
    context_id: 0,
    debug: true,
    language: 'de_DE',
    logoutLocation: 'signin',
    online: true,
    revision: '1',
    root: root,
    secretCookie: false, // auto-login
    serverConfig: {},
    version: '0.0.0-0.' + new Date().getTime(),
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

// stub the appsuite body

(function () {
    function stubAppsuiteBody() {
        $('body', document).empty().append(
            $('<div id="background_loader" class="busy" style="display: none;">'),
            $('<div id="io-ox-core" class="abs unselectable" style="display: none">').append(
                $('<div id="io-ox-topbar" role="navigation" class="f6-target">').append(
                    $('<ul class="launchers" role="menubar">'),
                    $('<div class="launcher-dropdown dropdown" aria-hidden="true">').append(
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true">').append(
                            $('<i class="icon-reorder">')
                        ),
                        $('<ul class="dropdown-menu" role="menu">')
                    )
                ),
                $('<div id="io-ox-screens" class="abs">').append(
                    $('<div id="io-ox-windowmanager" class="abs" style="display: none">').append(
                        $('<div id="io-ox-windowmanager-pane" class="atb">')
                    ),
                    $('<div id="io-ox-desktop" class="abs">')
                )
            )
        );
    }
    ox.testUtils = {
        stubAppsuiteBody: stubAppsuiteBody
    };
}());

// fake autologin

if (sinon) {
    ox.fakeServer = {
        create: function () {
            var fakeServer = sinon.fakeServer.create();
            sinon.FakeXMLHttpRequest.useFilters = true;
            sinon.FakeXMLHttpRequest.addFilter(function (method, url, async) {
                // don’t filter out server calls from requirejs or static theme files
                return async && (url.indexOf('/api/apps/load/' + ox.version + ',') === 0 || url.indexOf('/base/spec/fixtures/') >= 0 || /\.js(?!on)/.test(url));
            });
            ox.fakeServer.setup(fakeServer);
            return fakeServer;
        },
        setup: function (fakeServer) {
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

            //faking configuration (jslob api and deprecated config api)
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
        }
    };

    var fakeServer = ox.fakeServer.create();
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
    fakeServer.autoRespond = true;
}
