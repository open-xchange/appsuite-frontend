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

define('io.ox/chat/views/avatar', ['io.ox/contacts/util'], function (util) {

    'use strict';

    var AvatarView = Backbone.View.extend({

        className: 'avatar initials',

        initialize: function () {
            this.listenTo(this.model, 'change:first_name change:last_name', this.onChangeName);
        },

        render: function () {
            this.update();
            return this;
        },

        update: function () {
            var data = this.model.pick('first_name', 'last_name'),
                initials = util.getInitials(data);
            this.$el.attr('class', 'avatar initials ' + util.getInitialsColor(initials)).text(initials);
        },

        onChangeName: function () {
            this.update();
        }
    });

    return AvatarView;
});
