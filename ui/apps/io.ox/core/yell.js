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

define('io.ox/core/yell', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    if (false) {
        //make sure, translations of ariaText types are always available
        //only for create_pot task to pickup the strings.
        gt('Error');
        gt('Info');
        gt('Success');
        gt('Warning');
    }

    var validType = /^(busy|error|info|success|warning|screenreader)$/,

        durations = {
            busy: 10000,
            error: 30000,
            info: 10000,
            success: 4000,
            warning: 10000,
            screenreader: 5000
        },

        ariaText = {
            error: 'Error',
            info: 'Info',
            success: 'Success',
            warning: 'Warning'
        },

        icons = {
            busy: 'fa fa-refresh fa-spin',
            error: 'fa fa-exclamation',
            info: 'fa fa-exclamation',
            success: 'fa fa-check',
            warning: 'fa fa-exclamation'
        },

        timer = null;

    function remove() {
        clearTimeout(timer);
        $('.io-ox-alert').trigger('notification:removed').remove();
        $(document).off('.yell');
    }

    function click (e) {

        var alert = $('.io-ox-alert');
        if (alert.length === 0) return;

        if (_.device('smartphone')) return remove();

        // close if clicked outside notifications
        if (!$.contains(alert.get(0), e.target)) return remove();

        // click on close?
        if ($(e.target).closest('.close').length) return remove();
    }

    function screenreaderMessage(message) {
        // this is for cross browser yells
        // please don't touch and see:
        // http://www.paciellogroup.com/blog/2012/06/html5-accessibility-chops-aria-rolealert-browser-support/
        var textCon = $('#sr-alert-text').removeAttr('role').attr('role', 'alert'),
            textNode = $.txt(message);

        // cleanup text nodes
        textCon
            .contents()
            .filter(function () {
                return this.nodeType == 3; //Node.TEXT_NODE
            }).remove();

        $('#io-ox-alert-screenreader').css('clip', 'auto');

        textCon.append(textNode).hide().css('display', 'inline');
    }

    function yell(type, message, focus) {

        if (type === 'destroy' || type === 'close') return remove();

        var o = {
            duration: 0,
            html: false,
            type: 'info',
            focus: false
        };

        if (_.isObject(type)) {
            // catch server error?
            if ('error' in type) {
                o.type = 'error';
                o.message = type.message || type.error;
                o.headline = gt('Error');
            } else {
                o = _.extend(o, type);
            }
        } else {
            o.type = type || 'info';
            o.message = message;
            o.focus = focus;
        }

        // add message
        if (!validType.test(o.type)) return;

        var alert = [];
        //screenreader only messages can be much simpler and don't need styling or formating (audio only)
        if (o.type === 'screenreader') {
            return screenreaderMessage(o.message);
        } else {
            clearTimeout(timer);
            timer = o.duration === -1 ? null : setTimeout(remove, o.duration || durations[o.type] || 5000);
            // replace existing alert?
            alert = $('.io-ox-alert');
            //prevent double binding
            //we can not use an event listener that always listens. Otherwise we might run into opening clicks and close our notifications, when they should not. See Bug 34339
            //not using click here, since that sometimes shows odd behavior (clicking, then binding then listener -> listener runs code although he should not)
            $(document).off('.yell');
            _.defer(function () {
                // use defer not to run into drag&drop
                $(document).on(_.device('touch') ? 'tap.yell' : 'mousedown.yell', click);
            });

            var html = o.html ? o.message : _.escape(o.message).replace(/\n/g, '<br>'),
                className = 'io-ox-alert io-ox-alert-' + o.type,
                wordbreak = html.indexOf('http') >= 0 ? 'break-all' : 'normal',
                node = $('<div tabindex="-1">');

            if (alert.length) {
                className += ' appear';
                alert.remove();
            }

            node.attr('class', className).append(
                $('<div class="icon">').append(
                    $('<i>').attr('aria-hidden', true).addClass(icons[o.type] || 'fa fa-fw')
                )
            );

            // DO NOT REMOVE! We need to use defer here, otherwise screenreaders don't read the alert correctly.
            _.defer(function () {
                node.append(
                    $('<div role="alert" aria-live="polite" class="message user-select-text">').append(
                        ariaText[o.type] ? $('<span class="sr-only">').text(/*#, dynamic*/gt(ariaText[o.type])) : [],
                        o.headline ? $('<h2 class="headline">').text(o.headline) : [],
                        $('<div>').css('word-break', wordbreak).html(html)
                    )
                );
            });

            node.append(
                $('<a href="#" role="button" class="close" tabindex="1">').append(
                    $('<i class="fa fa-times" aria-hidden="true">'),
                    $('<span class="sr-only">').text(gt('Click to close this notification')))
            );

            $('#io-ox-core').append(node);

            // put at end of stack not to run into opening click
            setTimeout(function () {
                // might be already added
                node.trigger('notification:appear').addClass('appear');
                if (o.focus) node.attr('tabindex', 1).focus();

            }, _.device('touch') ? 300 : 2); // _.defer uses setTimeout(..., 1) internally so use at least 2ms

            return node;
        }
    }

    yell.done = function () {
        yell('success', gt('Done'));
    };

    yell.close = function () {
        yell('close');
    };

    return yell;
});
