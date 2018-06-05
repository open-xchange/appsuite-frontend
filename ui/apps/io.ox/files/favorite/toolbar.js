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
 * @author York Richter <york.richter@open-xchange.com>
 */

define('io.ox/files/favorite/toolbar', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/core',
    'io.ox/files/actions',
    'less!io.ox/files/style'
], function (ext, links, actions, Dropdown, gt) {

    'use strict';

    // define links for classic toolbar
    var point = ext.point('io.ox/files/favorite/classic-toolbar/links');
    // the link meta data used for desktop and tablets
    var meta = {
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
            ref: 'io.ox/files/dropdown/shareFavorites',
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
        'removeFromFavorites': {
            prio: 'hi',
            mobile: 'lo',
            label: gt('Remove from favorites'),
            ref: 'io.ox/files/favorites/remove',
            section: 'favorites'
        },
        //
        // --- LO ----
        //
        'encrypt': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Encrypt'),
            ref: 'oxguard/encrypt',
            section: 'guard'
        },
        'showInDrive': {
            prio: 'lo',
            mobile: 'lo',
            label: gt('Show in Drive'),
            drawDisabled: true,
            ref: 'io.ox/files/actions/show-in-folder',
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
            prio: 'lo',
            mobile: 'lo',
            label: gt('Move'),
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
    // the link meta data used for smartphones, fix for #58808
    var metaPhone = {
        'back': {
            prio: 'lo',
            mobile: 'hi',
            label: gt('Folders'),
            ref: 'io.ox/files/favorite/back'
        }
    };

    new actions.Action('io.ox/files/favorite/back', {
        requires: function () {
            return _.device('smartphone');
        },
        action: function () {
            $('[data-page-id="io.ox/files/main"]').trigger('myfavorites-folder-back');
        }
    });

    var index = 0;

    // fix for #58808 - use different link meta data on smartphones
    _(_.device('smartphone') ? metaPhone : meta).each(function (extension, id) {
        extension.id = id;
        extension.index = (index += 100);
        point.extend(new links.Link(extension));
    });

    ext.point('io.ox/files/favorite/classic-toolbar').extend(new links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/files/favorite/classic-toolbar/links'
    }));

});
