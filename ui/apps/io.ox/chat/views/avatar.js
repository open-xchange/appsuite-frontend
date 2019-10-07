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

define('io.ox/chat/views/avatar', ['io.ox/backbone/views/disposable', 'io.ox/contacts/util'], function (DisposableView, util) {

    'use strict';

    var AvatarView = DisposableView.extend({

        className: 'avatar initials',

        initialize: function () {
            this.listenTo(this.model, 'change:first_name change:last_name', this.onChangeName);
        },

        render: function () {
            this.update();
            return this;
        },

        update: function () {
            var data = this.model.pick('id', 'first_name', 'last_name', 'image');
            this.$el
                .text(data.image ? '' : util.getInitials(data))
                .css('background-color', data.image ? null : util.getInitialsColor(util.getInitials(data)))
                .css('background-image', data.image ? 'url(api/image/user/picture?id=' + data.id + '&width=96&height=96&scaleType=cover)' : null);
        },

        onChangeName: function () {
            this.update();
        }
    });

    return AvatarView;
});
