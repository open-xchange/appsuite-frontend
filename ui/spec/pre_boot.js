require(['gettext'], function (gettext) {
    gettext.setLanguage(ox.language);
    gettext.enable();

    require(['io.ox/core/gettext'], function (gettext) {
        gettext.setLanguage(ox.language);
        ox.signin = false;
    })
});

require(['io.ox/core/settings'], function (settings) {
    var fakeServer = sinon.fakeServer.create();
    fakeServer.respondWith("PUT", /api\/jslob\?action=list/, function (xhr) {
        var fakeSettings = {data: [
            {
                id: 'io.ox/core',
                meta: {},
                tree: {}
            }
        ]};
        xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, JSON.stringify(fakeSettings));
    });
    settings.load('io.ox/core');
    fakeServer.respond();
    fakeServer.restore();
});
