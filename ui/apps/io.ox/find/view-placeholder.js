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

define('io.ox/find/view-placeholder', [
], function () {

    'use strict';

    var PlaceholderView = Backbone.View.extend({

        events: {
            'focusin': 'focused'
        },

        initialize: function (options) {
            var win = options.app.getWindow();
            // field stub already rendered by desktop.js
            this.setElement(win.nodes.sidepanel.find('.io-ox-find'));

            this.ui = {
                field: this.$el.find('.search-field')
            };

            this.listenTo(options.app, 'view:disable', this.disable);
            this.listenTo(options.app, 'view:enable', this.enable);
        },

        disable: function () {
            this.ui.field.attr('disabled', true);
        },

        enable: function () {
            this.ui.field.removeAttr('disabled');
        },

        focused: function () {
            this.trigger('launch');
            this.destroy();
        },

        destroy: function () {
            this.trigger('destroy');
            this.stopListening();
            this.off();
        }
    });

    return PlaceholderView;
});
