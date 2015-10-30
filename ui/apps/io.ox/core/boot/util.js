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
        ).show();
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

        isAnonymous: function () {
            return _.url.hash('login_type') === 'anonymous_password';
        },

        isGuest: function () {
            return _.url.hash('login_type') === 'guest';
        },

        isGuestWithPassword: function () {
            return _.url.hash('login_type') === 'guest_password';
        },

        fail: function (error, focus) {
            var self = this;
            // restore form
            this.restore();

            // show error
            if (error && error.error === '0 general') {
                this.feedback('error', 'No connection to server. Please check your internet connection and retry.');
            } else if (error && error.code === 'LGI-0011') {
                //password expired
                this.feedback('error', function () {
                    return [$('<p>').text(self.gt('Your password is expired. Please change your password to continue.')),
                            // don't use a button here or it will trigger a submit event
                            $('<a target="_blank" role="button" class="btn btn-primary btn">')
                                .text(self.gt('Change password'))
                                // error_params[0] should contain a url to password change manager or sth.
                                .attr( 'href', error.error_params[0] )];
                });
            } else {
                this.feedback('error', $.txt(_.formatError(error, '%1$s (%2$s)')));
            }
            // reset focus
            var id = (_.isString(focus) && focus) || (this.isAnonymous() && 'password') || 'username';
            $('#io-ox-login-' + id).focus().select();
            // event
            ox.trigger('login:fail', error);
        },

        restore: function () {
            // stop being busy
            $('#io-ox-login-form')
                // visual response (shake sucks on touch devices)
                .css('opacity', '')
                .find('input').removeAttr('disabled');
            $('#io-ox-login-blocker').hide();
            //$('#io-ox-login-feedback').idle();
        },

        lock: function () {
            // be busy
            $('#io-ox-login-form')
                .css('opacity', 0.5)
                .find('input').attr('disabled', 'disabled');
            $('#io-ox-login-blocker').show();
            //$('#io-ox-login-feedback').busy().empty();
        }

    };

    //
    // take care of invalid sessions
    //

    ox.relogin = function () {
        exports.gotoSignin('login_type=none');
    };

    ox.on('relogin:required', ox.relogin);

    ox.busy = function (block) {
        // init screen blocker
        $('#background-loader')[block ? 'busy' : 'idle']()
            .show()
            .addClass('secure' + (block ? ' block' : ''));
    };

    ox.idle = function () {
        $('#background-loader')
            .removeClass('secure block')
            .hide()
            .idle()
            .empty();
    };

    // only disable, don't show night-rider
    ox.disable = function () {
        $('#background-loader')
            .addClass('busy block secure')
            .on('touchmove', function (e) {
                e.preventDefault();
                return false;
            })
            .show();
    };

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
