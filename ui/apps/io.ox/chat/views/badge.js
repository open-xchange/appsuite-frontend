/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/badge', ['io.ox/chat/views/state'], function (StateView) {

    'use strict';

    var Badgeiew = Backbone.View.extend({

        tagName: 'li',
        className: 'user-badge',

        initialize: function () {
            this.listenTo(this.model, 'change:name', this.onChangeName);
        },

        render: function () {
            this.$el.append(
                new StateView({ model: this.model }).render().$el,
                $('<span class="name">').text(this.model.get('name'))
            );
            return this;
        },

        onChangeName: function () {
            this.$('.name').text(this.model.get('name'));
        }
    });

    return Badgeiew;
});
