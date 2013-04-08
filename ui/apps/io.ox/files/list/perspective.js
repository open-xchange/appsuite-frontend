/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/list/perspective',
    ['io.ox/files/list/view-detail',
     'io.ox/files/api',
     'io.ox/core/tk/vgrid',
     'io.ox/core/tk/upload',
     'io.ox/core/extPatterns/dnd',
     'io.ox/core/extPatterns/shortcuts',
     'io.ox/core/commons',
     'gettext!io.ox/files',
     'io.ox/core/bootstrap/basics'
     ], function (viewDetail, api, VGrid, upload, dnd, shortcuts, commons, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('list');
    var firstTime = false;
    perspective.render = function (app) {

        var win = app.getWindow(),
        vsplit = commons.vsplit(this.main, app),
        left = vsplit.left.addClass('border-right'),
        right = vsplit.right.addClass('default-content-padding').scrollable(),
        grid = new VGrid(left, {settings: app.settings}),
        dropZone;

        grid.addTemplate({
            build: function () {
                var name;
                this
                    .addClass('file')
                    .append(name = $('<div>').addClass('name'));
                return { name: name };
            },
            set: function (data, fields, index) {
                var title = data.title || data.filename || '\u00A0';
                fields.name.text(cut(title));
            }
        });

        function cut(str, maxLen, cutPos) {
            if (!cutPos) cutPos = 25;
            if (!maxLen) maxLen = 70;
            str = String(str || '');
            if (str.length > maxLen) {
                return str.substr(0, maxLen - cutPos).trim() + '\u2026' + str.substr(str.length - cutPos).trim();
            } else {
                return str;
            }
        }

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        // The list request is not needed and is too slow
        // ids contains all required information
        grid.setListRequest(function (ids) {
            return $.Deferred().resolve(ids);
        });

        // LFO callback
        app.currentFile = null;

        var showFile, selectFile, drawFail;

        showFile = function (obj) {
            // get file
            if (_.cid(app.currentFile) === _.cid(obj)) {
                return;
            }
            right.busy(true);
            api.get(obj)
                .done(_.lfo(selectFile))
                .fail(_.lfo(drawFail));
        };

        showFile.cancel = function () {
            _.lfo(selectFile);
            _.lfo(drawFail);
        };

        selectFile = function (data) {
            right.idle().empty().append(viewDetail.draw(data, app));
            right.parent().scrollTop(0);
            app.currentFile = data;
            if (dropZone) {
                dropZone.update();
            }
            // shortcutPoint.activateForContext({
            //     data: data,
            //     view: app.detailView,
            //     folder: data.folder_id
            // });
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Couldn't load file data."), function () {
                    showFile(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/files', showFile, right);

        grid.selection.on('empty', function () {
            app.currentFile = null;
            if (_.browser.IE === undefined || _.browser.IE > 9) {
                dropZone.update();
            }
        })
        .on('change', function (evt, selected) {
            if (selected.length > 1) {
                app.currentFile = null;
            }
        });

        // delete item
        api.on('beforedelete', function () {
            grid.selection.selectNext();
        });

        // Uploads
        app.queues = {};

        var uploadedFiles = [];

        app.queues.create = upload.createQueue({
            start: function () {
                win.busy();
                grid.selection.clearIndex();
            },
            progress: function (file, position, files) {
                var pct = position / files.length;
                win.busy(pct, 0);
                return api.uploadFile({ file: file, folder: app.folder.get() })
                    .done(function (data) {
                        // select new item
                        uploadedFiles.push(data);
                    })
                    .progress(function (e) {
                        var sub = e.loaded / e.total;
                        win.busy(pct + sub / files.length, sub);
                    })
                    .fail(function (e) {
                        require(['io.ox/core/notifications'], function (notifications) {
                            if (e && e.code && e.code === 'UPL-0005')
                                notifications.yell('error', gt(e.error, e.error_params[0], e.error_params[1]));
                            else
                                notifications.yell('error', gt('This file has not been added'));
                        });
                    });
            },
            stop: function () {
                api.trigger('refresh.all');
                grid.selection.clearIndex();
                grid.selection.set(uploadedFiles);
                uploadedFiles = [];
                grid.refresh();
                win.idle();
            }
        });

        var currentVersionUpload;

        app.queues.update = upload.createQueue({
            start: function () {
                win.busy();
                currentVersionUpload = {
                    id: app.currentFile.id,
                    folder: app.currentFile.folder_id
                };
            },
            progress: function (data, position, files) {
                var pct = position / files.length;
                win.busy(pct, 0);
                return api.uploadNewVersion({
                        file: data,
                        id: currentVersionUpload.id,
                        folder: currentVersionUpload.folder,
                        timestamp: _.now(),
                        silent: position < files.length - 1
                    })
                    .done(function (data) {
                        // select new item
                        app.invalidateFolder(data);
                        // TODO: Error Handling
                    })
                    .progress(function (e) {
                        var sub = e.loaded / e.total;
                        win.busy(pct + sub / files.length, sub);
                    })
                    .fail(function (e) {
                        require(['io.ox/core/notifications'], function (notifications) {
                            if (e && e.code && e.code === 'UPL-0005')
                                notifications.yell('error', gt(e.error, e.error_params[0], e.error_params[1]));
                            else
                                notifications.yell('error', gt('This file has not been added'));
                        });
                    });
            },
            stop: function () {
                win.idle();
            }
        });

        if (_.browser.IE === undefined || _.browser.IE > 9) {
            dropZone = new dnd.UploadZone({
                ref: 'io.ox/files/dnd/actions'
            }, app);


        // var shortcutPoint = new shortcuts.Shortcuts({
        //     ref: 'io.ox/files/shortcuts'
        // });
            if (dropZone) dropZone.include();


            app.on('perspective:list:hide', function () {
                if (dropZone) dropZone.remove();
                // shortcutPoint.deactivate();
            });

            app.on('perspective:list:show', function () {
                if (dropZone) dropZone.include();
                // shortcutPoint.deactivate();
            });

        }

        // Add status for uploads

        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridFolderSupport(app, grid);
        commons.addGridToolbarFolder(app, grid);

        app.invalidateFolder = function (data) {
            api.propagate('change', data);
            if (data) {
                grid.selection.clearIndex();
                grid.selection.set([data]);
            }
            grid.refresh();
        };

        app.on('folder:change', function (e, id, folder) {
            app.currentFile = null;
            if (_.browser.IE === undefined || _.browser.IE > 9) {
                dropZone.remove();
                if (dropZone) dropZone.include();
            }
        });

        grid.prop('folder', app.folder.get());
        grid.paint();
    };
    return perspective;
});
