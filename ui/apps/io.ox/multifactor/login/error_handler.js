
define('io.ox/multifactor/login/error_handler', [
    'io.ox/core/http'
], function (http) {
    'use strict';

    ox.on('http:error', function (response) {
        // Check for multifactor error
        if (!(/(MFA-0001|MFA-0015)/i).test(response.code)) return;

        http.disconnect();
        require(['io.ox/multifactor/auth'], function (auth) {
            auth.reAuthenticate().then(function () {
                http.reconnect();
            }, function () {
                if ((/^MFA-0001/i).test(response.code)) {
                    console.error('MF login failed, reload required');
                    ox.session = '';
                    http.resetDisconnect(response);
                    ox.trigger('relogin:required');
                } else {
                    http.reconnect();
                }
            });
        });
    });
});
