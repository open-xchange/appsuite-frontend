define.async('io.ox.saml/login/register', ['io.ox/core/extensions', 'io.ox.saml/handlers'], function (ext) {
    var def = $.Deferred();
    if (ox.serverConfig.samlLogin && noSessionSet()) {
        $.get(ox.apiRoot + '/saml/init?flow=login').done(function (data) {
            var baton = new ext.Baton({data: data});
            ext.point('io.ox.saml/login').invoke('handle', baton, baton);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if (ox.serverConfig.samlLoginErrorRedirect) {
                _.url.redirect(ox.serverConfig.samlLoginErrorRedirectURL +
                    '#&' + _.serialize({ language: ox.language, statusCode: jqXHR.status || 'undefined', statusText: textStatus, error: errorThrown }));
            }
        });
        if (ox.serverConfig.samlLoginErrorPage === true) {
            $('body').addClass('down');
            $('#io-ox-login-container').empty().append(
                $('<div class="alert alert-info">').append(
                    $('<div><b>Connection error</b></div> The service is not available right now. <a href="#">Retry</a>')
                )
                .on('click', function (e) { e.preventDefault(); location.reload(); })
            );
            $('#background-loader').fadeOut(250);
            console.warn('Server is down.');
        }
        return def.reject(); // actually doesn't really do anything yet
    } else {
        def.resolve({});
    }
    return $.when();

    function noSessionSet() {
        var hashData = _.url.hash();
        if (hashData.session) {
            return false;
        }

        var ref = hashData.ref;
        if (ref && _.deserialize(ref).session) {
            return false;
        }

        return true;
    }
});
