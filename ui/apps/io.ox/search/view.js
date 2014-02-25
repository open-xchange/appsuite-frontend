/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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

                //invoke extensions defined by io.ox/search/view-template
                ext.point('io.ox/search/view/' + mode).invoke('draw', node, self.baton);

                if (_.device('smartphone')) {
                    // create new toolbar on bottom
                    ext.point('io.ox/search/view/window/mobile').invoke('draw', this, self.baton);
                }

                return this;
            },
            redraw: function () {
                var mode = this.baton.model.get('mode');
                if (mode !== 'widget') {
                    this.$el.empty();
                    this.render();
                }
                return this;
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
