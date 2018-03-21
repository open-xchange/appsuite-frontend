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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view-facets', [
    'io.ox/backbone/views/extensible',
    'io.ox/find/extensions-facets',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'gettext!io.ox/core'
], function (ExtensibleView, extensions, api, ext, gt) {

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

    ext.point(POINT + '/select/options').extend({
        index: 100,
        draw: extensions.options
    });

    ext.point(POINT + '/select/options/item').extend({
        index: 100,
        draw: extensions.item
    });

    ext.point(POINT + '/dropdown/folder').extend({
        index: 100,
        draw: extensions.folder
    });

    ext.point(POINT + '/dropdown/account').extend({
        index: 100,
        draw: $.noop
    });

    /**
     * BACKBONE
     */

    // container view
    var FacetsView = ExtensibleView.extend({

        className: 'search-box-filter',

        attributes: {
            'aria-label': gt('Search facets'),
            'role': 'navigation'
        },

        constructor: function (props) {
            _.extend(this, props);
            this.register();
            ExtensibleView.prototype.constructor.apply(this, arguments);
        },

        register: function () {
            this.listenTo(this.app.model.manager, 'active', this.hide);
            this.listenTo(this.app, 'find:config-updated', this.render);
        },

        render: function () {
            this.reset();
            this.$el.append(
                this.$dropdown = $('<form class="dropdown" autocomplete="off">')
            );
            ext.point(POINT + '/toolbar').invoke('draw', this.$dropdown, this.baton);
            return this;
        },

        toggle: function (state) {
            this.app.trigger('facets:toggle');
            if (state === undefined) state = !this.isOpen();
            this.$el.css('width', this.$el.closest('.search-box').outerWidth())
                    .toggleClass('open', state);
            //this.$dropdownToggle.attr('aria-expanded', state);
            this.trigger(state ? 'open' : 'close');
        },

        isOpen: function () {
            return this.$el.hasClass('open');
        },

        show: function () {
            this.toggle(true);
        },

        hide: function () {
            this.toggle(false);
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
                is = self.is;

            function isAccount(data) {
                var account = self.model.manager.get('account');
                if (!account) return true;
                return data.account_id === account.getValue().getOption().value;
            }

            require(['io.ox/core/folder/picker'], function (picker) {
                var manager = self.model.manager,
                    facet = manager.get('folder'),
                    type = self.baton.app.getModuleParam(),
                    module = (type === 'files' ? 'infostore' : type),
                    value = facet.getValue(),
                    id = value.getOption().value;

                picker({
                    async: true,
                    folder: id || api.getDefaultFolder(module),
                    module: module,
                    root: type === 'files' ? '9' : '1',
                    flat: api.isFlat(module),
                    done: function (target) {
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
                                self.render();
                            });
                    },
                    disable: function (data) {
                        return !is('readable', data) || api.is('virtual', data) || !isAccount(data);
                    }
                });
            });
        }

    });

    return FacetsView;

});
