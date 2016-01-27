/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */
define('io.ox/ads/register', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'less!io.ox/ads/style'
], function (ext, capabilities) {
    'use strict';

    var config = {},
        reloadTimers = [];

    ext.point('io.ox/ads').extend({
        id: 'default',
        inject: function (baton) {
            this.append(
                baton.data.inject
            );
        },
        changeModule: function (module, baton) {
            var allAds = baton.data.config,
                activeAds = _(baton.data.config).chain().pairs()
                .filter(function moduleFilter(conf) {
                    return _.isEmpty(conf[1].showadinmodules) || _.contains(conf[1].showadinmodules, module);
                }).filter(function capabilityFilter(conf) {
                    return _.isEmpty(conf[1].capabilities) || capabilities.has(conf[1].capabilities);
                })
                .object().value();

            _.each(allAds, function (obj, point) {
                var baton = ext.Baton.ensure(obj);
                ext.point(point).invoke('cleanup', undefined, baton);
            });

            reloadTimers.forEach(clearInterval);
            reloadTimers = [];

            _.each(activeAds, function (obj, point) {
                var baton = ext.Baton.ensure(obj);
                ext.point(point).invoke('draw', undefined, baton);

                if (obj.reloadAfter) {
                    reloadTimers.push(setInterval(function () {
                        ext.point(point).invoke('reload', undefined, baton);
                    }, obj.reloadAfter));
                }
            });
        }
    });

    /**
     * Load Ad configuration from config load
     *
     * @params ad - { inject: function, config: array }
     */
    function loadAdConfig(ad) {
        var baton = ext.Baton.ensure(ad);
        ext.point('io.ox/ads').invoke('inject', $('head'), baton);

        //handle configuration
        ext.point('io.ox/ads').invoke('config', undefined, baton);
        _.extend(config, baton.data.config, {});
    }

    ox.manifests.loadPluginsFor('io.ox/ads/config').then(function () {
        for (var i = 0; i < arguments.length; i++) {
            loadAdConfig(arguments[i]);
        }
    });

    function changeModule(app) {
        var baton = ext.Baton.ensure({
            app: app,
            config: config
        });
        ext.point('io.ox/ads').invoke('changeModule', undefined, app.get('name'), baton);
    }

    ox.on('app:start', changeModule);

    ox.on('app:resume', changeModule);

    ox.on('mail:send:start', function () {
        require(['io.ox/ads/mailoverlay'], function (Overlay) {
            var app = ox.ui.apps.get('io.ox/mail'),
                target = app.pages.getAll().detailView.$el.closest('.window-body'),
                baton = ext.Baton.ensure(config.mailoverlay || { html: '' });

            new Overlay({ target: target, baton: baton }).show();
        });
    });

    ext.point('io.ox/portal/sections').extend({
        id: 'motor',
        before: 'widgets',
        draw: function () {
            this.append(
                $('<div id="io-ox-ad-portal" class="io-ox-ad">').hide()
            );
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'motor',
        index: 50,
        draw: function () {
            this.$el.append(
                $('<div id="io-ox-ad-mail-detail">').hide()
            );
        }
    });

    ext.point('io.ox/core/foldertree/infostore/app').extend({
        id: 'motor',
        index: 150,
        draw: function () {
            this.append(
                $('<div id="io-ox-ad-drive-folder">').hide()
            );
        }
    });

    ext.point('io.ox/ads/driveFolder').extend({
        id: 'default',
        draw: function (baton) {
            $('#io-ox-ad-drive-folder').append(
                baton.data.html
            ).show();
        },
        cleanup: function () {
            $('#io-ox-ad-drive-folder').empty().hide();
        }
    });

    ext.point('io.ox/ads/portalBillboard').extend({
        id: 'default',
        draw: function (baton) {
            $('#io-ox-ad-portal').append(
                baton.data.html
            ).show();
        },
        cleanup: function () {
            $('#io-ox-ad-portal').empty().hide();
        }
    });

    ext.point('io.ox/ads/mailDetail').extend({
        id: 'default',
        draw: function (baton) {
            var detail = $('#io-ox-ad-mail-detail');

            detail.closest('.thread-view-control').addClass('show-ad');
            detail.append(
                baton.data.html
            ).show();
        },
        cleanup: function () {
            var detail = $('#io-ox-ad-mail-detail');

            detail.closest('.thread-view-control').removeClass('show-ad');
            detail.empty().hide();
        }
    });

    ext.point('io.ox/ads/skyscraper').extend({
        id: 'default',
        draw: function (baton) {
            $('#io-ox-windowmanager').addClass('show-ad');
            $('#io-ox-ad-skyscraper').append(
                baton.data.html
            );

        },
        cleanup: function () {
            $('#io-ox-windowmanager').removeClass('show-ad');
            $('#io-ox-ad-skyscraper').empty();
        }
    });

    ext.point('io.ox/ads/leaderboard').extend({
        id: 'default',
        draw: function (baton) {
            $('#io-ox-core').addClass('show-ad');
            $('#io-ox-ad-banner').append(
                baton.data.html
            );

        },
        cleanup: function () {
            $('#io-ox-core').removeClass('show-ad');
            $('#io-ox-ad-banner').empty();
        }
    });

    ext.point('io.ox/ads/mailSentOverlay').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            this.append(
                baton.data.html
            );
        }
    });

});
