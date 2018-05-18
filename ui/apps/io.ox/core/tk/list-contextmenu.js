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
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/contextmenu-utils',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/collection',
    'gettext!io.ox/core'
], function (ext, Dropdown, ContextMenuUtils, actions, Collection, gt) {
    'use strict';

    function renderItems() {
        var list = this.selection.resolve(),
            baton = new ext.Baton({
                data: list.length === 1 ? list[0] : list,
                collection: this.collection,
                selection: this.selection.get(),
                app: this.app
            }),
            listView = this;
        return actions.applyCollection(this.contextMenuRef, new Collection(list), baton).then(function (items) {
            var extensions = items.filter(function (item) {
                return item.state;
            }).map(function (item) {
                return item.link;
            });
            extensions.reduce(function (acc, extension) {
                if (acc.oldSection !== extension.section) {
                    listView.dropdown.divider();
                }

                listView.dropdown.link(
                    extension.id,
                    extension.label,
                    actions.invoke.bind(this, extension.ref, null, baton),
                    { data: extension }
                );
                return { oldSection: extension.section };
            }, { oldSection: extensions[0] && extensions[0].section });
            listView.trigger('contextmenu:populated', extensions);
            return extensions;
        });
    }

    function populate() {
        // desktop 'burger' vs. mobile-edit-mode
        var contextmenu = this.dropdown.$toggle.attr('data-contextmenu') || this.selection.get('data-contextmenu');
        // load relevant code on demand
        return ox.manifests.loadPluginsFor(this.contextMenuRef)
            .then(renderItems.bind(this, contextmenu));
    }

    function toggleDropdown(renderedExtensions) {
        if (renderedExtensions.length === 0 || this.contextMenuState === 'aborted') return this.$dropdownMenu.empty();

        // a11y: The role menu should only be set if there are menuitems in it
        this.$dropdownMenu.attr('role', 'menu');
        this.$dropdownToggle.dropdown('toggle');
    }

    function abortContextmenu() {
        this.contextMenuState = 'aborted';
    }

    var Contextmenu = {
        onContextMenu: function (e) {
            // clicks bubbles. right-click not
            // DO NOT ADD e.preventDefault() HERE (see bug 42409)
            e.stopPropagation();

            this.toggleContextMenu(ContextMenuUtils.positionForEvent(e));
        },

        toggleContextMenu: function (pos) {
            var quitEarly = _.device('smartphone') || this.dropdown && this.dropdown.$el.hasClass('open');
            if (quitEarly) return;

            if (!this.dropdown) this.renderContextMenu();
            this.contextMenuState = 'loading';
            this.listenTo(ox.ui.apps, 'resume add', abortContextmenu);
            this.$dropdownMenu
                .css({ top: pos.top, left: pos.left, bottom: 'auto' })
                .empty()
                .removeAttr('role')
                .busy();
            this.dropdown.$toggle = pos.target.data('fixed', true);
            return $.when()
                .then(populate.bind(this))
                .then(toggleDropdown.bind(this))
                .always(function () {
                    this.$dropdownMenu.idle();
                    delete this.contextMenuState;
                    this.stopListening(ox.ui.apps, 'resume add', abortContextmenu);
                }.bind(this));
        },

        renderContextMenu: function () {
            this.$dropdownToggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">').attr('aria-label', gt('Folder options'));
            this.$dropdownMenu = $('<ul class="dropdown-menu">');
            this.dropdown = new Dropdown({
                smart: true,
                className: 'context-dropdown dropdown',
                $toggle: this.$dropdownToggle,
                $ul: this.$dropdownMenu,
                margin: 24
            });
            this.contextMenuRef = this.contextMenuRef || this.ref + '/contextmenu';

            this.$el.after(
                this.dropdown.render().$el
            );
        }
    };
    return Contextmenu;
});
