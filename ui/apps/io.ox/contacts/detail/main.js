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

define('io.ox/contacts/detail/main', [
    'io.ox/contacts/api',
    'io.ox/core/yell',
    'io.ox/contacts/view-detail',
    'gettext!io.ox/contacts',
    'io.ox/core/extensions',
    'io.ox/contacts/util'
], function (api, yell, detailView, gt, ext, util) {

    'use strict';

    var NAME = 'io.ox/contacts/detail';

    ox.ui.App.mediator(NAME, {
        'show-contact': function (app) {
            app.showContact = function (contact) {
                api.get(contact).done(function (data) {

                    var baton = ext.Baton({ data: data, app: app }),
                        title = util.getFullName(data),
                        label = data.mark_as_distributionlist ? gt('Distribution List Details') : gt('Contact Details'),
                        containerNode = $('<div class="f6-target detail-view-container" role="region" tabindex="-1">').attr('aria-label', label);

                    app.setTitle(title);
                    app.right = containerNode;
                    api.on('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                    app.on('quit', function () {
                        api.off('delete:' + _.ecid(data), function () {
                            app.quit();
                        });
                    });

                    app.getWindowNode().addClass('detail-view-app').append(
                        containerNode.append(
                            detailView.draw(baton)
                        )
                    );
                }).fail(yell);
            };
        },

        'metrics': function (app) {
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                var body = app.getWindow().nodes.body;

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name'),
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/contacts\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'contacts',
                        target: target,
                        type: 'click',
                        action: isSelect ? node.attr('data-name') : action,
                        detail: isSelect ? node.attr('data-value') : ''
                    });
                }

                // toolbar actions
                body.on('track', function (e, node) {
                    track('contacts-standalone/toolbar', node);
                });
            });
        }
    });

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: '',
            floating: !_.device('smartphone')
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false,
                floating: !_.device('smartphone'),
                closable: true
            });

            app.setWindow(win);
            app.mediate();
            win.show();

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from contacts app
                obj = _.cid(cid);
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.showContact(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                app.showContact(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };
});
