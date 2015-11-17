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

define('io.ox/calendar/list/perspective',
    ['io.ox/calendar/api',
     'io.ox/calendar/list/view-grid-template',
     'io.ox/calendar/view-detail',
     'io.ox/core/commons',
     'io.ox/core/extensions',
     'io.ox/core/date',
     'io.ox/calendar/util',
     'io.ox/core/extPatterns/actions',
     'settings!io.ox/calendar',
     'gettext!io.ox/calendar'
    ], function (api, tmpl, viewDetail, commons, ext, date, util, actions, settings, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('list'),
        start, end;

    perspective.refresh = function () {
        this.updateGridOptions();
        this.grid.refresh(true);
    };

    perspective.render = function (app) {

        var win = app.getWindow(),
            self = this,
            left,
            right,
            grid,
            findRecurrence = false,
            optDropdown = null,
            // how many months do we display
            months = 1;

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

        // special search: list request
        grid.setListRequest('search', function (ids) {
            return $.Deferred().resolve(ids);
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

        function buildOption(value, text) {
            return $('<li role="presentation">')
                .append(
                    $('<a>').attr({
                        href: '#',
                        role: 'menuitem',
                        'data-option': value
                    }).text(text)
                );
        }

        this.updateGridOptions = function () {
            var dropdown = grid.getToolbar().find('.grid-options'),
                list = dropdown.find('ul'),
                showAll = $('[data-option="all"]', list).parent(),
                props = grid.prop();
            // uncheck all
            list.find('i').attr('class', 'fa fa-fw');

            app.folder.getData().done(function (folder) {
                showAll[folder.type === 1 ? 'show' : 'hide']();
            });

            // sort & showall
            list.find(
                '[data-option="' + props.order + '"], ' +
                '[data-option="' + (settings.get('showAllPrivateAppointments', false) ? 'all' : '~all') + '"]')
                .find('i').attr('class', 'fa fa-check');
            // order
            var opacity = [1, 0.4][props.order === 'asc' ? 'slice' : 'reverse']();
            dropdown.find('.fa-arrow-down').css('opacity', opacity[0]).end()
                .find('.fa-arrow-up').css('opacity', opacity[1]).end();
        };

        ext.point('io.ox/calendar/vgrid/toolbar').extend({
            id: 'dropdown',
            index: 100,
            draw: function () {
                this.append(
                    optDropdown = $('<div class="grid-options dropdown">')
                        .append(
                            $('<a>').attr({
                                    href: '#',
                                    tabindex: 1,
                                    'data-toggle': 'dropdown',
                                    'aria-haspopup': true,
                                    'aria-expandet': false,
                                    'aria-label': gt('Sort options')
                                }).append(
                                    $('<i class="fa fa-arrow-down" aria-hidden="true">'),
                                    $('<i class="fa fa-arrow-up" aria-hidden="true">')
                                )
                                .dropdown(),
                            $('<ul class="dropdown-menu" role="menu">')
                                .append(
                                    buildOption('asc', gt('Ascending')),
                                    buildOption('desc', gt('Descending'))
                                )
                                .on('click', 'a', { grid: grid }, function () {
                                    var option = $(this).attr('data-option');
                                    switch (option) {
                                    case 'asc':
                                    case 'desc':
                                        grid.prop('order', option).refresh(true);
                                        break;
                                    }
                                })
                        )
                );
            }
        });

        /**
         * returns the all request for the vgrid
         * @param  {Object} dates   contains a start end end date
         * @return {function}       the all request function for the vgrid
         */
        var generateAllRequest = function (dates) {
            //var timeframe = util.getDateInterval({start_date: dates.start, end_date: dates.end});
            var endDate = new date.Local(dates.end).format(date.DATE);
            grid.setEmptyMessage(function () {
                return gt.format(gt('No appointments found until %s'), endDate);
            });
            return function () {
                var prop = grid.prop(),
                    start = dates.start,
                    end = dates.end;

                return app.folder.getData().pipe(function (folder) {
                    // set folder data to view and update
                    return api.getAll({
                        start: start.getTime(),
                        end: end.getTime(),
                        folder: settings.get('showAllPrivateAppointments', false) && folder.type === 1 ? undefined : prop.folder,
                        order: prop.order
                    }).then(function (data) {
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
                                _.url.hash({id: _.url.hash('id') + '.' + foundRecurrence});
                            } else {
                                //ok its not in the list lets show it directly
                                app.trigger('show:appointment', {id: searchItem[1], folder_id: searchItem[0], recurrence_position: 0}, true);
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
            start = new date.Local().setHours(0, 0, 0, 0);
            end = new date.Local(start).setMonth(start.getMonth() + months);
            // increase for next run
            months++;
            return {start: start, end: end};
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

        grid.prop('folder', app.folder.get());
        app.on('folder:change', function () {
            self.updateGridOptions();
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
