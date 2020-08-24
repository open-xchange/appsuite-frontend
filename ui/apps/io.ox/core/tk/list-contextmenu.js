/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jonas Regier <jonas.regier@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/tk/list-contextmenu', [
    'io.ox/backbone/views/action-dropdown',
    'io.ox/backbone/mini-views/contextmenu-utils',
    'gettext!io.ox/core'
], function (ActionDropdownView, ContextMenuUtils, gt) {

    'use strict';

    function renderItems() {
        // load relevant code on demand
        return ox.manifests.loadPluginsFor(this.contextMenuRef).done(function () {

            this.contextMenu.on('ready', function () {
                if (!this.contextMenu.hasActions()) return;
                this.contextMenu.$toggle.dropdown('toggle');
                // Keyboardsupport for cursor up/down on toggle
                this.contextMenu.$toggle.on('keydown', function (e) {
                    if (!/^(38|40)$/.test(e.which)) return;
                    this.contextMenu.$menu.find('li:' + (e.which === 38 ? 'last' : 'first') + ' a').focus();
                }.bind(this));
                if (this.isKeyboardEvent) this.contextMenu.$menu.find('li:first a').focus();
            }.bind(this));

            var selection = this.selection.get();
            this.contextMenu.setSelection(selection.map(_.cid), this.getContextMenuData.bind(this, selection));

        }.bind(this));
    }

    var Contextmenu = {

        onContextMenu: function (e) {
            // clicks bubbles. right-click not
            // DO NOT ADD e.preventDefault() HERE (see bug 42409)
            e.stopPropagation();
            this.isKeyboardEvent = e.isKeyboardEvent;
            this.clickedInFreeSpace = ContextMenuUtils.checkEventTargetOutsideList(e);
            this.toggleContextMenu(ContextMenuUtils.positionForEvent(e), e);
        },

        toggleContextMenu: function (pos) {
            if (_.device('smartphone')) return;
            if (this.contextMenu && this.contextMenu.$el.hasClass('open')) return;
            this.contextMenuRef = this.contextMenuRef || (this.ref + '/contextmenu');

            var currentRef = this.contextMenuRef;
            // handle context menu in free space, when defined
            if (this.freeSpaceContextMenuRef) {

                if (this.clickedInFreeSpace) {
                    // deselect when clicked in free space
                    this.selection.clear();
                    currentRef = this.freeSpaceContextMenuRef;
                }

                if (this.contextMenu) {
                    this.contextMenu.updatePoint(currentRef);
                }
            }

            this.renderContextMenu(currentRef);

            this.contextMenu.$menu.data({ top: pos.top, left: pos.left });
            return renderItems.call(this);
        },

        renderContextMenu: function (contextMenuRef) {
            if (this.contextMenu) return;

            this.contextMenu = new ActionDropdownView({ point: contextMenuRef, title: gt('Folder options'), backdrop: true });
            this.contextMenu.$el.addClass('context-dropdown').insertAfter(this.$el);
        },

        getContextMenuData: function (selection) {
            return { data: selection.map(_.cid) };
        }
    };

    return Contextmenu;
});
