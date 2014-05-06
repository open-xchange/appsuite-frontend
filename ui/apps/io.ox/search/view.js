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

define('io.ox/search/view',
    ['io.ox/search/view-template',
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
                    model = this.baton.model,
                    mode = model.get('mode'),
                    node = node || self.$el;

                if (_.device('smartphone')) {
                    // create new toolbar on bottom
                    ext.point('io.ox/search/view/window/mobile').invoke('draw', node, self.baton);
                }

                //invoke extensions defined by io.ox/search/view-template
                ext.point('io.ox/search/view/' + mode).invoke('draw', node, self.baton);

                return this;
            },
            idle: function () {
                var container = this.$el.find('.query');
                //input
                container.find('.search-field')
                 .prop('disabled', false);
                //button
                container.find('.btn-search>.fa')
                    .prop('disabled', false);
                //busy node
                this.$el.find('.result').find('.busy').remove();
            },
            busy: function () {
                var container = this.$el.find('.query'),
                    result = this.$el.find('.result');
                //input
                container.find('.search-field')
                        .prop('disabled', true);
                //button
                container.find('.btn-search>.fa')
                    .prop('disabled', true);
                //result row
                result.empty();
                result.append(
                    $('<div class="col-xs-12 busy">')
                        .css('min-height', '50px')
                        .busy()
                );
                return this;
            },
            redraw: function () {
                var mode = this.baton.model.get('mode'),
                    node = $('<span>');
                if (mode !== 'widget') {
                    //draw into dummy node
                    this.render(node);
                    //TODO: keep search string the ugly way
                    node.find('.search-field').val(
                        this.$el.find('.search-field').val()
                    );
                    //replace
                    this.$el.empty();
                    this.$el.append(node.children());
                }
                return this;
            },
            focus: function (isRetry) {
                var searchfield = this.$el.find('.search-field');
                //set focus and trigger autocomplete
                searchfield.trigger('focus:custom', isRetry);
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
