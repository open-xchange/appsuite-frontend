/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicableƒ
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */

define('io.ox/help/main', ['io.ox/help/view', 'io.ox/backbone/views/modal', 'gettext!io.ox/help', 'less!io.ox/help/style'], function (HelpView, ModalDialogView, gt) {

    'use strict';

    function getAddress(opt) {
        var href = opt.href,
            base = opt.base;
        // if target is dynamic, execute as function
        if (_.isFunction(href)) href = opt.href();

        if (_.isObject(href)) {
            base = href.base || base;
            href = href.target || href;
        }
        return base + '/l10n/' + ox.language + '/' + href;
    }

    function createInstance(options) {

        var opt = _.extend({
            base: 'help',
            href: 'index.html',
            modal: false
        }, options);

        var app = ox.ui.createApp({
            name: 'io.ox/help',
            title: gt('Online help'),
            closable: true,
            floating: !_.device('smartphone'),
            size: 'width-xs height-md',
            href: opt.href
        });

        app.cid = 'io.ox/help:' + getAddress(opt);

        app.showModal = function (iframe) {
            iframe.on('load', function () {
                $(this).height($(this).contents().find('body').height() + 16);
            });
            var modal = new ModalDialogView({
                focus: _.device('smartphone') ? '' : 'iframe',
                title: gt('Online help'),
                width: '640px',
                maximize: 650
            }).build(function () {
                this.$el.addClass('inline-help');
                this.$body.append(iframe);
            }).addCloseButton()
                .on('close', function () { app.quit(); })
                .open();
            $.noop(modal);
        };

        app.showFloatingWindow = function (iframe) {
            var win;
            app.setWindow(win = ox.ui.createWindow({
                name: 'io.ox/help',
                chromeless: true,
                // attributes for the floating window
                floating: !_.device('smartphone'),
                closable: true,
                title: gt('Online help')
            }));
            win.nodes.main.append(iframe);
            win.show();
        };

        app.createIframe = function () {
            var iframe;
            iframe = $('<iframe>', { src: getAddress(opt), frameborder: 0 })
                .addClass('hidden');
            iframe.on('load', function () {
                $(this).contents().find('html').addClass('embedded');
                $(this).attr('title', $(this).contents().attr('title'));
                $(this).removeClass('hidden');
                this.contentWindow.focus();
                this.contentWindow.$('a').not(function () { return !$(this).html().trim(); }).first().focus();
                setTimeout(function () {
                    $('a').not(function () { return !$(this).html().trim(); }).first().focus();
                }, 100);
                this.contentWindow.addEventListener('beforeunload', function () {
                    iframe.addClass('hidden');
                });
            });
            iframe.css({
                width: '100%',
                height: '100%'
            });
            return iframe;
        };

        app.setLauncher(function () {
            var iframe = app.createIframe();
            if (opt.modal) return app.showModal(iframe);
            app.showFloatingWindow(iframe);
        });
        app.launch();
        return app;
    }

    return {
        getApp: createInstance,
        reuse: function (opt) {
            return ox.ui.App.reuse('io.ox/help:' + getAddress(opt));
        }
    };
});
