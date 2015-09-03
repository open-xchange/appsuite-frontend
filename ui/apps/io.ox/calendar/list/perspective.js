/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/list/perspective', [
    'io.ox/calendar/api',
    'io.ox/calendar/list/view-grid-template',
    'io.ox/calendar/view-detail',
    'io.ox/core/commons',
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/folder/api',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar'
], function (api, tmpl, viewDetail, commons, ext, util, actions, folderAPI, settings, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('list'),
        start, end;

    perspective.refresh = function () {
        this.updateGridOptions();
        this.grid.refresh(true);
    };

    perspective.updateColor = function (model) {
        $('[data-folder="' + model.get('id') + '"]', this.pane).each(function () {
            this.className = this.className.replace(/color-label-\d{1,2}/, 'color-label-' + model.get('meta').color_label);
        });
    };

    perspective.selectAppointment = function (obj) {
        this.grid.selection.set(obj);
    };

    perspective.render = function (app) {

        var win = app.getWindow(),
            self = this,
            left,
            right,
            grid,
            findRecurrence = false,
            // how many months do we display
            months = 1;

        this.app = app;

        if (_.device('smartphone')) {
            app.left.addClass('calendar-list-view vsplit');
            app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                .attr({
                    'tabindex': 1,
                    'role': 'complementary',
                    'aria-label': gt('Appointment Details')
                });
            left = app.left;
            right = app.right;
        } else {
            this.main.addClass('calendar-list-view vsplit').append(
                app.left.addClass('border-right'),
                app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                .attr({
                    'tabindex': 1,
                    'role': 'complementary',
                    'aria-label': gt('Appointment Details')
                })
            );
            left = app.left;
            right = app.right.scrollable();
        }

        this.grid = grid = app.getGrid();

        // use only for single items
        if (_.url.hash('id') && _.url.hash('id').split(',').length === 1) {
            //check if recurrencePosition is missing
            findRecurrence = _.url.hash('id').split('.').length === 2;
        }

        // fix selection's serialize
        grid.selection.serialize = function (obj) {
            return typeof obj === 'object' ? (obj.folder_id || obj.folder || 0) + '.' + obj.id + '.' + (obj.recurrence_position || 0) : obj;
        };

        commons.wireGridAndAPI(grid, api);

        // add grid options
        grid.prop('order', 'asc')
            .prop('folder', app.folder.get());

        // add template
        grid.addTemplate(tmpl.main);

        // add label template
        grid.addLabelTemplate(tmpl.label);

        // requires new label?
        grid.requiresLabel = tmpl.requiresLabel;

        api.on('create', function (e, data) {
            if (app.folder.get() === data.folder) {
                grid.selection.set(data);
            }
        });

        //directly linked appointments are stored here
        var directAppointment;

        //function to check for a selection change to prevent refresh from overiding direct links
        function checkDirectlink(e, list) {
            if (list.length > 1 || (list.length === 1 && list[0].id !== directAppointment.id)) {
                grid.prop('directlink', false);
                grid.selection.off('change', checkDirectlink);
            }
        }
        function showAppointment(obj, directlink) {
            if (_.device('smartphone') && app.props.get('checkboxes') === true) return;
            // be busy
            right.busy(true);

            //direct links are preferred
            if (directlink) {
                grid.prop('directlink', true);
                directAppointment = obj;
                grid.selection.on('change', checkDirectlink);
                // get appointment
                api.get(obj)
                    .done(drawAppointment)
                    .fail(drawFail, obj);
            } else if (grid.prop('directlink') && directAppointment) {
                api.get(directAppointment)
                .done(drawAppointment)
                .fail(drawFail, directAppointment);
            } else {
                directAppointment = undefined;
                // get appointment
                if (!(grid.prop('directlink'))) {
                    api.get(obj)
                        .done(_.lfo(drawAppointment))
                        .fail(_.lfo(drawFail, obj));
                }
            }
        }

        showAppointment.cancel = function () {
            _.lfo(drawAppointment);
            _.lfo(drawFail);
        };

        function drawAppointment(data) {
            var baton = ext.Baton({ data: data });
            if (_.device('smartphone')) {
                app.pages.changePage('detailView');
                var p = app.pages.getPage('detailView');
                // clear selection after page is left, otherwise the selection
                // will not fire an event if the user click on the same appointment again
                p.one('pagehide', function () {
                    app.grid.selection.clear();
                });
                // draw details to page
                p.idle().empty().append(viewDetail.draw(data));
                // update toolbar with new baton
                app.pages.getToolbar('detailView').setBaton(baton);

            } else {
                baton.disable('io.ox/calendar/detail', 'inline-actions');
                right.idle().empty().append(viewDetail.draw(baton));
            }
        }

        function drawFail(obj) {
            right.idle().empty().append(
                $.fail(gt('Couldn\'t load appointment data.'), function () {
                    showAppointment(obj);
                })
            );
        }

        this.updateGridOptions = function () {

            var dropdown = grid.getToolbar().find('.grid-options'),
                list = dropdown.find('ul'),
                props = grid.prop();

            // uncheck all
            list.find('i').attr('class', 'fa fa-fw');

            // sort & showall
            list.find('[data-option="' + props.order + '"]').find('i').attr('class', 'fa fa-check');

            // order
            var opacity = [1, 0.4][props.order === 'asc' ? 'slice' : 'reverse']();
            dropdown.find('.fa-arrow-down').css('opacity', opacity[0]).end()
                .find('.fa-arrow-up').css('opacity', opacity[1]).end();
        };

        /**
         * returns the all request for the vgrid
         * @param  {Object} dates   contains a start end end date
         * @return { function}       the all request function for the vgrid
         */
        var generateAllRequest = function (dates) {
            grid.setEmptyMessage(function () {
                return gt.format(gt('No appointments found until %s'), moment(dates.end).format('LLL'));
            });
            return function () {
                var prop = grid.prop();

                return app.folder.getData().then(function () {
                    // set folder data to view and update
                    return api.getAll({
                        start: dates.start,
                        end: dates.end,
                        folder: prop.folder === 'virtual/all-my-appointments' ? 0 : prop.folder,
                        order: prop.order
                    })
                    .then(function (data) {
                        if (!settings.get('showDeclinedAppointments', false)) {
                            data = _.filter(data, function (obj) {
                                return util.getConfirmationStatus(obj) !== 2;
                            });
                        }
                        if (findRecurrence) {

                            var foundRecurrence = false,
                                searchItem = _.url.hash('id').split('.');

                            _(data).each(function (obj) {
                                if (obj.id.toString() === searchItem[1] && obj.folder_id.toString() === searchItem[0]) {
                                    if (foundRecurrence) {
                                        if (foundRecurrence > obj.recurrence_position) {
                                            foundRecurrence = obj.recurrence_position;
                                        }

                                    } else {
                                        foundRecurrence = obj.recurrence_position || 0;
                                    }
                                }
                            });

                            //found valid recurrence, append it
                            if (foundRecurrence !== false) {
                                _.url.hash({ id: _.url.hash('id') + '.' + foundRecurrence });
                            } else {
                                //ok its not in the list lets show it directly
                                app.trigger('show:appointment', { id: searchItem[1], folder_id: searchItem[0], recurrence_position: 0 }, true);
                            }

                            //only search once
                            findRecurrence = false;
                        }
                        return data;
                    });
                });
            };
        };

        // calculates the timeframe for appointments to fetch
        // based on the months variable which will be increased each time
        // this gets called
        var getIncreasedTimeFrame = function () {
            start = moment().startOf('day').valueOf();
            end = moment(start).add(months, 'months');
            // increase for next run
            months++;
            return { start: start.valueOf(), end: end.valueOf() };
        };

        // standard call will get the first month
        grid.setAllRequest(generateAllRequest(getIncreasedTimeFrame()));

        // click on "load more" will fetch one month more
        $(left).on('click', '.tail', function () {
            // set new all request with extend range
            grid.setAllRequest(generateAllRequest(getIncreasedTimeFrame()));
            // refresh the grid
            grid.selection.clear();
            grid.refresh();
        });

        commons.wireGridAndSelectionChange(grid, 'io.ox/calendar', showAppointment, right, api);
        commons.wireGridAndWindow(grid, win);
        commons.wireGridAndRefresh(grid, api, win);
        commons.addGridFolderSupport(app, grid);
        commons.addGridToolbarFolder(app, grid);

        grid.on('change:prop', self.updateGridOptions);
        self.updateGridOptions();

        grid.setListRequest(function (ids) {
            return $.Deferred().resolve(ids);
        });

        self.app.folder.getData().done(function (data) {
            self.folderModel = folderAPI.pool.getModel(data.id);
            self.folderModel.on('change:meta', self.updateColor, self);
        });

        grid.prop('folder', app.folder.get());
        app.on('folder:change', function () {
            self.updateGridOptions();

            self.app.folder.getData().done(function (data) {
                if (this.folderModel) {
                    this.folderModel.off('change:meta', this.updateColor);
                }
                self.folderModel = folderAPI.pool.getModel(data.id);
                self.folderModel.on('change:meta', self.updateColor, self);
            });
        });

        // jump to newly created items
        api.on('create', function (e, data) {
            grid.selection.set(data);
        });

        // refresh grid on all update/delete events
        api.on('update delete', grid.refresh);

        // to show an appointment without it being in the grid, needed for direct links
        app.on('show:appointment', showAppointment);

        // drag & drop support
        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/calendar/detail/actions/move', null, baton);
        });

        grid.paint();
    };

    /**
     * handle different views in this perspective
     * triggered by desktop.js
     */
    perspective.afterShow = function () {
        this.refresh();
    };

    return perspective;
});
