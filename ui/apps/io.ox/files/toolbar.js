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

define('io.ox/files/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/notifications',
    'gettext!io.ox/files',
    'io.ox/files/api',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, links, actions, Dropdown, Toolbar, notifications, gt, api) {

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
                    var self = this;

                    this.append('<i class="fa fa-caret-down">');

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
                        'aria-haspopup': 'true',
                        'data-toggle': 'dropdown',
                        'role': 'button'
                    }).dropdown();

                    this.parent().addClass('dropdown');
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
                title: gt('Share current folder'),
                ref: 'io.ox/files/dropdown/share',
                customize: function (baton) {
                    var self = this;
                    this.append('<i class="fa fa-caret-down">');

                    this.after(
                        links.DropdownLinks({
                            ref: 'io.ox/files/links/toolbar/share',
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.remove();
                            }
                        }, baton)
                    );

                    this.addClass('dropdown-toggle').attr({
                        'aria-haspopup': 'true',
                        'data-toggle': 'dropdown',
                        'role': 'button'
                    }).dropdown();

                    this.parent().addClass('dropdown');

                    // set proper tooltip
                    var folders = 0,
                        files = 0;
                    _(_.isArray(baton.data) ? baton.data : [baton.data]).each( function (item) {
                        if (item.folder_id === 'folder') {
                            folders++;
                        } else {
                            files++;
                        }
                    });
                    if (folders) {
                        if (files) {
                            this.attr('data-original-title', gt('Share selected objects'));
                        } else {
                            this.attr('data-original-title', gt.ngettext('Share selected folder', 'Share selected folders', folders));
                        }
                    } else if (files) {
                        this.attr('data-original-title', gt.ngettext('Share selected file', 'Share selected files', files));
                    } else {
                        this.attr('data-original-title', gt('Share current folder'));
                    }
                }
            },
            'mediaplayer-audio': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-music',
                label: gt('Play audio files'),
                ref: 'io.ox/files/icons/audioplayer'
            },
            'mediaplayer-video': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-film',
                label: gt('Play video files'),
                ref: 'io.ox/files/icons/videoplayer'
            },
            'viewer': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-eye',
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
                ref: 'io.ox/files/actions/delete'
            },
            //
            // --- LO ----
            //
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
            'send': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Send by mail'),
                ref: 'io.ox/files/actions/send',
                section: 'share'
            },
            'sendlink': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Send as internal link'),
                ref: 'io.ox/files/actions/sendlink',
                section: 'share'
            },
            'showlink': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Show internal link'),
                ref: 'io.ox/files/actions/showlink',
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
            }
        };

    // local dummy action

    new actions.Action('io.ox/files/dropdown/new', {
        requires: function () { return true; },
        action: $.noop
    });

    new actions.Action('io.ox/files/dropdown/share', {
        requires: function () { return true; },
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
                .header(gt('Layout'))
                .option('layout', 'list', gt('List'))
                .option('layout', 'icon', gt('Icons'))
                .option('layout', 'tile', gt('Tiles'))
                .divider()
                .header(gt('Options'))
                .option('checkboxes', true, gt('Checkboxes'))
                .option('folderview', true, gt('Folder view'));

            if (_.device('!touch')) dropdown.option('details', true, gt('File details'));

            this.append(
                dropdown.render().$el.addClass('pull-right').attr('data-dropdown', 'view')
            );
        }
    });

    ext.point('io.ox/files/mediator').extend({
        id: 'toolbar',
        index: 10000,
        setup: function (app) {
            var toolbar = new Toolbar({ title: app.getTitle(), tabindex: 1 });
            app.getWindow().nodes.body.addClass('classic-toolbar-visible').prepend(
                toolbar.render().$el
            );
            app.updateToolbar = _.debounce(function (list) {
                if (!list) return;
                // turn cids into proper objects
                var cids = list, models = api.resolve(cids, false);
                list = _(models).invoke('toJSON');
                // extract single object if length === 1
                var data = list.length === 1 ? list[0] : list;
                // draw toolbar
                var baton = ext.Baton({ $el: toolbar.$list, data: data, models: models, collection: app.listView.collection, app: this, allIds: [] }),
                    ret = ext.point('io.ox/files/classic-toolbar').invoke('draw', toolbar.$list.empty(), baton);
                $.when.apply($, ret.value()).then(function () {
                    toolbar.initButtons();
                });
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
        }
    });
});
