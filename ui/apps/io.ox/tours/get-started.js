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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/tours/get-started', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/core'
], function (ext, capabilities, Tour, gt) {

    'use strict';

    var GetStartedView = Backbone.View.extend({

        tagName: 'a',

        events: {
            'click': 'onClick',
            'start': 'onStart'
        },

        onClick: function (e) {
            e.preventDefault();
            var node = $(e.target).closest('li'),
                path = node.attr('data-path'),
                dependencies = path && path.split(',');
            // load and start wizard
            require(dependencies, function () {
                var app = ox.ui.App.getCurrentApp();
                this.$el.trigger('start', app);
                Tour.registry.run(node.attr('data-id'));
            }.bind(this));
        },

        onStart: function (e, app) {
            require(['io.ox/metrics/main'], function (metrics) {
                // track help as separate app/page
                metrics.trackPage({
                    id: 'io.ox/guidedtour'
                });
                // track
                var name = app.get('trackingId') || app.get('name') || app.get('id');
                metrics.trackEvent({
                    app: 'core',
                    target: 'toolbar',
                    type: 'click',
                    action: 'guided-tour',
                    detail: name.substr(name.lastIndexOf('/') + 1)
                });
            });
        },

        hide: function () {
            if (this.$el.parent().length > 0) return this.$el.parent().toggle(false);
        },
        show: function () {
            if (this.$el.parent().length > 0) return this.$el.parent().toggle(true);
        },

        onAppChange: function () {
            //no tours for guests, yet. See bug 41542
            if (capabilities.has('guest')) return this.hide();

            var app = ox.ui.App.getCurrentApp();
            // there are cases where there is no current app (e.g. restore mail compose, then press cancel)
            if (app === null) return this.hide();

            // deprecated way via app.getTour
            var fn = app && _.isFunction(app.getTour),
                response = fn && app.getTour();
            if (fn && !_.isEmpty(response)) {
                console.warn('guided tours: getTour is deprecated. Please use a manifest entry instead.');
                return this.show().attr({ 'data-id': response.id, 'data-path': response.path });
            }
            // fresh and shiny new way via manifests
            var id = 'default/' + app.getName(),
                list = ox.manifests.pluginsFor(id);
            if (list.length) return this.show().attr({ 'data-id': id, 'data-path': list });

            this.hide();
        },

        initialize: function () {
            this.listenTo(ox, 'app:ready app:resume app:stop', this.onAppChange);
        },

        render: function () {
            this.$el.attr({ href: '#', role: 'menuitem', 'data-action': 'guided-tour' }).text(gt('Guided tour for this app'));
            return this;
        }
    });

    ext.point('io.ox/core/appcontrol/right/help').extend({
        id: 'get-started',
        index: 250,
        extend: function () {
            if (_.device('smartphone')) return;
            if (capabilities.has('guest')) return;
            var getStartedView = new GetStartedView();
            this.append(getStartedView.render().$el);
            getStartedView.hide();
        }
    });
});
