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

define('io.ox/calendar/list/perspective',
    ['io.ox/calendar/api',
     'io.ox/core/tk/vgrid',
     'io.ox/calendar/view-grid-template',
     'io.ox/calendar/view-detail',
     'io.ox/core/commons'
     ], function (api, VGrid, tmpl, viewDetail, commons) {

    'use strict';

    var perspective = new ox.ui.Perspective('list');

    perspective.render = function (app) {

        var win = app.getWindow(),
            left, right, grid;

        var vsplit = commons.vsplit(this.main, app);
        left = vsplit.left.addClass('border-right');
        right = vsplit.right.addClass('default-content-padding calendar-detail-pane').scrollable();

        // grid
        grid = new VGrid(left);

        // fix selection's serialize
        grid.selection.serialize = function (obj) {
            return typeof obj === "object" ? (obj.folder_id || obj.folder || 0) + "." + obj.id + "." + (obj.recurrence_position || 0) : obj;
        };

        // add template
        grid.addTemplate(tmpl.main);

        // add label template
        grid.addLabelTemplate(tmpl.label);

        // requires new label?
        grid.requiresLabel = tmpl.requiresLabel;

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

        api.on('created', function (e, data) {
            if (app.folder.get() === data.folder) {
                grid.selection.set(data);
            }
        });

        // special search: list request
        grid.setListRequest("search", function (ids) {
            return $.Deferred().resolve(ids);
        });

        var showAppointment, drawAppointment, drawFail;

        showAppointment = function (obj) {
            // be busy
            right.busy(true);
            // get appointment
            api.get(obj)
                .done(_.lfo(drawAppointment))
                .fail(_.lfo(drawFail, obj));
        };

        drawAppointment = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Oops, couldn't load appointment data.", function () {
                    showAppointment(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/calendar', showAppointment, right, api);
        commons.wireGridAndWindow(grid, win);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridFolderSupport(app, grid);
        commons.addGridToolbarFolder(app, grid);

        grid.setListRequest(function (ids) {
            return $.Deferred().resolve(ids);
        });

        grid.prop('folder', app.folder.get());
        grid.paint();
    };

    return perspective;
});
