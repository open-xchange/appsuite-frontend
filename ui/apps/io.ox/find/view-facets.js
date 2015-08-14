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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/find/view-facets', [
    'io.ox/find/extensions-facets',
    'io.ox/core/extensions',
    'gettext!io.ox/core'
], function (extensions, ext, gt) {

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

        redraw: function (count) {
            // just reset when no facets are active
            if (count === 0) return this.reset();
            this.render();
        },

        render: function () {
            this.reset();
            // container node
            ext.point('io.ox/find/facets/toolbar').invoke('draw', this.$el, this.baton);
            // adjust height by parents height (maybe tokenfield has morge than on line visible)
            this.$el.find('ul.classic-toolbar').outerHeight(this.$el.parent().outerHeight());
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

        openFolderDialog: function () {
            var self = this;
            require(['io.ox/core/folder/picker', 'io.ox/core/folder/api'], function (picker, api) {
                var manager = self.model.manager,
                    facet = manager.get('folder'),
                    type = self.baton.app.getModuleParam(),
                    module = (type === 'files' ? 'infostore' : type),
                    value = facet.getValue(),
                    id = value.getOption().value;

                picker({
                    folder: id || api.getDefaultFolder(module),
                    module: module,
                    root: type === 'files' ? '9' : '1',
                    flat: api.isFlat(module),
                    done: function (target) {
                        //get folder data
                        api.get(target)
                            .always(function (data) {
                                //use id as fallback label
                                var label = (data || {}).title || target;
                                manager.activate(facet.id, 'custom', {
                                    value: target,
                                    id: target,
                                    name: label
                                });
                            });
                    },
                    disable: function (data) {
                        return !api.can('read', data) || api.isVirtual(data.id);
                    }
                });
            });
        }

    });

    return FacetsView;

});
