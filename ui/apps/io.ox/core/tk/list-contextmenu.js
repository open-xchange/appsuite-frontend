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
], function (ext, Dropdown, utils, actions, Collection, gt) {
    'use strict';

    function renderItems() {
        this.$dropdownMenu.idle();
        var models = this.selection.get().map(function (cid) {
                return this.collection.get(cid);
            }.bind(this)),
            list = models.map(function (m) { return m.toJSON(); }),
            baton = new ext.Baton({
                data: list.length === 1 ? list[0] : list,
                models: models,
                collection: this.collection,
                selection: list,
                app: this.app
            }),
            listView = this;
        return actions.applyCollection(this.ref + '/contextmenu', new Collection(list), baton).then(function (items) {
            return items.filter(function (item) {
                return item.state;
            }).map(function (item) {
                return item.link;
            });
        }).then(function (extensions) {
            var oldSection = extensions[0] && extensions[0].section;
            extensions.forEach(function (extension) {
                if (oldSection !== extension.section) {
                    listView.dropdown.divider();
                }

                utils.addLink(listView.$dropdownMenu, {
                    action: extension.id,
                    enabled: true,
                    handler: function () { actions.invoke(extension.ref, null, baton); },
                    text: extension.label
                });
                oldSection = extension.section;
            });
            listView.trigger('contextmenu:populated', extensions);
        });
    }

    function show() {
        // desktop 'burger' vs. mobile-edit-mode
        var contextmenu = this.dropdown.$toggle.attr('data-contextmenu') || this.selection.get('data-contextmenu');
        // load relevant code on demand
        ox.manifests.loadPluginsFor(this.ref + '/contextmenu').then(renderItems.bind(this, contextmenu));
        // a11y: The role menu should only be set if there are menuitems in it
        this.$dropdownMenu.attr('role', 'menu');
    }

    var Contextmenu = {
        onContextMenu: function (e) {
            // clicks bubbles. right-click not
            // DO NOT ADD e.preventDefault() HERE (see bug 42409)
            e.stopPropagation();
            var target = $(e.currentTarget).data('fixed', true), top = e.pageY - 20, left = e.pageX + 30;
            if (target.is('.contextmenu-control')) {
                top = target.offset().top;
                left = target.offset().left + 40;
                target.removeData('fixed');
            }
            if (e.type === 'contextmenu' && target.hasClass('contextmenu-control')) {
                // if the contextmenubutton was rightclicked, the selection doesn't change, so we are allowed to prevent the default in this case (Bug 42409 remains fixed)
                e.preventDefault();
            }
            this.toggleContextMenu(target, top, left);
        },

        toggleContextMenu: function (target, top, left) {
            var quitEarly = _.device('smartphone') || this.dropdown && this.dropdown.$el.hasClass('open');
            if (quitEarly) return;

            _.defer(function () {
                if (!this.dropdown) this.renderContextMenu();
                this.$dropdownMenu.css({ top: top, left: left, bottom: 'auto' }).empty().busy();
                this.dropdown.$toggle = target;
                this.$dropdownToggle.dropdown('toggle');
            }.bind(this));
        },

        renderContextMenuItems: function () {
        },

        renderContextMenu: function () {
            this.$dropdownToggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">').attr('aria-label', gt('Folder options'));
            this.$dropdownMenu = $('<ul class="dropdown-menu">');
            this.dropdown = new Dropdown({
                smart: false,
                className: 'context-dropdown dropdown',
                $toggle: this.$dropdownToggle,
                $ul: this.$dropdownMenu,
                margin: 24
            });

            this.$el.after(
                this.dropdown.render().$el
                .on('show.bs.dropdown', show.bind(this))
            );
            this.$dropdownMenu.removeAttr('role');
        }
    };
    return Contextmenu;
});
