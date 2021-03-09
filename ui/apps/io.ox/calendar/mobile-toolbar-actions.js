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

define('io.ox/calendar/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/actions/mobile',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'io.ox/calendar/actions'
], function (ext, ToolbarView, mobile, api, util, gt) {

    'use strict';

    // define links for each page

    var meta = {
        'create': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Create'),
            icon: 'fa-plus',
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/create'
        },
        'listView': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('List view'),
            icon: 'fa-list',
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/switch-to-list-view'
        },
        'calendarView': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Calendar view'),
            icon: 'fa-table',
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/switch-to-month-view'
        },
        'next': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Show next month'),
            icon: 'fa-chevron-right',
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/showNext'
        },
        'prev': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Show previous month'),
            icon: 'fa-chevron-left',
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/showPrevious'
        },
        'today': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Today'),
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/showToday'
        },
        'move': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Move'),
            icon: 'fa-sign-in',
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/move'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Delete'),
            icon: 'fa-trash-o',
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/delete'
        },
        'export': {
            prio: 'hi',
            mobile: 'hi',
            title: gt('Export'),
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/export'
        }
    };

    var points = {
        monthView: 'io.ox/calendar/mobile/toolbar/month',
        weekView: 'io.ox/calendar/mobile/toolbar/week',
        listView: 'io.ox/calendar/mobile/toolbar/list',
        listViewMulti: 'io.ox/calendar/mobile/toolbar/list/multiselect',
        detailView: 'io.ox/calendar/mobile/toolbar/detailView'
    };

    // clone all available links from inline links (larger set)
    ext.point(points.detailView + '/links').extend(
        ext.point('io.ox/calendar/links/inline').list().map(function (item) {
            item = _(item).pick('id', 'index', 'prio', 'mobile', 'icon', 'title', 'ref', 'section', 'sectionTitle');
            switch (item.id) {
                case 'edit': item.icon = 'fa-pencil'; break;
                case 'accept': item.mobile = 'hi'; item.icon = 'fa-check'; break;
                case 'decline': item.mobile = 'lo'; break;
                case 'delete': item.mobile = 'hi'; item.icon = 'fa-trash'; break;
                case 'send mail': item.mobile = 'hi'; item.icon = 'fa-envelope-o'; break;
                // no default
            }
            return item;
        })
    );

    mobile.addAction(points.monthView, meta, ['create', 'listView', 'prev', 'today', 'next']);
    mobile.addAction(points.weekView, meta, ['create', 'listView', 'prev', 'today', 'next']);
    mobile.addAction(points.listView, meta, ['calendarView']);
    mobile.addAction(points.listViewMulti, meta, ['move', 'delete']);
    mobile.createToolbarExtensions(points);

    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;
        // draw toolbar
        var baton = ext.Baton({ data: list, app: this });
        this.pages.getToolbar('month').setBaton(baton);
        this.pages.getToolbar('week:day').setBaton(baton);
        this.pages.getToolbar('list').setBaton(baton);
        this.pages.getSecondaryToolbar('list').setBaton(baton);

    }, 10);

    function prepareUpdateToolbar(app) {
        var list = app.pages.getCurrentPage().name === 'list' ? app.listView.selection.get() : [];
        list = _(list).map(function (item) {
            if (_.isString(item)) item = _.extend(util.cid(item), { flags: app.listView.selection.getNode(item).attr('data-flags') || '' });
            return item;
        });
        app.updateToolbar(list);
    }

    // some mediator extensions
    // register update function and introduce toolbar updating
    ext.point('io.ox/calendar/mediator').extend({
        id: 'toolbar-mobile',
        index: 10100,
        setup: function (app) {
            if (_.device('!smartphone')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/calendar/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (_.device('!smartphone')) return;
            app.updateToolbar([]);
            // update toolbar on selection change
            app.listView.on('selection:change', function () {
                prepareUpdateToolbar(app);
            });
            // folder change
            app.on('folder:change', function () {
                prepareUpdateToolbar(app);
            });
            app.getWindow().on('change:perspective change:initialPerspective', function () {
                _.defer(prepareUpdateToolbar, app);
            });
        }
    });

    ext.point('io.ox/calendar/mediator').extend({
        id: 'change-mode-toolbar-mobile',
        index: 10400,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            // if multiselect is triggered, show secondary toolbar with other options based on selection
            app.props.on('change:checkboxes', function (model, state) {
                app.pages.toggleSecondaryToolbar('list', state);
            });
        }
    });

});
