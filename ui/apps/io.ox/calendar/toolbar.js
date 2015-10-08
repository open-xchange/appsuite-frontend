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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style'
], function (ext, links, actions, Dropdown, Toolbar, upload, dropzone, notifications, gt) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/calendar/classic-toolbar/links');

    var meta = {
        //
        // --- HI ----
        //
        'create': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('New'),
            title: gt('New appointment'),
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/create'
        },
        'schedule': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Scheduling'),
            title: gt('Find a free time'),
            drawDisabled: true,
            ref: 'io.ox/calendar/actions/freebusy'
        },
        'today': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Today'),
            ref: 'io.ox/calendar/actions/today'
        },
        'edit': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Edit'),
            title: gt('Edit appointment'),
            ref: 'io.ox/calendar/detail/actions/edit'
        },
        'changestatus': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Status'),
            title: gt('Change status'),
            ref: 'io.ox/calendar/detail/actions/changestatus'
        },
        'delete': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Delete'),
            title: gt('Delete appointment'),
            ref: 'io.ox/calendar/detail/actions/delete'
        },
        //
        // --- LO ----
        //
        'print': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Print'),
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/print-appointment'
        },
        'move': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
            ref: 'io.ox/calendar/detail/actions/move',
            drawDisabled: true,
            section: 'file-op'
        }
    };

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/calendar/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/calendar/classic-toolbar/links'
    }));

    // local mediator
    function updateCheckboxOption() {
        // only show this option if preview pane is right (vertical/compact)
        var li = this.$el.find('[data-name="checkboxes"]').parent(),
            layout = this.model.get('layout');
        li.toggle(layout === 'list');
    }

    function updateColorOption() {
        // only show this option if preview pane is right (vertical/compact)
        var li = this.$el.find('[data-name="darkColors"]').parent(),
            layout = this.model.get('layout');
        li.toggle(layout !== 'list');
    }

    function updatePrintLink(baton) {
        if (baton.app.getWindow().currentPerspective !== 'list') return;
        var link = this.$el.find('[data-name="print"]');
        link.toggleClass('disabled', baton.data && _.isEmpty(baton.data));
    }

    function print(baton, e) {
        e.preventDefault();
        if (baton.app.getWindow().currentPerspective === 'list') {
            if (!baton.data || _.isEmpty(baton.data)) return;
            actions.invoke('io.ox/calendar/detail/actions/print-appointment', null, baton);
        } else {
            actions.invoke('io.ox/calendar/detail/actions/print', null, ext.Baton({ app: baton.app, window: baton.app.getWindow() }));
        }
    }

    // view dropdown
    ext.point('io.ox/calendar/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {
            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ model: baton.app.props, label: gt('View'), tagName: 'li' })
            .header(gt('Layout'))
            .option('layout', 'week:day', gt('Day'))
            .option('layout', 'week:workweek', gt('Workweek'))
            .option('layout', 'week:week', gt('Week'))
            .option('layout', 'month', gt('Month'))
            .option('layout', 'list', gt('List'))
            .divider()
            .header(gt('Options'))
            .option('folderview', true, gt('Folder view'))
            .option('checkboxes', true, gt('Checkboxes'))
            .divider()
            .header(gt('Color scheme'))
            .option('colorScheme', 'classic', gt('Classic colors'))
            .option('colorScheme', 'dark', gt('Dark colors'))
            .option('colorScheme', 'custom', gt('Custom colors'))
            .divider()
            .link('print', gt('Print'), print.bind(null, baton))
            .listenTo(baton.app.props, 'change:layout', updateCheckboxOption)
            .listenTo(baton.app.props, 'change:layout', updateColorOption);

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );

            updatePrintLink.call(dropdown, baton);
            updateCheckboxOption.call(dropdown);
            updateColorOption.call(dropdown);
        }
    });

    // classic toolbar
    ext.point('io.ox/calendar/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            var toolbar = new Toolbar({ title: app.getTitle(), tabindex: 1 });
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbar.render().$el
            );
            app.updateToolbar = _.queued(function (list) {
                if (!list) return $.when();
                // extract single object if length === 1
                list = list.length === 1 ? list[0] : list;
                // draw toolbar
                var baton = ext.Baton({ $el: toolbar.$list, data: list, app: app }),
                    ret = ext.point('io.ox/calendar/classic-toolbar').invoke('draw', toolbar.$list.empty(), baton);
                return $.when.apply($, ret.value()).then(function () {
                    toolbar.initButtons();
                });
            }, 10);
        }
    });

    function prepareUpdateToolbar(app) {
        var perspective = app.getWindow().getPerspective(),
            list = perspective && perspective.name === 'list' ? app.getGrid().selection.get() : {};
        app.updateToolbar(list);
    }

    ext.point('io.ox/calendar/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
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
