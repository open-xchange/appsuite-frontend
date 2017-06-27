/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/extensions', [
    'io.ox/core/extensions'
], function (ext) {

    var point = ext.point('io.ox/metrics/extensions');

    point.extend({
        id: 'upsell',
        register: function () {
            var metrics = this;
            ox.on('upsell:requires-upgrade', function (data) {
                metrics.trackEvent({
                    app: 'core',
                    target: 'upsell/' + data.type,
                    action: data.id,
                    detail: data.missing
                });
            });
        }
    });

    point.extend({
        id: 'app',
        register: function () {
            var metrics = this,
                lastTracked;
            // inital
            _.defer(function () {
                if (!ox.ui.App) return;
                trackPage(ox.ui.App.getCurrentApp());
            });
            ox.on('app:start app:resume', trackPage);
            // track
            function trackPage(app) {
                if (!app) return;
                // do not track resume on curent active app
                if (lastTracked === app.id) return;
                lastTracked = app.id;
                metrics.trackPage({
                    name: app.get('name'),
                    id: app.get('id'),
                    trackingId: app.get('trackingId')
                });
            }
        }
    });

    point.extend({
        id: 'loadtime',
        register: function () {
            var metrics = this;
            ox.on('loadtime', function (data) {
                // use app when available
                var app = data.app,
                    action = app && app.get ? app.get('trackingId') || app.get('name') || app.get('id') : data.id;
                metrics.trackEvent({
                    app: 'core',
                    target: 'loadtime',
                    action: action,
                    value: data.loadEnd - data.loadStart
                });
            });
        }
    });

    point.extend({
        id: 'settings',
        register: function () {
            var metrics = this;
            $('#topbar-settings-dropdown').on('mousedown', 'a', function (e) {
                var node = $(e.target).closest('a'),
                    action = node.attr('data-action') || node.attr('class') || node.parent().attr('class');
                metrics.trackEvent({
                    app: 'core',
                    target: 'toolbar',
                    type: 'click',
                    action: action
                });
            });
        }
    });

    point.extend({
        id: 'filestorages',
        register: function () {
            var metrics = this;
            // filestorage api C(R)UD
            require(['io.ox/core/api/filestorage'], function (filestorageApi) {
                var map = {
                    'create': 'created',
                    'delete': 'deleted',
                    'update': 'updated'
                };
                filestorageApi.on('create delete update', function (e, model) {
                    metrics.trackEvent({
                        app: 'data',
                        target: 'drive/account/' + map[e.type],
                        type: 'click',
                        action: model.get('filestorageService')
                    });
                });
            });
        }
    });

});
