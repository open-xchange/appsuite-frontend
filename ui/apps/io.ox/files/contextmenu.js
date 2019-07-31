/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jonas Regier <jonas.regier@open-xchange.com>
 */

define('io.ox/files/contextmenu', [
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/backbone/mini-views/abstract',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/contextmenu-utils',
    'io.ox/core/collection',
    'gettext!io.ox/core',
    'io.ox/files/share/toolbar'
], function (ext, extAction, AbstractView, Dropdown, ContextUtils, Collection, gt) {

    'use strict';

    /**
    * Creating a handler function that invokes a given action.
    */
    function createHandler(baton, action) {
        extAction.invoke(action, null, baton);
    }

    /**
     * Appending entries to a given element via 'addLink' for all available actions from
     * a given extension point.
     * All actions are checked if they are available for the currently selected items.
     * Entries with different 'sections' are automatically separated with a divider.
     * A promise is resolved when all checks and rendering calls have been finished.
     *
     * @param: element
     *  The element were the entries are appended to.
     *
     * @param: point
     *  Expects a point with the following structure:
     *
     *   {
     *     id: 'id',
     *     index: 1000,
     *     ref: 'referenceToAction',
     *     section: 'sectionName',
     *     label: gt('displayedText')
     *  }
     *
     * @param: baton
     *  A baton containing the data that is needed for handling the actions.
     *
     * @return: promise
     *  A promise that is resolved when all action are checked and the rendering is finished.
     */
    function renderActionPointItems(element, point, baton) {

        var def = jQuery.Deferred();
        var checkAvailableActionsFromPoint = extAction.applyCollection(point, new Collection(baton.data), baton, null);

        // wait that all actions are checked
        $.when(checkAvailableActionsFromPoint).done(function (dat) {

            var arrayOfEnabledIds = [];

            //crate array of available actions from the point
            _.each(dat, function (obj) {
                if (obj.state === true) {
                    arrayOfEnabledIds.push(obj.link.id);
                }
            });

            // get data for point
            var menuData = ext.point(point).all();
            // needed as temp memory for processing sections later
            var lastSection;
            //  whether there are items in the menu
            var menuIsEmtpy = true;

            // create entries for all available actions
            _.each(menuData, function (obj) {

                // return when actions not available
                if (!_.contains(arrayOfEnabledIds, obj.id)) return;

                var currentSection = obj.section;

                // add dividers for sections (do not add one above the first item)
                if (!menuIsEmtpy && lastSection !== currentSection) {
                    ContextUtils.divider.call(element);
                }

                // create markup and handler for available action
                ContextUtils.addLink(element, {
                    action: String(obj.id),
                    data: { id: baton.data.id },
                    enabled: true,
                    handler: createHandler.bind(element, baton, obj.ref),
                    text: String(obj.label)
                });

                menuIsEmtpy = false;
                lastSection = currentSection;
            });

            // reject when no entry available to prevent that a empty context
            // menu is shown (would be only visible in the DOM, not for the user)
            if (menuIsEmtpy) {
                def.reject();
            } else {
                def.resolve();
            }

        });

        return def.promise();
    }

    // define point for the default file context menu
    ext.point('io.ox/core/file/contextmenu/default').extend({
        id: 'drive-list-dropdown',
        index: 10000,
        draw: function (baton) {
            return renderActionPointItems(this, 'io.ox/core/file/contextmenu/default/items', baton);
        }
    });

    // define point for the outside-list context menu
    ext.point('io.ox/core/file/contextmenu/default/outsideList').extend({
        id: 'drive-list-dropdown-outsideList',
        index: 10000,
        draw: function (baton) {
            return renderActionPointItems(this, 'io.ox/core/file/contextmenu/default/outsideList/items', baton);
        }
    });

    // define point for the myshares file context menu
    ext.point('io.ox/core/file/contextmenu/myshares').extend({
        id: 'drive-myshares-dropdown',
        index: 10000,
        draw: function (baton) {
            return renderActionPointItems(this, 'io.ox/core/file/contextmenu/myshares/items', baton);
        }
    });

    // ======  context menu definition ======

    // default/outside-list file context menu definition
    ext.point('io.ox/core/file/contextmenu/default/outsideList/items').extend(
        {
            id: 'addfolder',
            index: 1000,
            ref: 'io.ox/files/actions/add-folder',
            section: '5',
            label: gt('Add folder')
        }
    );

    // myshares file context menu definition
    ext.point('io.ox/core/file/contextmenu/myshares/items').extend(
        {
            id: 'editShare',
            index: 1000,
            ref: 'io.ox/files/actions/editShare',
            section: '30',
            label: gt('Edit Share')
        },
        {
            id: 'show-in-folder',
            index: 1200,
            ref: 'io.ox/files/actions/show-in-folder',
            section: '20',
            label: gt('Show in Drive')
        },
        {
            id: 'revoke-access',
            index: '1200',
            ref: 'io.ox/files/share/revoke',
            section: '30',
            label: gt('Revoke access')
        }
    );

    // default file context menu definition
    ext.point('io.ox/core/file/contextmenu/default/items').extend(

        {
            id: 'viewer',
            index: 1000,
            ref: 'io.ox/files/actions/viewer',
            section: '10',
            //#. used as a verb here. label of a button to view files
            label: gt('View')
        },
        {
            id: 'add-favorite',
            index: 1201,
            ref: 'io.ox/files/favorites/add',
            section: '20',
            label: gt('Add to favorites')
        },
        {
            id: 'remove-favorite',
            index: 1201,
            ref: 'io.ox/files/favorites/remove',
            section: '20',
            label: gt('Remove from favorites')
        },
        {
            id: 'show-in-folder',
            index: 1202,
            ref: 'io.ox/files/actions/show-in-folder',
            section: '20',
            label: gt('Show in Drive')
        },
        {
            id: 'download',
            index: 1250,
            ref: 'io.ox/files/actions/download',
            section: '25',
            label: gt('Download')
        },
        {
            id: 'downloadfolder',
            index: 1250,
            ref: 'io.ox/files/actions/download-folder',
            section: '25',
            label: gt('Download entire folder')
        },
        {
            id: 'invite',
            index: 1300,
            ref: 'io.ox/files/actions/invite',
            section: '30',
            label: gt('Permissions / Invite people')
        },
        {
            id: 'getalink',
            index: 1400,
            ref: 'io.ox/files/actions/getalink',
            section: '30',
            label: gt('Create sharing link')
        },
        {
            id: 'rename',
            index: 1500,
            ref: 'io.ox/files/actions/rename',
            section: '40',
            label: gt('Rename')
        },
        {
            id: 'move',
            index: 1600,
            ref: 'io.ox/files/actions/move',
            section: '40',
            label: gt('Move')
        },
        {
            id: 'copy',
            index: 1700,
            ref: 'io.ox/files/actions/copy',
            section: '40',
            label: gt('Copy')
        },
        {
            id: 'saveaspdf',
            index: 1800,
            ref: 'io.ox/files/actions/save-as-pdf',
            section: '50',
            label: gt('Save as PDF')
        },
        {
            id: 'send',
            index: 1700,
            ref: 'io.ox/files/actions/send',
            section: '50',
            label: gt('Send by mail')
        },
        {
            id: 'delete',
            index: 1900,
            ref: 'io.ox/files/actions/delete',
            section: '60',
            label: gt('Delete')
        },
        {
            id: 'restore',
            index: 2000,
            ref: 'io.ox/files/actions/restore',
            section: '60',
            label: gt('Restore')
        }
    );

    // constructor contextmenu
    var Contextmenu = AbstractView.extend({

        initialize: function (option) {
            this.createContextMenu(option);
        },

        createContextMenu: function (option) {
            this.$dropdownToggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">').attr('aria-label', ('Files context menu'));
            this.$dropdownMenu = $('<ul class="dropdown-menu">');
            this.dropdown = new Dropdown({
                smart: true,
                className: 'context-dropdown dropdown',
                $toggle: this.$dropdownToggle,
                $ul: this.$dropdownMenu,
                margin: 24
            });

            option.el.append(
                this.dropdown.render().$el
            );

            this.$dropdownMenu.removeAttr('role');
        },

        showContextMenu: function (e, baton) {

            var link = this.getLink(e, baton);
            // when no link available cancel the current process to show the context menu
            if (!link) { return; }

            var positionData = this.calcPositionFromEvent(e);
            var updateFinished = this.updateContextMenu(link, baton);
            var view = this;
            $.when.apply($, updateFinished.value()).done(function () {

                // check that the context menu is opened only in it's app.
                // -> otherwise the context menu could be visible on top of a document when
                // the context menu is called and a document is opened directly after that very fast
                // with a slow internet connection. A slow internet connection can cause a delay
                // when opening the context menu.
                var appHasNotChanged = ox.ui.App.getCurrentApp().getName() === baton.app.options.name;

                if (appHasNotChanged) {

                    // a11y: The role menu should only be set if there are menuitems in it - as we don't have a case with no items in the menu no check is needed so far
                    view.$dropdownMenu.attr('role', 'menu');

                    view.$dropdownMenu.css({ top: positionData.top, left: positionData.left, bottom: 'auto' });
                    view.dropdown.$toggle = positionData.target;
                    view.$dropdownToggle.dropdown('toggle');
                }
            });
        },

        calcPositionFromEvent: function (e) {
            var target, top, left, targetOffset;

            if (e.isKeyboardEvent) {
                // for keyboardEvent
                target = $(document.activeElement);
                targetOffset = target.offset();
                top = targetOffset.top;
                // open at the mid from the list
                left = targetOffset.left + (target.width() / 2);
            } else {
                // for mouseEvent
                target = $(e.currentTarget);
                top = e.pageY - 20;
                left = e.pageX + 30;
            }

            // 'fixed' is important for setting the position (see dropdown.js)
            target.data('fixed', true);

            return { target: target, top: top, left: left };
        },

        // Check if clicked below the list entries in the outside-list area.
        checkEventTargetOutsideList: function (e) {
            // target when clicking in a empty folder
            var emptyList = $(e.target).hasClass('abs notification');
            // target when clicked below a list
            var areaBelowList = $(e.target).is('ul');

            return areaBelowList || emptyList;
        },

        /**
         * Get the link depending on on the target (list | outside-list).
         * @param e
         * @param baton
         *   @param {String} baton.linkContextMenu
         *   @param {String} baton.linkContextMenuOutsideList [optional]
         *   In case outside-list context-menu is wanted.
         *
         * @returns {String} link
         */
        getLink: function (e, baton) {
            var link = null;

            if (this.checkEventTargetOutsideList(e)) {
                link = baton.linkContextMenuOutsideList;
            } else {
                link = baton.linkContextMenu;
            }

            return link;
        },

        updateContextMenu: function (link, baton) {

            var ul = this.$dropdownMenu.empty();

            // a11y: remove menu role when no items in the menu on empty
            this.$dropdownMenu.removeAttr('role');

            //baton.$el = ul; NOTE: found no case were needed, but when there is a bug with certain actions, check if this helps
            ext.point(link + '/items').replace({
                id: 'delete',
                index: 1900,
                ref: 'io.ox/files/actions/delete',
                section: '60',
                label: baton.insideTrash ? gt('Delete forever') : gt('Delete')
            });
            var finishedRendering = ext.point(link).invoke('draw', ul, baton);
            return finishedRendering;
        }
    });

    return Contextmenu;
});
