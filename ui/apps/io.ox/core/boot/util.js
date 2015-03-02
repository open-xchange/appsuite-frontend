/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/util', [], function () {

    'use strict';

    function displayFeedback() {

        var node = feedbackNode;

        if (!node) return;
        if (typeof node === 'function') node = node();
        if (typeof node === 'string') node = $.txt(node); // TODO: this had a gt()

        $('#io-ox-login-feedback').empty().append(
            $('<div role="alert" class="selectable-text alert alert-info">').append(
                node
            )
        );
    }

    var feedbackType = null, feedbackNode = null;
    ox.on('language', displayFeedback);

    var exports = {

        DURATION: 250,

        debug: $.noop,

        gt: _.identity,

        setPageTitle: function (title) {
            document.title = title || '';
            $('[name="apple-mobile-web-app-title"]').attr('content', title);
        },

        feedback: function (type, node) {
            feedbackType = type;
            feedbackNode = node;
            displayFeedback();
        },

        cleanUp: function () {
            // we don't clear the password right now (see bug 36950)
            $('#io-ox-login-form')
                .off('submit')
                .find('input, button').prop('readonly', true);
        },

        gotoSignin: function (hash) {
            var ref = (location.hash || '').replace(/^#/, ''),
                path = String(ox.serverConfig.loginLocation || ox.loginLocation),
                glue = path.indexOf('#') > -1 ? '&' : '#';
            path = path.replace('[hostname]', window.location.hostname);
            hash = (hash || '') + (ref ? '&ref=' + encodeURIComponent(ref) : '');
            _.url.redirect((hash ? path + glue + hash : path));
        },

        isGuest: function () {
            return _.url.hash('login_type') === 'anonymous';
        },

        isAnonymous: function () {
            return _.url.hash('login_type') === 'anonymous';
        }
    };

    //
    // take care of invalid sessions
    //

    ox.relogin = function () {
        exports.gotoSignin('login_type=none');
    };

    ox.on('relogin:required', ox.relogin);

    //
    // Debug?
    //

    if (/\bboot/.test(_.url.hash('debug'))) {
        exports.debug = function () {
            var args = _(arguments).toArray(), t = _.now() - ox.t0;
            args.unshift('boot (' + (t / 1000).toFixed(1) + 's): ');
            console.log.apply(console, args);
        };
    }

    return exports;
});
