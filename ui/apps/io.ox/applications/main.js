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
 */

define('io.ox/applications/main',
    ['io.ox/core/api/apps',
     'io.ox/core/tk/vgrid',
     'less!io.ox/applications/style.css'
    ], function (api, VGrid) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/applications' }),
        // app window
        win,
        // grid
        grid,
        // nodes
        left,
        right;

    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/applications',
            title: 'Application Manager',
            toolbar: true
        });

        win.addClass('io-ox-applications-main');
        app.setWindow(win);

        // left panel
        left = $('<div>')
            .addClass('leftside border-right')
            .appendTo(win.nodes.main);

        // right panel
        right = $('<div>')
            .css({ paddingRight: '0' })
            .addClass('rightside default-content-padding')
            .appendTo(win.nodes.main)
            .scrollable();

        // grid
        grid = new VGrid(left);

        // add template
        grid.addTemplate({
            build: function () {
                var count, title;
                this.addClass('application')
                    .append(
                        count = $('<div>').addClass('count')
                    )
                    .append(
                        title = $('<div>').addClass('title')
                    );
                return { count: count, title: title };
            },
            set: function (data, fields, index) {
                fields.count.text(data.count);
                fields.title.text(data.title);
                if (data.id === 'upgrades' && data.count > 0) {
                    fields.count.addClass('highlight');
                }
            }
        });

        // add label template
        grid.addLabelTemplate({
            build: function () {
                this.addClass('application-label');
            },
            set: function (data, fields, index) {
                this.text(data.group || '');
            }
        });

        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            return data.group !== current ? data.group : false;
        };

        // all request
        grid.setAllRequest(function () {
            return $.Deferred().resolve(api.getCategories());
        });

        var showView = function (data, view) {
            right.empty().append(view.draw(data));
        };

        var loadView = function (obj) {
            var id = obj.id;
            if (id !== 'installed' && id !== 'favorites' && id !== 'upgrades' && id !== 'mockIntegration') {
                id = 'category';
            }
            require([obj.viewModule || 'io.ox/applications/view-' + id])
                .done(_.lfo(showView, obj));
        };

        grid.selection.setMultiple(false)
            .on('change', function (e, selection) {
                if (selection.length === 1) {
                    loadView(selection[0]);
                }
            });

        win.on('show', function () {
            grid.selection.keyboard(true);
        });
        win.on('hide', function () {
            grid.selection.keyboard(false);
        });

        // go!
        win.show(function () {
            grid.paint();
        });

        // bind all refresh
        api.on('refresh.all', function (e, data) {
            grid.refresh();
        });
    });

    return {
        getApp: app.getInstance
    };
});