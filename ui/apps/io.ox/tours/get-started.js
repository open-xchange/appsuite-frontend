/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/tours/get-started', ['io.ox/core/extensions', 'io.ox/core/tk/wizard', 'gettext!io.ox/core'], function (ext, Tour, gt) {

    'use strict';

    var GetStartedView = Backbone.View.extend({

        tagName: 'li',

        events: {
            'click a': 'onClick',
            'start': 'onStart'
        },

        onClick: function (e) {
            e.preventDefault();
            var app = ox.ui.App.getCurrentApp(), description, self = this;
            if (app && _.isFunction(app.getTour)) {
                description = app.getTour();
                require([description.path], function () {
                    self.$el.trigger('start', app);
                    Tour.registry.run(description.id);
                });
            }
        },

        onStart: function (e, app) {
            require(['io.ox/metrics/main'], function (metrics) {
                // track help as separate app/page
                metrics.trackPage({
                    id: 'io.ox/guidedtour'
                });
                // track
                var name = app.get('trackingId') || app.get('id') || app.get('name');
                metrics.trackEvent({
                    app: 'core',
                    target: 'toolbar',
                    type: 'click',
                    action: 'guided-tour',
                    detail: name.substr(name.lastIndexOf('/') + 1)
                });
            });
        },

        onAppChange: function () {
            // check if the current app implements getTour()
            var app = ox.ui.App.getCurrentApp(),
                visible = !!app && _.isFunction(app.getTour) && !_.isEmpty(app.getTour());
            this.$el.toggle(visible);
        },

        initialize: function () {
            this.listenTo(ox, 'app:ready app:resume app:stop', this.onAppChange);
        },

        render: function () {
            this.$el.hide().attr('role', 'presentation').append(
                $('<a href="#" role="menuitem" data-action="guided-tour">').text(gt('Guided tour for this app'))
            );
            return this;
        }
    });

    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'get-started',
        index: 250,
        draw: function () {
            this.append(new GetStartedView().render().$el);
        }
    });
});
