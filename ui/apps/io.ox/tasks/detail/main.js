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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/detail/main', [
    'io.ox/tasks/api',
    'io.ox/core/yell',
    'io.ox/tasks/view-detail',
    'gettext!io.ox/tasks',
    'io.ox/core/extensions'
], function (api, yell, detailView, gt, ext) {

    'use strict';

    var NAME = 'io.ox/tasks/detail';

    ox.ui.App.mediator(NAME, {
        'show-task': function (app) {
            app.showTask = function (task) {
                var ecid = _.ecid(task);
                api.get(task).done(function (data) {
                    var baton = ext.Baton({ data: data, app: app }),
                        handleDelete = function (e, tasks) {
                            if (e.type === 'delete:' + ecid) {
                                app.quit();
                                return;
                            }
                            _(tasks).each(function (taskObj) {
                                if (taskObj.id === baton.data.id && taskObj.folder_id === baton.data.folder_id) {
                                    app.quit();
                                }
                            });
                        };
                    app.setTitle(data.title);
                    api.on('delete ' + 'delete:' + ecid, handleDelete);
                    app.on('quit', function () {
                        api.off('delete ' + 'delete:' + ecid, handleDelete);
                    });

                    app.getWindowNode().addClass('detail-view-app').append(
                        $('<div class="f6-target detail-view-container" tabindex="-1" role="complementary">')
                            .attr('aria-label', gt('Task Details'))
                            .append(detailView.draw(baton)));
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
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/tasks\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'tasks',
                        target: target,
                        type: 'click',
                        action: isSelect ? node.attr('data-name') : action,
                        detail: isSelect ? node.attr('data-value') : ''
                    });
                }

                // toolbar actions
                body.on('track', function (e, node) {
                    track('tasks-standalone/toolbar', node);
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
                closable: true,
                floating: !_.device('smartphone')
            });

            app.setWindow(win);
            app.mediate();
            win.show();

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from tasks app
                obj = _.cid(cid);
                app.folder.set(obj.folder_id);//needed for inline links to work correctly
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.showTask(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                app.folder.set(obj.folder);//needed for inline links to work correctly
                app.showTask(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };
});
