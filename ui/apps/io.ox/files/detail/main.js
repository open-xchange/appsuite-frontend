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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/files/detail/main', [
    'io.ox/files/api',
    'gettext!io.ox/files',
    'io.ox/core/notifications',
    'io.ox/files/actions'
], function (api, gt, notifications) {

    'use strict';

    var NAME = 'io.ox/files/detail';

    ox.ui.App.mediator(NAME, {
        'show-file': function (app) {
            function showModel(data) {
                var label = gt('File Details'),
                    title = data.filename || data.title,
                    fileModel = api.pool.get('detail').get(_.cid(data));

                app.getWindowNode().addClass('detail-view-app').append(
                    $('<div class="f6-target detail-view-container">').attr({
                        'tabindex': 1,
                        'role': 'complementary',
                        'aria-label': label
                    }));

                require(['io.ox/core/viewer/main'], function (Viewer) {
                    var launchParams = { files: [fileModel || data], app: app, container: app.getWindowNode(), standalone: true },
                        viewer = new Viewer();
                    viewer.launch(launchParams);
                });

                app.setTitle(title);
                if (fileModel) {
                    app.listenTo(fileModel, 'change:filename change:title', function (model) {
                        app.setTitle(model.get('filename') || model.get('title'));
                    });

                    api.once('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                }
            }

            app.showFile = function (file) {
                if (file.file) return showModel(file.file);

                api.get(file).then(showModel, function fail(error) {
                    notifications.yell(error);
                    app.quit();
                });

            };
        },
        'manage-url': function (app) {
            var win = app.getWindow(),
                state;

            win.on('show', function () {
                app.setState(state);
            });
            win.on('hide', function () {
                app.setState({ attachment: null });
            });

            app.setUrlParameter = function (obj) {
                state = obj;
                app.setState(obj);
            };
        }
    });

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: ''
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();
            win.show();

            // handle mail attachments
            if (options.file) {
                var mail = options.file.mail;
                if (mail) {
                    // generic mail attachment
                    app.setUrlParameter({ folder: mail.folder_id, id: mail.id, attachment: options.file.id });
                } else {
                    // sharing mail attachment
                    app.setUrlParameter({ folder: options.file.folder_id, id: options.file.id });
                }
                return app.showFile(options);
            }

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from files app
                obj = _.cid(cid);
                app.setUrlParameter({ folder: obj.folder_id, id: obj.id });
                app.showFile(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                if (obj.attachment) {
                    // is mail attachment
                    require(['io.ox/mail/api', 'io.ox/mail/util'],  function (mailAPI, mailUtil) {
                        mailAPI.get({ folder: obj.folder, id: obj.id }).then(function success(mail) {
                            var attachments = mailUtil.getAttachments(mail),
                                attachment = _.find(attachments, function (attachment) {
                                    return attachment.id === obj.attachment;
                                });
                            app.showFile({ file: attachment });
                            app.setUrlParameter(obj);
                        }, function fail(error) {
                            notifications.yell(error);
                            app.close();
                        });
                    });
                } else {
                    app.showFile(obj);
                    app.setUrlParameter(obj);
                }
            }
        });
    }

    return {
        getApp: createInstance
    };
});
