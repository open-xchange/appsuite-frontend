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
    if (_.device('small')) {
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

    // detect if backend is down
    // use long timeout for slow connections & IE
    var serverTimeout = setTimeout(ox.trigger.bind(ox, 'server:down'), 30000);

    //
    // teach require.js to use deferred objects
    //

    var req = window.req = window.require;
    window.require = function (deps, success, fail) {
        if (_.isArray(deps)) {
            // use deferred object
            _(deps).each(function (m) {
                $(window).trigger('require:require', m);
            });
            var def = $.Deferred().done(success).fail(fail);
            req(deps, def.resolve, def.reject);
            return def.promise();
        } else {
            // bypass
            return req.apply(this, arguments);
        }
    };
    _.extend(require, req);

    require(['io.ox/core/boot/fixes', 'io.ox/core/boot/main']).then(
        function success(fixes, boot) {
            boot.start();
        },
        function fail(e) {
            console.error('Server down', e.message, e);
            ox.trigger('server:down');
        }
    );

    //         var hash = _.url.hash();
    //         // token login?
    //         if (hash.tokenSession) {
    //             var whoami = $.Deferred();
    //             debug('boot.js: autoLogin > hash.tokenSession');

    //             session.redeemToken(hash.tokenSession).fail(function (e) {
    //                 debug('boot.js redeemToken > failed', e);
    //             }).done(function (resp) {
    //                 debug('boot.js redeemToken > success');

    //                 ox.session = resp.session;
    //                 session.store();

    //                  // set store cookie?
    //                 $.when(
    //                     session.rampup(),
    //                     hash.store === 'true' ? session.store() : $.when()
    //                 )
    //                 .always(function () {

    //                     // fetch user config
    //                     ox.secretCookie = hash.secretCookie === 'true';
    //                     fetchUserSpecificServerConfig().done(function () {
    //                         var whoami = $.Deferred();
    //                         if (hash.user && hash.language && hash.user_id) {
    //                             whoami.resolve(hash);
    //                         } else {
    //                             require(['io.ox/core/http'], function (http) {
    //                                 http.GET({
    //                                     module: 'system',
    //                                     params: {
    //                                         action: 'whoami'
    //                                     }
    //                                 }).done(function (resp) {
    //                                     resp.language = resp.locale;
    //                                     whoami.resolve(resp);
    //                                 }).fail(whoami.reject);
    //                             });
    //                         }

    //                         whoami.done(function (resp) {
    //                             serverUp();
    //                             // store login data (cause we have all valid languages now)
    //                             session.set({
    //                                 locale: resp.language,
    //                                 session: resp.session,
    //                                 user: resp.user,
    //                                 user_id: parseInt(resp.user_id || '0', 10),
    //                                 context_id: resp.context_id
    //                             });

    //                             var redirect = '#';
    //                             if (hash.ref) {
    //                                 redirect += hash.ref;
    //                             }

    //                             // cleanup url
    //                             _.url.hash({
    //                                 language: null,
    //                                 session: null,
    //                                 user: null,
    //                                 user_id: null,
    //                                 context_id: null,
    //                                 secretCookie: null,
    //                                 store: null,
    //                                 ref: null
    //                             });
    //                             _.url.redirect(redirect);

    //                             // go ...
    //                             loadCoreFiles().done(function () {
    //                                 loadCore();
    //                             });

    //                         });
    //                     });
    //                 });

    //             }).fail(function (e) {
    //                 // TBD
    //                 gotoSignin();
    //             });

    //         } else if (hash.session) {
    //             // session via hash?
    //             debug('boot.js: autoLogin > hash.session', hash.session);

    //             // set session; session.store() might need it now (formlogin)
    //             ox.session = hash.session;

    //             // set store cookie?
    //             $.when(
    //                 session.rampup(),
    //                 hash.store === 'true' ? session.store() : $.when()
    //             )
    //             .always(function () {

    //                 // fetch user config
    //                 ox.secretCookie = hash.secretCookie === 'true';
    //                 fetchUserSpecificServerConfig().done(function () {
    //                     var whoami = $.Deferred();
    //                     if (hash.user && hash.language && hash.user_id) {
    //                         whoami.resolve(hash);
    //                     } else {
    //                         require(['io.ox/core/http'], function (http) {
    //                             http.GET({
    //                                 module: 'system',
    //                                 params: {
    //                                     action: 'whoami'
    //                                 }
    //                             }).done(function (resp) {
    //                                 resp.language = resp.locale;
    //                                 whoami.resolve(resp);
    //                             }).fail(whoami.reject);
    //                         });
    //                     }

    //                     whoami.done(function (resp) {
    //                         serverUp();
    //                         // store login data (cause we have all valid languages now)
    //                         session.set({
    //                             locale: resp.language,
    //                             session: resp.session,
    //                             user: resp.user,
    //                             user_id: parseInt(resp.user_id || '0', 10),
    //                             context_id: resp.context_id
    //                         });

    //                         var redirect = '#';
    //                         if (hash.ref) {
    //                             redirect += hash.ref;
    //                         }

    //                         // cleanup url
    //                         _.url.hash({
    //                             language: null,
    //                             session: null,
    //                             user: null,
    //                             user_id: null,
    //                             context_id: null,
    //                             secretCookie: null,
    //                             store: null,
    //                             ref: null
    //                         });
    //                         _.url.redirect(redirect);

    //                         // go ...
    //                         loadCoreFiles().done(function () {
    //                             loadCore();
    //                         });

    //                     });
    //                 });
    //             });

});
