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
    'io.ox/core/api/account',
    'gettext!io.ox/core'
], function (ExtensibleView, extensions, api, ext, accountAPI, gt) {

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
            // needs redraw in case option is set outside this view
            this.listenTo(this.app.model.manager, 'active', this.render);
            this.listenTo(this.app, 'find:config-updated', this.render);
        },

        render: function () {
            this.hide();
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
            var verticalspace = window.innerHeight - this.$el.position().top - 32;
            this.$el.css({
                'width': this.$el.closest('.search-box').outerWidth(),
                'max-height': verticalspace
            }).toggleClass('open', state);

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
                                self.render();
                                dialog.close();
                            });
                    },
                    disable: function (data) {
                        return !is('readable', data) || api.is('virtual', data) || isIncompatible(data);
                    }
                });
            });
        }

    });

    return FacetsView;

});
