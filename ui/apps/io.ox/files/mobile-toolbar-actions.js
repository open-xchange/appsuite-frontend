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

define('io.ox/files/mobile-toolbar-actions',
   ['io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/files/api',
    'gettext!io.ox/mail'],
    function (ext, links, api, gt) {

    'use strict';

    // define links for each page

    var pointMainView = ext.point('io.ox/files/mobile/toolbar/mainView'),
        pointMultiSelect = ext.point('io.ox/files/mobile/toolbar/mainView/multiselect'),
        pointDetailView = ext.point('io.ox/files/mobile/toolbar/detailView'),
        meta = {
            'add': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Add file'),
                icon: 'fa fa-plus',
                drawDisabled: true,
                ref: 'io.ox/files/actions/upload',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'view-icon': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Show icons'),
                icon: 'fa fa-th',
                drawDisabled: true,
                ref: 'io.ox/files/actions/layout-icon',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'view-tile': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Show tiles'),
                icon: 'fa fa-th-large',
                drawDisabled: true,
                ref: 'io.ox/files/actions/layout-tile',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'view-list': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Show list'),
                icon: 'fa fa-align-justify',
                drawDisabled: true,
                ref: 'io.ox/files/actions/layout-list',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'
            },
            'actions': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Actions'),
                drawDisabled: true,
                ref: 'io.ox/files/links/inline',
                cssClasses: 'io-ox-action-link mobile-toolbar-action'

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

    addAction(pointMainView, ['add', 'view-list', 'view-icon', 'view-tile']);

    // add submenu as text link to toolbar in multiselect
    pointDetailView.extend(new links.Dropdown({
        index: 300,
        label: $('<span>').text(
            //.# Will be used as button label in the toolbar, allowing the user to choose an alternative layout for the current view
            gt('Actions')
        ),
        noCaret: true, // don't draw the caret icon beside menu link
        drawDisabled: true,
        ref: 'io.ox/files/links/inline'
    }));

    // add submenu as text link to toolbar in multiselect
    pointMultiSelect.extend(new links.Dropdown({
        index: 100,
        label: $('<span>').text(
            //.# Will be used as button label in the toolbar, allowing the user to choose an alternative layout for the current view
            gt('Actions')
        ),
        noCaret: true, // don't draw the caret icon beside menu link
        drawDisabled: true,
        ref: 'io.ox/files/links/inline'
    }));

    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        var self = this,
            ids = this.getIds ? this.getIds() : [];

        //get full data, needed for require checks for example
        api.getList(list).done(function (data) {
            // extract single object if length === 1
            data = data.length === 1 ? data[0] : data;
            // draw toolbar
            var baton = ext.Baton({data: data, app: self, allIds: ids});
             // handle updated baton to pageController
            self.pages.getToolbar('detailView').setBaton(baton);
            self.pages.getSecondaryToolbar('mainView').setBaton(baton);
        });

    }, 10);

    // some mediator extensions
    // register update function and introduce toolbar updating
    ext.point('io.ox/files/mediator').extend({
        id: 'toolbar-mobile',
        index: 10100,
        setup: function (app) {
            if (_.device('!small')) return;
            app.updateToolbar = updateToolbar;
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'update-toolbar-mobile',
        index: 10300,
        setup: function (app) {
            if (!_.device('small')) return;
            // folder change

            function fnFolderChange() {
                app.folder.getData().done(function (data) {
                    var baton = ext.Baton({ data: data, app: app });
                    // handle updated baton to pageController
                    app.pages.getToolbar('mainView').setBaton(baton);
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

            app.on('selection:change', function () {
                if (!app.props.get('showCheckboxes')) return;
                app.updateToolbar(app.selection.get());
            });
        }
    });

});
