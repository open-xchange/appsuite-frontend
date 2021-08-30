/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/chat/views/groupAvatar', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/api',
    'io.ox/chat/util',
    'io.ox/chat/util/url',
    'io.ox/contacts/util'
], function (DisposableView, api, util, url, contactsUtil) {

    'use strict';

    var GroupAvatarView = DisposableView.extend({

        className: 'group avatar image',

        initialize: function () {
            this.listenTo(this.model, 'change:iconId', this.update);
            if (this.model.isChannel()) this.$icon = util.svg({ icon: 'fa-hashtag' });
            else if (this.model.isGroup()) this.$icon = util.svg({ icon: 'fa-group' });
        },

        render: function () {
            this.$el.css('background-image', '').empty();
            if (this.model.get('iconId')) {
                url.request(this.model.getIconUrl()).then(function (url) {
                    if (this.disposed) return;
                    this.$el.css('backgroundImage', 'url("' + url + '")');
                }.bind(this));
            } else {
                var data = { first_name: this.model.get('title'), last_name: this.model.get('description') };
                this.$el.addClass(contactsUtil.getInitialsColor(contactsUtil.getInitials(data))).append(this.$icon);
            }
            return this;
        },

        update: function () {
            var iconUrl = this.model.getIconUrl();
            if (iconUrl) url.revoke(iconUrl);
            this.render();
        }
    });

    return GroupAvatarView;
});
