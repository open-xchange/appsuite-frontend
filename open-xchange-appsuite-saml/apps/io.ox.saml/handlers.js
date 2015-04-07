define('io.ox.saml/handlers', ['io.ox/core/extensions'], function (ext) {
	function RedirectHandler (options) {
        options = options || {};

        _.extend(this, options, {
            id: 'saml_redirect',
            handle: function (baton) {
                if (baton.data.redirect_uri) {
                    _.url.redirect(baton.data.redirect_uri);
                }
            }
        });
    }

    ext.point('io.ox.saml/relogin').extend(new RedirectHandler());
    ext.point('io.ox.saml/logout').extend(new RedirectHandler());
    ext.point('io.ox.saml/login').extend(new RedirectHandler());
});