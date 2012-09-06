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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/main", ["io.ox/tasks/api",
                            'gettext!io.ox/tasks',
                            'io.ox/core/tk/vgrid',
                            'io.ox/tasks/view-grid-template',
                            "io.ox/core/commons",
                            'io.ox/tasks/util',
                            'io.ox/tasks/view-detail'], function (api, gt, VGrid, template, commons, util, viewDetail) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/tasks', title: 'Tasks' }),
        // app window
        win,
        // grid
        grid,
        GRID_WIDTH = 330,
        // nodes
        left,
        right;
    
    // launcher
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: "Tasks",
            toolbar: true,
            search: true
        });
        
        win.addClass('io-ox-tasks-main');
        app.setWindow(win);
        
        // folder tree
        commons.addFolderView(app, { width: GRID_WIDTH, type: 'tasks', view: 'FolderList' });

        
        // left panel
        left = $("<div>")
            .addClass("leftside border-right")
            .css({
                width: GRID_WIDTH + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
        
        // right panel
        right = $("<div>")
            .css({ left: GRID_WIDTH + 1 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding")
            .appendTo(win.nodes.main)
            .scrollable();
        
        // grid
        grid = new VGrid(left);
        
        grid.addTemplate(template.main);
        
        commons.wireGridAndAPI(grid, api);
        
        grid.setAllRequest(function () {
            return api.getAll(this.prop('folder')).pipe(function (data) {
                var datacopy = util.sortTasks(data);
                return datacopy;
            });
        });
        
        grid.setListRequest(function (ids) {
            return api.getList(ids).pipe(function (list) {
                var listcopy = _.copy(list, true),
                    i = 0;
                for (; i < listcopy.length; i++) {
                    listcopy[i] = util.interpretTask(listcopy[i]);
                }
                
                return listcopy;
            });
        });
        
        var showTask, drawTask, drawFail;

        //detailview lfo callbacks
        showTask = function (obj) {
            // be busy
            right.busy(true);
            console.log(obj);
            api.get(obj)
                .done(_.lfo(drawTask))
                .fail(_.lfo(drawFail, obj));
        };

        drawTask = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Oops, couldn't load that task."), function () {
                    showTask(obj);
                })
            );
        };
        
        commons.wireGridAndSelectionChange(grid, 'io.ox/task', showTask, right);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);
        
        app.getGrid = function () {
            return grid;
        };
        
        //ready for show
        commons.addFolderSupport(app, grid, 'tasks')
            .done(commons.showWindow(win, grid));
    });

    return {
        getApp: app.getInstance
    };
});
