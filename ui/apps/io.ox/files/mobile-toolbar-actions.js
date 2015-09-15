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

define('io.ox/files/mobile-toolbar-actions', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/files/api',
    'gettext!io.ox/mail'
], function (ext, links, api, gt) {

    'use strict';

    // define links for each page

    var Action = links.Action,
        pointMainView = ext.point('io.ox/files/mobile/toolbar/main'),
        pointMainViewActions = ext.point('io.ox/files/mobile/toolbar/actions'),
        pointMultiSelect = ext.point('io.ox/files/mobile/toolbar/main/multiselect'),
        meta = {
            'create': {
                prio: 'hi',
                mobile: 'hi',
                drawDisabled: true,
                icon: 'fa fa-plus',
                cssClasses: 'io-ox-action-link mobile-toolbar-action',
                ref: 'io.ox/files/dropdown/new',
                customize: function (baton) {
                    var self = this;

                    this.after(
                        links.DropdownLinks({
                            ref: 'io.ox/files/links/toolbar/default',
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.addClass('disabled')
                                    .attr({ 'aria-disabled': true })
                                    .removeAttr('href');
                            }
                        }, baton)
                    );

                    this.addClass('dropdown-toggle').attr({
                        'data-toggle': 'dropdown'
                    }).dropdown();
                }
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

    // actions
    new Action('io.ox/files/actions/layout-list', {
        action: function (baton) {
            baton.app.props.set('layout', 'list');
        }
    });

    new Action('io.ox/files/actions/layout-icon', {
        action: function (baton) {
            baton.app.props.set('layout', 'icon');
        }
    });

    new Action('io.ox/files/actions/layout-tile', {
        action: function (baton) {
            baton.app.props.set('layout', 'tile');
        }
    });

    // add submenu as text link to toolbar in multiselect
    pointMultiSelect.extend(new links.Dropdown({
        index: 100,
        label: $('<span>').text(
            //.# Will be used as button label in the toolbar, allowing the user to choose some file actions like "copy" or "delete"
            gt('Actions')
        ),
        // don't draw the caret icon beside menu link
        noCaret: true,
        drawDisabled: true,
        ref: 'io.ox/files/links/inline'
    }));

    var updateToolbar = _.debounce(function (list) {
        if (!list) return;
        var cids = list, models = api.resolve(cids, false), data, baton;

        list = _(models).invoke('toJSON');
        // extract single object if length === 1
        data = list.length === 1 ? list[0] : list;
        // draw toolbar
        baton = ext.Baton({ data: data, app: this, models: models, collection: this.listView.collection, allIds: [] });
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
        id: 'toolbar-mobile-defaultactions',
        index: 10200,
        setup: function () {
            if (_.device('!smartphone')) return;

            addAction(pointMainViewActions, ['create', 'view-list', 'view-icon', 'view-tile']);

            pointMainView.extend(new links.InlineLinks({
                attributes: {},
                classes: '',
                index: 10,
                id: 'toolbar-links',
                ref: 'io.ox/files/mobile/toolbar/actions'
            }));
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

            app.listView.on('selection:change', function (selection) {
                if (!selection) {
                    selection = app.listView.selection.get();
                }
                if (selection.length === 0) {
                    app.pages.toggleSecondaryToolbar('main', false);
                } else {
                    app.pages.toggleSecondaryToolbar('main', true);
                }
                app.updateToolbar(selection);
            });

            app.pages.getPage('main').on('pageshow', function () {
                app.pages.getToolbar('main').setBaton(new ext.Baton({ app: app }));
            });
        }
    });

});
