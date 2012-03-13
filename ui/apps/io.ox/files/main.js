/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

// TODO: Break this up, this is becoming messy
define("io.ox/files/main",
    ["io.ox/files/view-detail",
     "io.ox/files/api",
     "io.ox/core/commons",
     "io.ox/core/tk/vgrid",
     "io.ox/core/tk/upload",
     "io.ox/core/extPatterns/dnd",
     "io.ox/core/tk/dialogs",
     "io.ox/help/hints",
     "io.ox/core/bootstrap/basics",
     "io.ox/files/actions",
     "less!io.ox/files/style.css"
    ], function (viewDetail, api, commons, VGrid, upload, dnd, dialogs, hints) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files' }),
        // app window
        win,
        // vgrid
        grid,
        GRID_WIDTH = 330,
        // nodes
        left,
        right;

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: "Files",
            titleWidth: (GRID_WIDTH + 27) + "px",
            toolbar: true,
            search: true
        });

        app.setWindow(win);

        // folder tree
        commons.addFolderTree(app, GRID_WIDTH, 'infostore', 9);

        // left side
        left = $("<div>").addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);

        right = $("<div>")
            .css({ left: GRID_WIDTH + 1 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding")
            .appendTo(win.nodes.main);


        // Grid
        grid = new VGrid(left);

        // add template
        grid.addTemplate({
            build: function () {
                var name;
                this
                    .addClass("file")
                    .append(name = $("<div>").addClass("name"));
                return { name: name };
            },
            set: function (data, fields, index) {
                fields.name.text(data.title);
            }
        });

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        // LFO callback
        var currentDetailView = null;
        function drawDetail(data) {
            if (currentDetailView) {
                currentDetailView.destroy();
            }
            currentDetailView = viewDetail.draw(data);
            right.idle().empty().append(currentDetailView.element);
            right.parent().scrollTop(0);
            app.currentFile = data;
            dropZone.update();
        }

        var drawFile = function (obj) {
            // get file
            if (currentDetailView && currentDetailView.file.id === obj.id) {
                return;
            }
            right.busy(true);
            api.get(obj).done(_.lfo(drawDetail));
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/files', drawFile, right);
        
        
        grid.selection.on('empty', function () {
            if (currentDetailView) {
                currentDetailView.destroy();
                currentDetailView = null;
            }
            app.currentFile = null;
            dropZone.update();
        });
        
        grid.selection.on("change", function (evt, selected) {
            if (selected.length > 1) {
                app.currentFile = null;
            }
        });

        // delete item
        api.on("beforedelete", function () {
            grid.selection.selectNext();
        });

        api.on("triggered", function () {
            var args = $.makeArray(arguments), source = args.shift();
            if (currentDetailView) {
                currentDetailView.trigger.apply(currentDetailView, args);
            }
        });

        // Uploads
        
        
        app.queues = {};
        
        app.queues.create = upload.createQueue({
            processFile: function (file) {
                var uploadIndicator = new dialogs.ModalDialog();
                uploadIndicator.getContentNode().append($("<div>").text("Uploading...").addClass("alert alert-info").css({textAlign: "center"})).append($("<div>").css({minHeight: "10px"}).busy());
                uploadIndicator.getContentControls().css({
                    visibility: "hidden"
                });
                uploadIndicator.show();
                return api.uploadFile({file: file, folder: app.folder.get()})
                    .done(function (data) {
                        uploadIndicator.close();
                        // select new item
                        grid.selection.set([data]);
                        grid.refresh();
                        // TODO: Error Handling
                    });
            }
        });
        
        app.queues.update = upload.createQueue({
            processFile: function (fileData) {
                var uploadIndicator = new dialogs.ModalDialog();
                uploadIndicator.getContentNode().append($("<div>").text("Uploading...").addClass("alert alert-info").css({textAlign: "center"})).append($("<div>").css({minHeight: "10px"}).busy());
                uploadIndicator.getContentControls().css({
                    visibility: "hidden"
                });
                uploadIndicator.show();
                return api.uploadNewVersion({
                    file: fileData,
                    id: app.currentFile.id,
                    folder: app.currentFile.folder,
                    timestamp: app.currentFile.last_modified
                }).done(function (data) {
                    // select new item
                    uploadIndicator.close();
                    grid.selection.set([data]);
                    grid.refresh();
                    // TODO: Error Handling
                });
            }
        });

        var dropZone = new dnd.UploadZone({
            ref: "io.ox/files/dnd/actions"
        }, app);

        win.on("show", function () {
            dropZone.include();
        });

        win.on("hide", function () {
            dropZone.remove();
        });

        // Add status for uploads

        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api);

        app.on('change:folder', function (e, id, folder) {
            // reset first
            win.nodes.title.find('.has-publications').remove();
            // published?
            if (folder['com.openexchange.publish.publicationFlag']) {
                win.nodes.title.prepend(
                    $('<img>', {
                        src: ox.base + '/apps/themes/default/glyphicons_232_cloud.png',
                        title: 'This folder has publications',
                        alt: ''
                    })
                    .addClass('has-publications')
                );
            }
        });

        // go!
        commons.addFolderSupport(app, grid, 'infostore')
            .done(commons.showWindow(win, grid));
    });

    app.invalidateFolder = function (data) {
        if (data) {
            grid.selection.set([data]);
        }
        grid.refresh();
    };

    return {
        getApp: app.getInstance
    };
});
