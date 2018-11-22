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
    'io.ox/core/capabilities',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style'
], function (ext, links, actions, Dropdown, Toolbar, upload, dropzone, notifications, capabilities, util, gt) {

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
            label: gt.pgettext('app', 'Scheduling'),
            title: gt('Find a free time'),
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
        'export': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Export'),
            drawDisabled: true,
            ref: 'io.ox/calendar/detail/actions/export'
        },
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
        if (baton.app.perspective.getName() !== 'list') return;
        var link = this.$el.find('[data-name="print"]');
        link.toggleClass('disabled', baton.data && _.isEmpty(baton.data));
    }

    function print(baton, e) {
        e.preventDefault();
        if (baton.app.perspective.getName() === 'list') {
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
            var dropdown = new Dropdown({ caret: true, model: baton.app.props, label: gt('View'), tagName: 'li', attributes: { role: 'presentation' } })
            .group(gt('Layout'))
            .option('layout', 'week:day', gt('Day'), { radio: true, group: true });
            if (_.device('!smartphone')) dropdown.option('layout', 'week:workweek', gt('Workweek'), { radio: true, group: true });
            dropdown.option('layout', 'week:week', gt('Week'), { radio: true, group: true })
                .option('layout', 'month', gt('Month'), { radio: true, group: true })
                .option('layout', 'year', gt('Year'), { radio: true, group: true })
                .option('layout', 'list', gt('List'), { radio: true, group: true })
                .divider()
                .group(gt('Options'))
                .option('folderview', true, gt('Folder view'), { group: true })
                .option('showMiniCalendar', true, gt('Mini calendar'), { group: true });

            if (baton.app.props.get('layout') === 'month') {
                dropdown.option('showMonthviewWeekend', true, gt('Weekends'), { group: true });
                // dropdown.option('showMonthviewCW', true, gt('CW'));
            }

            dropdown
                .option('checkboxes', true, gt('Checkboxes'), { group: true })
                .listenTo(baton.app.props, 'change:layout', updateCheckboxOption)
                .listenTo(baton.app.props, 'change:layout', updateColorOption);

            if (capabilities.has('calendar-printing') && baton.app.props.get('layout') !== 'year') {
                dropdown
                .divider()
                .link('print', gt('Print'), print.bind(null, baton));
            }

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

            var toolbarView = new Toolbar({ title: app.getTitle(), tabindex: 0 });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.render().$el
            );

            function updateCallback($toolbar) {
                toolbarView.replaceToolbar($toolbar).initButtons();
            }

            app.updateToolbar = _.debounce(function (list) {
                if (!list) return;
                // extract single object if length === 1
                if (list.length === 1) {
                    list = list[0];
                    // add flags to draw items correctly
                    list.flags = this.listView.selection.getNode(this.listView.selection.get()).attr('data-flags') || '';
                } else if (list.length > 1) {
                    // add flags
                    list = _(list).map(function (item) {
                        return _.extend(item, { flags: app.listView.selection.getNode(util.cid(item)).attr('data-flags') || '' });
                    });
                }
                // disable visible buttons
                toolbarView.disableButtons();
                // draw toolbar
                var $toolbar = toolbarView.createToolbar(),
                    baton = ext.Baton({ $el: $toolbar, data: list, app: app }),
                    ret = ext.point('io.ox/calendar/classic-toolbar').invoke('draw', $toolbar, baton);
                $.when.apply($, ret.value()).done(_.lfo(updateCallback, $toolbar));
            }, 10);
        }
    });

    function prepareUpdateToolbar(app) {
        var perspective = app.perspective,
            list = perspective && perspective.getName() === 'list' ? app.listView.selection.get() : {};
        list = _(list).map(function (item) {
            if (_.isString(item)) return util.cid(item);
            return item;
        });
        app.updateToolbar(list);
    }

    ext.point('io.ox/calendar/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar();
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

    // bottom toolbar
    ext.point('io.ox/calendar/mediator').extend({
        id: 'bottom-toolbar',
        index: 10300,
        setup: function (app) {
            if (_.device('smartphone')) return;
            var toolbar = $('<div class="generic-toolbar calendar bottom visual-focus">').append(
                $('<a href="#" class="toolbar-item" role="button" data-action="close-folder-view">').attr('aria-label', gt('Open folder view')).append(
                    $('<i class="fa fa-angle-double-right" aria-hidden="true">').attr('title', gt('Open folder view'))
                ).on('click', { state: true }, app.toggleFolderView)
            );
            app.getWindow().nodes.body.toggleClass('bottom-toolbar', app.props.get('layout') !== 'list').append(toolbar);
            toolbar.toggle(app.props.get('layout') !== 'list');

            app.getWindow().on('change:perspective', function (e, value) {
                app.getWindow().nodes.body.toggleClass('bottom-toolbar', value !== 'list');
                toolbar.toggle(value !== 'list');
            });
        }
    });

    ext.point('io.ox/calendar/mediator').extend({
        id: 'metrics-toolbar',
        index: 10300,
        setup: function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    toolbar = nodes.body.find('.classic-toolbar-container');

                // toolbar actions
                toolbar.on('mousedown', '.io-ox-action-link:not(.dropdown-toggle)', function (e) {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar options dropdown
                toolbar.on('mousedown', '.dropdown a:not(.io-ox-action-link)', function (e) {
                    var node =  $(e.target).closest('a'),
                        isToggle = node.attr('data-toggle') === 'true';
                    if (!node.attr('data-name')) return;
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: isToggle ? !node.find('.fa-check').length : node.attr('data-value')
                    });
                });
            });
        }
    });
});
