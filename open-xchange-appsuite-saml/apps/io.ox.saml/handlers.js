define('io.ox.saml/handlers', ['io.ox/core/extensions'], function (ext) {
    function RedirectHandler (options) {
        options = options || {};

        _.extend(this, options, {
            id: 'saml_redirect',
            handle: function (baton) {
                var uri = baton.data.redirect_uri;
                if (uri) {
                    if ((/^http/i).test(uri)) {
                        _.url.redirect(uri);
                    } else {
                        var path = '';
                        if (uri.indexOf('/') === 0) {
                            path = uri;
                        } else {
                            path = '/' + uri;
                        }

                        var l = location;
                        _.url.redirect(l.protocol + '//' + l.host + path);
                    }
                }
            }
        });
    }

    ext.point('io.ox.saml/relogin').extend(new RedirectHandler());
    ext.point('io.ox.saml/logout').extend(new RedirectHandler());
    ext.point('io.ox.saml/login').extend(new RedirectHandler());
});