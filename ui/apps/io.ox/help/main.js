/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/help/main', [
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/help',
    'less!io.ox/help/style'
], function (ModalDialogView, ext, capabilities, gt) {

    'use strict';

    function getAddress(opt) {
        var href = opt.href,
            base = opt.base,
            // see: https://oxpedia.org/wiki/index.php?title=AppSuite:Available_Translations
            locale = ox.language === 'fr_CA' ? 'fr_FR' : ox.language;
        // if target is dynamic, execute as function
        if (_.isFunction(href)) href = opt.href();

        if (_.isObject(href)) {
            base = href.base || base;
            href = href.target || href;
        }
        return base + '/l10n/' + locale + '/' + href;
    }

    function createInstance(options) {

        var opt = _.extend({
                base: 'help',
                href: 'index.html',
                modal: false
            }, options),
            //#. This is a concatenated string to build a window title like "OX Appsuite help"
            windowTitle = gt('%1$s Help', ox.serverConfig.productName || 'OX App Suite');

        var app = ox.ui.createApp({
            name: 'io.ox/help',
            title: windowTitle,
            closable: true,
            floating: !_.device('smartphone'),
            size: 'width-xs height-md',
            href: opt.href
        });

        app.cid = 'io.ox/help:' + getAddress(opt);

        app.showModal = function (iframe) {
            var modal = new ModalDialogView({
                focus: _.device('smartphone') ? '' : 'iframe',
                title: windowTitle,
                width: 640,
                maximize: 650
            }).build(function () {
                this.$el.addClass('inline-help');
                this.$body.append(iframe.addClass('abs'));
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
            win.addClass('inline-help');
            win.nodes.main.append(iframe);
            win.show();
        };

        app.createIframe = function () {
            var iframe = $('<iframe class="hidden inline-help-iframe" frameborder="0">')
                .attr({ src: getAddress(opt), title: gt('loading') });

            function onEscape(e) {
                if (e.which !== 27) return;
                e.preventDefault();
                $('.inline-help').find('[data-action="cancel"], [data-action="close"]').click();
            }

            function onShiftTab(e) {
                if (!opt.modal) return;
                if (!(e.which === 9 && e.shiftKey)) return;
                e.preventDefault();
                $('.inline-help').find('[data-action="cancel"]').focus();
            }

            function onTab(e) {
                if (opt.modal) return;
                if (!(e.which === 9 && !e.shiftKey)) return;
                e.preventDefault();
                $('.io-ox-help-window').find('[data-action="minimize"]').focus();
            }

            var activate = function () {
                if (opt.modal || !this.getWindow().floating) return;
                this.getWindow().floating.activate();
            }.bind(this);

            iframe.on('load', function () {
                // mark the iframes html as embedded class and modal to override the styles in the help less files
                var classesToAdd = opt.modal ? 'embedded in-modal' : 'embedded',
                    contents = $(this).contents(),
                    firstTabbable = contents.find('.oxhelp-content a:first'),
                    lastTabbable = contents.find('.navbar-nav a:eq(2)'),
                    caps = capabilities.getFlat(),
                    navigation = contents.find('.oxhelp-navigation-top'),
                    navbar = navigation.find('nav'),
                    helpContent = contents.find('.oxhelp-content');

                navigation.before(helpContent);

                // hides the top-bar and always displays navigation (without toggle), see OXUIB-325
                navbar.removeClass('navbar-inverse');
                navbar.find('.navbar-header').hide();
                navbar.find('#ox-main-nav').removeClass('collapse');

                _(caps.enabled).each(function (cap) {
                    classesToAdd += ' cap-' + cap;
                });

                contents.find('html')
                    .addClass(classesToAdd)
                    // attach handler to bring the app to front when clicking into the iframe
                    .on('mousedown', activate)
                    // remove brand link because this is most likely an empty link
                    .find('.navbar-brand').remove();

                contents.find('body').on('keydown', onEscape);
                firstTabbable.on('keydown', onShiftTab);
                lastTabbable.on('keydown', onTab);

                $(this).attr('title', contents.attr('title'))
                    .removeClass('hidden');

                _.defer(function () {
                    // set the focus to the first navigation link after loading and dom construction
                    iframe.focus();
                    firstTabbable.focus();
                });

                $(this.contentWindow).on('dragover drop', false);

                this.contentWindow.addEventListener('beforeunload', function () {
                    iframe.addClass('hidden');
                    contents.find('html').off('mousedown', activate);
                    contents.find('body').off('keydown', onEscape);
                    firstTabbable.off('keydown', onShiftTab);
                    lastTabbable.off('keydown', onTab);
                });
            });
            return iframe;
        };

        app.setLauncher(function () {
            var iframe = app.createIframe();
            if (opt.modal) return app.showModal(iframe);
            app.showFloatingWindow(iframe);
        });
        app.launch().then(function () {
            if (opt.modal || !this.getWindow().floating) return;
            // activate this app after launch to prevent it staying in background
            // when opened from a modal inside another floating app
            this.getWindow().floating.activate();
        });
        return app;
    }

    ext.point('io.ox/help/main').extend({
        id: 'ensure-active-state',
        resume: function () {
            if (this.options.modal || !this.getWindow().floating) return;
            this.getWindow().floating.activate();
        }
    });

    return {
        getApp: createInstance,
        reuse: function (opt) {
            return ox.ui.App.reuse('io.ox/help:' + getAddress(opt));
        },
        getAddress: getAddress
    };
});
