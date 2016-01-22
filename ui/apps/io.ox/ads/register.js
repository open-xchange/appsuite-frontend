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

    var config = [],
        points = {
            'landscape': 'io.ox/core/banner',
            'skyscraper': 'io.ox/core/skyscraper'
        };

    ext.point('io.ox/ads').extend({
        id: 'default',
        inject: function (baton) {
            this.append(
                baton.data.inject
            );
        },
        changeModule: function (module, baton) {
            var allAds = _.keys(points),
                activeAds = baton.data.config.filter(function moduleFilter(conf) {
                    return _.isEmpty(conf.showadinmodules) || _.contains(conf.showadinmodules, module);
                }).filter(function capabilityFilter(conf) {
                    return _.isEmpty(conf.capabilities) || capabilities.has(conf.capabilities);
                });

            _.each(points, function (value, key) {

                _.each(activeAds, function (obj) {
                    var baton = ext.Baton.ensure(obj);
                    if (obj.ad === key) {
                        allAds.splice(_.indexOf(allAds, key));
                        ext.point(points[key]).get('motor', function (extension) {
                            extension.invoke('draw', undefined, baton);
                        });
                    }
                });

            });

            _.each(allAds, function (value) {
                ext.point(points[value]).get('motor', function (extension) {
                    extension.invoke('cleanup');
                });
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
        config.push.apply(config, _.compact([].concat(baton.data.config)));
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
        ext.point('io.ox/ads').invoke('changeModule', undefined, app.get('id'), baton);
    }

    ox.on('app:start', changeModule);

    ox.on('app:resume', changeModule);

    ox.on('mail:send:start', function () {
        require(['io.ox/ads/mailoverlay'], function (Overlay) {
            var app = ox.ui.apps.get('io.ox/mail'),
                target = app.pages.getAll().detailView.$el.closest('.window-body'),
                baton = ext.Baton.ensure(config.mailoverlay || { adtaghtml: '' });

            new Overlay({ target: target, baton: baton }).show();
        });
    });

    ext.point('io.ox/portal/sections').extend({
        id: 'motor',
        before: 'widgets',
        draw: function (baton) {
            this.append(
                $('<div id="io-ox-ad-portal">').append(
                    baton.data.adtaghtml
                )
            );
        },
        cleanup: function () {
            this.find('#io-ox-ad-portal').detach();
        }
    });

    ext.point('io.ox/mail/thread-view').extend({
        id: 'motor',
        index: 50,
        draw: function (baton) {
            if (baton && baton.data) {
                this.$el.closest('.thread-view-control').addClass('show-ad');
                this.$el.append(
                    $('<div id="io-ox-ad-mail-detail">').append(
                        baton.data.adtaghtml
                    )
                );
            }
        },
        cleanup: function () {
            this.$el.closest('.thread-view-control').removeClass('show-ad');
            this.find('#io-ox-ad-mail-detail').detach();

        }
    });

    ext.point('io.ox/core/foldertree/infostore/app').extend({
        id: 'motor',
        index: 150,
        draw: function (baton) {
            this.find('#io-ox-ad-drive-folder').detach();
            this.append(
                $('<div id="io-ox-ad-drive-folder">').append(
                    baton.data.adtaghtml
                )
            );
        },
        cleanup: function () {
            this.find('#io-ox-ad-drive-folder').detach();
        }
    });

    ext.point('io.ox/core/skyscraper').extend({
        id: 'motor',
        draw: function (baton) {
            $('#io-ox-windowmanager').addClass('show-ad');
            var skyscraper = $('#io-ox-ad-skyscraper').show();
            skyscraper.empty();
            skyscraper.append(
                baton.data.adtaghtml
            );

        },
        cleanup: function () {
            $('#io-ox-windowmanager').removeClass('show-ad');
            $('#io-ox-ad-skyscraper').empty();
        }
    });

    ext.point('io.ox/core/banner').extend({
        id: 'motor',
        draw: function (baton) {
            $('#io-ox-core').addClass('show-ad');
            var banner = $('#io-ox-ad-banner').show();
            banner.empty();
            banner.append(
                baton ? baton.data.adtaghtml : []
            );

        },
        cleanup: function () {
            $('#io-ox-core').removeClass('show-ad');
            $('#io-ox-ad-banner').empty();
        }
    });

    ext.point('io.ox/ads/mailoverlay').extend({
        id: 'motor',
        index: 100,
        draw: function (baton) {
            this.append(
                baton.data.adtaghtml
            );
        }
    });

});
