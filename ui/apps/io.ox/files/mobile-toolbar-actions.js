/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/files/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/mobile',
    'io.ox/backbone/views/toolbar',
    'io.ox/files/api',
    'gettext!io.ox/mail',
    'io.ox/files/actions'
], function (ext, mobile, ToolbarView, api, gt) {

    'use strict';

    // define links for each page

    var meta = {
        'create': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa-plus',
            dropdown: 'io.ox/files/toolbar/new',
            drawDisabled: true,
            caret: false
        },
        'upload': {
            prio: 'hi',
            mobile: 'hi',
            icon: 'fa-cloud-upload',
            dropdown: 'io.ox/files/toolbar/upload',
            drawDisabled: true,
            caret: false
        },
        'view-icon': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Show icons'),
            icon: 'fa-th',
            ref: 'io.ox/files/actions/layout-icon',
            drawDisabled: true
        },
        'view-tile': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Show tiles'),
            icon: 'fa-th-large',
            ref: 'io.ox/files/actions/layout-tile',
            drawDisabled: true
        },
        'view-list': {
            prio: 'hi',
            mobile: 'hi',
            label: gt('Show list'),
            icon: 'fa-align-justify',
            ref: 'io.ox/files/actions/layout-list',
            drawDisabled: true
        }
    };

    var points = {
        listView: 'io.ox/files/mobile/toolbar/main',
        listViewMultiSelect: 'io.ox/files/mobile/toolbar/main/multiselect'
    };

    // clone all available links from inline links (larger set)
    ext.point(points.listViewMultiSelect + '/links').extend(
        ext.point('io.ox/files/links/inline').list().map(function (item) {
            item = _(item).pick('id', 'index', 'prio', 'mobile', 'icon', 'title', 'ref', 'section', 'sectionTitle');
            switch (item.id) {
                case 'openviewer': item.icon = 'fa-eye'; break;
                // no default
            }
            return item;
        })
    );

    mobile.addAction(points.listView, meta, ['create', 'upload', 'view-list', 'view-icon', 'view-tile']);
    mobile.createToolbarExtensions(points);

    var updateToolbar = _.debounce(function (list) {
        if (!list || !list.length) return;
        var cids = list, models = api.resolve(cids, false);
        list = _(models).invoke('toJSON');
        // draw toolbar
        var baton = ext.Baton({ data: list, app: this, models: models, collection: this.listView.collection, allIds: [] });
        // handle updated baton to pageController
        this.pages.getSecondaryToolbar('main').setBaton(baton);
    }, 10);

    // some mediator extensions
    // register update function and introduce toolbar updating
    ext.point('io.ox/files/mediator').extend({
        id: 'toolbar-mobile',
        index: 10100,
        setup: function (app) {
            if (_.device('!smartphone')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (!_.device('smartphone')) return;
            // folder change

            function fnFolderChange() {
                app.folder.getData().done(function (data) {
                    var baton = ext.Baton({ data: data, app: app });
                    // handle updated baton to pageController
                    app.pages.getToolbar('main').setBaton(baton);
                });
            }

            app.on('folder:change', fnFolderChange);
            fnFolderChange();

            // simple select
            app.on('selection:setup', function () {
                app.selection.on('select', function (e, id) {
                    app.updateToolbar(id);
                });
            });

            app.listView.on('selection:change', _.debounce(function (selection) {
                selection = selection || app.listView.selection.get();
                app.pages.toggleSecondaryToolbar('main', selection.length > 0);
                app.updateToolbar(selection);
            }, 10));

            app.pages.getPage('main').on('pageshow', function () {
                app.pages.getToolbar('main').setBaton(new ext.Baton({ app: app }));
            });
        }
    });
});
