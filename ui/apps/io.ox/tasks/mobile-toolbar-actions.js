/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/tasks/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/mobile',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks',
    'io.ox/tasks/actions'
], function (ext, ToolbarView, mobile, api, gt) {

    'use strict';

    var meta = {
        'create': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('New task'),
            icon: 'fa-plus',
            drawDisabled: true,
            ref: 'io.ox/tasks/actions/create'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa-pencil',
            title: gt('Edit'),
            ref: 'io.ox/tasks/actions/edit',
            drawDisabled: true
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa-trash-o',
            title: gt('Delete'),
            ref: 'io.ox/tasks/actions/delete',
            drawDisabled: true
        },
        'done': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa-check',
            title: gt('Mark as done'),
            ref: 'io.ox/tasks/actions/done',
            drawDisabled: true
        },
        'undone': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Mark as undone'),
            ref: 'io.ox/tasks/actions/undone'
        },
        'confirm': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Change confirmation status'),
            ref: 'io.ox/tasks/actions/confirm'
        },
        'move': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Move'),
            ref: 'io.ox/tasks/actions/move'
        },
        'export': {
            prio: 'hi',
            mobile: 'lo',
            title: gt('Export'),
            ref: 'io.ox/tasks/actions/export'
        }
    };

    var points = {
        listView: 'io.ox/tasks/mobile/toolbar/listView',
        detailView: 'io.ox/tasks/mobile/toolbar/detailView'
    };

    mobile.addAction(points.listView, meta, ['create']);
    mobile.addAction(points.detailView, meta, ['edit', 'done', 'delete', 'undone', 'confirm', 'move', 'export']);
    mobile.createToolbarExtensions(points);

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
