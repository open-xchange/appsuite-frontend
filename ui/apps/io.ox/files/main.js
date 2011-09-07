/**
 * 
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
 *
 */

// TODO: Break this up, this is becoming messy
 define("io.ox/files/main", [
    "io.ox/files/base", "io.ox/files/api",
    "io.ox/core/tk/vgrid",  "io.ox/files/upload", "io.ox/core/dialogs", "io.ox/help/hints", "css!io.ox/files/style.css"
    ], function (base, api, VGrid, upload, dialogs, hints) {

    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // vgrid
        grid,
        // nodes
        left,
        right,
        statusBar;
    
    function deleteItems () {
        // ask first
        
        new dialogs.ModalDialog()
            .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
            .addButton("cancel", "No, rather not")
            .addButton("delete", "Shut up and delete it!")
            .show()
            .done(function (action) {
                if (action === "delete") {
                    api.remove(grid.selection.get());
                    grid.selection.selectNext();
                }
            });
        
    }
    
    // launcher
    app.setLauncher(function () {
        
        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "Files",
            subtitle: "Private files",
            search: true
        }));
        
        // toolbar
        win.addButton({
            label: "Delete",
            action: deleteItems
        });
        
        // left side
        left = $("<div/>").addClass("leftside withStatusBar border-right")
            .css({
                width: "309px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
        
        right = $("<div/>")
            .css({ left: "310px", overflow: "auto", padding: "0px 40px 20px 40px" })
            .addClass("rightside withStatusBar")
            .appendTo(win.nodes.main);
        
        
        statusBar = $("<div/>")
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
                    .append(name = $("<div/>").addClass("name"));
                return { name: name };
            },
            set: function (data, fields, index) {
                fields.name.text(data.title);
            }
        });
        
        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });
        
        // search request
        grid.setAllRequest("search", function () {
            return api.search(win.search.query);
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
        });
        
        /*
         * Search handling
         */
        win.bind("search", function (q) {
            grid.setMode("search");
        });
        
        win.bind("cancel-search", function () {
            grid.setMode("all");
        });
        
        // LFO callback
        function drawDetail(data) {
            var detail = base.draw(data);
            right.idle().empty().append(detail);
            right.parent().scrollTop(0);
        }
        
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                // get file
                right.busy(true);
                api.get(selection[0]).done(_.lfo(drawDetail));
            } else {
                right.empty();
            }
        });
        
        // explicit keyboard support
        win.bind("show", function () { grid.selection.keyboard(true); });
        win.bind("hide", function () { grid.selection.keyboard(false); });
        
        // bind all refresh
        api.bind("refresh.all", function (data) {
            grid.refresh();
        });
        
        // bind list refresh
        api.bind("refresh.list", function (data) {
            grid.repaint();
        });
        
        // go!
        win.show();
        grid.paint();
        
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
        
        var $uploadStatus = $("<span/>");
        var $filenameNode = $("<span/>").appendTo($uploadStatus);
        
        statusBar.append($uploadStatus);
        queue.bind("start", function (file) {
            $filenameNode.text(file.fileName);
            statusBar.busy();
        });

        
        queue.bind("stop", function () {
            $filenameNode.text("");
            statusBar.idle();
        });
             
        
        var dropZone = upload.dnd.createDropZone();
        
        if (dropZone.enabled) {
            statusBar.append(hints.createHint({
                teaser: "Drag and Drop is enabled.",
                explanation: "You can drag one or more files from your desktop and drop them in the browser window to upload them. Try it out!"
            }));
        }
        
        dropZone.bind("drop", function (file) {
            queue.offer(file);
        });
        
        win.bind("show", function () {
            dropZone.include();
        });
        
        win.bind("hide", function () {
            dropZone.remove();
        });
        
        // Upload Button
        // TODO: Make this IE compatible
        (function () {
            
            var pane = new dialogs.SlidingPane();
            // Let's build our upload form. Nothing fancy here, but we'll allow multiple selection
            // TODO: Add a hint to the user, that multiple uploads are available and how to use them
            var $fileField = $('<input type="file" multiple="multiple"></input>');
            
            pane.append($fileField);
            pane.append(hints.createHint({
                teaser: "Multiple uploads are available.",
                explanation: "You can select more than one file to upload at the same time in the file choosing dialog. If you want to select a whole range of files, hold down the shift key while selecting the start and end of the range of files. If you want to select multiple individual files, hold down control while clicking on the file names (or the function key, if you're on a mac)."
            }));
            pane.addButton("resolveUpload", "Upload");
            pane.addButton("cancelUpload", "Cancel");
            
            var actions = {
                resolveUpload: function () {
                    var files = $fileField[0].files; //TODO: Find clean way to do this
                    _.each(files, function (file) {
                        queue.offer(file);
                    });
                },
            
                cancelUpload: function () {
                    $fileField.val("");
                }
            };
            
            var showUploadField = function () {
                pane.show().done(function (action) {
                    actions[action]();
                });
            };
            var uploadButton = win.addButton({
               label: "Add File",
               action: showUploadField 
            });
            pane.relativeTo(uploadButton);            
        }());
        
    });
    
    return {
        getApp: app.getInstance
    };
});
