/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/toolbar', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/tk/upload',
    'io.ox/core/dropzone',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/calendar/actions',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/style'
], function (ext, actionsUtil, Dropdown, ToolbarView, upload, dropzone, notifications, capabilities, api, util, inlineLinks, gt) {

    'use strict';

    if (_.device('smartphone')) return;

    // define links for classic toolbar
    var point = ext.point('io.ox/calendar/toolbar/links');

    // transform into extensions

    var index = 0;

    _(inlineLinks).each(function (extension) {
        extension.index = (index += 100);
        delete extension.invoke;
        delete extension.metadata;
        point.extend(extension);
    });

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
        if (baton.app.perspective && baton.app.perspective.getName() !== 'list') return;
        var link = this.$el.find('[data-name="print"]');
        link.toggleClass('disabled', baton.data && _.isEmpty(baton.data));
    }

    function print(baton, e) {
        e.preventDefault();
        if (baton.app.perspective && baton.app.perspective.getName() === 'list') {
            if (!baton.data || _.isEmpty(baton.data)) return;
            actionsUtil.invoke('io.ox/calendar/detail/actions/print-appointment', baton);
        } else {
            actionsUtil.invoke('io.ox/calendar/detail/actions/print', ext.Baton({ app: baton.app, window: baton.app.getWindow() }));
        }
    }

    // view dropdown
    ext.point('io.ox/calendar/toolbar/links').extend({
        id: 'view-dropdown',
        index: 10000,
        custom: true,
        draw: function (baton) {

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ el: this, caret: true, model: baton.app.props, label: gt('View') })
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

            dropdown.render().$el.addClass('dropdown pull-right').attr('data-dropdown', 'view');

            setTimeout(function () {
                // in case we get fast multiple renderings of the toolbar, the dropdown might already be disposed.
                if (dropdown.model === null) return;
                updatePrintLink.call(dropdown, baton);
                updateCheckboxOption.call(dropdown);
                updateColorOption.call(dropdown);
            }, 0);
        }
    });

    // classic toolbar
    ext.point('io.ox/calendar/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            // don't use strict mode here. We also want to update the toolbar when the selected folder changes, not only when the selection changes (permissions for the selected folder might be different)
            var toolbarView = new ToolbarView({ point: 'io.ox/calendar/toolbar/links', title: app.getTitle(), strict: false });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.$el
            );

            // selection is array of strings
            app.updateToolbar = function (selection) {
                var options = { data: [], models: [], folder_id: this.folder.get(), app: this },
                    list = selection.map(_.cid);
                toolbarView.setSelection(list, function () {
                    if (!list.length || list.length > 100) return options;
                    return api.getList(list).pipe(function (models) {
                        options.models = models;
                        options.data = _(models).invoke('toJSON');
                        return options;
                    });
                });
            };

            app.forceUpdateToolbar = function (selection) {
                toolbarView.selection = null;
                this.updateToolbar(selection);
            };

            app.toolbarView = toolbarView;
        }
    });

    ext.point('io.ox/calendar/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change
            app.listView.on('selection:change', function () {
                // prevent unneeded redraws if new selection matches current selection
                if (_.isEqual(_.compact((app.toolbarView.selection || '').split(',').sort()), _.compact(getSelection(app).sort()))) return;
                app.updateToolbar(getSelection(app));
            });
            // folder change
            app.on('folder:change', function () {
                app.updateToolbar(getSelection(app));
            });
            app.getWindow().on('change:perspective change:initialPerspective', function () {
                _.defer(function () { app.forceUpdateToolbar(getSelection(app)); });
            });
        }
    });

    function getSelection(app) {
        return app.perspective && app.perspective.getName() === 'list' ? app.listView.selection.get() : [];
    }

    // bottom toolbar
    ext.point('io.ox/calendar/mediator').extend({
        id: 'bottom-toolbar',
        index: 10300,
        setup: function (app) {
            if (_.device('smartphone')) return;

            var toolbar = $('<div class="generic-toolbar calendar bottom visual-focus" role="region">').append(
                $('<button type="button" class="btn btn-link toolbar-item" data-action="close-folder-view">').attr('aria-label', gt('Open folder view')).append(
                    $.icon('fa-angle-double-right', gt('Open folder view'))
                ).on('click', { state: true }, app.toggleFolderView)
            );

            app.getWindow().nodes.body.append(toolbar);

            var toggleToolbar = function () {
                var isList = app.props.get('layout') === 'list';
                app.getWindow().nodes.body.toggleClass('bottom-toolbar', !isList);
                toolbar.toggle(!isList);
            };

            app.getWindow().nodes.body.append(toolbar);
            app.props.on('change:layout', toggleToolbar);
            app.getWindow().on('change:perspective', toggleToolbar);
        }
    });
});
