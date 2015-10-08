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

define('io.ox/search/view', [
    'io.ox/search/view-template',
    'io.ox/core/extensions',
    'io.ox/backbone/views'
], function (template, ext, views) {

    'use strict';

    var SearchView = views.point('io.ox/search/view').createView({
            tagName: 'div',
            className: 'io-ox-search container default-content-padding',
            init: function (options) {
                this.baton.app = options.app;
                this.baton.$ = this.$el;
            },
            render: function (node) {
                var self = this,
                    node = node || self.$el;

                self.baton.$container = node;
                // create new toolbar on bottom
                ext.point('io.ox/search/view/mobile').invoke('draw', node, self.baton);

                //invoke extensions defined by io.ox/search/view-template
                ext.point('io.ox/search/view').invoke('draw', node, self.baton);

                return this;
            },
            idle: function () {
                var container = this.$el.find('.query'),
                    busy = this.$el.find('.busy');
                //input
                container.find('.search-field')
                 .prop('disabled', false);
                //button
                container.find('.btn-search>.fa')
                    .prop('disabled', false);
                //busy node
                busy.hide();
                return this;
            },
            busy: function () {
                var container = this.$el.find('.query'),
                    busy = this.$el.find('.busy');
                //input
                container.find('.search-field')
                        .prop('disabled', true);
                //button
                container.find('.btn-search>.fa')
                    .prop('disabled', true);
                //result row
                busy.show();
                return this;
            },
            repaint: function (ids) {
                var self = this;
                ext.point('io.ox/search/view').each(function (p) {
                    var list = ids.split(' ');
                    list.forEach(function (id) {
                        if (id === p.id)
                            p.invoke('draw', self.$el, self.baton);
                    });
                });
                if (_.device('smartphone')) {
                    ext.point('io.ox/search/view/mobile').each(function (p) {
                        var list = ids.split(' ');
                        list.forEach(function (id) {
                            if (id === p.id)
                                p.invoke('draw', self.$el, self.baton);
                        });
                    });
                }
            },
            redraw: function (options) {
                options = options || {};

                var node = $('<span>');

                //draw into dummy node
                this.render(node);
                //TODO: keep search string the ugly way
                node.find('.search-field').val(
                    this.$el.find('.search-field').val()
                );
                //replace
                this.$el.empty();
                this.$el.append(node.children());

                if (options.closeSidepanel)
                    $('.io-ox-sidepopup', '#io-ox-windowmanager-pane>.io-ox-search-window').detach();

                return this;
            },
            focus: function () {
                var searchfield = this.$el.find('.search-field');
                //set focus and trigger autocomplete
                searchfield.trigger('focus:custom');
                return this;
            },
            getBaton: function () {
                return this.baton;
            }
        });

    return {
        //use a pseudo factory here to be similar to modelfactory
        factory: {
            create: function (app, model, node) {
                return new SearchView({
                    app: app,
                    model: model,
                    el: node
                });
            }
        }
    };
});
