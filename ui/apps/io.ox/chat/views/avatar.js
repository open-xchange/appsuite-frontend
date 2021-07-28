/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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

        initialize: function (options) {
            this.options = options || {};
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
                this.update();
            }.bind(this));
        },

        update: function () {
            var data = this.model.pick('email', 'first_name', 'last_name', 'image');
            var initials = util.getInitials(data);
            this.$el.addClass(util.getInitialsColor(initials));
            if (!data.image) {
                this.$el.append(
                    '<svg viewbox="0 0 48 48"><text x="24" y="28" text-anchor="middle">' + _.escape(initials) + '</text></svg>'
                );
            } else {
                this.$el.css('background-image', 'url(api/contacts/picture?action=get&email=' + encodeURIComponent(data.email) + '&width=96&height=96&scaleType=cover)');
            }
        },

        onChangeName: function () {
            this.update();
        }
    });

    return AvatarView;
});
