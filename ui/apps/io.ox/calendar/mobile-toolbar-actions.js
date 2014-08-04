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

define('io.ox/calendar/mobile-toolbar-actions',
   ['io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/calendar/api',
    'gettext!io.ox/calendar'],
    function (ext, links, api, gt) {

    'use strict';

    // define links for each page

    var pMonth = ext.point('io.ox/calendar/mobile/toolbar/month'),
        pWeek = ext.point('io.ox/calendar/mobile/toolbar/week'), // actually a single day as we use week:day
        pList = ext.point('io.ox/calendar/mobile/toolbar/list'),
        pDetail = ext.point('io.ox/calendar/mobile/toolbar/detailView'),
        meta = {
            'create': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Create'),
                icon: 'fa fa-plus',
                drawDisabled: true,
                ref: 'io.ox/calendar/detail/actions/create',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'listView': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Listview'),
                icon: 'fa fa-list',
                drawDisabled: true,
                ref: 'io.ox/calendar/actions/switch-to-list-view',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'calendarView': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Calendar view'),
                icon: 'fa fa-table',
                drawDisabled: true,
                ref: 'io.ox/calendar/actions/switch-to-month-view',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'nextDay': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Show next day'),
                icon: 'fa fa-chevron-right',
                drawDisabled: true,
                ref: 'io.ox/calendar/actions/dayview/showNext',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'

            },
            'prevDay': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Show previous day'),
                icon: 'fa fa-chevron-left',
                drawDisabled: true,
                ref: 'io.ox/calendar/actions/dayview/showPrevious',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'today': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Today'),
                drawDisabled: true,
                ref: 'io.ox/calendar/actions/dayview/showToday',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            }
        };

    // helper for extending
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
    // add default actions to toolbar which might be extended by 3rd party apps
    pDetail.extend(new links.Dropdown({
        index: 100,
        label: $('<span>').text(
            //.# Will be used as button label in the toolbar, allowing the user to peform actions for the current appointment
            gt('Actions')
        ),
        noCaret: true, // don't draw the caret icon beside menu link
        drawDisabled: true,
        ref: 'io.ox/calendar/links/inline'
    }));

    // add other actions
    addAction(pMonth, ['create', 'listView']);
    addAction(pWeek, ['create', 'listView', 'prevDay', 'today', 'nextDay']);
    addAction(pList, ['calendarView']);
    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        // extract single object if length === 1
        list = list.length === 1 ? list[0] : list;
        // draw toolbar
        var baton = ext.Baton({data: list, app: this });
        this.pages.getToolbar('month').setBaton(baton);
        this.pages.getToolbar('week').setBaton(baton);
        this.pages.getToolbar('list').setBaton(baton);

    }, 10);

    function prepareUpdateToolbar(app) {
        var list = app.pages.getCurrentPage().name === 'list' ? app.getGrid().selection.get() : {};
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
            app.updateToolbar();
            // update toolbar on selection change
            app.getGrid().selection.on('change', function () {
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

});
