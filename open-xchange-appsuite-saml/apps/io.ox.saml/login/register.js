define('io.ox.saml/login/register', ['io.ox/core/extensions', 'io.ox.saml/handlers'], function (ext) {
    if (ox.serverConfig.samlLogin) {
        ext.point('io.ox/core/boot/login').extend({
            id: 'saml',
            after: 'autologin',
            login: function () {
                var def = $.when();
                var samlPath = '/saml';
                if (ox.serverConfig.samlPath) {
                    samlPath = '/saml/' + ox.serverConfig.samlPath;
                }
                def = $.Deferred();
                $.get(ox.apiRoot + samlPath + '/init?flow=login').done(function (data) {
                    var baton = new ext.Baton({ data: data });
                    ext.point('io.ox.saml/login').invoke('handle', baton, baton);
                    def.resolve();
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    if (ox.serverConfig.samlLoginErrorRedirect) {
                        _.url.redirect(ox.serverConfig.samlLoginErrorRedirectURL +
                            '#&' + _.serialize({ language: ox.language, statusCode: jqXHR.status || 'undefined', statusText: textStatus, error: errorThrown }));
                    }
                    def.resolve();
                });
                if (ox.serverConfig.samlLoginErrorPage === true) {
                    setTimeout(function () {
                        ox.trigger('server:down');
                        $('body').addClass('down');
                        $('#io-ox-login-container').empty().append(
                            $('<div class="alert alert-info">').append(
                                $('<div><b>Connection error</b></div> The service is not available right now. <a href="#">Retry</a>')
                            )
                            .on('click', function (e) { e.preventDefault(); location.reload(); })
                        );
                        $('#background-loader').fadeOut(250);
                        console.warn('Server is down.');
                    }, 250);
                }
                return def;
            }
        });
    }
    return {};
});
