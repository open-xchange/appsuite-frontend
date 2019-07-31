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

define('io.ox/files/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/notifications',
    'gettext!io.ox/files',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, links, actions, Dropdown, Toolbar, notifications, gt, api, folderApi) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/files/classic-toolbar/links'),

        meta = {
            //
            // --- HI ----
            //
            'create': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('New'),
                title: gt('New file'),
                ref: 'io.ox/files/dropdown/new',
                customize: function (baton) {
                    var self = this,
                        $ul = links.DropdownLinks({
                            ref: 'io.ox/files/links/toolbar/default',
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.addClass('disabled')
                                    .attr({ 'aria-disabled': true })
                                    .removeAttr('href');
                            }
                        }, baton);

                    this.append('<i class="fa fa-caret-down" aria-hidden="true">');

                    this.addClass('dropdown-toggle').attr({
                        'aria-haspopup': 'true',
                        'data-toggle': 'dropdown',
                        'role': 'button'
                    });

                    this.parent().addClass('dropdown');

                    new Dropdown({
                        el: this.parent(),
                        $toggle: this,
                        $ul: $ul
                    }).render();
                }
            },
            'edit': {
                prio: 'hi',
                mobile: 'lo',
                label: gt('Edit'),
                ref: 'io.ox/files/actions/editor'
            },
            'share': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-user-plus',
                label: gt('Share'),
                ref: 'io.ox/files/dropdown/share',
                customize: function (baton) {
                    var self = this,
                        $ul = links.DropdownLinks({
                            ref: 'io.ox/files/links/toolbar/share',
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.remove();
                            }
                        }, baton);

                    this.append('<i class="fa fa-caret-down" aria-hidden="true">');

                    this.addClass('dropdown-toggle').attr({
                        'aria-haspopup': 'true',
                        'data-toggle': 'dropdown',
                        'role': 'button'
                    });

                    this.parent().addClass('dropdown');

                    new Dropdown({
                        el: this.parent(),
                        $toggle: this,
                        $ul: $ul
                    }).render();

                    // set proper tooltip
                    var folders = 0, files = 0;
                    _(_.isArray(baton.data) ? baton.data : [baton.data]).each(function (item) {
                        if (item.folder_id === 'folder') {
                            folders++;
                        } else {
                            files++;
                        }
                    });

                    var title = '';

                    if (folders && files) {
                        // mixed selection
                        title = gt('Share selected objects');
                    } else if (folders) {
                        // folders only
                        title = gt.ngettext('Share selected folder', 'Share selected folders', folders);
                    } else if (files) {
                        // files only
                        title = gt.ngettext('Share selected file', 'Share selected files', files);
                    } else {
                        // empty selection
                        title = gt('Share current folder');
                    }

                    this.attr({ 'aria-label': title, 'data-original-title': title });
                }
            },
            'viewer': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-eye',
                //#. used as a verb here. label of a button to view files
                label: gt('View'),
                ref: 'io.ox/files/actions/viewer'
            },
            'download': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-download',
                label: gt('Download'),
                ref: 'io.ox/files/actions/download'
            },
            'download-folder': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-download',
                label: gt('Download'),
                ref: 'io.ox/files/actions/download-folder'
            },
            'delete': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-trash-o',
                label: gt('Delete'),
                ref: 'io.ox/files/actions/delete',
                customize: function (baton) {
                    var folderId = baton.app.folder.get(),
                        model = folderApi.pool.getModel(folderId);

                    if (folderApi.is('trash', model.toJSON())) {
                        this.attr({
                            'aria-label': gt('Delete forever'),
                            'data-original-title': gt('Delete forever')
                        });
                    }
                }
            },
            //
            // --- LO ----
            //
            'addToFavorites': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Add to Favorites'),
                ref: 'io.ox/files/favorites/add',
                section: 'favorites'
            },
            'removeFromFavorites': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Remove from favorites'),
                ref: 'io.ox/files/favorites/remove',
                section: 'favorites'
            },
            'rename': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Rename'),
                ref: 'io.ox/files/actions/rename',
                section: 'edit'
            },
            'edit-description': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Edit description'),
                ref: 'io.ox/files/actions/edit-description',
                section: 'edit'
            },
            'save-as-pdf': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Save as PDF'),
                ref: 'io.ox/files/actions/save-as-pdf',
                section: 'save-as'
            },
            'send': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Send by mail'),
                ref: 'io.ox/files/actions/send',
                section: 'share'
            },
            'add-to-portal': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Add to portal'),
                ref: 'io.ox/files/actions/add-to-portal',
                section: 'share'
            },
            'move': {
                label: gt('Move'),
                prio: 'lo',
                mobile: 'lo',
                ref: 'io.ox/files/actions/move',
                section: 'file-op'
            },
            'copy': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Copy'),
                ref: 'io.ox/files/actions/copy',
                section: 'file-op'
            },
            'lock': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Lock'),
                ref: 'io.ox/files/actions/lock',
                section: 'file-op'
            },
            'unlock': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Unlock'),
                ref: 'io.ox/files/actions/unlock',
                section: 'file-op'
            },
            'restore': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Restore'),
                ref: 'io.ox/files/actions/restore',
                section: 'file-op'
            }
        };

    // local dummy action

    new actions.Action('io.ox/files/dropdown/new', {
        requires: function (e) {
            var folderId = e.baton.app.folder.get(),
                model = folderApi.pool.getModel(folderId);

            return !folderApi.is('trash', model.toJSON());
        },
        action: $.noop
    });

    // new actions.Action('io.ox/files/dropdown/share', {
    //     requires: function () {
    //         return true;
    //     },
    //     action: $.noop
    // });

    new actions.Action('io.ox/files/dropdown/shareFavorites', {
        requires: function (e) {
            var elemId;
            if (e.baton.data) {
                if (!_.isArray(e.baton.data)) {
                    elemId = e.baton.data.id;
                } else if (e.baton.data.length) {
                    elemId = _.first(e.baton.data).id;
                }
            }
            return !!elemId;
        },
        action: $.noop
    });

    // transform into extensions

    var index = 0;

    _(meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/files/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/files/classic-toolbar/links'
    }));

    // view dropdown
    ext.point('io.ox/files/classic-toolbar').extend({
        id: 'view-dropdown',
        index: 10000,
        draw: function (baton) {

            if (_.device('smartphone')) return;

            //#. View is used as a noun in the toolbar. Clicking the button opens a popup with options related to the View
            var dropdown = new Dropdown({ model: baton.app.props, label: gt('View'), tagName: 'li', caret: true })
                .group(gt('Layout'))
                .option('layout', 'list', gt('List'), { group: true })
                .option('layout', 'icon', gt('Icons'), { group: true })
                .option('layout', 'tile', gt('Tiles'), { group: true })
                .divider()
                .group(gt('Options'))
                .option('checkboxes', true, gt('Checkboxes'), { group: true })
                .option('folderview', true, gt('Folder view'), { group: true });

            if (_.device('!touch')) dropdown.option('details', true, gt('File details'), { group: true });

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {

            var toolbarView = new Toolbar({ title: app.getTitle() });

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbarView.render().$el
            );

            function updateCallback($toolbar) {
                toolbarView.replaceToolbar($toolbar).initButtons();
            }

            app.updateToolbar = _.debounce(function (list) {
                if (!list) return;
                // turn cids into proper objects
                var cids = list, models = api.resolve(cids, false);
                list = _(models).invoke('toJSON');
                // extract single object if length === 1
                var data = list.length === 1 ? list[0] : list;
                // disable visible buttons
                toolbarView.disableButtons();
                // draw toolbar
                var $toolbar = toolbarView.createToolbar(),
                    baton = ext.Baton({ $el: $toolbar, data: data, models: models, collection: app.listView.collection, app: this, allIds: [] }),
                    ret = ext.point('io.ox/files/classic-toolbar').invoke('draw', $toolbar, baton);
                $.when.apply($, ret.value()).done(_.lfo(updateCallback, $toolbar));
            }, 10);
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'update-toolbar',
        index: 10200,
        setup: function (app) {
            app.updateToolbar([]);
            // update toolbar on selection change as well as any model change
            app.listView.on('selection:change change', function () {
                app.updateToolbar(app.listView.selection.get());
            });
            api.on('favorite:add favorite:remove', function () {
                app.updateToolbar(app.listView.selection.get());
            });
            folderApi.on('favorite:add favorite:remove', function () {
                app.updateToolbar(app.listView.selection.get());
            });
        }
    });

    ext.point('io.ox/files/mediator').extend({
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
                        app: 'drive',
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
                        app: 'drive',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-tracking-id') || node.attr('data-name') || node.attr('data-action'),
                        detail: isToggle ? !node.find('.fa-check').length : node.attr('data-value')
                    });
                });
            });
        }
    });
});
