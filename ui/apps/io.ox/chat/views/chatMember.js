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

define('io.ox/chat/views/chatMember', ['io.ox/backbone/views/disposable', 'io.ox/chat/views/badge'], function (DisposableView, BadgeView) {

    'use strict';

    var ChatMemberView = DisposableView.extend({

        tagName: 'ul',
        className: 'members',

        initialize: function () {
            this.listenTo(this.collection, {
                add: this.onAdd,
                remove: this.onRemove
            });
        },

        render: function () {
            this.$el.append(
                this.collection.map(this.renderMember, this)
            );
            return this;
        },

        renderMember: function (model) {
            if (model.isMyself()) return $();
            return $('<li>').append(new BadgeView({ model: model }).render().$el);
        },

        onAdd: function (model) {
            this.$el.append(
                $('<li>').append(new BadgeView({ model: model }).render().$el)
            );
        },

        onRemove: function (model) {
            this.$el.find('[data-email="' + model.get('email1') + '"]').parent().remove();
        }
    });

    return ChatMemberView;
});
