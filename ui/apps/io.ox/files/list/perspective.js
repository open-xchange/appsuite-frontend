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
        grid = new VGrid(left),
        dropZone;

        grid.addTemplate({
            build: function () {
                var name;
                this
                    .addClass("file")
                    .append(name = $("<div>").addClass("name"));
                return { name: name };
            },
            set: function (data, fields, index) {
                fields.name.text(data.title || data.filename || '\u00A0');
            }
        });

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

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

        selectFile = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
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
        .on("change", function (evt, selected) {
            if (selected.length > 1) {
                app.currentFile = null;
            }
        });

        // delete item
        api.on("beforedelete", function () {
            grid.selection.selectNext();
        });

        // Uploads
        app.queues = {};

        app.queues.create = upload.createQueue({
            start: function () {
                win.busy();
            },
            progress: function (file) {
                return api.uploadFile({ file: file, folder: app.folder.get() }).done(function (data) {
                    // select new item
                    grid.selection.set([data]);
                    grid.refresh();
                    // TODO: Error Handling
                });
            },
            stop: function () {
                win.idle();
            }
        });

        app.queues.update = upload.createQueue({
            start: function () {
                win.busy();
            },
            progress: function (data) {
                return api.uploadNewVersion({
                        file: data,
                        id: app.currentFile.id,
                        folder: app.currentFile.folder_id,
                        timestamp: app.currentFile.last_modified
                    })
                    .done(function (data) {
                        // select new item
                        grid.selection.set([data]);
                        grid.refresh();
                        // TODO: Error Handling
                    });
            },
            stop: function () {
                win.idle();
            }
        });

        if (_.browser.IE === undefined || _.browser.IE > 9) {
            dropZone = new dnd.UploadZone({
                ref: "io.ox/files/dnd/actions"
            }, app);


        // var shortcutPoint = new shortcuts.Shortcuts({
        //     ref: "io.ox/files/shortcuts"
        // });
            if (dropZone) {dropZone.include(); }


            app.on("perspective:list:hide", function () {
                if (dropZone) {dropZone.remove(); }
                // shortcutPoint.deactivate();
            });

            app.on("perspective:list:show", function () {
                if (dropZone) {dropZone.include(); }
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
            if (data) {
                grid.selection.set([data]);
            }
            grid.refresh();
        };

        app.on('folder:change', function (e, id, folder) {
            if (_.browser.IE === undefined || _.browser.IE > 9) {
                dropZone.remove();
                if (dropZone) { dropZone.include(); }
            }
            // reset first
            win.nodes.title.find('.has-publications').remove();
            // published?
            if (folder['com.openexchange.publish.publicationFlag']) {
                win.nodes.title.prepend(
                    $('<img>', {
                        src: ox.base + '/apps/themes/default/glyphicons_232_cloud_white.png',
                        title: gt('This folder has publications'),
                        alt: ''
                    })
                    .addClass('has-publications')
                );
            }
        });

        grid.prop('folder', app.folder.get());
        grid.paint();
    };
    return perspective;
});
