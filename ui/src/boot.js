/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

// change ms-viewport rule for WP8 devices
// http://mattstow.com/responsive-design-in-ie10-on-windows-phone-8.html
if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var vpRule = document.createElement('style');
    vpRule.appendChild(
        document.createTextNode('@-ms-viewport{width:auto!important}')
    );
    document.getElementsByTagName('head')[0].appendChild(vpRule);
}

// not document.ready cause we wait for CSS to be loaded
$(window).load(function () {

    'use strict';

    if (_.url.hash('cacheBusting')) ox.base = ox.base + _.now();

    // ugly device hack
    // if device small wait 10ms check again
    // maybe the check was made too early could be wrong
    // desktop was recognized as mobile in some cases because of this
    if (_.device('smartphone')) {
        setTimeout(function () { _.recheckDevice(); }, 10);
    }

    //
    // Turn global "ox" into an event hub
    //

    _.extend(ox, Backbone.Events);

    //
    // Server down notification
    //

    ox.on({

        'server:up': function () {
            $('body').removeClass('down'); // to be safe
            clearTimeout(serverTimeout);
        },

        'server:down': function () {
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
    });

    // detect if backend is down. use long timeout for slow connections & IE
    var serverTimeout = setTimeout(ox.trigger.bind(ox, 'server:down'), 30000);

    //
    // teach require.js to use deferred objects
    //

    (function (require) {

        function fallback(error) {
            console.error('require: Error in ' + error.requireModules, error.stack);
        }

        window.require = function (deps, success, fail) {

            if (_.isArray(deps)) {
                // use deferred object
                _(deps).each(function (name) {
                    $(window).trigger('require:require', name);
                });
                var def = $.Deferred().done(success).fail(fail || fallback);
                require(deps, def.resolve, def.reject);
                return def.promise();
            } else {
                // bypass
                return require.apply(this, arguments);
            }
        };

        _.extend(window.require, require);

    }(window.require));

    require(['io.ox/core/boot/fixes', 'io.ox/core/boot/main']).then(
        function success(fixes, boot) {
            boot.start();
        },
        function fail(e) {
            console.error('Server down', e.message, e);
            ox.trigger('server:down');
        }
    );
});
