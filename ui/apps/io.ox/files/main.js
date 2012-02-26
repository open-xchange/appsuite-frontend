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
     "io.ox/core/tk/dialogs",
     "io.ox/help/hints",
     "io.ox/core/bootstrap/basics",
     "less!io.ox/files/style.css"
    ], function (viewDetail, api, commons, VGrid, upload, dialogs, hints) {

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
        right,
        statusBar;

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
        commons.addFolderTree(app, GRID_WIDTH, 'infostore');

        // left side
        left = $("<div>").addClass("leftside withStatusBar border-right")
            .css({
                width: GRID_WIDTH + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);

        right = $("<div>")
            .css({ left: GRID_WIDTH + 1 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding withStatusBar")
            .appendTo(win.nodes.main);

        statusBar = $("<div>")
            .addClass("statusBar")
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
        function drawDetail(data) {
            var detail = viewDetail.draw(data);
            right.idle().empty().append(detail);
            right.parent().scrollTop(0);
        }

        grid.selection.on("change", function (e, selection) {
            if (selection.length === 1) {
                // get file
                right.busy(true);
                api.get(selection[0]).done(_.lfo(drawDetail));
            } else {
                right.empty();
            }
        });

        // delete item
        api.on("beforedelete", function () {
            statusBar.busy();
            grid.selection.selectNext();
        });

        api.on("afterdelete", function () {
            statusBar.idle();
        });

        // Uploads
        var queue = upload.createQueue({
            processFile: function (file) {
                return api.uploadFile({file: file})
                    .done(function (data) {
                        // select new item
                        grid.selection.set([data]);
                        grid.refresh();
                        // TODO: Error Handling
                    });
            }
        });

        var dropZone = upload.dnd.createDropZone();

        dropZone.on("drop", function (e, file) {
            queue.offer(file);
        });

        win.on("show", function () {
            dropZone.include();
        });

        win.on("hide", function () {
            dropZone.remove();
        });

        // Add status for uploads

        var $uploadStatus = $("<span>").css("margin-left", "30px");
        var $filenameNode = $("<span>").appendTo($uploadStatus);

        statusBar.append($uploadStatus);
        queue.on("start", function (e, file) {
            $filenameNode.text("Uploading: " + file.fileName);
            statusBar.busy();
        });


        queue.on("stop", function () {
            $filenameNode.text("");
            statusBar.idle();
        });


        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api);

        // go!
        commons.addFolderSupport(app, grid, 'infostore')
            .done(commons.showWindow(win, grid));
    });

    app.invalidateFolder = function (data) {
        console.log(data);
        if (data) {
            console.log(data);
            grid.selection.set([data]);
        }
        grid.refresh();
    };

    return {
        getApp: app.getInstance
    };
});
