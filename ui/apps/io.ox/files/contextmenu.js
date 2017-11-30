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
    'gettext!io.ox/core'
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

            def.resolve();
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

    // define point for the myshares file context menu
    ext.point('io.ox/core/file/contextmenu/myshares').extend({
        id: 'drive-list-dropdown-myshares',
        index: 10000,
        draw: function (baton) {
            return renderActionPointItems(this, 'io.ox/core/file/contextmenu/myshares/items', baton);
        }
    });

    // myshares file context menu definition
    ext.point('io.ox/core/file/contextmenu/myshares/items').extend(
        {
            id: 'permissions',
            index: 1000,
            ref: 'io.ox/files/actions/permissions',
            section: '10',
            label: gt('Permissions')
        },
        {
            id: 'show-folder',
            index: 1100,
            ref: 'io.ox/files/actions/show-folder',
            section: '20',
            label: gt('Show folder')
        },
        {
            id: 'show-in-folder',
            index: 1100,
            ref: 'io.ox/files/actions/show-in-folder',
            section: '20',
            label: gt('Show in folder')
        }
    );

    // default file context menu definition
    ext.point('io.ox/core/file/contextmenu/default/items').extend(

        {
            id: 'viewer',
            index: 1000,
            ref: 'io.ox/files/actions/viewer',
            section: '10',
            label: gt('View')
        },
        {
            id: 'download',
            index: 1100,
            ref: 'io.ox/files/actions/download',
            section: '10',
            label: gt('Download')
        },
        {
            id: 'downloadfolder',
            index: 1200,
            ref: 'io.ox/files/actions/download-folder',
            section: '10',
            label: gt('Download')
        },
        {
            id: 'invite',
            index: 1300,
            ref: 'io.ox/files/actions/invite',
            section: '20',
            label: gt('Invite people')
        },
        {
            id: 'getalink',
            index: 1400,
            ref: 'io.ox/files/actions/getalink',
            section: '20',
            label: gt('Create sharing link')
        },
        {
            id: 'rename',
            index: 1500,
            ref: 'io.ox/files/actions/rename',
            section: '30',
            label: gt('Rename')
        },
        {
            id: 'move',
            index: 1600,
            ref: 'io.ox/files/actions/move',
            section: '30',
            label: gt('Move')
        },
        {
            id: 'copy',
            index: 1700,
            ref: 'io.ox/files/actions/copy',
            section: '30',
            label: gt('Copy')
        },
        {
            id: 'saveaspdf',
            index: 1800,
            ref: 'io.ox/files/actions/save-as-pdf',
            section: '40',
            label: gt('Save as PDF')
        },
        {
            id: 'send',
            index: 1700,
            ref: 'io.ox/files/actions/send',
            section: '40',
            label: gt('Send by mail')
        },
        {
            id: 'delete',
            index: 1900,
            ref: 'io.ox/files/actions/delete',
            section: '50',
            label: gt('Delete')
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

            var positionData = this.calcPositionFromEvent(e);
            var updateFinished = this.updateContextMenu(baton);
            var view = this;
            $.when.apply($, updateFinished.value()).done(function () {

                // check that the context menu is opened only in it's app.
                // -> otherwise the context menu could be visible on top of a document when
                // the context menu is called and a document is opened directly after that very fast
                // with a slow internet connection. A slow internet connection can cause a delay
                // when opening the context menu.
                var appHasNotChanged = ox.ui.App.getCurrentApp().getName() === baton.app.options.name;

                if (appHasNotChanged) {
                    view.$dropdownMenu.css({ top: positionData.top, left: positionData.left, bottom: 'auto' });
                    view.dropdown.$toggle = positionData.target;
                    view.$dropdownToggle.dropdown('toggle');
                }
            });
        },

        calcPositionFromEvent: function (e) {

            // 'fixed' is important for setting the position (see dropdown.js)
            var target = $(e.currentTarget).data('fixed', true);

            var top = e.pageY - 20;
            var left = e.pageX + 30;

            if (e.type === 'keydown') {
                var targetOffset = target.offset();
                top = targetOffset.top;
                // open at the mid from the list
                left = targetOffset.left + (target.width() / 2);
            }

            return { target: target, top: top, left: left };
        },

        updateContextMenu: function (baton) {

            var ul = this.$dropdownMenu.empty();
            //baton.$el = ul; NOTE: found no case were needed, but when there is a bug with certain actions, check if this helps
            var finishedRendering = ext.point('io.ox/core/file/contextmenu' + baton.contextLinkAdder).invoke('draw', ul, baton);
            return finishedRendering;
        }
    });

    return Contextmenu;
});
