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
            'click a': 'onClick'
        },

        onClick: function (e) {
            e.preventDefault();
            var app = ox.ui.App.getCurrentApp(), description;
            if (app && _.isFunction(app.getTour)) {
                description = app.getTour();
                require([description.path], function () {
                    Tour.registry.run(description.id);
                });
            }
        },

        onAppChange: function () {
            // check if the current app implements getTour()
            var app = ox.ui.App.getCurrentApp(),
                visible = !!app && _.isFunction(app.getTour);
            this.$el.toggle(visible);
        },

        initialize: function () {
            this.listenTo(ox, 'app:ready app:resume app:stop', this.onAppChange);
        },

        render: function () {
            this.$el.hide().attr('role', 'presentation').append(
                $('<a href="#" role="menuitem">').text(gt('Guided tour for this app'))
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
