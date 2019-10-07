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

define('io.ox/chat/views/avatar', [
    'io.ox/backbone/views/disposable',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'io.ox/core/api/user'
], function (DisposableView, util, contactsAPI, userAPI) {

    'use strict';

    var AvatarView = DisposableView.extend({

        className: 'avatar initials',

        initialize: function () {
            this.listenTo(this.model, 'change:first_name change:last_name', this.onChangeName);
            if (this.model.get('id') === ox.user_id) this.listenTo(contactsAPI, 'reset:image update:image', this.onUpdateUser.bind(this));
        },

        render: function () {
            this.update();
            return this;
        },

        onUpdateUser: function () {
            userAPI.get(this.model.get('id')).then(function (data) {
                this.model.set('image', data.number_of_images > 0);
                if (this.model.get('image')) this.$el.css('background-image', '');
                this.update();
            }.bind(this));
        },

        update: function () {
            var data = this.model.pick('id', 'first_name', 'last_name', 'image');
            this.$el
                .text(data.image ? '' : util.getInitials(data))
                .css('background-color', data.image ? '' : util.getInitialsColor(util.getInitials(data)))
                .css('background-image', data.image ? 'url(api/image/user/picture?id=' + data.id + '&width=96&height=96&scaleType=cover)' : '');
        },

        onChangeName: function () {
            this.update();
        }
    });

    return AvatarView;
});
