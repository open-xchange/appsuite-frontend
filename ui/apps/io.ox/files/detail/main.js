/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/files/detail/main', [
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'gettext!io.ox/files',
    'io.ox/core/notifications',
    'io.ox/core/api/tab',
    'io.ox/files/actions'
], function (api, folderAPI, gt, notifications, tabAPI) {

    'use strict';

    var NAME = 'io.ox/files/detail';

    var MODEL_CHANGE_EVENTS_FOR_TAB_PROPAGATION = 'change:cid change:filename change:title change:com.openexchange.file.sanitizedFilename change:file_size change:last_modified change:description change:folder_id change:object_permissions change:permissions change:current_version change:number_of_versions change:version';
    var MODEL_CHANGE_EVENTS_FOR_RENAME = 'change:com.openexchange.file.sanitizedFilename change:filename change:title';

    ox.ui.App.mediator(NAME, {
        'show-file': function (app) {

            var fileModel = null;

            function fileRenameHandler(model) {
                app.setTitle(model.getDisplayName());
            }

            function fileChangeHandler(model) {
                tabAPI.propagate('refresh-file', _.pick(model.toJSON(), 'folder_id', 'id'));
            }

            function showModel(data) {
                var label = gt('File Details');
                var title = data['com.openexchange.file.sanitizedFilename'] || data.filename || data.title;

                app.getWindowNode().addClass('detail-view-app').append(
                    $('<div class="f6-target detail-view-container" tabindex="-1" role="complementary">').attr('aria-label', label)
                );

                fileModel = api.pool.get('detail').get(_.cid(data)) || null;

                // alternate file version
                if (fileModel && data.override_file_version) {
                    var versionData = _.find(fileModel.get('versions'), function (item) {
                        return item.version === data.override_file_version;
                    });

                    fileModel = (versionData) ? new api.Model(versionData) : fileModel;
                }

                require(['io.ox/core/viewer/main'], function (Viewer) {
                    var launchParams = {
                            files: [fileModel || data],
                            app: app,
                            container: app.getWindowNode(),
                            standalone: true,
                            opt: { disableFolderInfo: !fileModel }
                        },
                        viewer = new Viewer();
                    viewer.launch(launchParams);
                });

                app.setTitle(title);

                if (fileModel) {
                    app.listenTo(fileModel, MODEL_CHANGE_EVENTS_FOR_RENAME, fileRenameHandler);

                    app.on('quit', function () {
                        app.stopListening(fileModel, MODEL_CHANGE_EVENTS_FOR_RENAME, fileRenameHandler);
                    });

                    api.once('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                }

                // propagate file changes to all browser tabs
                if (ox.tabHandlingEnabled && fileModel) {
                    app.listenTo(fileModel, MODEL_CHANGE_EVENTS_FOR_TAB_PROPAGATION, fileChangeHandler);

                    app.on('quit', function () {
                        app.stopListening(fileModel, MODEL_CHANGE_EVENTS_FOR_TAB_PROPAGATION, fileChangeHandler);
                    });
                }
            }

            app.showFile = function (file) {
                if (file.file) return showModel(file.file);

                // load file and folder data, e.g. needed if popout viewer is launched in a new browser tab
                folderAPI.get(file.folder_id || file.folder).then(function () {
                    return api.get(file);

                }).then(function (modelData) {
                    // current model
                    if (!file.version) { return modelData; }

                    // alternate model
                    modelData.override_file_version = file.version;
                    return api.versions.load(modelData, { cache: false }).then(function () { return modelData; });

                }).then(showModel, app.showErrorAndCloseApp);
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
        },
        'handle-api-file-change': function () {
            // listen to events that affect the filename, version and generic changes
            api.on('rename add:version remove:version change:version', _.debounce(function (file) {
                api.get(_.cid(file), { cache: false });
            }, 100));
        },
        'error-handler': function (app) {
            app.showErrorAndCloseApp = function (error) {
                notifications.yell(error);
                app.close();
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

            // necessary when plugging Spreadsheet into the Viewer, otherwise the Drive side bar would be visible
            win.nodes.outer.css('z-index', 2);

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

            // deep-link and 'open in new browser tab'
            var obj = _.clone(app.getState());

            if (obj.space && obj.attachment) {
                // mail compose attachment
                require(['io.ox/mail/compose/api']).then(function (composeAPI) {

                    return composeAPI.space.get(obj.space);

                }).then(function (data) {
                    var attachment = _.extend({ space: obj.space }, _.find(data.attachments, function (attachment) {
                        return attachment.id === obj.attachment;
                    }));

                    return app.showFile({ file: attachment });

                }, app.showErrorAndCloseApp);

            } else if (obj.module && obj.id && obj.folder && obj.attachment) {
                // pim attachment
                require(['io.ox/core/api/attachment']).then(function (attachmentAPI) {

                    return attachmentAPI.getAll({
                        folder_id: obj.folder,
                        id: obj.id,
                        module: obj.module

                    }).then(function (attachments) {
                        var attachmentId = parseInt(obj.attachment, 10);
                        var attachment = _.find(attachments, function (attachment) {
                            return attachment.id === attachmentId;
                        });

                        app.showFile({ file: attachment });

                    }, app.showErrorAndCloseApp);
                });

            } else if (obj.id && obj.folder && obj.attachment) {
                // mail attachment

                require(['io.ox/mail/api', 'io.ox/mail/util']).then(function (mailAPI, mailUtil) {
                    var mailOptions = { folder: obj.folder, id: obj.id };
                    if (obj.decrypt && obj.cryptoAuth) {  // Must decrypt Guard email again if checking attachments
                        _.extend(mailOptions, {
                            decrypt: true,
                            cryptoAuth: obj.cryptoAuth
                        });
                    }
                    return mailAPI.get(mailOptions).then(function success(mail) {
                        var attachments = mailUtil.getAttachments(mail);
                        var attachment = _.find(attachments, function (attachment) {
                            return attachment.id === obj.attachment;
                        });
                        if (obj.decrypt) {  // Add decryption info to attachment for file viewer
                            _.extend(attachment, {
                                security: {
                                    decrypted: true,
                                    authentication: obj.cryptoAuth
                                }
                            });
                        }
                        app.showFile({ file: attachment });

                    }, app.showErrorAndCloseApp);
                });

            } else if (obj.id && obj.folder) {
                // file
                app.showFile(obj);

            } else if (options.id && options.folder) {
                app.setUrlParameter(_.pick(options, 'id', 'folder'));
                app.showFile({ id: options.id, folder_id: options.folder });

            } else if (options.cid) {
                app.setUrlParameter(_.pick(_.cid(options.cid), 'id', 'folder'));
                app.showFile(_.cid(options.cid));
            }
        });
    }

    return {
        getApp: createInstance
    };
});
