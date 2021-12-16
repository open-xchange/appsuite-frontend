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
                    action = app && app instanceof Backbone.Model ? app.get('trackingId') || app.get('name') || app.get('id') : data.id;
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
        id: 'topbar-logo',
        register: function () {
            var metrics = this;
            metrics.watch({
                node: $('#io-ox-appcontrol'),
                selector: '#io-ox-top-logo',
                type: 'click'
            }, {
                app: 'core',
                target: 'topbar/logo',
                type: 'click',
                action: ''
            });
        }
    });

    point.extend({
        id: 'topbar-quicklaunch',
        register: function () {
            var metrics = this;
            $('#io-ox-appcontrol #io-ox-quicklaunch').on('mousedown', 'button', function (e) {
                metrics.trackEvent({
                    app: 'core',
                    target: 'topbar/quicklaunch',
                    type: 'click',
                    action: $(e.currentTarget).attr('data-id')
                });
            });
        }
    });

    point.extend({
        id: 'topbar-taskbar',
        register: function () {
            var metrics = this;
            $('#io-ox-appcontrol .taskbar').on('mousedown', 'li', function (e) {

                // tracked in different extension
                if ($(e.currentTarget).is('#io-ox-topbar-account-dropdown-icon')) return;
                // ignore bubbled clicks in opened dropdowns
                if ($(e.currentTarget).hasClass('dropdown') && $(e.currentTarget).hasClass('open')) return;

                var isLauncher = $(e.currentTarget).hasClass('launcher') || ($(e.currentTarget).hasClass('dropdown')),
                    value = isLauncher ? $(e.currentTarget).attr('id') : $(e.currentTarget).find('a').attr('data-id');

                if (!value) return;
                metrics.trackEvent({
                    app: 'core',
                    target: 'topbar/taskbar',
                    type: 'click',
                    action: value
                });
            });
        }
    });

    point.extend({
        id: 'topbar-account-dropdown',
        register: function () {
            var metrics = this;

            $('#io-ox-topbar-account-dropdown-icon').on('mousedown', function () {
                // prevent tracking bubbled mousedown events
                if ($(this).hasClass('open')) return;
                metrics.trackEvent({
                    app: 'core',
                    target: 'topbar/settings',
                    type: 'click',
                    action: 'dropdown/open'
                });
            });

            $('#topbar-account-dropdown').on('mousedown', 'a', function (e) {
                var node = $(e.target).closest('a'),
                    action = node.attr('data-name') || node.attr('data-action') || node.attr('class') || node.parent().attr('class');

                metrics.trackEvent({
                    app: 'core',
                    target: 'topbar/settings',
                    type: 'click',
                    action: action
                });
            });
        }
    });

    point.extend({
        id: 'halo',
        register: function () {
            var metrics = this;
            $(document.documentElement).on('mousedown', '.halo-link', function () {
                var app = ox.ui.App.getCurrentApp() || new Backbone.Model({ name: 'unknown' });
                metrics.trackEvent({
                    app: 'core',
                    type: 'click',
                    action: 'halo',
                    detail: _.last(app.get('name').split('/'))
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
