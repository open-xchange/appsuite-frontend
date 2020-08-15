/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 */

define('io.ox/chat/views/groupAvatar', [
    'io.ox/backbone/views/disposable'
],
function (DisposableView) {

    'use strict';

    var GroupAvatarView = DisposableView.extend({

        className: 'group avatar image',

        initialize: function () {
            this.listenTo(this.model, 'change:icon', this.update);

            if (this.model.isChannel()) this.$icon = $('<i class="fa fa-hashtag">');
            else if (this.model.isGroup()) this.$icon = $('<i class="fa fa-group">');
        },

        render: function () {
            this.update();
            return this;
        },

        update: function () {
            this.$el.css('background-image', '').empty();

            if (this.model.get('icon')) {
                this.$el.css('background-image', 'url("' + this.model.getIconUrl() + '")');
            } else {
                this.$el.append(this.$icon);
            }
        }
    });

    return GroupAvatarView;
});
