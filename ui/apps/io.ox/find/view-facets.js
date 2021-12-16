/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/find/view-facets', [
    'io.ox/find/extensions-facets',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'io.ox/core/api/account',
    'gettext!io.ox/core'
], function (extensions, api, ext, accountAPI, gt) {

    'use strict';

    var POINT = 'io.ox/find/facets';

    ext.point(POINT + '/toolbar').extend({
        index: 100,
        draw: extensions.toolbar
    });

    ext.point(POINT + '/list').extend({
        index: 100,
        draw: extensions.list
    });

    ext.point(POINT + '/dropdown/default').extend({
        index: 100,
        draw: extensions.dropdownDefault
    });

    ext.point(POINT + '/dropdown/default/item').extend({
        index: 100,
        draw: extensions.item
    });

    ext.point(POINT + '/dropdown/folder').extend({
        index: 100,
        draw: extensions.dropdownFolder
    });

    ext.point(POINT + '/dropdown/account').extend({
        index: 100,
        draw: $.noop
    });

    ext.point(POINT + '/help').extend({
        index: 100,
        draw: extensions.help
    });

    /**
     * BACKBONE
     */

    // container view
    var FacetsView = Backbone.View.extend({

        attributes: {
            'aria-label': gt('Search facets'),
            'role': 'navigation'
        },

        initialize: function (props) {
            _.extend(this, props);

            this.setElement(this.parent.$el.find('.search-box-filter'));

            this.register();
        },

        register: function () {
            this.listenTo(this.app.model.manager, 'active', $.proxy(this.redraw, this));
            this.listenTo(this.app, 'find:config-updated', $.proxy(this.render, this));
        },

        redraw: function () {
            this.render();
        },

        render: function () {
            this.reset();
            // container node
            ext.point('io.ox/find/facets/toolbar').invoke('draw', this.$el, this.baton);
            // adjust height by parents height (maybe tokenfield has morge than on line visible)
            this.$el.find('ul.classic-toolbar').outerHeight(this.$el.parent().outerHeight());
            this.$el.find('ul.classic-toolbar > li > a:not(:first)').attr('tabindex', -1);
            return this;
        },

        show: function () {
            this.$el.show();
        },

        hide: function () {
            this.$el.hide();
        },

        reset: function () {
            this.$el.empty();
        },

        focus: function () {
            this.$el
                .find('.facet > a')
                .focus();
        },

        is: function (type, data, options) {

            var matcher = {
                    'readable': _.partial(api.can, 'read'),
                    'virtual': function (data) {
                        return api.isVirtual(data.id);
                    },
                    'account': function (data, option) {
                        return (data.account = option.account);
                    }
                }, match;

            match = matcher[type];
            return match ? match.call(this, data, options) : false;

        },

        openFolderDialog: function () {
            var self = this,
                is = self.is,
                manager = self.model.manager,
                facet = manager.get('folder'),
                value = facet.getValue(),
                id = value.getOption().value,
                type = self.baton.app.getModuleParam(),
                folder = id || api.getDefaultFolder(module),
                module = (type === 'files' ? 'infostore' : type);

            function isIncompatible(data) {
                if (module === 'mail') {
                    // primary-only-facets like 'filename' and has_attachments
                    if (accountAPI.isPrimary(data.id)) return false;
                    return accountAPI.isPrimary(folder) && !accountAPI.isPrimary(data.id);
                }
                if (module === 'infostore') {
                    // account-specific facets
                    var account = self.model.manager.get('account');
                    if (!account) return;
                    return data.account_id !== account.getValue().getOption().value;
                }
                return false;
            }

            require(['io.ox/core/folder/picker'], function (picker) {
                picker({
                    async: true,
                    folder: folder,
                    module: module,
                    root: type === 'files' ? '9' : '1',
                    flat: api.isFlat(module),
                    //#. 'Select' as button text to confirm the selection of a chosen folder via a picker dialog.
                    button: gt('Select'),
                    done: function (target, dialog) {
                        //get folder data
                        api.get(target)
                            .always(function (data) {
                                //use id as fallback label
                                var label = (data || {}).title || target;
                                manager.activate(facet.id, 'custom', {
                                    value: target,
                                    id: target,
                                    name: label
                                });
                                dialog.close();
                            });
                    },
                    disable: function (data, options, originalID) {
                        if (originalID && is('virtual', { id: originalID })) return true;
                        return !is('readable', data) || api.is('virtual', data) || isIncompatible(data);
                    }
                });
            });
        }

    });

    return FacetsView;

});
