/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/tasks/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks'
], function (ext, links, api, gt) {

    'use strict';

    // define links for each page

    var pointListViewActions = ext.point('io.ox/tasks/mobile/toolbar/actions'),
        pointListView = ext.point('io.ox/tasks/mobile/toolbar/listView'),
        pointDetailView = ext.point('io.ox/tasks/mobile/toolbar/detailView'),
        actions = ext.point('io.ox/tasks/mobile/actions'),
        meta = {
            'create': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('New'),
                icon: 'fa fa-plus',
                drawDisabled: true,
                ref: 'io.ox/tasks/actions/create',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'edit': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Edit'),
                ref: 'io.ox/tasks/actions/edit',
                drawDisabled: true
            },
            'delete': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Delete'),
                drawDisabled: true,
                ref: 'io.ox/tasks/actions/delete'
            },
            'done': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Mark as done'),
                drawDisabled: true,
                ref: 'io.ox/tasks/actions/done'
            },
            'undone': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Mark as undone'),
                drawDisabled: true,
                ref: 'io.ox/tasks/actions/undone'
            },
            'confirm': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Change confirmation status'),
                drawDisabled: true,
                ref: 'io.ox/tasks/actions/confirm'
            },
            'move': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Move'),
                ref: 'io.ox/tasks/actions/move'
            }
        };

    function addAction(point, ids) {
        var index = 0;
        _(ids).each(function (id) {
            var extension = meta[id];
            extension.id = id;
            extension.index = (index += 100);
            point.extend(new links.Link(extension));
        });
        index = 0;
    }

    addAction(pointListViewActions, ['create']);

    pointListView.extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        index: 100,
        id: 'toolbar-links',
        ref: 'io.ox/tasks/mobile/toolbar/actions'
    }));

    addAction(actions, ['done', 'undone', 'confirm', 'edit', 'delete', 'confirm', 'move']);

    // add submenu as text link to toolbar in multiselect
    pointDetailView.extend(new links.Dropdown({
        index: 50,
        label: $('<span>').text(
            //.# Will be used as menu heading in tasks module which then show the actions which can be performed with a task like "mark as done"
            gt('Actions')
        ),
        // don't draw the caret icon beside menu link
        noCaret: true,
        drawDisabled: true,
        ref: 'io.ox/tasks/mobile/actions'
    }));

    var updateToolbar = _.debounce(function (task) {
        var self = this;
        //get full data, needed for require checks for example
        api.get(task).done(function (data) {
            if (!data) return;
            var baton = ext.Baton({ data: data, app: self });
            // handle updated baton to pageController
            self.pages.getToolbar('detailView').setBaton(baton);
        });
    }, 50);

    // multi select toolbar links need some attention
    // in case nothing is selected disabled buttons
    // This should be done via our Link concept, but I
    // didn't get it running. Feel free to refactor this
    // to a nicer solutioun
    /*pointListViewMultiSelect.extend({
        id: 'update-button-states',
        index: 10000,
        draw: function (baton) {
            // hmmmm, should work for this easy case
            if (baton.data.length === 0) {
                $('.mobile-toolbar-action', this).addClass('ui-disabled');
            } else {
                $('.mobile-toolbar-action', this).removeClass('ui-disabled');
            }
        }
    });*/

    // some mediator extensions
    // register update function and introduce toolbar updating
    ext.point('io.ox/tasks/mediator').extend({
        id: 'toolbar-mobile',
        index: 10100,
        setup: function (app) {
            if (_.device('!smartphone')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/tasks/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (!_.device('smartphone')) return;

            api.on('update', function (e, data) {
                app.updateToolbar(data);
            });

            // folder change
            app.grid.on('change:ids', function () {
                app.folder.getData().done(function (data) {
                    var baton = ext.Baton({ data: data, app: app });
                    // handle updated baton to pageController
                    app.pages.getToolbar('listView').setBaton(baton);
                });
            });

            // multiselect
            function updateSecondaryToolbar(list) {
                if (app.props.get('checkboxes') !== true) return;
                if (list.length === 0) {
                    // reset to remove old baton
                    app.pages.getSecondaryToolbar('listView')
                        .setBaton(ext.Baton({ data: [], app: app }));
                    return;
                }
                api.getList(list).done(function (data) {
                    if (!data) return;
                    var baton = ext.Baton({ data: data, app: app });
                    // handle updated baton to pageController
                    app.pages.getSecondaryToolbar('listView').setBaton(baton);
                });
            }

            // simple select
            app.grid.selection.on('pagechange:detailView', function () {
                // update toolbar on each pagechange
                var data = app.grid.selection.get();
                app.updateToolbar(data[0]);
            });

            app.grid.selection.on('change', function (e, list) { updateSecondaryToolbar(list); });
            app.props.on('change:checkboxes', function () { updateSecondaryToolbar(app.grid.selection.get()); });
        }
    });

    ext.point('io.ox/tasks/mediator').extend({
        id: 'change-mode-toolbar-mobile',
        index: 10400,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            // if multiselect is triggered, show secondary toolbar with other options based on selection
            app.props.on('change:checkboxes', function (model, state) {
                app.pages.toggleSecondaryToolbar('listView', state);
            });
        }
    });

});
