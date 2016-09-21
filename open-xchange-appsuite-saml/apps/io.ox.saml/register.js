define('io.ox.saml/register', ['io.ox/core/extensions', 'io.ox/core/session', 'settings!io.ox/core', 'io.ox/core/http', 'io.ox/core/capabilities', 'io.ox.saml/handlers'], function (ext, session, settings, http, caps) {

    if (ox.serverConfig.samlLogin) {
        ox.on('relogin:required', function () {
            return $.get(ox.apiRoot + '/saml/init?flow=relogin').done(function (data) {
                var baton = new ext.Baton({data: data});
                ext.point('io.ox.saml/relogin').invoke('handle', baton, baton);
            });        
        });
    }

    if (caps.has('saml-single-logout')) {
        ext.point('io.ox/core/logout').extend({
            id: 'saml_logout',
            index: 'last',
            logout: function () {
                var def = $.Deferred();
                $.get(ox.apiRoot + '/saml/init?flow=logout&session=' + ox.session).done(function (data) {
                    var baton = new ext.Baton({data: data});
                    ext.point('io.ox.saml/logout').invoke('handle', baton, baton);
                }).fail(def.reject);
                return def; // Hack to stop all further processing. This is never resolved.
            }
        });
    }
});
